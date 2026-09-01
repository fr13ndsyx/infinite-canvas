import axios from "axios";

import { dataUrlToFile } from "@/lib/image-utils";
import { boolConfig, normalizeSeedanceRatio } from "@/lib/seedance-video";
import { modelKey } from "@/lib/video-model-capabilities";
import { resolveMediaUrl } from "@/services/file-storage";
import { imageToDataUrl, resolveImageUrl } from "@/services/image-storage";
import { buildApiUrl, channelIdForActiveModel, findModelCapability, localChannelForActiveModel, resolveSupportsAudioGeneration, resolveVideoPanelType, resolveVideoProvider, type AiConfig } from "@/stores/use-config-store";
import { useUserStore } from "@/stores/use-user-store";
import type { ReferenceImage } from "@/types/image";
import type { ReferenceAudio, ReferenceVideo } from "@/types/media";

export type VideoResponse = { id: string; task_id?: string; video_id?: string; source_id?: string; sourceId?: string; channelId?: string; userChannelId?: string; channelName?: string; channel_id?: string; user_channel_id?: string; channel_name?: string; status?: string; video_url?: string; url?: string; progress?: number; error?: { message?: string }; size?: string; seconds?: string; model?: string; created_at?: string | number; createdAt?: string | number; started_at?: string | number; startedAt?: string | number; request_body?: string };
type ApiVideoEnvelope = { code: number; data?: VideoResponse | VideoResponse[] | null; msg?: string; message?: string };
type ApiVideoResponse = VideoResponse | ApiVideoEnvelope;
export type VideoGenerationResult = { id: string; url: string; durationMs: number; width: number; height: number; bytes: number; mimeType: string; task: VideoResponse };
export type CreatedVideoGenerationTask = { task: VideoResponse; pollId: string; startedAt: number; requestBody: unknown };
export type VideoProgressHandler = (progress: number, task: VideoResponse) => void;
export type VideoTaskCreateOptions = { clientTaskId?: string; source?: "video-workbench" | "canvas"; sourceId?: string };
export const VIDEO_POLL_INTERVAL_MS = 5000;

export class VideoRequestError extends Error {
    detail?: string;

    constructor(message: string, detail?: unknown) {
        super(message);
        this.name = "VideoRequestError";
        this.detail = formatErrorDetail(detail);
    }
}

function usesAccountProxy(config: AiConfig) {
    const token = useUserStore.getState().token;
    return config.channelMode === "remote" || (config.channelMode === "local" && Boolean(token));
}

function aiApiUrl(config: AiConfig, path: string) {
    if (usesAccountProxy(config)) return `/api/v1${path}`;
    const channel = localChannelForActiveModel(config);
    return buildApiUrl(channel?.baseUrl || config.baseUrl, path);
}

function aiVideoPollUrl(config: AiConfig, model: string, id: string) {
    if (!isAgnesVideoModel(model) || !id.startsWith("video_")) {
        return aiApiUrl(config, `/videos/${encodeURIComponent(id)}`);
    }
    if (usesAccountProxy(config)) {
        return `/api/v1/videos/${encodeURIComponent(id)}`;
    }
    const channel = localChannelForActiveModel(config);
    const baseUrl = agnesBaseUrl(channel?.baseUrl || config.baseUrl);
    return `${baseUrl}/agnesapi?video_id=${encodeURIComponent(id)}&model_name=${encodeURIComponent(model)}`;
}

function agnesBaseUrl(baseUrl: string) {
    const normalized = baseUrl.trim().replace(/\/+$/, "");
    return normalized.toLowerCase().endsWith("/v1") ? normalized.slice(0, -3).replace(/\/+$/, "") : normalized;
}

function aiHeaders(config: AiConfig) {
    const token = useUserStore.getState().token;
    if (config.channelMode === "remote" && !token) throw new Error("请先登录后再使用云端渠道");
    if (config.channelMode === "remote") return { Authorization: `Bearer ${token}`, ...(channelIdForActiveModel(config) ? { "X-Model-Channel-ID": channelIdForActiveModel(config) } : {}) };
    if (token) return { Authorization: `Bearer ${token}`, ...(channelIdForActiveModel(config) ? { "X-User-Model-Channel-ID": channelIdForActiveModel(config) } : {}) };
    return { Authorization: `Bearer ${localChannelForActiveModel(config)?.apiKey || config.apiKey}` };
}

