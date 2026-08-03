"use client";

import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Card, Checkbox, Col, Flex, Form, InputNumber, Row, Select, Space, Switch, Typography } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchAdminSettings, saveAdminSettings, type AdminModelCapability, type AdminModelCost, type AdminSettings } from "@/services/api/admin";
import { modelMatchesCapability } from "@/stores/use-config-store";
import { useUserStore } from "@/stores/use-user-store";

import { collectChannelModels, emptySettings, finalizeSettingsForSave, modelCostCredits, normalizeSettings, setModelCost } from "../settings-shared";

// 模型能力可选项：与前端 image-settings-panel / video-settings-panel 保持一致
const IMAGE_ASPECT_OPTIONS = [
    { label: "1:1", value: "1:1" },
    { label: "3:2", value: "3:2" },
    { label: "2:3", value: "2:3" },
    { label: "4:3", value: "4:3" },
    { label: "3:4", value: "3:4" },
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" },
    { label: "21:9", value: "21:9" },
];
const IMAGE_TIER_OPTIONS = [
    { label: "标准", value: "standard" },
    { label: "2K", value: "2k" },
    { label: "4K", value: "4k" },
];
const VIDEO_RESOLUTION_OPTIONS = [
    { label: "480p", value: "480p" },
    { label: "720p", value: "720p" },
    { label: "1080p", value: "1080p" },
    { label: "2K", value: "2k" },
    { label: "4K", value: "4k" },
];

function getModelCapability(items: AdminModelCapability[], model: string): AdminModelCapability {
    return items.find((item) => item.model === model) || { model, imageAspects: [], imageTiers: [], videoResolutions: [] };
}

function setModelCapabilityField(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "imageAspects" | "imageTiers" | "videoResolutions", values: string[]) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], [field]: values };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], [field]: values });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

