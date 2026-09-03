import { apiDelete, apiGet, apiPost, apiPostForm, compactApiParams } from "@/services/api/request";
import type { Prompt, PromptListResponse } from "@/services/api/prompts";
import type { Skill } from "@/services/api/skills";

export type AdminUser = {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    role: "user" | "admin";
    credits: number;
    affCode: string;
    affCount: number;
    inviterId: string;
    status: "active" | "ban";
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
};

export type AdminUserListResponse = {
    items: AdminUser[];
    total: number;
};

export type AdminCreditLog = {
    id: string;
    userId: string;
    userDisplayName: string;
    type: string;
    amount: number;
    balance: number;
    relatedId: string;
    remark: string;
    extra: string;
    createdAt: string;
};

export type AdminCreditLogListResponse = {
    items: AdminCreditLog[];
    total: number;
};

export type AdminUserQuery = {
    keyword?: string;
    page?: number;
    pageSize?: number;
};

export async function fetchAdminUsers(token: string, query: AdminUserQuery = {}) {
    return apiGet<AdminUserListResponse>("/api/admin/users", compactApiParams(query), token);
}

export async function saveAdminUser(token: string, user: Partial<AdminUser> & { password?: string }) {
    return apiPost<AdminUser>("/api/admin/users", user, token);
}

export async function adjustAdminUserCredits(token: string, id: string, credits: number) {
    return apiPost<AdminUser>(`/api/admin/users/${encodeURIComponent(id)}/credits`, { credits }, token);
}

export async function deleteAdminUser(token: string, id: string) {
    return apiDelete<boolean>(`/api/admin/users/${encodeURIComponent(id)}`, token);
}

export async function fetchAdminCreditLogs(token: string, query: AdminUserQuery = {}) {
    return apiGet<AdminCreditLogListResponse>("/api/admin/credit-logs", compactApiParams(query), token);
}

export async function saveAdminCreditLog(token: string, log: Partial<AdminCreditLog>) {
    return apiPost<AdminCreditLog>("/api/admin/credit-logs", log, token);
}

export async function deleteAdminCreditLog(token: string, id: string) {
    return apiDelete<boolean>(`/api/admin/credit-logs/${encodeURIComponent(id)}`, token);
}

export type AdminPromptQuery = {
    keyword?: string;
    category?: string;
    source?: string;
    tag?: string[];
    page?: number;
    pageSize?: number;
};

export type AdminAsset = {
    id: string;
    title: string;
    type: "text" | "image" | "video" | "audio";
    coverUrl: string;
    tags: string[];
    category: string;
    description: string;
    content: string;
    url: string;
    createdAt: string;
    updatedAt: string;
};

export type AdminAssetListResponse = {
    items: AdminAsset[];
    tags: string[];
    total: number;
};

export async function fetchAdminPrompts(token: string, query: AdminPromptQuery = {}) {
    return apiGet<PromptListResponse>("/api/admin/prompts", compactApiParams(query), token);
}

export async function saveAdminPrompt(token: string, prompt: Partial<Prompt>) {
    return apiPost<Prompt>("/api/admin/prompts", prompt, token);
}

export async function deleteAdminPrompt(token: string, id: string) {
    return apiDelete<boolean>(`/api/admin/prompts/${encodeURIComponent(id)}`, token);
}

export async function deleteAdminPrompts(token: string, ids: string[]) {
    return apiPost<boolean>("/api/admin/prompts/batch-delete", { ids }, token);
}

export async function importAdminPrompts(token: string, jsonFile: File, mediaFiles: File[]) {
    const form = new FormData();
    form.append("file", jsonFile);
    mediaFiles.forEach((file) => form.append("media", file));
    return apiPostForm<{ count: number }>("/api/admin/prompts/import", form, token);
}

export type AdminAssetQuery = {
    keyword?: string;
    type?: string;
    tag?: string[];
    page?: number;
    pageSize?: number;
};

export async function fetchAdminAssets(token: string, query: AdminAssetQuery = {}) {
    return apiGet<AdminAssetListResponse>("/api/admin/assets", compactApiParams(query), token);
}

export async function saveAdminAsset(token: string, asset: Partial<AdminAsset>) {
    return apiPost<AdminAsset>("/api/admin/assets", asset, token);
}

export async function deleteAdminAsset(token: string, id: string) {
    return apiDelete<boolean>(`/api/admin/assets/${encodeURIComponent(id)}`, token);
}

