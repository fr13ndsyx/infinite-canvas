"use client";

import { App, Button, Form, Input, Modal, Select, Switch, Tabs } from "antd";
import { useEffect, useState } from "react";

import { ModelPicker } from "@/components/model-picker";
import { fetchImageModels } from "@/services/api/image";
import { fetchUserConfig, measureUserStorageProvider, syncUserModelConfig, syncUserStorageProvider } from "@/services/api/user-config";
import { clearStorageConfigCache as clearFileStorageCache } from "@/services/file-storage";
import { clearStorageConfigCache as clearImageStorageCache, defaultUserStorageProvider, loadStorageConfig, saveUserStorageProvider, USER_STORAGE_PROVIDER_KEY, type UserStorageProvider } from "@/services/image-storage";
import { audioFormatOptions, audioVoiceOptions, normalizeAudioSpeedValue } from "@/lib/audio-generation";
import { filterModelsByCapability, normalizeLocalChannels, useConfigStore, useEffectiveConfig, type AiConfig, type LocalModelChannel, type ModelCapability } from "@/stores/use-config-store";
import { useUserStore } from "@/stores/use-user-store";

type ModelGroup = {
    capability: ModelCapability;
    modelKey: "imageModel" | "videoModel" | "textModel" | "audioModel";
    channelKey: "imageChannelId" | "videoChannelId" | "textChannelId" | "audioChannelId";
    modelsKey: "imageModels" | "videoModels" | "textModels" | "audioModels";
    defaultLabel: string;
    optionsLabel: string;
};

const modelGroups: ModelGroup[] = [
    { capability: "image", modelKey: "imageModel", channelKey: "imageChannelId", modelsKey: "imageModels", defaultLabel: "默认生图模型", optionsLabel: "生图模型可选项" },
    { capability: "video", modelKey: "videoModel", channelKey: "videoChannelId", modelsKey: "videoModels", defaultLabel: "默认视频模型", optionsLabel: "视频模型可选项" },
    { capability: "text", modelKey: "textModel", channelKey: "textChannelId", modelsKey: "textModels", defaultLabel: "默认文本模型", optionsLabel: "文本模型可选项" },
    { capability: "audio", modelKey: "audioModel", channelKey: "audioChannelId", modelsKey: "audioModels", defaultLabel: "默认音频模型", optionsLabel: "音频模型可选项" },
];