function refreshRemoteUser(config: AiConfig) {
    if (usesAccountProxy(config)) void useUserStore.getState().hydrateUser();
}

export type VideoReferenceInput = {
    references?: ReferenceImage[];
    videoReferences?: ReferenceVideo[];
    audioReferences?: ReferenceAudio[];
    firstFrame?: ReferenceImage | null;
    lastFrame?: ReferenceImage | null;
};

export async function requestVideoGeneration(config: AiConfig, prompt: string, references: ReferenceImage[] | VideoReferenceInput = [], videoReferencesOrProgress?: ReferenceVideo[] | ((progress: number) => void), audioReferences: ReferenceAudio[] = []) {
    const legacyVideoReferences = Array.isArray(videoReferencesOrProgress) ? videoReferencesOrProgress : undefined;
    const onProgress = typeof videoReferencesOrProgress === "function" ? videoReferencesOrProgress : undefined;
    const input = legacyVideoReferences ? { references: Array.isArray(references) ? references : references.references || [], videoReferences: legacyVideoReferences, audioReferences } : references;
    const created = await createVideoGenerationTask(config, prompt, input, onProgress ? (progress) => onProgress(progress) : undefined);
    return pollCreatedVideoGenerationTask(config, created.task, { startedAt: created.startedAt, requestBody: created.requestBody, onProgress: onProgress ? (progress) => onProgress(progress) : undefined });
}

export async function createVideoGenerationTask(config: AiConfig, prompt: string, references: ReferenceImage[] | VideoReferenceInput = [], onProgress?: VideoProgressHandler, options?: string | VideoTaskCreateOptions): Promise<CreatedVideoGenerationTask> {
    const model = config.model || config.videoModel;
    const systemPrompt = (config.systemPrompts.video || config.systemPrompt).trim();
    const body = await createVideoRequestBody(config, model, systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt, normalizeVideoReferenceInput(references));
    const startedAt = Date.now();
    try {
        const createOptions = normalizeVideoTaskCreateOptions(options);
        const accountProxy = usesAccountProxy(config);
        const headers = { ...aiHeaders(config), ...(accountProxy && createOptions.clientTaskId ? { "X-Client-Video-Task-ID": createOptions.clientTaskId } : {}), ...(accountProxy && createOptions.source ? { "X-Video-Task-Source": createOptions.source } : {}), ...(accountProxy && createOptions.sourceId ? { "X-Video-Task-Source-ID": createOptions.sourceId } : {}) };
        const created = unwrapVideoResponse((await axios.post<ApiVideoResponse>(aiApiUrl(config, "/videos"), body, { headers })).data);
        if (!created.id && !created.video_id) throw new Error("视频接口没有返回任务 ID");
        if (typeof created.progress === "number") onProgress?.(created.progress, created);
        return { task: created, pollId: videoPollId(model, created), startedAt, requestBody: body };
    } catch (error) {
        const { message, detail } = readAxiosError(error, "视频生成失败");
        void writeVideoAICallLog(config, model, "/videos", "POST", startedAt, axios.isAxiosError(error) ? error.response?.status || 0 : 0, stringifyLogPayload(summarizeVideoRequestBody(body)), stringifyLogPayload(detail), message);
        throw new VideoRequestError(message, detail);
    }
}

function normalizeVideoTaskCreateOptions(options?: string | VideoTaskCreateOptions): VideoTaskCreateOptions {
    return typeof options === "string" ? { clientTaskId: options } : options || {};
}

