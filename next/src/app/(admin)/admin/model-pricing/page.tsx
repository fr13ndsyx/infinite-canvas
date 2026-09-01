"use client";

import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Card, Checkbox, Col, Collapse, Flex, Form, Input, InputNumber, Row, Select, Space, Switch, Table, Typography } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchAdminSettings, saveAdminSettings, type AdminImageAdapterConfig, type AdminModelCapability, type AdminModelCost, type AdminModelInfo, type AdminSettings, type AdminVideoAdapterConfig } from "@/services/api/admin";
import { modelMatchesCapability } from "@/stores/use-config-store";
import { useUserStore } from "@/stores/use-user-store";

import { collectChannelModels, emptySettings, finalizeSettingsForSave, modelCostCredits, modelInfoDescription, normalizeSettings, setModelCost, setModelDescription, syncPublicSettingsFromSaved } from "../settings-shared";

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
const VIDEO_PANEL_TYPE_OPTIONS = [
    { label: "通用面板 · 标准请求", value: "" },
    { label: "Kling V2.6 专属面板", value: "kling-v26" },
    { label: "Kling V3 专属面板", value: "kling-v3" },
    { label: "Seedance 请求适配", value: "seedance" },
    { label: "Grok 请求适配", value: "grok" },
    { label: "Agnes 请求适配", value: "agnes" },
];
const VIDEO_PROVIDER_OPTIONS = [
    { label: "不区分（空）", value: "" },
    { label: "apimart", value: "apimart" },
    { label: "kie", value: "kie" },
];
const VIDEO_RATIO_OPTIONS = [
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" },
    { label: "1:1", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "3:4", value: "3:4" },
    { label: "21:9", value: "21:9" },
    { label: "智能", value: "adaptive" },
];

function getModelCapability(items: AdminModelCapability[], model: string): AdminModelCapability {
    return items.find((item) => item.model === model) || { model, imageAspects: [], imageTiers: [], videoResolutions: [], videoSecondsMin: 4, videoSecondsMax: 20 };
}

// 渠道适配参数布尔项的三态选择："" = 默认（跟随通用协议），"true"/"false" = 显式覆盖
function adapterBoolValue(value: string): boolean | undefined {
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
}

function setModelCapabilityAdapter(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, patch: Partial<AdminImageAdapterConfig>) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const merged: AdminImageAdapterConfig = { ...(index >= 0 ? current[index].imageAdapter || {} : {}), ...patch };
    // 清理空值：全部为空时移除整个 imageAdapter（= 走通用默认）
    const cleaned: AdminImageAdapterConfig = {};
    let hasValue = false;
    (Object.keys(merged) as (keyof AdminImageAdapterConfig)[]).forEach((key) => {
        const value = merged[key];
        if (value !== undefined && value !== null && value !== "") {
            (cleaned as Record<string, unknown>)[key] = value;
            hasValue = true;
        }
    });
    const next = [...current];
    const adapter = hasValue ? cleaned : undefined;
    if (index >= 0) {
        next[index] = { ...next[index], imageAdapter: adapter };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], imageAdapter: adapter });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelCapabilityVideoAdapter(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, patch: Partial<AdminVideoAdapterConfig>) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const merged: AdminVideoAdapterConfig = { ...(index >= 0 ? current[index].videoAdapter || {} : {}), ...patch };
    // 清理空值：全部为空时移除整个 videoAdapter（= 走通用默认）
    const cleaned: AdminVideoAdapterConfig = {};
    let hasValue = false;
    (Object.keys(merged) as (keyof AdminVideoAdapterConfig)[]).forEach((key) => {
        const value = merged[key];
        if (value !== undefined && value !== null && value !== "") {
            (cleaned as Record<string, unknown>)[key] = value;
            hasValue = true;
        }
    });
    const next = [...current];
    const adapter = hasValue ? cleaned : undefined;
    if (index >= 0) {
        next[index] = { ...next[index], videoAdapter: adapter };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], videoAdapter: adapter });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function AdapterField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div style={{ minWidth: 130 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{label}</Typography.Text>
            {children}
        </div>
    );
}

// 右侧配置区分组标题：基础能力 / 参数限制 / 请求与能力 / 高级协议适配
function CapabilitySection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <Typography.Text strong style={{ display: "block", fontSize: 13, marginBottom: 8 }}>{title}</Typography.Text>
            {children}
        </div>
    );
}

// 渠道适配参数三态下拉（默认 / 支持 / 不支持）
function AdapterTriState({ value, onChange, defaultLabel }: { value: boolean | undefined; onChange: (value: boolean | undefined) => void; defaultLabel: string }) {
    return (
        <Select
            size="small"
            style={{ width: 120 }}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(v) => onChange(adapterBoolValue(v))}
            options={[
                { label: defaultLabel, value: "" },
                { label: "支持", value: "true" },
                { label: "不支持", value: "false" },
            ]}
        />
    );
}