export function AppConfigModal() {
    const { message } = App.useApp();
    const [loadingModels, setLoadingModels] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [remoteStorageSyncEnabled, setRemoteStorageSyncEnabled] = useState(false);
    const [allowUserStorageProvider, setAllowUserStorageProvider] = useState(false);
    const [userStorage, setUserStorage] = useState<UserStorageProvider>(() => defaultUserStorageProvider());
    const [measuringStorage, setMeasuringStorage] = useState(false);
    const [storageUsageText, setStorageUsageText] = useState("");
    const [activeTab, setActiveTab] = useState<"local" | "remote" | "preferences">("local");
    const config = useConfigStore((state) => state.config);
    const updateConfig = useConfigStore((state) => state.updateConfig);
    const isConfigOpen = useConfigStore((state) => state.isConfigOpen);
    const shouldPromptContinue = useConfigStore((state) => state.shouldPromptContinue);
    const setConfigDialogOpen = useConfigStore((state) => state.setConfigDialogOpen);
    const clearPromptContinue = useConfigStore((state) => state.clearPromptContinue);
    const publicSettings = useConfigStore((state) => state.publicSettings);
    const token = useUserStore((state) => state.token);
    const user = useUserStore((state) => state.user);
    const effectiveConfig = useEffectiveConfig();
    const modelChannel = publicSettings?.modelChannel;
    const isLoggedIn = Boolean(token && user);
    const canUseRemoteChannel = isLoggedIn && (user?.role === "admin" || modelChannel?.allowUserRemoteChannel === true);
    const allowCustomChannel = isLoggedIn && modelChannel?.allowCustomChannel === true;
    const effectiveMode = canUseRemoteChannel ? (allowCustomChannel ? config.channelMode : "remote") : "local";
    const localModelConfig: AiConfig = effectiveMode === "local" && config.channelMode !== "local" ? { ...config, channelMode: "local" } : config;
    const modelConfig = effectiveMode === "remote" ? effectiveConfig : localModelConfig;
    const canUseUserStorageProvider = isLoggedIn && allowUserStorageProvider;
    // 可见 Tab：admin 且双开关可见全部三个；普通用户仅显示当前可用渠道 Tab + 偏好设置
    const visibleTabs: Array<{ label: string; value: "local" | "remote" | "preferences" }> = [];
    if (effectiveMode === "local" || (allowCustomChannel && canUseRemoteChannel)) {
        visibleTabs.push({ label: "本地渠道", value: "local" });
    }
    if (effectiveMode === "remote" || (allowCustomChannel && canUseRemoteChannel)) {
        visibleTabs.push({ label: "平台渠道", value: "remote" });
    }
    visibleTabs.push({ label: "偏好设置", value: "preferences" });

    useEffect(() => {
        try {
            setUserStorage({ ...defaultUserStorageProvider(), ...JSON.parse(window.localStorage.getItem(USER_STORAGE_PROVIDER_KEY) || "{}") });
        } catch {
            setUserStorage(defaultUserStorageProvider());
        }
        if (!isConfigOpen || !token) return;
        let canceled = false;
        void fetchUserConfig(token)
            .then((payload) => {
                if (canceled) return;
                const remoteConfig = payload.modelConfig;
                const shouldSync = remoteConfig?.syncModelConfig === true;
                const shouldSyncStorage = remoteConfig?.syncStorageConfig === true;
                setRemoteStorageSyncEnabled(shouldSyncStorage);
                if (remoteConfig) {
                    Object.entries(remoteConfig)
                        .filter(([key]) => shouldSync || !["apiKey", "baseUrl", "localChannels"].includes(key))
                        .forEach(([key, value]) => updateConfig(key as keyof AiConfig, value as never));
                } else {
                    updateConfig("syncModelConfig", false);
                }
                updateConfig("syncStorageConfig", shouldSyncStorage);
                if (shouldSyncStorage && payload.storageProvider) {
                    const next = {
                        ...defaultUserStorageProvider(),
                        ...payload.storageProvider,
                        enabled: payload.storageProvider.enabled !== undefined ? payload.storageProvider.enabled : true,
                    };
                    setUserStorage(next);
                    saveUserStorageProvider(next);
                }
            })
            .catch(() => {});
        return () => {
            canceled = true;
        };
    }, [isConfigOpen, token, updateConfig]);

    useEffect(() => {
        if (!isConfigOpen) return;
        let canceled = false;
        void loadStorageConfig()
            .then((storage) => {
                if (!canceled) setAllowUserStorageProvider(storage.allowUserProvider === true);
            })
            .catch(() => {
                if (!canceled) setAllowUserStorageProvider(false);
            });
        return () => {
            canceled = true;
        };
    }, [isConfigOpen]);

    // 拦截未登录且后台关闭 allowGuestConfig 时的弹窗打开（覆盖模型选择器等所有入口）
    useEffect(() => {
        if (isConfigOpen && !user && publicSettings?.modelChannel?.allowGuestConfig === false) {
            setConfigDialogOpen(false);
            clearPromptContinue();
            message.info("请登录后使用配置功能");
        }
    }, [isConfigOpen, user, publicSettings?.modelChannel?.allowGuestConfig, setConfigDialogOpen, clearPromptContinue, message]);

    // 弹窗打开时根据当前渠道模式重置默认 Tab（仅 isConfigOpen 由 false→true 时触发，避免与用户手动切换冲突）
    useEffect(() => {
        if (isConfigOpen) {
            setActiveTab(effectiveMode === "remote" ? "remote" : "local");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConfigOpen]);

    const finishConfig = async () => {
        const localIncomplete = effectiveMode === "local" && normalizeLocalChannels(config).some((channel) => !channel.baseUrl.trim() || !channel.apiKey.trim());
        const modelIncomplete = !modelConfig.imageModel.trim() || !modelConfig.videoModel.trim() || !modelConfig.textModel.trim();
        if (!canUseRemoteChannel && config.channelMode !== "local") updateConfig("channelMode", "local");
        else if (canUseRemoteChannel && !allowCustomChannel && config.channelMode !== "remote") updateConfig("channelMode", "remote");
        if (canUseUserStorageProvider) saveUserStorageProvider(userStorage);
        setSavingConfig(true);
        try {
            if (token) {
                const configToSave = effectiveMode === "local" && config.channelMode !== "local" ? { ...config, channelMode: "local" as const } : config;
                const shouldSaveLocalSecrets = effectiveMode === "local" && config.syncModelConfig;
                await syncUserModelConfig(
                    token,
                    shouldSaveLocalSecrets
                        ? configToSave
                        : {
                              ...configToSave,
                              channelMode: canUseRemoteChannel ? "remote" : "local",
                              apiKey: "",
                              baseUrl: "",
                              localChannels: [],
                          },
                );
            }
            if (token && canUseUserStorageProvider && (config.syncStorageConfig || remoteStorageSyncEnabled)) {
                await syncUserStorageProvider(token, config.syncStorageConfig ? userStorage : { ...userStorage, enabled: false, endpoint: "", bucket: "", accessKeyId: "", secretAccessKey: "" });
                setRemoteStorageSyncEnabled(config.syncStorageConfig);
            }
            clearImageStorageCache();
            clearFileStorageCache();
            setConfigDialogOpen(false);
            if ((config.syncModelConfig || config.syncStorageConfig) && !token) message.warning("请登录后再同步配置");
            else if (localIncomplete || modelIncomplete) message.warning("部分模型或本地渠道密钥尚未配置完整，配置已保存");
            else message.success(shouldPromptContinue ? "配置已保存，请继续刚才的请求" : "配置已保存");
            clearPromptContinue();
        } catch (error) {
            message.error(error instanceof Error ? "同步配置失败：" + error.message : "同步配置失败");
        } finally {
            setSavingConfig(false);
        }
    };

    const refreshModels = async () => {
        if (effectiveMode === "remote") return;
        const channels = normalizeLocalChannels(config);
        if (channels.some((channel) => !channel.baseUrl.trim() || !channel.apiKey.trim())) {
            message.error("请先填写所有本地渠道的 Base URL 和 API Key");
            return;
        }
        setLoadingModels(true);
        try {
            const nextChannels = await Promise.all(channels.map(async (channel) => ({ ...channel, models: await fetchImageModels(configForLocalChannel(config, channel)) })));
            updateLocalChannels(nextChannels);
            message.success("模型列表已更新");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取模型失败");
        } finally {
            setLoadingModels(false);
        }
    };

    const updateLocalChannels = (channels: LocalModelChannel[]) => {
        const normalized = channels.length ? channels : normalizeLocalChannels({ baseUrl: config.baseUrl, apiKey: config.apiKey, models: config.models });
        const models = uniqueModels(normalized.flatMap((channel) => channel.models));
        const nextImageModels = filterModelsByCapability(models, "image");
        const nextVideoModels = filterModelsByCapability(models, "video");
        const nextTextModels = filterModelsByCapability(models, "text");
        const nextAudioModels = filterModelsByCapability(models, "audio");
        const imageModel = nextImageModels.includes(config.imageModel) ? config.imageModel : nextImageModels[0] || "";
        const videoModel = nextVideoModels.includes(config.videoModel) ? config.videoModel : nextVideoModels[0] || "";
        const textModel = nextTextModels.includes(config.textModel) ? config.textModel : nextTextModels[0] || "";
        const audioModel = nextAudioModels.includes(config.audioModel) ? config.audioModel : nextAudioModels[0] || "";
        updateConfig("localChannels", normalized);
        updateConfig("models", models);
        updateConfig("imageModels", nextImageModels);
        updateConfig("videoModels", nextVideoModels);
        updateConfig("textModels", nextTextModels);
        updateConfig("audioModels", nextAudioModels);
        updateConfig("imageModel", imageModel);
        updateConfig("videoModel", videoModel);
        updateConfig("textModel", textModel);
        updateConfig("audioModel", audioModel);
        updateConfig("imageChannelId", channelIdForLocalModel(normalized, imageModel, config.imageChannelId));
        updateConfig("videoChannelId", channelIdForLocalModel(normalized, videoModel, config.videoChannelId));
        updateConfig("textChannelId", channelIdForLocalModel(normalized, textModel, config.textChannelId));
        updateConfig("audioChannelId", channelIdForLocalModel(normalized, audioModel, config.audioChannelId));
        updateConfig("baseUrl", normalized[0]?.baseUrl || config.baseUrl);
        updateConfig("apiKey", normalized[0]?.apiKey || config.apiKey);
    };

    const patchLocalChannel = (id: string, patch: Partial<LocalModelChannel>) => {
        updateLocalChannels(normalizeLocalChannels(config).map((channel) => (channel.id === id ? { ...channel, ...patch } : channel)));
    };

    const addLocalChannel = () => {
        updateLocalChannels([...normalizeLocalChannels(config), { id: "local-" + Date.now(), name: "新渠道", baseUrl: "", apiKey: "", models: [] }]);
    };

    const removeLocalChannel = (id: string) => {
        updateLocalChannels(normalizeLocalChannels(config).filter((channel) => channel.id !== id));
    };

    const refreshLocalChannelModels = async (channel: LocalModelChannel) => {
        if (!channel.baseUrl.trim() || !channel.apiKey.trim()) {
            message.error("请先填写该渠道的 Base URL 和 API Key");
            return;
        }
        setLoadingModels(true);
        try {
            patchLocalChannel(channel.id, { models: await fetchImageModels(configForLocalChannel(config, channel)) });
            message.success("模型列表已更新");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取模型失败");
        } finally {
            setLoadingModels(false);
        }
    };


    const measureStorage = async () => {
        if (!token) {
            message.warning("请先登录后再统计容量");
            return;
        }
        setMeasuringStorage(true);
        try {
            const result = await measureUserStorageProvider(token, userStorage);
            setStorageUsageText(`${formatBytes(result.bytes)} / ${formatBytes(result.limitBytes)}${result.overLimit ? "，已达到上限" : ""}`);
            if (result.overLimit) {
                const next = { ...userStorage, enabled: false };
                setUserStorage(next);
                saveUserStorageProvider(next);
            }
            message.success("容量统计完成");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "容量统计失败");
        } finally {
            setMeasuringStorage(false);
        }
    };

    return (
        <Modal
            title={
                <div className="py-1">
                    <div className="text-lg font-semibold tracking-tight">配置与用户偏好</div>
                    <div className="mt-1 text-xs font-normal text-stone-500">模型、渠道和画布默认行为</div>
                </div>
            }
            open={isConfigOpen}
            width={1000}
            centered
            onCancel={() => setConfigDialogOpen(false)}
            styles={{
                header: { marginBottom: 4, paddingBottom: 14, borderBottom: "1px solid var(--color-border)" },
                body: { height: "min(68vh, 660px)", overflowY: "auto", padding: "8px 20px 8px 4px" },
                footer: { marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" },
            }}
            footer={
                <div className="flex items-center justify-between gap-3">
                    <div className="hidden text-xs text-stone-500 sm:block">修改会在点击完成后保存</div>
                    <Button type="primary" loading={savingConfig} onClick={() => void finishConfig()}>
                        完成并保存
                    </Button>
                </div>
            }
        >
            <div>
                <Form layout="vertical" requiredMark={false}>
                    <Tabs
                        className="[&_.ant-tabs-nav]:mb-5 [&_.ant-tabs-tab]:px-1 [&_.ant-tabs-tab]:py-2 [&_.ant-tabs-tab-btn]:text-sm [&_.ant-tabs-ink-bar]:h-0.5"
                        activeKey={activeTab}
                        onChange={(key) => {
                            const next = key as "local" | "remote" | "preferences";
                            setActiveTab(next);
                            // admin 且双开关时，切换本地/平台 Tab 同步渠道模式
                            if ((next === "local" || next === "remote") && allowCustomChannel && canUseRemoteChannel) {
                                updateConfig("channelMode", next);
                            }
                        }}
                        items={visibleTabs.map((tab) => ({
                            key: tab.value,
                            label: tab.label,
                            children:
                                tab.value === "local" ? (
                                    <>
                                        <div className="mb-5 space-y-4 rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-900/45">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-medium">本地模型渠道</div>
                                                    <div className="mt-1 text-xs text-stone-500">可为生图、视频、文本、音频分别选择不同渠道的模型。</div>
                                                </div>
                                                <Button size="small" type="default" onClick={addLocalChannel}>
                                                    新增渠道
                                                </Button>
                                            </div>
                                            {normalizeLocalChannels(config).map((channel, index) => (
                                                <div key={channel.id} className="space-y-3 rounded-xl border border-stone-200/80 bg-white/80 p-3 shadow-sm dark:border-stone-800 dark:bg-stone-950/45">
                                                    <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                        <Input value={channel.name} placeholder="渠道名称" autoComplete="off" onChange={(event) => patchLocalChannel(channel.id, { name: event.target.value })} />
                                                        <Input value={channel.baseUrl} placeholder="Base URL" autoComplete="off" onChange={(event) => patchLocalChannel(channel.id, { baseUrl: event.target.value })} />
                                                        <Input.Password value={channel.apiKey} placeholder="API Key" autoComplete="new-password" onChange={(event) => patchLocalChannel(channel.id, { apiKey: event.target.value })} />
                                                        <div className="flex items-stretch gap-2">
                                                            <Button loading={loadingModels} onClick={() => void refreshLocalChannelModels(channel)}>
                                                                拉取
                                                            </Button>
                                                            <Button danger disabled={index === 0 && normalizeLocalChannels(config).length === 1} onClick={() => removeLocalChannel(channel.id)}>
                                                                删除
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-stone-500">已保存 {channel.models.length} 个模型</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-stone-50/60 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/45">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">模型列表</div>
                                                <div className="mt-1 text-xs text-stone-500">当前已保存 {config.models.length} 个模型</div>
                                            </div>
                                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                                <span className="text-xs text-stone-500">自动同步</span>
                                                <Switch size="small" checked={config.syncModelConfig} onChange={(checked) => updateConfig("syncModelConfig", checked)} />
                                                <Button size="small" loading={loadingModels} onClick={() => void refreshModels()}>
                                                    拉取全部渠道
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : tab.value === "remote" ? (
                                    <>
                                        <div className="mb-5 grid items-stretch gap-4 md:grid-cols-2">
                                            {modelGroups.map((group) => (
                                                <div key={group.modelKey} className="flex min-h-[104px] h-full flex-col rounded-xl border border-stone-200/90 bg-stone-50/65 p-3.5 dark:border-stone-800 dark:bg-stone-900/50">
                                                    <div className="mb-2 text-sm font-medium leading-5">{group.defaultLabel}</div>
                                                    <ModelPicker config={modelConfig} value={modelConfig[group.modelKey]} channelId={modelConfig[group.channelKey]} onChange={(model, channelId) => { updateConfig(group.modelKey, model); if (channelId) updateConfig(group.channelKey, channelId); }} capability={group.capability} fullWidth />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-5 rounded-2xl border border-stone-200/90 bg-stone-50/60 px-4 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900/45">
                                            这些偏好会作为新画布和工作台的默认值，具体节点仍可单独覆盖。
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <Form.Item label="画布默认生图张数" extra="新建画布生图和配置节点默认使用。" className="mb-4">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={15}
                                                    autoComplete="off"
                                                    value={config.canvasImageCount}
                                                    onChange={(event) => updateConfig("canvasImageCount", event.target.value)}
                                                    onBlur={(event) => updateConfig("canvasImageCount", normalizeImageCount(event.target.value))}
                                                />
                                            </Form.Item>
                                            <Form.Item label="默认音频声音" className="mb-4">
                                                <Select value={config.audioVoice} options={audioVoiceOptions} onChange={(value) => updateConfig("audioVoice", value)} />
                                            </Form.Item>
                                            <Form.Item label="默认音频格式" className="mb-4">
                                                <Select value={config.audioFormat} options={audioFormatOptions} onChange={(value) => updateConfig("audioFormat", value)} />
                                            </Form.Item>
                                            <Form.Item label="默认音频语速" className="mb-4">
                                                <Input
                                                    type="number"
                                                    min={0.25}
                                                    max={4}
                                                    step={0.05}
                                                    autoComplete="off"
                                                    value={config.audioSpeed}
                                                    onChange={(event) => updateConfig("audioSpeed", event.target.value)}
                                                    onBlur={(event) => updateConfig("audioSpeed", normalizeAudioSpeedValue(event.target.value))}
                                                />
                                            </Form.Item>
                                        </div>
                                        <div className="mb-4 grid gap-3 md:grid-cols-3">
                                            <FeatureSwitch title="流式传输" description="开启后请求中追加 stream，支持读取中间图片事件并避免长时间无数据。" checked={Boolean(config.streamImages)} onChange={(checked) => updateConfig("streamImages", checked ? "1" : "")} />
                                            <FeatureSwitch title="返回 Base64 图片数据" description="开启后 Image API 请求会追加 response_format: b64_json。" checked={Boolean(config.responseFormatB64Json)} onChange={(checked) => updateConfig("responseFormatB64Json", checked ? "1" : "")} />
                                            <FeatureSwitch title="Codex CLI 兼容模式" description="开启后减少不兼容参数，并追加防提示词改写前缀。" checked={Boolean(config.codexCli)} onChange={(checked) => updateConfig("codexCli", checked ? "1" : "")} />
                                        </div>
                                        {canUseUserStorageProvider ? (
                                            <section className="mb-5 mt-4 rounded-xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/50">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-medium">用户 S3/R2 存储</div>
                                                        <div className="mt-1 text-xs text-stone-500">开启后，新生成图片和媒体文件会优先保存到你的 S3 兼容对象存储。{storageUsageText ? `当前容量：${storageUsageText}` : ""}</div>
                                                    </div>
                                                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                                        <Button size="small" loading={measuringStorage} onClick={() => void measureStorage()}>
                                                            统计容量
                                                        </Button>
                                                        <span className="text-xs text-stone-500">自动同步</span>
                                                        <Switch size="small" checked={config.syncStorageConfig} onChange={(checked) => updateConfig("syncStorageConfig", checked)} />
                                                        <Switch checked={userStorage.enabled} onChange={(enabled) => setUserStorage((value) => ({ ...value, enabled }))} />
                                                    </div>
                                                </div>
                                                {userStorage.enabled ? (
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <Input value={userStorage.name} placeholder="配置名称" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, name: event.target.value }))} />
                                                        <Input value={userStorage.endpoint} placeholder="Endpoint，例如 https://<account>.r2.cloudflarestorage.com" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, endpoint: event.target.value }))} />
                                                        <Input value={userStorage.region} placeholder="Region，R2 通常为 auto" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, region: event.target.value }))} />
                                                        <Input value={userStorage.bucket} placeholder="Bucket 名称" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, bucket: event.target.value }))} />
                                                        <Input value={userStorage.accessKeyId} placeholder="Access Key ID" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, accessKeyId: event.target.value }))} />
                                                        <Input.Password value={userStorage.secretAccessKey} placeholder="Secret Access Key" autoComplete="new-password" onChange={(event) => setUserStorage((value) => ({ ...value, secretAccessKey: event.target.value }))} />
                                                        <Input value={userStorage.publicBaseUrl} placeholder="公开访问地址，例如 https://pub-xxx.r2.dev" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, publicBaseUrl: event.target.value }))} />
                                                        <Input value={userStorage.pathPrefix} placeholder="保存路径前缀，例如 images" autoComplete="off" onChange={(event) => setUserStorage((value) => ({ ...value, pathPrefix: event.target.value }))} />
                                                    </div>
                                                ) : null}
                                            </section>
                                        ) : null}
                                        <Form.Item label="默认音频指令" className="mb-4">
                                            <Input.TextArea rows={2} autoComplete="off" value={config.audioInstructions} placeholder="例如：自然、温暖、适合旁白。" onChange={(event) => updateConfig("audioInstructions", event.target.value)} />
                                        </Form.Item>
                                    </>
                                ),
                        }))}
                    />
                </Form>
            </div>
        </Modal>
    );
}