export async function pollCreatedVideoGenerationTask(config: AiConfig, task: VideoResponse, { startedAt = Date.now(), requestBody, initialDelayMs = 0, onProgress, onPoll }: { startedAt?: number; requestBody?: unknown; initialDelayMs?: number; onProgress?: VideoProgressHandler; onPoll?: (task: VideoResponse) => void } = {}) {
    const model = config.model || config.videoModel;
    const pollId = videoPollId(model, task);
    if (!pollId) throw new VideoRequestError("视频接口没有返回任务 ID", task);
    let completed: VideoResponse | null = null;
    try {
        if (initialDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
        for (; ;) {
            const video = unwrapVideoResponse((await axios.get<ApiVideoResponse>(aiVideoPollUrl(config, model, pollId), { headers: aiHeaders(config), params: usesAccountProxy(config) ? { model } : undefined })).data);
            onPoll?.(video);
            if (isFailedVideoStatus(video.status)) throw new VideoRequestError(video.error?.message || "视频生成失败", video);
            if (typeof video.progress === "number") onProgress?.(video.progress, video);
            if (isCompletedVideoStatus(video.status) || video.video_url || video.url) {
                completed = video;
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
        }
        const videoUrl = completed?.video_url || completed?.url || "";
        if (!videoUrl) throw new VideoRequestError("视频生成完成但没有返回视频地址", completed);
        const result = buildVideoGenerationResult(completed, videoUrl, Date.now() - startedAt);
        void writeVideoAICallLog(config, model, "/videos", "POST", startedAt, 200, stringifyLogPayload(requestBody ? summarizeVideoRequestBody(requestBody) : { taskId: pollId }), stringifyLogPayload({ task: completed, video: result }), "");
        refreshRemoteUser(config);
        return result;
    } catch (error) {
        const { message, detail } = readAxiosError(error, "视频生成失败");
        void writeVideoAICallLog(config, model, "/videos", "POST", startedAt, axios.isAxiosError(error) ? error.response?.status || 0 : 0, stringifyLogPayload(requestBody ? summarizeVideoRequestBody(requestBody) : { taskId: pollId }), stringifyLogPayload(detail), message);
        throw new VideoRequestError(message, detail);
    }
}

export async function pollVideoGenerationTaskStatus(config: AiConfig, task: VideoResponse) {
    const model = config.model || config.videoModel;
    const pollId = videoPollId(model, task);
    if (!pollId) throw new VideoRequestError("视频接口没有返回任务 ID", task);
    return unwrapVideoResponse((await axios.get<ApiVideoResponse>(aiVideoPollUrl(config, model, pollId), { headers: aiHeaders(config), params: usesAccountProxy(config) ? { model } : undefined })).data);
}

export async function listVideoGenerationTasks(config: AiConfig) {
    if (!usesAccountProxy(config)) return [];
    const payload = (await axios.get<ApiVideoEnvelope>("/api/v1/video-tasks", { headers: aiHeaders(config) })).data;
    if (payload.code !== 0) throw new VideoRequestError(payload.msg || payload.message || "读取视频任务失败", payload);
    return Array.isArray(payload.data) ? payload.data.map(normalizeVideoResponse) : [];
}

export async function deleteVideoGenerationTask(config: AiConfig, task?: VideoResponse | null) {
    if (!usesAccountProxy(config) || !task) return;
    const id = task.id || task.task_id || task.video_id;
    if (!id) return;
    const payload = (await axios.delete<ApiVideoEnvelope>(`/api/v1/video-tasks/${encodeURIComponent(id)}`, { headers: aiHeaders(config) })).data;
    if (payload.code !== 0) throw new VideoRequestError(payload.msg || payload.message || "删除视频任务失败", payload);
}

async function createVideoRequestBody(config: AiConfig, model: string, prompt: string, input: Required<VideoReferenceInput>) {
    const cap = findModelCapability(config, model);
    const panelType = resolveVideoPanelType(cap);
    const provider = resolveVideoProvider(cap);
    const size = normalizeVideoSize(config.size);
    if (isAgnesVideoModel(model)) {
        // Agnes 视频协议：seconds(字符串4-12) + size 档位(720P/960P/2K) + aspect_ratio 比例；首尾帧走 mode=keyframe，参考图走 mode=reference + images
        const firstFrameUrl = input.firstFrame ? await imageToAgnesReference(input.firstFrame) : "";
        const lastFrameUrl = input.lastFrame ? await imageToAgnesReference(input.lastFrame) : "";
        const inputReferences = await Promise.all(input.references.slice(0, 5).map(imageToAgnesReference));
        const ratio = normalizeSeedanceRatio(size || "");
        const body: Record<string, unknown> = {
            model,
            prompt,
            mode: firstFrameUrl || lastFrameUrl ? "keyframe" : inputReferences.length ? "reference" : "text",
            seconds: String(Math.max(4, Math.min(12, Number(normalizeVideoSeconds(config.videoSeconds))))),
            size: agnesSizeTier(config.vquality, model),
            aspect_ratio: ratio === "adaptive" ? "16:9" : ratio,
        };
        if (firstFrameUrl) body.first_frame = firstFrameUrl;
        if (lastFrameUrl) body.last_frame = lastFrameUrl;
        if (inputReferences.length) body.images = inputReferences;
        return body;
    }

    const klingV26 = panelType === "kling-v26";
    const apimartKlingV3 = panelType === "kling-v3" && provider !== "kie";
    const apimartMotionControl = panelType === "motion-control" && provider !== "kie";
    const kieKlingV3 = panelType === "kling-v3" && provider === "kie";
    const kieMotionControl = panelType === "motion-control" && provider === "kie";
    // 协议类型决定请求结构，能力开关只决定是否启用角色朝向字段。
    const motionProtocol = apimartMotionControl || kieMotionControl;
    const motionControl = motionProtocol && cap?.supportsMotionControl !== false;
    const klingV3 = apimartKlingV3 || kieKlingV3;
    const kling = klingV26 || klingV3;
    const body = new FormData();
    body.append("model", model);
    body.append("prompt", prompt);
    if (kling) {
        const configuredMode = resolveConfiguredVideoMode(cap, config.videoMode);
        body.append("mode", configuredMode || (klingV3 ? normalizeKlingV3Mode(config.videoMode) : normalizeKlingV26Mode(config.videoMode)));
        body.append("duration", klingV3 ? normalizeKlingV3Duration(config.videoSeconds) : normalizeKlingV26Duration(config.videoSeconds));
        body.append("aspect_ratio", normalizeKlingV26AspectRatio(config.size));
        if (klingV3 && cap?.supportsMultiShot !== false && boolConfig(config.videoMultiShot, false)) {
            body.append("multi_shot", "true");
            if (kieKlingV3) {
                body.append("multi_prompt", JSON.stringify(normalizeKIEKlingMultiPrompt(config.videoMultiPrompt)));
            } else {
                const shotType = normalizeKlingShotType(config.videoShotType);
                body.append("shot_type", shotType);
                if (shotType === "customize") body.append("multi_prompt", JSON.stringify(normalizeKlingMultiPrompt(config.videoMultiPrompt)));
            }
        }
    } else if (apimartMotionControl) {
        body.append("mode", normalizeAPIMartKlingMotionControlMode(config.vquality));
    } else {
        if (!kieMotionControl && !isGeminiOmniFlashVideoModel(model)) body.append("seconds", normalizeVideoSecondsForModel(model, config.videoSeconds));
        if (panelType === "seedance") body.append("size", normalizeSeedanceRatio(config.size));
        else if (size) body.append("size", size);
        body.append("resolution_name", normalizeVideoResolution(config.vquality));
        if (panelType === "grok") body.append("mode", resolveConfiguredVideoMode(cap, config.videoMode) || normalizeGrokVideoMode(config.videoMode));
        else body.append("preset", "normal");
    }
    if (motionControl) body.append("character_orientation", normalizeCharacterOrientation(config.videoCharacterOrientation));
    if (resolveSupportsAudioGeneration(cap) === true) body.append("video_generate_audio", String(boolConfig(config.videoGenerateAudio, false)));
    const files = await Promise.all(input.references.slice(0, kling ? 2 : 9).map(imageReferenceToFormValue));
    files.forEach((file) => body.append("input_reference[]", file));
    if (input.firstFrame) body.append("first_frame_url", await imageReferenceToFormValue(input.firstFrame));
    if (input.lastFrame) body.append("last_frame_url", await imageReferenceToFormValue(input.lastFrame));
    const videoFiles = kling || cap?.maxVideoReferences === -1 ? [] : await Promise.all(input.videoReferences.map(mediaReferenceToFormValue));
    videoFiles.forEach((file) => body.append("video_reference[]", file));
    const audioFiles = kling ? [] : await Promise.all(input.audioReferences.map(mediaReferenceToFormValue));
    audioFiles.forEach((file) => body.append("audio_reference[]", file));
    return body;
}

function normalizeCharacterOrientation(value: string | undefined) {
    return value === "image" ? "image" : "video";
}

function resolveConfiguredVideoMode(cap: ReturnType<typeof findModelCapability>, value: string | undefined) {
    const options = cap?.videoModes || [];
    if (!options.length) return "";
    return options.some((item) => item.value === value) ? String(value || "") : String(options[0]?.value || "");
}

function normalizeKlingV26Mode(value: string) {
    return value === "pro" ? "pro" : "std";
}

function normalizeAPIMartKlingMotionControlMode(value: string) {
    return normalizeVideoResolution(value) === "1080p" ? "pro" : "std";
}

function normalizeKlingV26Duration(value: string) {
    return String(value).trim() === "10" ? "10" : "5";
}

function normalizeKlingV3Mode(value: string) {
    return value === "4k" ? "4k" : value === "pro" ? "pro" : "std";
}

function normalizeGrokVideoMode(value: string) {
    return value === "fun" || value === "spicy" ? value : "normal";
}

function normalizeKlingV3Duration(value: string) {
    const seconds = Math.floor(Number(value) || 3);
    return String(Math.max(3, Math.min(15, seconds)));
}

function normalizeKlingShotType(value: string) {
    return value === "customize" ? "customize" : "intelligence";
}

function normalizeKlingMultiPrompt(value: AiConfig["videoMultiPrompt"] | undefined) {
    const items = Array.isArray(value) && value.length ? value : [{ prompt: "", duration: "1" }];
    return items.map((item, index) => ({ index: index + 1, prompt: item?.prompt || "", duration: normalizeKlingMultiPromptDuration(item?.duration) }));
}

function normalizeKIEKlingMultiPrompt(value: AiConfig["videoMultiPrompt"] | undefined) {
    const items = Array.isArray(value) && value.length ? value : [{ prompt: "", duration: "1" }];
    return items.map((item) => ({ prompt: item?.prompt || "", duration: normalizeKlingMultiPromptDuration(item?.duration) }));
}

function normalizeKlingMultiPromptDuration(value: string | undefined) {
    const duration = Math.floor(Number(value) || 1);
    return Math.max(1, Math.min(15, duration));
}

function normalizeKlingV26AspectRatio(value: string) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["9:16", "720x1280", "1080x1920"].includes(normalized)) return "9:16";
    if (["1:1", "1024x1024", "1080x1080"].includes(normalized)) return "1:1";
    return "16:9";
}