function setModelCapabilityField(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "imageAspects" | "imageTiers" | "videoResolutions" | "videoRatios", values: string[]) {
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

function setModelCapabilitySeconds(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "videoSecondsMin" | "videoSecondsMax", value: number | null) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const fallback = { model, imageAspects: [], imageTiers: [], videoResolutions: [], videoSecondsMin: 4, videoSecondsMax: 20 } as AdminModelCapability;
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], [field]: value ?? (field === "videoSecondsMin" ? 4 : 20) };
    } else {
        next.push({ ...fallback, [field]: value ?? (field === "videoSecondsMin" ? 4 : 20) });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelCapabilityValue(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "videoPanelType" | "videoProvider", value: string) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], [field]: value };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], [field]: value });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelCapabilityBool(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "supportsFirstLastFrame" | "supportsFirstFrame" | "supportsAudioGeneration" | "supportsWatermark", value: boolean) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], [field]: value };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], [field]: value });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelFrameCapability(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "supportsFirstLastFrame" | "supportsFirstFrame", value: boolean) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    const patch = field === "supportsFirstLastFrame"
        ? { supportsFirstLastFrame: value, ...(value ? { supportsFirstFrame: false } : {}) }
        : { supportsFirstFrame: value, ...(value ? { supportsFirstLastFrame: false } : {}) };
    if (index >= 0) next[index] = { ...next[index], ...patch };
    else next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], ...patch });
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelCapabilityModes(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, modes: { value: string; label: string; desc?: string }[]) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], videoModes: modes };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], videoModes: modes });
    }
    form.setFieldValue(["public", "modelChannel", "modelCapabilities"], next);
    setModelCapabilities(next);
}