function FeatureSwitch({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <div className="rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-800">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{title}</div>
                <Switch checked={checked} onChange={onChange} />
            </div>
            <div className="mt-1 text-xs leading-5 text-stone-500">{description}</div>
        </div>
    );
}

function configForLocalChannel(config: AiConfig, channel: LocalModelChannel): AiConfig {
    return {
        ...config,
        channelMode: "local",
        baseUrl: channel.baseUrl,
        apiKey: channel.apiKey,
        localChannels: [{ ...channel }],
        imageChannelId: channel.id,
        videoChannelId: channel.id,
        textChannelId: channel.id,
        audioChannelId: channel.id,
        model: channel.models[0] || config.model,
    };
}

function channelIdForLocalModel(channels: LocalModelChannel[], model: string, currentId: string) {
    if (!channels.length) return "";
    if (channels.some((channel) => channel.id === currentId && (!model || channel.models.includes(model)))) return currentId;
    return channels.find((channel) => model && channel.models.includes(model))?.id || channels[0].id;
}

function normalizeImageCount(value: string) {
    return String(Math.max(1, Math.min(15, Math.floor(Math.abs(Number(value)) || 3))));
}


function uniqueModels(models: string[]) {
    return Array.from(new Set(models.map((model) => model.trim()).filter(Boolean)));
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