function normalizeVideoReferenceInput(input: ReferenceImage[] | VideoReferenceInput): Required<VideoReferenceInput> {
    if (Array.isArray(input)) return { references: input, videoReferences: [], audioReferences: [], firstFrame: null, lastFrame: null };
    return { references: input.references || [], videoReferences: input.videoReferences || [], audioReferences: input.audioReferences || [], firstFrame: input.firstFrame || null, lastFrame: input.lastFrame || null };
}

async function imageReferenceToFile(image: ReferenceImage) {
    return dataUrlToFile({ ...image, dataUrl: await imageToDataUrl(image) });
}

async function imageReferenceToFormValue(image: ReferenceImage) {
    const resolvedUrl = await resolveImageUrl(image.storageKey, "");
    for (const url of [image.url, resolvedUrl, image.dataUrl]) {
        const publicUrl = publicHttpUrl(url);
        if (publicUrl) return publicUrl;
    }
    return imageReferenceToFile(image);
}

async function mediaReferenceToFile(media: ReferenceVideo | ReferenceAudio) {
    const url = await resolveMediaUrl(media.storageKey, media.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`参考素材读取失败：${response.status}`);
    const blob = await response.blob();
    return new File([blob], media.name || "reference", { type: media.type || blob.type || "application/octet-stream" });
}