export type AdminSkillQuery = {
    nodeType?: string;
};

export async function fetchAdminSkills(token: string, query: AdminSkillQuery = {}) {
    return apiGet<Skill[]>("/api/admin/skills", compactApiParams(query), token);
}

export async function saveAdminSkill(token: string, skill: Partial<Skill>) {
    return apiPost<Skill>("/api/admin/skills", skill, token);
}

export async function deleteAdminSkill(token: string, id: string) {
    return apiDelete<boolean>(`/api/admin/skills/${encodeURIComponent(id)}`, token);
}

export type AdminModelChannel = {
    id: string;
    protocol: "openai";
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
    weight: number;
    timeout: number;
    enabled: boolean;
    remark: string;
    apiMode: "images" | "responses";
};

export type AdminPublicModelChannelSettings = {
    availableModels: string[];
    modelCosts: AdminModelCost[];
    modelCapabilities: AdminModelCapability[];
    modelInfos: AdminModelInfo[];
    channels: AdminPublicModelChannelInfo[];
    defaultImageModel: string;
    defaultVideoModel: string;
    defaultTextModel: string;
    defaultAudioModel: string;
    systemPrompt: string;
    systemPrompts: {
        image: string;
        video: string;
        text: string;
        workflow: string;
        workflowAgent: string;
    };
    allowCustomChannel: boolean;
    allowUserRemoteChannel: boolean;
    allowGuestConfig: boolean;
};

export type AdminModelCost = {
    model: string;
    credits: number;
};

export type AdminModelInfo = {
    model: string;
    description: string;
};

export type AdminVideoModeOption = {
    value: string;
    label: string;
    desc?: string;
};

export type AdminImageAdapterConfig = {
    aspectField?: string; // 比例参数字段名，空=默认 size
    hasResolution?: boolean; // 是否支持 resolution 参数，缺省=支持
    resolutionCase?: string; // 分辨率大小写：upper（默认）/ lower
    minResolution?: string; // 分辨率下限（如 2K）
    maxResolution?: string; // 分辨率上限（如 1K/2K）
    hasCount?: boolean; // 是否支持 n 参数，缺省=支持
    hasQuality?: boolean; // 是否支持 quality 参数，缺省=不支持
    hasOutput?: boolean; // 是否支持 output_format 参数，缺省=不支持
    hasImageRefs?: boolean; // 是否支持参考图，缺省=支持
    imageRefField?: string; // 参考图字段名，空=默认 image_urls
    maxImageRefs?: number; // 参考图数量上限，0=不限
    requireRefs?: boolean; // 是否必须提供参考图，缺省=不强制
    tierField?: string; // 档位映射目标字段（quality/resolution/size），空=折算像素（OpenAI 标准协议）
    tierStandard?: string; // standard 档映射值（如 low / 1k / 2K）
    tier2k?: string; // 2k 档映射值（如 medium / 2k / 2K）
    tier4k?: string; // 4k 档映射值（如 high / 2k / 4K）
    ratioMode?: string; // 比例处理：空=折算像素；field=直传比例字段；prompt=写入提示词
};

export type AdminVideoAdapterConfig = {
    aspectField?: string; // 比例字段名：空=默认 aspect_ratio；none=不支持；如 size
    hasResolution?: boolean; // 是否支持 resolution 参数，缺省=支持
    resolutionCase?: string; // 分辨率表达：video（默认，720p）/ upper_video
    maxResolution?: string; // 分辨率上限（如 720p）
    modeFromRes?: boolean; // 分辨率反推 std/pro 模式（Kling 系），缺省=否
    hasQuality?: boolean; // 是否支持 quality 参数（Grok），缺省=不支持
    dropAspectWithImage?: boolean; // 带参考图时丢弃比例参数，缺省=否
    imageRefField?: string; // 参考图字段名，空=默认 image_urls
    imageRefKind?: string; // 参考图组装模式，空=默认 array（纯 URL 数组）
    maxImageRefs?: number; // 参考图数量上限，0=不限
    videoRefField?: string; // 参考视频字段名，空=不支持
    videoRefKind?: string; // 参考视频组装模式，空=不支持
    audioRefField?: string; // 参考音频字段名，空=不支持
    audioRefKind?: string; // 参考音频组装模式，空=不支持
};