function setModelCapabilityNumber(form: any, setModelCapabilities: (items: AdminModelCapability[]) => void, model: string, field: "maxImageReferences" | "maxVideoReferences" | "maxAudioReferences", value: number | null) {
    const current = (form.getFieldValue(["public", "modelChannel", "modelCapabilities"]) || []) as AdminModelCapability[];
    const index = current.findIndex((item) => item.model === model);
    const next = [...current];
    if (index >= 0) {
        next[index] = { ...next[index], [field]: value ?? 0 };
    } else {
        next.push({ model, imageAspects: [], imageTiers: [], videoResolutions: [], [field]: value ?? 0 });
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
    const [modelInfos, setModelInfos] = useState<AdminModelInfo[]>([]);
    const [channels, setChannels] = useState<AdminSettings["private"]["channels"]>([]);
    const [capabilityKind, setCapabilityKind] = useState<"image" | "video">("image");
    const [selectedCapabilityModel, setSelectedCapabilityModel] = useState("");
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
    // 默认模型 Select options 按能力过滤，只显示对应类型的模型
    const textModelOptions = useMemo(() => availableModels.filter((m) => modelMatchesCapability(m, "text")).map((item) => ({ label: item, value: item })), [availableModels]);
    const imageModelOptions = useMemo(() => availableModels.filter((m) => modelMatchesCapability(m, "image")).map((item) => ({ label: item, value: item })), [availableModels]);
    const videoModelOptions = useMemo(() => availableModels.filter((m) => modelMatchesCapability(m, "video")).map((item) => ({ label: item, value: item })), [availableModels]);
    const imageCapabilityModels = useMemo(() => availableModels.filter((model) => modelMatchesCapability(model, "image")), [availableModels]);
    const videoCapabilityModels = useMemo(() => availableModels.filter((model) => modelMatchesCapability(model, "video")), [availableModels]);
    const capabilityModels = capabilityKind === "image" ? imageCapabilityModels : videoCapabilityModels;
    const activeCapabilityModel = capabilityModels.includes(selectedCapabilityModel) ? selectedCapabilityModel : capabilityModels[0] || "";
    const audioModelOptions = useMemo(() => availableModels.filter((m) => modelMatchesCapability(m, "audio")).map((item) => ({ label: item, value: item })), [availableModels]);

    // 定价表数据：按渠道分组扁平化，渠道列用 rowSpan 合并首行，其余行 rowSpan=0
    const pricingTableData = useMemo(() => {
        const rows: Array<{ key: string; channel: string; model: string; channelRowSpan: number; groupModels: string[] }> = [];
        channelGroups.forEach((group) => {
            group.models.forEach((model, index) => {
                rows.push({
                    key: `${group.name}-${model}`,
                    channel: group.name,
                    model,
                    channelRowSpan: index === 0 ? group.models.length : 0,
                    groupModels: group.models,
                });
            });
        });
        return rows;
    }, [channelGroups]);

    const loadSettings = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = normalizeSettings(await fetchAdminSettings(token));
            // 新模型默认全选：模型完全不在 modelCapabilities 里时填入全部选项（已存在的配置不动，包括用户手动清空的）。
            const caps = [...data.public.modelChannel.modelCapabilities];
            const existingModels = new Set(caps.map((c) => c.model));
            for (const model of data.public.modelChannel.availableModels) {
                if (existingModels.has(model)) continue;
                const isImage = modelMatchesCapability(model, "image");
                const isVideo = modelMatchesCapability(model, "video");
                if (!isImage && !isVideo) continue;
                caps.push({
                    model,
                    imageAspects: isImage ? IMAGE_ASPECT_OPTIONS.map((o) => o.value) : [],
                    imageTiers: isImage ? IMAGE_TIER_OPTIONS.map((o) => o.value) : [],
                    videoResolutions: isVideo ? VIDEO_RESOLUTION_OPTIONS.map((o) => o.value) : [],
                    videoSecondsMin: isVideo ? 4 : undefined,
                    videoSecondsMax: isVideo ? 20 : undefined,
                });
            }
            data.public.modelChannel.modelCapabilities = caps;
            form.setFieldsValue(data);
            setChannels(data.private.channels);
            setModelCosts(data.public.modelChannel.modelCosts);
            setModelCapabilities(caps);
            setModelInfos(data.public.modelChannel.modelInfos);
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
            const rawValues = form.getFieldsValue(true) as AdminSettings;
            // modelInfos 通过 state 管理，避免 form store 读取丢失
            rawValues.public.modelChannel.modelInfos = modelInfos;
            const values = finalizeSettingsForSave(rawValues);
            const saved = normalizeSettings(await saveAdminSettings(token, values));
            form.setFieldsValue(saved);
            setModelCosts(saved.public.modelChannel.modelCosts);
            setModelCapabilities(saved.public.modelChannel.modelCapabilities);
            setModelInfos(saved.public.modelChannel.modelInfos);
            syncPublicSettingsFromSaved(saved);
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
                            <Flex vertical gap={12}>
                                {/* 隐藏字段，保持 Form 对 availableModels 的绑定 */}
                                <Form.Item name={["public", "modelChannel", "availableModels"]} hidden>
                                    <InputNumber />
                                </Form.Item>
                                <Table
                                    rowKey="key"
                                    dataSource={pricingTableData}
                                    pagination={false}
                                    size="middle"
                                    bordered
                                    scroll={{ x: 920 }}
                                    columns={[
                                        {
                                            title: "渠道",
                                            dataIndex: "channel",
                                            width: 180,
                                            onCell: (row) => ({ rowSpan: row.channelRowSpan }),
                                            render: (_, row) =>
                                                row.channelRowSpan > 0 ? (
                                                    <Space direction="vertical" size={0}>
                                                        <Checkbox
                                                            checked={row.groupModels.every((m) => availableSet.has(m))}
                                                            indeterminate={row.groupModels.some((m) => availableSet.has(m)) && !row.groupModels.every((m) => availableSet.has(m))}
                                                            onChange={(e) => toggleGroupAvailable(row.groupModels, e.target.checked)}
                                                        >
                                                            <Typography.Text strong>{row.channel}</Typography.Text>
                                                        </Checkbox>
                                                        <Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>
                                                            {row.groupModels.filter((m) => availableSet.has(m)).length}/{row.groupModels.length} 已开放
                                                        </Typography.Text>
                                                    </Space>
                                                ) : null,
                                        },
                                        {
                                            title: "模型",
                                            dataIndex: "model",
                                            width: 200,
                                            render: (value: string) => (
                                                <Typography.Text style={{ maxWidth: 180 }} ellipsis={{ tooltip: value }}>
                                                    {value}
                                                </Typography.Text>
                                            ),
                                        },
                                        {
                                            title: "描述",
                                            key: "description",
                                            width: 320,
                                            render: (_, row) => (
                                                <Input
                                                    size="small"
                                                    placeholder="模型介绍文案（选填）"
                                                    maxLength={30}
                                                    value={modelInfoDescription(modelInfos, row.model)}
                                                    onChange={(e) => setModelDescription(setModelInfos, row.model, e.target.value)}
                                                />
                                            ),
                                        },
                                        {
                                            title: "开放",
                                            key: "available",
                                            width: 80,
                                            align: "center",
                                            render: (_, row) => <Switch checked={availableSet.has(row.model)} onChange={(checked) => toggleModelAvailable(row.model, checked)} />,
                                        },
                                        {
                                            title: "单价",
                                            key: "credits",
                                            width: 160,
                                            render: (_, row) => (
                                                <Space.Compact>
                                                    <InputNumber
                                                        min={0}
                                                        step={1}
                                                        precision={0}
                                                        style={{ width: 100 }}
                                                        value={modelCostCredits(modelCosts, row.model)}
                                                        disabled={!availableSet.has(row.model)}
                                                        onChange={(value) => setModelCost(form, setModelCosts, row.model, Number(value) || 0)}
                                                    />
                                                    <span style={{ display: "flex", alignItems: "center", padding: "0 10px", border: "1px solid var(--ant-color-border)", borderLeft: 0, borderRadius: "0 6px 6px 0", background: "var(--ant-color-fill-quaternary)" }}>
                                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>点</Typography.Text>
                                                    </span>
                                                </Space.Compact>
                                            ),
                                        },
                                    ]}
                                />
                            </Flex>
                        )}
                    </Card>

                    <Card
                        variant="borderless"
                        title="模型能力配置"
                        extra={<Button type="primary" size="small" icon={<SaveOutlined />} loading={isSaving} onClick={() => void saveSettings()}>保存</Button>}
                    >
                        <div className="mb-4 rounded-lg border border-[var(--ant-color-border-secondary)] bg-[var(--ant-color-fill-quaternary)] px-3 py-2.5">
                            <Typography.Text strong style={{ fontSize: 12 }}>配置建议</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", marginTop: 3, fontSize: 12 }}>
                                图片模型先配置比例/档位；视频模型先配置分辨率/比例/时长，再按厂商文档勾选能力。只有上游接口与通用协议不一致时，再展开“高级协议适配”。勾选能力后前端会自动显示对应控件并约束请求，无需额外修改前端代码。
                            </Typography.Text>
                        </div>
                        {/* 隐藏字段，保持 Form 对 modelCapabilities 的绑定 */}
                        <Form.Item name={["public", "modelChannel", "modelCapabilities"]} hidden>
                            <InputNumber />
                        </Form.Item>
                        {imageCapabilityModels.length === 0 && videoCapabilityModels.length === 0 ? (
                            <Typography.Text type="secondary">请先在上方开放图片或视频模型</Typography.Text>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                                <aside className="min-w-0">
                                    <div className="px-2 pb-1 text-xs text-[var(--ant-color-text-secondary)]">图片模型 <span className="opacity-60">{imageCapabilityModels.length}</span></div>
                                    <div style={{ maxHeight: 256, overflowY: "auto" }}>
                                        {imageCapabilityModels.map((model) => (
                                            <button
                                                key={model}
                                                type="button"
                                                title={model}
                                                onClick={() => {
                                                    setCapabilityKind("image");
                                                    setSelectedCapabilityModel(model);
                                                }}
                                                className={`block w-full truncate rounded-md border px-2 py-1.5 text-left text-sm transition ${model === activeCapabilityModel ? "border-[var(--ant-color-primary-border)] font-medium text-[var(--ant-color-text)]" : "border-transparent text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill-quaternary)]"}`}
                                                style={model === activeCapabilityModel ? { background: "color-mix(in srgb, var(--ant-color-primary) 8%, var(--ant-color-bg-container))", boxShadow: "0 2px 8px color-mix(in srgb, var(--ant-color-primary) 18%, transparent)" } : undefined}
                                            >
                                                {model}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 px-2 pb-1 text-xs text-[var(--ant-color-text-secondary)]">视频模型 <span className="opacity-60">{videoCapabilityModels.length}</span></div>
                                    <div style={{ maxHeight: 256, overflowY: "auto" }}>
                                        {videoCapabilityModels.map((model) => (
                                            <button
                                                key={model}
                                                type="button"
                                                title={model}
                                                onClick={() => {
                                                    setCapabilityKind("video");
                                                    setSelectedCapabilityModel(model);
                                                }}
                                                className={`block w-full truncate rounded-md border px-2 py-1.5 text-left text-sm transition ${model === activeCapabilityModel ? "border-[var(--ant-color-primary-border)] font-medium text-[var(--ant-color-text)]" : "border-transparent text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill-quaternary)]"}`}
                                                style={model === activeCapabilityModel ? { background: "color-mix(in srgb, var(--ant-color-primary) 8%, var(--ant-color-bg-container))", boxShadow: "0 2px 8px color-mix(in srgb, var(--ant-color-primary) 18%, transparent)" } : undefined}
                                            >
                                                {model}
                                            </button>
                                        ))}
                                    </div>
                                </aside>
                                <div className="min-w-0" style={{ height: 600, overflowY: "auto", overflowX: "hidden" }}>
                                    {activeCapabilityModel ? (
                                        (() => {
                                            const model = activeCapabilityModel;
                                            const cap = getModelCapability(modelCapabilities, model);
                                            const isImage = capabilityKind === "image";
                                            return (
                                                <Flex vertical gap={12}>
                                                    {isImage ? (
                                                        <>
                                                            <CapabilitySection title="基础能力">
                                                                <Flex gap={32} wrap>
                                                                    <div style={{ minWidth: "min(100%, 320px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>图片比例</Typography.Text>
                                                                        <Checkbox.Group
                                                                            options={IMAGE_ASPECT_OPTIONS}
                                                                            value={cap.imageAspects}
                                                                            onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "imageAspects", values as string[])}
                                                                        />
                                                                    </div>
                                                                    <div style={{ minWidth: "min(100%, 220px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>图片档位</Typography.Text>
                                                                        <Checkbox.Group
                                                                            options={IMAGE_TIER_OPTIONS}
                                                                            value={cap.imageTiers}
                                                                            onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "imageTiers", values as string[])}
                                                                        />
                                                                    </div>
                                                                </Flex>
                                                            </CapabilitySection>
                                                            <Collapse
                                                                ghost
                                                                expandIconPosition="end"
                                                                styles={{ header: { display: "inline-flex", width: "fit-content", padding: "0 0 4px", gap: 6 }, title: { flex: "0 1 auto", fontWeight: 600, fontSize: 13 }, body: { padding: "4px 0 0" } }}
                                                                items={[{
                                                                    key: "image-adapter",
                                                                    label: "高级协议适配",
                                                                        children: (
                                                                            <div style={{ paddingTop: 4 }}>
                                                                                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                                                                                    后端请求归一化规则，全部默认时走 OpenAI images 标准协议；仅聚合渠道等非标准上游需要按模型接口文档配置
                                                                                </Typography.Text>
                                                                                <Flex gap={16} wrap>
                                                                                    <AdapterField label="比例字段名">
                                                                                        <Input size="small" style={{ width: 110 }} placeholder="size" value={cap.imageAdapter?.aspectField || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { aspectField: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率参数">
                                                                                        <AdapterTriState value={cap.imageAdapter?.hasResolution} defaultLabel="默认（支持）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { hasResolution: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率大小写">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 120 }}
                                                                                            value={cap.imageAdapter?.resolutionCase || ""}
                                                                                            onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { resolutionCase: v })}
                                                                                            options={[
                                                                                                { label: "默认（大写）", value: "" },
                                                                                                { label: "大写（2K）", value: "upper" },
                                                                                                { label: "小写（2k）", value: "lower" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率下限">
                                                                                        <Input size="small" style={{ width: 90 }} placeholder="如 2K" value={cap.imageAdapter?.minResolution || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { minResolution: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率上限">
                                                                                        <Input size="small" style={{ width: 90 }} placeholder="如 1K" value={cap.imageAdapter?.maxResolution || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { maxResolution: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="数量 n">
                                                                                        <AdapterTriState value={cap.imageAdapter?.hasCount} defaultLabel="默认（支持）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { hasCount: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="quality">
                                                                                        <AdapterTriState value={cap.imageAdapter?.hasQuality} defaultLabel="默认（不支持）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { hasQuality: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="output_format">
                                                                                        <AdapterTriState value={cap.imageAdapter?.hasOutput} defaultLabel="默认（不支持）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { hasOutput: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图">
                                                                                        <AdapterTriState value={cap.imageAdapter?.hasImageRefs} defaultLabel="默认（支持）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { hasImageRefs: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图字段名">
                                                                                        <Input size="small" style={{ width: 120 }} placeholder="image_urls" value={cap.imageAdapter?.imageRefField || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { imageRefField: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图上限">
                                                                                        <InputNumber size="small" min={0} max={20} style={{ width: 90 }} placeholder="0=不限" value={cap.imageAdapter?.maxImageRefs || undefined} onChange={(value) => setModelCapabilityAdapter(form, setModelCapabilities, model, { maxImageRefs: Number(value) || 0 })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="必须参考图">
                                                                                        <AdapterTriState value={cap.imageAdapter?.requireRefs} defaultLabel="默认（否）" onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { requireRefs: v })} />
                                                                                    </AdapterField>
                                                                                </Flex>
                                                                                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", margin: "12px 0 8px" }}>
                                                                                    档位映射：把前端发来的「比例 + 档位」翻译成上游原生参数。未配置 = 折算成像素 size（OpenAI 标准协议）；如 gpt-image 配 quality（low/medium/high）、Grok 配 resolution（1k/2k）、Seedream 官方配 size（2K/4K）+ 比例写入提示词
                                                                                </Typography.Text>
                                                                                <Flex gap={16} wrap>
                                                                                    <AdapterField label="档位映射字段">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 150 }}
                                                                                            value={cap.imageAdapter?.tierField || ""}
                                                                                            onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { tierField: v })}
                                                                                            options={[
                                                                                                { label: "默认（折算像素）", value: "" },
                                                                                                { label: "quality", value: "quality" },
                                                                                                { label: "resolution", value: "resolution" },
                                                                                                { label: "size", value: "size" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="standard 档映射">
                                                                                        <Input size="small" style={{ width: 100 }} placeholder="如 low / 1k / 2K" value={cap.imageAdapter?.tierStandard || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { tierStandard: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="2K 档映射">
                                                                                        <Input size="small" style={{ width: 100 }} placeholder="如 medium / 2k / 2K" value={cap.imageAdapter?.tier2k || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { tier2k: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="4K 档映射">
                                                                                        <Input size="small" style={{ width: 100 }} placeholder="如 high / 2k / 4K" value={cap.imageAdapter?.tier4k || ""} onChange={(e) => setModelCapabilityAdapter(form, setModelCapabilities, model, { tier4k: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="比例处理">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 150 }}
                                                                                            value={cap.imageAdapter?.ratioMode || ""}
                                                                                            onChange={(v) => setModelCapabilityAdapter(form, setModelCapabilities, model, { ratioMode: v })}
                                                                                            options={[
                                                                                                { label: "默认（折算像素）", value: "" },
                                                                                                { label: "直传比例字段", value: "field" },
                                                                                                { label: "写入提示词", value: "prompt" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                </Flex>
                                                                            </div>
                                                                        ),
                                                                    }]}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CapabilitySection title="基础能力">
                                                                <Flex gap={32} wrap>
                                                                    <div style={{ minWidth: "min(100%, 320px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>视频分辨率</Typography.Text>
                                                                        <Checkbox.Group
                                                                            options={VIDEO_RESOLUTION_OPTIONS}
                                                                            value={cap.videoResolutions}
                                                                            onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "videoResolutions", values as string[])}
                                                                        />
                                                                    </div>
                                                                    <div style={{ minWidth: "min(100%, 280px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>视频比例</Typography.Text>
                                                                        <Checkbox.Group
                                                                            options={VIDEO_RATIO_OPTIONS}
                                                                            value={cap.videoRatios}
                                                                            onChange={(values) => setModelCapabilityField(form, setModelCapabilities, model, "videoRatios", values as string[])}
                                                                        />
                                                                    </div>
                                                                </Flex>
                                                            </CapabilitySection>
                                                            <CapabilitySection title="参数限制">
                                                                <Flex gap={32} wrap>
                                                                    <div style={{ minWidth: "min(100%, 220px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>视频秒数范围（默认 4-20）</Typography.Text>
                                                                        <Space>
                                                                            <InputNumber
                                                                                size="small"
                                                                                min={1}
                                                                                max={60}
                                                                                value={cap.videoSecondsMin ?? 4}
                                                                                onChange={(value) => setModelCapabilitySeconds(form, setModelCapabilities, model, "videoSecondsMin", value)}
                                                                                style={{ width: 80 }}
                                                                            />
                                                                            <span style={{ color: "var(--ant-color-text-secondary)" }}>~</span>
                                                                            <InputNumber
                                                                                size="small"
                                                                                min={1}
                                                                                max={60}
                                                                                value={cap.videoSecondsMax ?? 20}
                                                                                onChange={(value) => setModelCapabilitySeconds(form, setModelCapabilities, model, "videoSecondsMax", value)}
                                                                                style={{ width: 80 }}
                                                                            />
                                                                            <span style={{ color: "var(--ant-color-text-secondary)", fontSize: 12 }}>秒</span>
                                                                        </Space>
                                                                    </div>
                                                                    <div style={{ minWidth: "min(100%, 280px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>参考素材数量上限（0=默认，视频 -1=不支持）</Typography.Text>
                                                                        <Space>
                                                                            <InputNumber
                                                                                size="small"
                                                                                min={0}
                                                                                max={20}
                                                                                placeholder="图片"
                                                                                value={cap.maxImageReferences || undefined}
                                                                                onChange={(value) => setModelCapabilityNumber(form, setModelCapabilities, model, "maxImageReferences", value)}
                                                                                style={{ width: 90 }}
                                                                            />
                                                                            <InputNumber
                                                                                size="small"
                                                                                min={-1}
                                                                                max={10}
                                                                                placeholder="视频"
                                                                                value={cap.maxVideoReferences || undefined}
                                                                                onChange={(value) => setModelCapabilityNumber(form, setModelCapabilities, model, "maxVideoReferences", value)}
                                                                                style={{ width: 90 }}
                                                                            />
                                                                            <InputNumber
                                                                                size="small"
                                                                                min={0}
                                                                                max={10}
                                                                                placeholder="音频"
                                                                                value={cap.maxAudioReferences || undefined}
                                                                                onChange={(value) => setModelCapabilityNumber(form, setModelCapabilities, model, "maxAudioReferences", value)}
                                                                                style={{ width: 90 }}
                                                                            />
                                                                        </Space>
                                                                    </div>
                                                                </Flex>
                                                            </CapabilitySection>
                                                            <CapabilitySection title="请求与能力">
                                                                <Flex gap={32} wrap>
                                                                    <div style={{ minWidth: 180 }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>前端面板 / 请求适配</Typography.Text>
                                                                        <Select
                                                                            size="small"
                                                                            style={{ width: 180 }}
                                                                            value={cap.videoPanelType || ""}
                                                                            onChange={(value) => setModelCapabilityValue(form, setModelCapabilities, model, "videoPanelType", value)}
                                                                            options={VIDEO_PANEL_TYPE_OPTIONS}
                                                                        />
                                                                        <Typography.Text type="secondary" style={{ display: "block", marginTop: 5, fontSize: 11 }}>
                                                                            通用模型选“通用”；只有需要专属控件或特殊请求体时才选择其他类型。
                                                                        </Typography.Text>
                                                                    </div>
                                                                    {cap.videoPanelType === "kling-v3" ? (
                                                                        <div style={{ minWidth: 140 }}>
                                                                            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>厂商（区分请求体格式）</Typography.Text>
                                                                            <Select
                                                                                size="small"
                                                                                style={{ width: 120 }}
                                                                                value={cap.videoProvider || ""}
                                                                                onChange={(value) => setModelCapabilityValue(form, setModelCapabilities, model, "videoProvider", value)}
                                                                                options={VIDEO_PROVIDER_OPTIONS}
                                                                            />
                                                                        </div>
                                                                    ) : null}
                                                                    <div style={{ minWidth: "min(100%, 360px)" }}>
                                                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>能力开关（只勾选上游明确支持的能力）</Typography.Text>
                                                                        <Flex gap={8} wrap>
                                                                            <Checkbox checked={!!cap.supportsFirstLastFrame} onChange={(e) => setModelFrameCapability(form, setModelCapabilities, model, "supportsFirstLastFrame", e.target.checked)}>首尾帧</Checkbox>
                                                                            <Checkbox checked={!!cap.supportsFirstFrame} onChange={(e) => setModelFrameCapability(form, setModelCapabilities, model, "supportsFirstFrame", e.target.checked)}>首帧</Checkbox>
                                                                            <Checkbox checked={!!cap.supportsAudioGeneration} onChange={(e) => setModelCapabilityBool(form, setModelCapabilities, model, "supportsAudioGeneration", e.target.checked)}>音频生成</Checkbox>
                                                                            <Checkbox checked={!!cap.supportsWatermark} onChange={(e) => setModelCapabilityBool(form, setModelCapabilities, model, "supportsWatermark", e.target.checked)}>水印</Checkbox>
                                                                        </Flex>
                                                                    </div>
                                                                </Flex>
                                                            </CapabilitySection>
                                                            <Collapse
                                                                ghost
                                                                expandIconPosition="end"
                                                                styles={{ header: { display: "inline-flex", width: "fit-content", padding: "0 0 4px", gap: 6 }, title: { fontWeight: 600, fontSize: 13 }, body: { padding: "4px 0 0" } }}
                                                                items={[{
                                                                    key: "video-modes",
                                                                    label: "模式选项（按需配置）",
                                                                    children: (
                                                                        <div>
                                                                            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 6, fontSize: 11 }}>适用于 Kling/Grok 等有模式参数的模型；值=发送给上游，标签=前端显示。通用模型留空即可。</Typography.Text>
                                                                            <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                                                                {(cap.videoModes || []).map((mode, modeIndex) => (
                                                                                    <Space key={modeIndex} size={4}>
                                                                                        <Input size="small" placeholder="值" style={{ width: 70 }} value={mode.value} onChange={(e) => setModelCapabilityModes(form, setModelCapabilities, model, (cap.videoModes || []).map((m, i) => i === modeIndex ? { ...m, value: e.target.value } : m))} />
                                                                                        <Input size="small" placeholder="标签" style={{ width: 80 }} value={mode.label} onChange={(e) => setModelCapabilityModes(form, setModelCapabilities, model, (cap.videoModes || []).map((m, i) => i === modeIndex ? { ...m, label: e.target.value } : m))} />
                                                                                        <Input size="small" placeholder="说明" style={{ width: 100 }} value={mode.desc || ""} onChange={(e) => setModelCapabilityModes(form, setModelCapabilities, model, (cap.videoModes || []).map((m, i) => i === modeIndex ? { ...m, desc: e.target.value } : m))} />
                                                                                        <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => setModelCapabilityModes(form, setModelCapabilities, model, (cap.videoModes || []).filter((_, i) => i !== modeIndex))} />
                                                                                    </Space>
                                                                                ))}
                                                                                <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => setModelCapabilityModes(form, setModelCapabilities, model, [...(cap.videoModes || []), { value: "", label: "" }])}>添加模式</Button>
                                                                            </Space>
                                                                        </div>
                                                                    ),
                                                                }]}
                                                            />
                                                            <Collapse
                                                                ghost
                                                                expandIconPosition="end"
                                                                styles={{ header: { display: "inline-flex", width: "fit-content", padding: "0 0 4px", gap: 6 }, title: { flex: "0 1 auto", fontWeight: 600, fontSize: 13 }, body: { padding: "4px 0 0" } }}
                                                                items={[{
                                                                    key: "video-adapter",
                                                                    label: "高级协议适配",
                                                                        children: (
                                                                            <div style={{ paddingTop: 4 }}>
                                                                                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                                                                                    后端视频请求归一化规则，全部默认时走通用协议（aspect_ratio 比例 + resolution 清晰度 + image_urls 纯 URL 数组参考图）；聚合渠道等非标准上游按模型接口文档配置
                                                                                </Typography.Text>
                                                                                <Flex gap={16} wrap>
                                                                                    <AdapterField label="比例字段名">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 150 }}
                                                                                            value={cap.videoAdapter?.aspectField || ""}
                                                                                            onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { aspectField: v })}
                                                                                            options={[
                                                                                                { label: "默认（aspect_ratio）", value: "" },
                                                                                                { label: "size", value: "size" },
                                                                                                { label: "不支持比例", value: "none" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率参数">
                                                                                        <AdapterTriState value={cap.videoAdapter?.hasResolution} defaultLabel="默认（支持）" onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { hasResolution: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率表达">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 130 }}
                                                                                            value={cap.videoAdapter?.resolutionCase || ""}
                                                                                            onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { resolutionCase: v })}
                                                                                            options={[
                                                                                                { label: "默认（720p 小写）", value: "" },
                                                                                                { label: "upper_video", value: "upper_video" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率上限">
                                                                                        <Input size="small" style={{ width: 90 }} placeholder="如 720p" value={cap.videoAdapter?.maxResolution || ""} onChange={(e) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { maxResolution: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="分辨率推模式">
                                                                                        <AdapterTriState value={cap.videoAdapter?.modeFromRes} defaultLabel="默认（否）" onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { modeFromRes: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="quality">
                                                                                        <AdapterTriState value={cap.videoAdapter?.hasQuality} defaultLabel="默认（不支持）" onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { hasQuality: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="带图丢比例">
                                                                                        <AdapterTriState value={cap.videoAdapter?.dropAspectWithImage} defaultLabel="默认（否）" onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { dropAspectWithImage: v })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图字段名">
                                                                                        <Input size="small" style={{ width: 120 }} placeholder="image_urls" value={cap.videoAdapter?.imageRefField || ""} onChange={(e) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { imageRefField: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图组装模式">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 170 }}
                                                                                            value={cap.videoAdapter?.imageRefKind || ""}
                                                                                            onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { imageRefKind: v })}
                                                                                            options={[
                                                                                                { label: "默认（纯 URL 数组）", value: "" },
                                                                                                { label: "首尾帧双字段（first_last）", value: "first_last" },
                                                                                                { label: "仅首帧（first_only）", value: "first_only" },
                                                                                                { label: "多帧序列（array_frames）", value: "array_frames" },
                                                                                                { label: "图+角色配对（roles）", value: "roles" },
                                                                                                { label: "单 URL 字段（single）", value: "single" },
                                                                                                { label: "Seedance 2 数组（seedance2）", value: "seedance2" },
                                                                                                { label: "Minimax H3（minimax_h3）", value: "minimax_h3" },
                                                                                                { label: "Skyreels", value: "skyreels" },
                                                                                                { label: "Happyhorse", value: "happyhorse" },
                                                                                                { label: "Happyhorse 1.1", value: "happyhorse11" },
                                                                                                { label: "Pixverse", value: "pixverse" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考图上限">
                                                                                        <InputNumber size="small" min={0} max={20} style={{ width: 90 }} placeholder="0=不限" value={cap.videoAdapter?.maxImageRefs || undefined} onChange={(value) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { maxImageRefs: Number(value) || 0 })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考视频字段名">
                                                                                        <Input size="small" style={{ width: 120 }} placeholder="空=不支持" value={cap.videoAdapter?.videoRefField || ""} onChange={(e) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { videoRefField: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考视频组装模式">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 170 }}
                                                                                            value={cap.videoAdapter?.videoRefKind || ""}
                                                                                            onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { videoRefKind: v })}
                                                                                            options={[
                                                                                                { label: "默认（不支持）", value: "" },
                                                                                                { label: "纯 URL 数组（array）", value: "array" },
                                                                                                { label: "单 URL 字段（single）", value: "single" },
                                                                                                { label: "Kling 视频列表（kling_video_list）", value: "kling_video_list" },
                                                                                                { label: "Skyreels", value: "skyreels" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考音频字段名">
                                                                                        <Input size="small" style={{ width: 120 }} placeholder="空=不支持" value={cap.videoAdapter?.audioRefField || ""} onChange={(e) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { audioRefField: e.target.value })} />
                                                                                    </AdapterField>
                                                                                    <AdapterField label="参考音频组装模式">
                                                                                        <Select
                                                                                            size="small"
                                                                                            style={{ width: 170 }}
                                                                                            value={cap.videoAdapter?.audioRefKind || ""}
                                                                                            onChange={(v) => setModelCapabilityVideoAdapter(form, setModelCapabilities, model, { audioRefKind: v })}
                                                                                            options={[
                                                                                                { label: "默认（不支持）", value: "" },
                                                                                                { label: "纯 URL 数组（array）", value: "array" },
                                                                                                { label: "单 URL 字段（single）", value: "single" },
                                                                                                { label: "Wan 语音（wan_r2v_voice）", value: "wan_r2v_voice" },
                                                                                                { label: "Skyreels 参考图（skyreels_ref_images）", value: "skyreels_ref_images" },
                                                                                            ]}
                                                                                        />
                                                                                    </AdapterField>
                                                                                </Flex>
                                                                            </div>
                                                                        ),
                                                                    }]}
                                                            />
                                                        </>
                                                    )}
                                                </Flex>
                                            );
                                        })()
                                    ) : (
                                        <Typography.Text type="secondary">请先在左侧选择模型</Typography.Text>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card variant="borderless" title="默认模型">
                        <Row gutter={16}>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultTextModel"]} label="默认文本模型">
                                    <Select showSearch allowClear options={textModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultImageModel"]} label="默认图片模型">
                                    <Select showSearch allowClear options={imageModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultVideoModel"]} label="默认视频模型">
                                    <Select showSearch allowClear options={videoModelOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name={["public", "modelChannel", "defaultAudioModel"]} label="默认音频模型">
                                    <Select showSearch allowClear options={audioModelOptions} />
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