async function mediaReferenceToFormValue(media: ReferenceVideo | ReferenceAudio) {
    const resolvedUrl = await resolveMediaUrl(media.storageKey, media.url);
    const publicUrl = publicHttpUrl(resolvedUrl) || publicHttpUrl(media.url);
    if (publicUrl) return publicUrl;
    return mediaReferenceToFile(media);
}

async function imageToAgnesReference(image: ReferenceImage) {
    const resolvedUrl = await resolveImageUrl(image.storageKey, "");
    for (const url of [image.dataUrl, image.url, resolvedUrl]) {
        const publicUrl = publicHttpUrl(url);
        if (publicUrl) return publicUrl;
    }
    // Agnes 仅接受公网 http(s) URL 或 Data URI Base64；base64 有体积/分辨率上限，
    // ComfyUI 4K 级大图会被拒（media must be a public http(s) URL or valid base64 data），需降采样重编码
    const dataUrl = await imageToDataUrl(image);
    const dataUri = dataUrl.startsWith("data:") ? dataUrl : `data:image/png;base64,${dataUrl}`;
    if (dataUri.length <= agnesReferenceMaxBase64Chars) return dataUri;
    return await compressAgnesReference(dataUri);
}

// 目标 base64 长度 ~4M 字符（约 3MB 原始数据），远低于常见媒体接口上限
const agnesReferenceMaxBase64Chars = 4_000_000;