export default function AdminModelPricingPage() {
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [form] = Form.useForm<AdminSettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modelCosts, setModelCosts] = useState<AdminModelCost[]>([]);
    const [modelCapabilities, setModelCapabilities] = useState<AdminModelCapability[]>([]);
    const [channels, setChannels] = useState<AdminSettings["private"]["channels"]>([]);
    const availableModels = (Form.useWatch(["public", "modelChannel", "availableModels"], form) || []) as string[];
    const allowCustomChannel = Form.useWatch(["public", "modelChannel", "allowCustomChannel"], form);
    const allowUserRemoteChannel = Form.useWatch(["public", "modelChannel", "allowUserRemoteChannel"], form);

    // 按渠道分组：每个启用渠道下的全部模型（不去重，保留渠道归属），用于勾选+定价一体化展示。
    // 同一模型被多渠道提供时会在每个渠道组下都出现一次，符合"在该渠道下定价该模型"的直觉。
    const channelGroups = useMemo(() => {
        return channels
            .filter((channel) => channel.enabled)
            .map((channel) => ({
                name: channel.name || "未命名渠道",
                models: Array.from(new Set((channel.models || []).filter(Boolean))) as string[],
            }))
            .filter((group) => group.models.length > 0);
    }, [channels]);

    const availableSet = useMemo(() => new Set(availableModels), [availableModels]);
    const publicModelOptions = useMemo(() => availableModels.map((item) => ({ label: item, value: item })), [availableModels]);

    const loadSettings = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = normalizeSettings(await fetchAdminSettings(token));
            form.setFieldsValue(data);
            setChannels(data.private.channels);
            setModelCosts(data.public.modelChannel.modelCosts);
            setModelCapabilities(data.public.modelChannel.modelCapabilities);
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
            setModelCosts(saved.public.modelChannel.modelCosts);
            setModelCapabilities(saved.public.modelChannel.modelCapabilities);
            message.success("已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    // 切换某个模型的开放状态：同步 availableModels 数组（去重）。
    const toggleModelAvailable = (model: string, checked: boolean) => {
        const current = (form.getFieldValue(["public", "modelChannel", "availableModels"]) || []) as string[];
        const next = checked ? Array.from(new Set([...current, model])) : current.filter((item) => item !== model);
        form.setFieldValue(["public", "modelChannel", "availableModels"], next);
    };

    // 渠道组全选/反选：把该组模型批量加入或移出 availableModels。
    const toggleGroupAvailable = (models: string[], checked: boolean) => {
        const current = (form.getFieldValue(["public", "modelChannel", "availableModels"]) || []) as string[];
        const set = new Set(current);
        if (checked) models.forEach((m) => set.add(m));
        else models.forEach((m) => set.delete(m));
        form.setFieldValue(["public", "modelChannel", "availableModels"], Array.from(set));
    };

    return (
        <main className="p-3 md:p-6">
            <Form form={form} layout="vertical" initialValues={emptySettings} requiredMark={false}>
                <Flex vertical gap={16}>
                    <Card variant="borderless">
                        <Flex justify="space-between" align="center" gap={16} wrap>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                开放与定价
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

                    <Card
                        variant="borderless"
                        title="模型开放与定价"
                        extra={<Typography.Text type="secondary">勾选 = 开放给用户，填写单价 = 每次调用扣除的算力点</Typography.Text>}
                    >
                        {channelGroups.length === 0 ? (
                            <Typography.Text type="secondary">
                                请先在<Link href="/admin/channels">模型管理</Link>添加并启用渠道
                            </Typography.Text>
                        ) : (
                            <Flex vertical gap={16}>
                                {/* 隐藏字段，保持 Form 对 availableModels 的绑定 */}
                                <Form.Item name={["public", "modelChannel", "availableModels"]} hidden>
                                    <InputNumber />
                                </Form.Item>
                                {channelGroups.map((group) => {
                                    const groupCheckedCount = group.models.filter((m) => availableSet.has(m)).length;
                                    const groupAllChecked = groupCheckedCount === group.models.length;
                                    const groupIndeterminate = groupCheckedCount > 0 && !groupAllChecked;
                                    return (
                                        <div key={group.name} style={{ border: "1px solid var(--ant-color-border)", borderRadius: 8, overflow: "hidden" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--ant-color-fill-quaternary)", borderBottom: "1px solid var(--ant-color-border)" }}>
                                                <Space>
                                                    <Checkbox
                                                        checked={groupAllChecked}
                                                        indeterminate={groupIndeterminate}
                                                        onChange={(e) => toggleGroupAvailable(group.models, e.target.checked)}
                                                    >
                                                        <Typography.Text strong>{group.name}</Typography.Text>
                                                    </Checkbox>
                                                    <Typography.Text type="secondary">{groupCheckedCount}/{group.models.length} 已开放</Typography.Text>
                                                </Space>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 0 }}>
                                                {group.models.map((model) => {
                                                    const checked = availableSet.has(model);
                                                    const credits = modelCostCredits(modelCosts, model);
                                                    return (
                                                        <div key={model} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--ant-color-border-secondary)", borderRight: "1px solid var(--ant-color-border-secondary)" }}>
                                                            <Checkbox checked={checked} onChange={(e) => toggleModelAvailable(model, e.target.checked)}>
                                                                <Typography.Text style={{ wordBreak: "break-all" }}>{model}</Typography.Text>
                                                            </Checkbox>
                                                            <Space.Compact style={{ marginLeft: "auto", width: 140 }}>
                                                                <InputNumber
                                                                    min={0}
                                                                    step={1}
                                                                    precision={0}
                                                                    style={{ width: "100%" }}
                                                                    value={credits}
                                                                    disabled={!checked}
                                                                    onChange={(value) => setModelCost(form, setModelCosts, model, Number(value) || 0)}
                                                                />
                                                                <span style={{ display: "flex", alignItems: "center", padding: "0 8px", border: "1px solid var(--ant-color-border)", borderLeft: 0, borderRadius: "0 6px 6px 0", background: "var(--ant-color-fill-quaternary)" }}>
                                                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>点</Typography.Text>
                                                                </span>
                                                            </Space.Compact>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </Flex>
                        )}
                    </Card>

                    <Card
                        variant="borderless"
                        title="模型能力"
                        extra={<Typography.Text type="secondary">勾选每个模型支持的比例和档位；留空 = 走默认（生图全比例+仅标准档，视频 480p/720p/1080p）</Typography.Text>}
                    >
                        {availableModels.length === 0 ? (
                            <Typography.Text type="secondary">请先在上方勾选开放模型</Typography.Text>
                        ) : (
                            <Flex vertical gap={12}>
                                <Form.Item name={["public", "modelChannel", "modelCapabilities"]} hidden>
                                    <InputNumber />
                                </Form.Item>
                                {availableModels
                                    .filter((model) => modelMatchesCapability(model, "image") || modelMatchesCapability(model, "video"))
                                    .map((model) => {
                                        const cap = getModelCapability(modelCapabilities, model);
                                        const isImage = modelMatchesCapability(model, "image");
                                        const isVideo = modelMatchesCapability(model, "video");
                                        return (
                                            <div key={model} style={{ border: "1px solid var(--ant-color-border)", borderRadius: 8, padding: "12px 16px" }}>
                                                <Typography.Text strong style={{ wordBreak: "break-all" }}>{model}</Typography.Text>
                                                <Flex gap={32} wrap style={{ marginTop: 8 }}>
                                                    {isImage ? (
                                                        <div style={{ minWidth: 320 }}>
                                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>图片比例（空=全部）</Typography.Text>
                                                            <Checkbox.Group
                                                                options={IMAGE_ASPECT_OPTIONS}
                                                                value={cap.imageAspects}
                                                                onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "imageAspects", values as string[])}
                                                            />
                                                        </div>
                                                    ) : null}
                                                    {isImage ? (
                                                        <div style={{ minWidth: 220 }}>
                                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>图片档位（空=仅标准）</Typography.Text>
                                                            <Checkbox.Group
                                                                options={IMAGE_TIER_OPTIONS}
                                                                value={cap.imageTiers}
                                                                onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "imageTiers", values as string[])}
                                                            />
                                                        </div>
                                                    ) : null}
                                                    {isVideo ? (
                                                        <div style={{ minWidth: 320 }}>
                                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>视频清晰度（空=480p/720p/1080p）</Typography.Text>
                                                            <Checkbox.Group
                                                                options={VIDEO_RESOLUTION_OPTIONS}
                                                                value={cap.videoResolutions}
                                                                onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "videoResolutions", values as string[])}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </Flex>
                                            </div>
                                        );
                                    })}
                            </Flex>
                        )}
                    </Card>

                    <Card variant="borderless" title="默认模型">
                        <Row gutter={16}>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultModel"]} label="默认模型">
                                    <Select showSearch allowClear options={publicModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultImageModel"]} label="默认图片模型">
                                    <Select showSearch allowClear options={publicModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultVideoModel"]} label="默认视频模型">
                                    <Select showSearch allowClear options={publicModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultTextModel"]} label="默认文本模型">
                                    <Select showSearch allowClear options={publicModelOptions} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card variant="borderless" title="渠道策略">
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "allowCustomChannel"]} label="允许用户自定义渠道" extra="开启后，前端可提供用户自定义 baseUrl 直连模式" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name={["public", "modelChannel", "allowUserRemoteChannel"]} label="允许普通用户使用云端渠道" extra="关闭后，普通用户只能使用本地直连；管理员仍可使用云端渠道" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Typography.Text type="secondary">
                            当前：{allowCustomChannel ? "用户可自带 API" : "用户不可自带 API"}
                            {allowUserRemoteChannel ? "，也可使用平台渠道" : "，仅管理员可用平台渠道"}
                        </Typography.Text>
                    </Card>
                </Flex>
            </Form>
        </main>
    );
}
