"use client";

import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Flex, Form, Input, InputNumber, Row, Space, Switch, Typography } from "antd";
import { useEffect, useState } from "react";

import { fetchAdminSettings, measureAdminStorageProvider, saveAdminSettings, type AdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";

import { emptySettings, emptyStorageProvider, finalizeSettingsForSave, formatStorageBytes, normalizeSettings, normalizeStorageProvider } from "../settings-shared";

export default function AdminStoragePage() {
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [form] = Form.useForm<AdminSettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [measuringProviderIndex, setMeasuringProviderIndex] = useState<number | null>(null);

    const loadSettings = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = normalizeSettings(await fetchAdminSettings(token));
            form.setFieldsValue(data);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取设置失败");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, [token]);

    const saveSettings = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const values = finalizeSettingsForSave(form.getFieldsValue(true) as AdminSettings);
            const saved = normalizeSettings(await saveAdminSettings(token, values));
            form.setFieldsValue(saved);
            message.success("已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    async function measureStorageProviderAt(index: number) {
        if (!token) return;
        const provider = normalizeStorageProvider(form.getFieldValue(["private", "storage", "providers", index]));
        setMeasuringProviderIndex(index);
        try {
            const result = await measureAdminStorageProvider(token, { index, provider });
            const next = normalizeSettings(await fetchAdminSettings(token));
            form.setFieldsValue(next);
            message.success(`容量统计完成：${formatStorageBytes(result.bytes)}${result.overLimit ? "，已达到上限并禁用" : ""}`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "容量统计失败");
        } finally {
            setMeasuringProviderIndex(null);
        }
    }

    return (
        <main className="p-3 md:p-6">
            <Form form={form} layout="vertical" initialValues={emptySettings} requiredMark={false}>
                <Flex vertical gap={16}>
                    <Card variant="borderless">
                        <Flex justify="space-between" align="center" gap={16} wrap>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                存储设置
                            </Typography.Title>
                            <Space>
                                <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadSettings()}>
                                    刷新
                                </Button>
                                <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={() => void saveSettings()}>
                                    保存设置
                                </Button>
                            </Space>
                        </Flex>
                    </Card>

                    <Card variant="borderless" title="存储模式">
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item label="存储模式" extra="自动检测：当配置并启用任意对象存储时，系统自动开启云端同步。">
                                    <Input disabled value="自动识别 (动态切换)" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name={["private", "storage", "allowUserProvider"]} label="允许用户配置 S3" extra="开启后，用户可在配置弹窗中填写自己的 S3/R2 密钥" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name={["private", "storage", "allowUserGlobalProvider"]} label="允许用户使用全局配置渠道" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card variant="borderless" title="容量上限">
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item name={["private", "storage", "capacityCheck", "enabled"]} label="定时统计容量" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name={["private", "storage", "capacityCheck", "cron"]} label="容量统计 Cron">
                                    <Input placeholder="0 */6 * * *" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name={["private", "storage", "capacityLimitBytes"]} label="容量上限(字节)" extra="默认 9GB，达到上限后会自动禁用该配置。">
                                    <InputNumber min={1} className="!w-full" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card variant="borderless" title="对象存储 providers">
                        <Form.List name={["private", "storage", "providers"]}>
                            {(fields, { add, remove }) => (
                                <Flex vertical gap={12}>
                                    <Button icon={<PlusOutlined />} onClick={() => add({ ...emptyStorageProvider })}>
                                        新增 S3/R2 配置
                                    </Button>
                                    {fields.map((field) => (
                                        <Card
                                            key={field.key}
                                            size="small"
                                            title={`对象存储 ${field.name + 1}`}
                                            extra={
                                                <Flex gap={8}>
                                                    <Button size="small" loading={measuringProviderIndex === field.name} onClick={() => void measureStorageProviderAt(field.name)}>
                                                        统计容量
                                                    </Button>
                                                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                                </Flex>
                                            }
                                        >
                                            <Row gutter={12}>
                                                <Col xs={24} md={6}>
                                                    <Form.Item name={[field.name, "name"]} label="名称">
                                                        <Input placeholder="Cloudflare R2" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item name={[field.name, "endpoint"]} label="Endpoint">
                                                        <Input placeholder="https://<account>.r2.cloudflarestorage.com" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <Form.Item name={[field.name, "region"]} label="Region">
                                                        <Input placeholder="auto" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <Form.Item name={[field.name, "bucket"]} label="Bucket">
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <Form.Item name={[field.name, "enabled"]} label="启用" valuePropName="checked">
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item name={[field.name, "accessKeyId"]} label="Access Key ID">
                                                        <Input />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item name={[field.name, "secretAccessKey"]} label="Secret Access Key">
                                                        <Input.Password placeholder="留空沿用已保存密钥" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item name={[field.name, "publicBaseUrl"]} label="公开访问域名">
                                                        <Input placeholder="可选，不填则走后端代理读取" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={3}>
                                                    <Form.Item name={[field.name, "pathPrefix"]} label="路径前缀">
                                                        <Input placeholder="canvas" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={3}>
                                                    <Form.Item name={[field.name, "weight"]} label="权重">
                                                        <InputNumber min={1} className="!w-full" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <Form.Item label="已用容量">
                                                        <Typography.Text>{formatStorageBytes(form.getFieldValue(["private", "storage", "providers", field.name, "capacityBytes"]) || 0)}</Typography.Text>
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={5}>
                                                    <Form.Item name={[field.name, "capacityCheckedAt"]} label="统计时间">
                                                        <Input disabled />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={3}>
                                                    <Form.Item name={[field.name, "capacityExceeded"]} label="超限" valuePropName="checked">
                                                        <Switch disabled />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                </Flex>
                            )}
                        </Form.List>
                    </Card>
                </Flex>
            </Form>
        </main>
    );
}