async function compressAgnesReference(dataUrl: string) {
    for (const maxSide of [2048, 1536, 1024]) {
        try {
            const compressed = await downscaleDataUrl(dataUrl, maxSide);
            if (compressed.length <= agnesReferenceMaxBase64Chars) return compressed;
        } catch {
            break;
        }
    }
    return dataUrl;
}

function downscaleDataUrl(dataUrl: string, maxSide: number) {
    return new Promise<string>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("canvas context unavailable"));
                return;
            }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        image.onerror = () => reject(new Error("reference image decode failed"));
        image.src = dataUrl;
    });
}

function publicHttpUrl(value?: string) {
    if (!value || value.startsWith("blob:") || value.startsWith("data:")) return "";
    try {
        const url = new URL(value, typeof window === "undefined" ? undefined : window.location.origin);
        if (!["http:", "https:"].includes(url.protocol)) return "";
        if (isPrivateHttpHost(url.hostname)) return "";
        return url.href;
    } catch {
        return "";
    }
}

// 外部 AI 服务抓取不到内网地址（localhost / 私网 IP / .local 等），一律不算公开 URL
function isPrivateHttpHost(hostname: string) {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (["localhost", "::1", "0.0.0.0"].includes(host)) return true;
    if (host.endsWith(".local") || host.endsWith(".lan") || host.endsWith(".internal")) return true;
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (!match) return false;
    const a = Number(match[1]);
    const b = Number(match[2]);
    return a === 10 || a === 127 || a === 0 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

function agnesSizeTier(vquality: string | undefined, model: string) {
    // flash 版硬限制：size 只能 720P，传其它档位直接 400
    if (model.toLowerCase().includes("flash")) return "720P";
    const resolution = normalizeVideoResolution(vquality).replace(/p$/i, "");
    if (resolution === "2k" || resolution === "4k" || resolution === "1080") return "2K";
    if (resolution === "960") return "960P";
    return "720P";
}

function isAgnesVideoModel(model: string) {
    return model.toLowerCase().includes("agnes-video");
}

function videoPollId(model: string, task: VideoResponse) {
    return isAgnesVideoModel(model) ? task.video_id || task.id : task.id || task.task_id || task.video_id || "";
}

function normalizeVideoSeconds(value: string) {
    const seconds = Math.floor(Number(value) || 6);
    return String(Math.max(1, Math.min(30, seconds)));
}

function isGeminiOmniFlashVideoModel(model: string) {
    return modelKey(model) === "gemini-omni-flash-preview";
}

function normalizeVideoSecondsForModel(model: string, value: string) {
    const seconds = Number(normalizeVideoSeconds(value));
    const key = modelKey(model);
    if (key.includes("sora-2")) return closestAllowedSeconds(seconds, [4, 8, 12, 16, 20]);
    if (key.includes("veo3-1") || key.includes("veo-3-1")) return "8";
    if (key.includes("minimax-hailuo-02")) return closestAllowedSeconds(seconds, [5, 10]);
    if (key.includes("minimax-hailuo-2-3")) return closestAllowedSeconds(seconds, [6, 10]);
    if (key.includes("omni-flash-ext")) return closestAllowedSeconds(seconds, [4, 6, 8, 10]);
    if (key.includes("wan2-5") || key.includes("wan2.5")) return closestAllowedSeconds(seconds, [5, 10]);
    if (key === "wan2-6") return closestAllowedSeconds(seconds, [5, 10, 15]);
    return String(seconds);
}

function closestAllowedSeconds(seconds: number, allowed: number[]) {
    return String(allowed.reduce((best, item) => Math.abs(item - seconds) < Math.abs(best - seconds) ? item : best, allowed[0]));
}

function normalizeVideoSize(value: string) {
    if (value === "auto") return null;
    const size = value || "1280x720";
    if (/^\d+x\d+$/.test(size)) return size;
    return ["9:16", "2:3", "3:4"].includes(size) ? "720x1280" : "1280x720";
}

function normalizeVideoResolution(value: string) {
    if (value === "low") return "480p";
    if (value === "auto" || value === "high" || value === "medium") return "720p";
    const resolution = value.replace(/p$/i, "") || "720";
    return `${resolution}p`;
}

function unwrapVideoResponse(payload: ApiVideoResponse): VideoResponse {
    if (!payload) throw new Error("接口没有返回视频任务");
    if (isVideoEnvelope(payload)) {
        if (payload.code !== 0) throw new VideoRequestError(payload.msg || payload.message || "请求失败", payload);
        if (!payload.data || Array.isArray(payload.data)) throw new Error("接口没有返回视频任务");
        return normalizeVideoResponse(payload.data);
    }
    const error = videoPayloadErrorMessage(payload);
    if (error) throw new VideoRequestError(error, payload);
    if (payload.error?.message) throw new VideoRequestError(payload.error.message, payload);
    return normalizeVideoResponse(payload);
}

function isVideoEnvelope(payload: ApiVideoResponse): payload is ApiVideoEnvelope {
    return "code" in payload && typeof payload.code === "number";
}

function readAxiosError(error: unknown, fallback: string) {
    if (error instanceof VideoRequestError) return { message: error.message, detail: error.detail || error.stack || error.message };
    if (axios.isAxiosError<{ error?: { message?: string }; msg?: string; code?: number }>(error)) {
        const responseData = error.response?.data;
        return { message: responseData?.msg || responseData?.error?.message || (error.response?.status ? `${fallback}：${error.response.status}` : fallback), detail: responseData || error.message };
    }
    return { message: error instanceof Error ? error.message : fallback, detail: error instanceof Error ? error.stack || error.message : error };
}

async function writeVideoAICallLog(config: AiConfig, model: string, endpoint: string, method: "GET" | "POST", startedAt: number, status: number, requestBody: string, responseBody: string, error: string) {
    if (config.channelMode !== "local" || usesAccountProxy(config)) return;
    const token = useUserStore.getState().token;
    if (!token) return;
    const channel = localChannelForActiveModel(config);
    await fetch("/api/v1/ai-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            endpoint,
            method,
            model,
            channelId: channel?.id || config.activeChannelId || "",
            channelName: channel?.name || "本地直连",
            status,
            durationMs: Date.now() - startedAt,
            credits: 0,
            requestBody,
            responseBody,
            error,
        }),
    }).catch(() => { });
}

