"use client";

import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Flex, Form, Input, Row, Space, Switch, Typography } from "antd";
import { useEffect, useState } from "react";

import { fetchAdminSettings, saveAdminSettings, type AdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";

import { emptySettings, finalizeSettingsForSave, normalizeSettings } from "../settings-shared";

export default function AdminPreferencesPage() {
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [form] = Form.useForm<AdminSettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    return (
        <main className="p-3 md:p-6">
            <Form form={form} layout="vertical" initialValues={emptySettings} requiredMark={false}>
                <Flex vertical gap={16}>
                    <Card variant="borderless">
                        <Flex justify="space-between" align="center" gap={16} wrap>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                系统偏好
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

                    <Card variant="borderless" title="访问控制">
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "auth", "allowRegister"]} label="允许用户注册" extra="关闭后隐藏注册入口，注册接口也会拒绝新用户创建" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "allowGuestConfig"]} label="允许未登录用户使用配置功能" extra="关闭后，未登录用户看不到配置入口，也无法通过模型选择器触发配置弹窗。用于引流期到变现期的切换" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card variant="borderless" title="内置系统提示词">
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "systemPrompts", "image"]} label="生图系统提示词">
                                    <Input.TextArea rows={4} placeholder="会自动追加在生图提示词前，不在输入框中展示" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "systemPrompts", "video"]} label="视频系统提示词">
                                    <Input.TextArea rows={4} placeholder="会自动追加在视频提示词前" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "systemPrompts", "text"]} label="文本/问答系统提示词">
                                    <Input.TextArea rows={4} placeholder="用于画布问答、AI 文本等文本模型调用" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "systemPrompts", "workflow"]} label="工作流运行系统提示词">
                                    <Input.TextArea rows={4} placeholder="用于工作流运行时补充统一创作要求" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name={["public", "modelChannel", "systemPrompts", "workflowAgent"]} label="工作流创建 Agent 系统提示词">
                                    <Input.TextArea rows={6} placeholder="控制 AI 创建工作流的输出规范和默认参数" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name={["public", "modelChannel", "systemPrompt"]} hidden>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Flex>
            </Form>
        </main>
    );
}