export type AdminModelCapability = {
    model: string;
    imageAdapter?: AdminImageAdapterConfig | null;
    videoAdapter?: AdminVideoAdapterConfig | null;
    imageAspects?: string[];
    imageTiers?: ("standard" | "2k" | "4k")[];
    videoResolutions?: string[];
    videoSecondsMin?: number;
    videoSecondsMax?: number;
    videoPanelType?: string;
    videoProvider?: string;
    videoModes?: AdminVideoModeOption[];
    videoRatios?: string[];
    videoSecondsPresets?: number[];
    supportsFirstLastFrame?: boolean; // 兼容字段：首尾帧都支持时勾选
    supportsFirstFrame?: boolean; // 仅支持首帧（部分模型只支持首帧）
    supportsMotionControl?: boolean;
    supportsAudioGeneration?: boolean;
    supportsWatermark?: boolean;
    supportsMultiShot?: boolean;
    audioRequiresMode?: string;
    audioMaxReferences?: number;
    maxImageReferences?: number;
    maxVideoReferences?: number; // 0=默认，-1=不支持视频参考
    maxAudioReferences?: number;
};

export type AdminPublicModelChannelInfo = {
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
    weight: number;
    timeout: number;
    enabled: boolean;
    remark: string;
    apiMode: "images" | "responses";
};

export type AdminPublicSettings = {
    modelChannel: AdminPublicModelChannelSettings;
    auth: {
        allowRegister: boolean;
    };
    storage: {
        mode: string;
    };
    modules: {
        imageWorkbench: boolean;
        videoWorkbench: boolean;
        workflows: boolean;
    };
};

export type AdminStorageProvider = {
    id: string;
    name: string;
    type: "s3";
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl: string;
    pathPrefix: string;
    weight: number;
    enabled: boolean;
    ownerUserId: string;
    capacityBytes: number;
    capacityCheckedAt: string;
    capacityExceeded: boolean;
};

export type AdminPrivateSettings = {
    channels: AdminModelChannel[];
    aiLog: {
        localDirectReportEnabled: boolean;
        cleanup: {
            enabled: boolean;
            retentionDays: number;
            cron: string;
        };
    };
    storage: {
        mode: string;
        allowUserProvider: boolean;
        allowUserGlobalProvider: boolean;
        providers: AdminStorageProvider[];
        roundRobinCursor: number;
        capacityCheck: {
            enabled: boolean;
            cron: string;
        };
        capacityLimitBytes: number;
    };
};

export type AdminAICallLog = {
    id: string;
    userId: string;
    userDisplayName: string;
    endpoint: string;
    method: string;
    model: string;
    channelId: string;
    channelName: string;
    status: number;
    durationMs: number;
    credits: number;
    requestBody: string;
    responseBody: string;
    error: string;
    createdAt: string;
};

export type AdminAICallLogListResponse = {
    items: AdminAICallLog[];
    total: number;
};

export async function fetchAdminAICallLogs(token: string, query: AdminUserQuery = {}) {
    return apiGet<AdminAICallLogListResponse>("/api/admin/ai-logs", compactApiParams(query), token);
}

export async function deleteAdminAICallLogs(token: string, olderThanDays = 7) {
    return apiDelete<{ removedFiles: number }>(`/api/admin/ai-logs?olderThanDays=${encodeURIComponent(String(olderThanDays))}`, token);
}

export type AdminSettings = {
    public: AdminPublicSettings;
    private: AdminPrivateSettings;
};

export async function fetchAdminSettings(token: string) {
    return apiGet<AdminSettings>("/api/admin/settings", undefined, token);
}

export async function saveAdminSettings(token: string, settings: AdminSettings) {
    return apiPost<AdminSettings>("/api/admin/settings", settings, token);
}

export type AdminChannelActionRequest = {
    index?: number;
    channel: AdminModelChannel;
    model?: string;
};

export async function fetchChannelModels(token: string, payload: AdminChannelActionRequest) {
    return apiPost<string[]>("/api/admin/settings/channel-models", payload, token);
}

export async function testChannelModel(token: string, payload: AdminChannelActionRequest) {
    return apiPost<string>("/api/admin/settings/channel-test", payload, token);
}

export type StorageCapacityResult = {
    bytes: number;
    limitBytes: number;
    overLimit: boolean;
    checkedAt: string;
    providerName: string;
};

export async function measureAdminStorageProvider(token: string, payload: { index: number; provider: AdminStorageProvider }) {
    return apiPost<StorageCapacityResult>("/api/admin/storage/measure", payload, token);
}