function summarizeVideoRequestBody(value: unknown) {
    if (value instanceof FormData) {
        const fields: Record<string, string[]> = {};
        const files: Array<{ field: string; name: string; size: number; type: string }> = [];
        value.forEach((item, key) => {
            if (item instanceof File) {
                files.push({ field: key, name: item.name, size: item.size, type: item.type });
                return;
            }
            fields[key] = [...(fields[key] || []), String(item)];
        });
        return { fields, files };
    }
    return value;
}

function formatErrorDetail(detail: unknown) {
    if (detail == null) return "";
    if (typeof detail === "string") return detail;
    try {
        return JSON.stringify(detail, null, 2);
    } catch {
        return String(detail);
    }
}

function stringifyLogPayload(value: unknown) {
    if (typeof value === "string") return value;
    try {
        const cloned = JSON.parse(JSON.stringify(value)) as unknown;
        redactLogMedia(cloned);
        return JSON.stringify(cloned, null, 2);
    } catch {
        return String(value || "");
    }
}

function redactLogMedia(value: unknown) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
        value.forEach(redactLogMedia);
        return;
    }
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        const item = record[key];
        if (typeof item === "string" && (item.startsWith("data:image/") || item.includes("data:image/") || item.length > 2048 && looksLikeBase64(item))) {
            record[key] = `[redacted image/string len=${item.length}]`;
            continue;
        }
        redactLogMedia(item);
    }
}

function looksLikeBase64(value: string) {
    return /^[A-Za-z0-9+/=]+$/.test(value.slice(0, 200));
}

function normalizeVideoResponse(value: unknown): VideoResponse {
    const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
    const id = firstString(record.id, record.request_id, record.task_id, record.video_id, firstTaskId(record));
    return {
        ...(record as VideoResponse),
        id,
        task_id: firstString(record.task_id, record.id),
        video_id: firstString(record.video_id),
        source_id: firstString(record.source_id, record.sourceId),
        sourceId: firstString(record.sourceId, record.source_id),
        channelId: firstString(record.channelId, record.channel_id),
        userChannelId: firstString(record.userChannelId, record.user_channel_id),
        channelName: firstString(record.channelName, record.channel_name),
        status: firstString(record.status, record.state),
        video_url: firstString(record.video_url, record.videoUrl, record.remixed_from_video_id, record.output_url, record.download_url, firstVideoUrl(record)),
        progress: typeof record.progress === "number" ? record.progress : (typeof record.progress === "string" ? parseFloat(record.progress) : undefined),
    };
}

function buildVideoGenerationResult(task: VideoResponse, url: string, durationMs: number): VideoGenerationResult {
    const size = parseVideoSize((task as Record<string, unknown>).size);
    return { id: task.id, url, durationMs, width: size.width, height: size.height, bytes: 0, mimeType: "video/mp4", task };
}

function parseVideoSize(value: unknown) {
    const match = typeof value === "string" ? value.match(/^(\d+)x(\d+)$/) : null;
    return { width: match ? Number(match[1]) : 1280, height: match ? Number(match[2]) : 720 };
}

function firstString(...values: unknown[]) {
    return values.find((value): value is string => typeof value === "string" && !!value.trim())?.trim() || "";
}

function isCompletedVideoStatus(status?: string) {
    return ["completed", "complete", "done", "succeeded", "success"].includes((status || "").toLowerCase());
}

function isFailedVideoStatus(status?: string) {
    return ["failed", "fail", "error", "cancelled", "canceled"].includes((status || "").toLowerCase());
}

function videoPayloadErrorMessage(value: unknown): string {
    const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
    if (typeof record.code === "number" && record.code !== 0) return firstString(record.msg, record.message, nestedMessage(record.error)) || "视频下载失败";
    if (typeof record.code === "string" && /fail|error/i.test(record.code)) return firstString(nestedMessage(record.error), record.msg, record.message, record.code);
    return firstString(nestedMessage(record.error));
}

function nestedMessage(value: unknown) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return firstString((value as Record<string, unknown>).message);
}

function firstVideoUrl(value: unknown, depth = 0): string {
    if (depth > 5 || value == null) return "";
    if (typeof value === "string") return /^https?:\/\//.test(value) ? value : "";
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = firstVideoUrl(item, depth + 1);
            if (found) return found;
        }
        return "";
    }
    if (typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    const direct = firstString(record.video_url, record.videoUrl, record.url, record.remixed_from_video_id, record.output_url, record.download_url, record.file_url);
    if (/^https?:\/\//.test(direct)) return direct;
    for (const key of ["video", "data", "output", "result", "content", "metadata"]) {
        const found = firstVideoUrl(record[key], depth + 1);
        if (found) return found;
    }
    return "";
}

function firstTaskId(value: unknown, depth = 0): string {
    if (depth > 4 || value == null) return "";
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = firstTaskId(item, depth + 1);
            if (found) return found;
        }
        return "";
    }
    if (typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    const direct = firstString(record.id, record.request_id, record.task_id, record.video_id);
    if (direct) return direct;
    for (const key of ["data", "result", "output", "video"]) {
        const found = firstTaskId(record[key], depth + 1);
        if (found) return found;
    }
    return "";
}

// 兼容旧版 video/page.tsx 的导出名
export type { VideoGenerationResult as VideoGenerationTask };

export async function pollVideoGenerationTask(taskId: string): Promise<VideoResponse> {
    const config = { channelMode: "remote" as const, model: "", videoModel: "" } as AiConfig;
    const token = useUserStore.getState().token;
    if (!token) throw new Error("请先登录");
    const response = await axios.get<ApiVideoEnvelope>(aiApiUrl(config, `/videos/${encodeURIComponent(taskId)}?model=`), { headers: { Authorization: `Bearer ${token}` } });
    return unwrapVideoResponse(response.data);
}

export function storeGeneratedVideo(result: VideoGenerationResult) {
    return result;
}
