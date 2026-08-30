"use client";

import { ArrowRight, ImageIcon, Layers3, Plus } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { App, Button, Image, Tag } from "antd";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";

import { fetchPrompts, type Prompt } from "@/services/api/prompts";
import { cn } from "@/lib/utils";
import { uploadAssetMediaFile } from "@/services/file-storage";
import { resolveImageUrl, uploadImage } from "@/services/image-storage";
import { resolveMediaUrl } from "@/services/file-storage";
import { useEffectiveConfig } from "@/stores/use-config-store";
import { AssetPickerModal } from "./canvas/components/asset-picker-modal";
import { CanvasAssistantComposer } from "./canvas/components/canvas-assistant-composer";
import { useCanvasStore, type CanvasProject } from "./canvas/stores/use-canvas-store";
import { HomeBannerCarousel, type HomeBanner } from "./home-banner-carousel";
import {
    CanvasNodeType,
    type CanvasAgentConfig,
    type CanvasAssistantReference,
    type InsertAssetPayload,
    type PendingAgentAsset,
} from "./canvas/types";


const HOME_BANNERS: HomeBanner[] = [
    { imageUrl: "/banners/agent.webp", videoUrl: "/banners/agent.webm", linkUrl: "", alt: "1" },
    { imageUrl: "/banners/panorama.webp", videoUrl: "", linkUrl: "", alt: "2" },
    { imageUrl: "/banners/3ddirector.webp", videoUrl: "", linkUrl: "", alt: "3" },
];

function toPendingAgentAsset(payload: InsertAssetPayload): PendingAgentAsset {
    const nodeId = nanoid();
    let reference: CanvasAssistantReference;
    if (payload.kind === "text") {
        reference = { id: nodeId, type: CanvasNodeType.Text, title: payload.title, text: payload.content };
    } else {
        const common = { id: nodeId, title: payload.title, storageKey: payload.storageKey, mimeType: payload.mimeType };
        if (payload.kind === "image") reference = { ...common, type: CanvasNodeType.Image, dataUrl: payload.dataUrl };
        else if (payload.kind === "video") reference = { ...common, type: CanvasNodeType.Video, url: payload.url };
        else reference = { ...common, type: CanvasNodeType.Audio, url: payload.url };
    }
    return { nodeId, payload, reference };
}

export default function IndexPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const effectiveConfig = useEffectiveConfig();
    const createProject = useCanvasStore((state) => state.createProject);
    const projects = useCanvasStore((state) => state.projects);
    const hydrated = useCanvasStore((state) => state.hydrated);
    const [promptShowcase, setPromptShowcase] = useState<Prompt[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [pendingAssets, setPendingAssets] = useState<PendingAgentAsset[]>([]);
    const [assetPickerOpen, setAssetPickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [agentConfig, setAgentConfig] = useState<CanvasAgentConfig>(() => ({
        imageQuality: effectiveConfig.quality,
        imageSize: effectiveConfig.size,
        videoQuality: effectiveConfig.vquality,
        videoSize: effectiveConfig.videoSize,
    }));
    const uploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        void fetchPrompts({ pageSize: 12 })
            .then((data) => setPromptShowcase(data.items))
            .catch((error) => message.error(error instanceof Error ? error.message : "获取提示词失败"));
    }, [message]);

    const addPendingAsset = (payload: InsertAssetPayload) => {
        setPendingAssets((current) => [...current, toPendingAgentAsset(payload)]);
    };

    const uploadFile = async (file: File) => {
        try {
            if (file.type.startsWith("image/")) {
                const uploaded = await uploadImage(file);
                addPendingAsset({ kind: "image", dataUrl: uploaded.url, title: file.name, ...uploaded });
            } else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
                const uploaded = await uploadAssetMediaFile(file);
                if (file.type.startsWith("video/")) addPendingAsset({ kind: "video", title: file.name, ...uploaded });
                else addPendingAsset({ kind: "audio", title: file.name, ...uploaded });
            } else {
                throw new Error("仅支持图片、视频和音频文件");
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材上传失败");
        }
    };

    const onUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void uploadFile(file);
    };

    const submit = () => {
        const text = prompt.trim();
        if (!text || submitting) return;
        if (!hydrated) {
            message.info("画布数据正在加载，请稍后再试");
            return;
        }
        setSubmitting(true);
        const titles = new Set(useCanvasStore.getState().projects.map(({ title }) => title));
        let title = "无限画布";
        for (let i = 1; titles.has(title); i++) title = `无限画布 ${i}`;
        const projectId = createProject(title, {
            agentConfig,
            pendingAgentRequest: { prompt: text, assets: pendingAssets },
        });
        router.push(`/canvas/${projectId}`);
    };

    const createAndEnter = () => {
        if (!hydrated) {
            message.info("画布数据正在加载，请稍后再试");
            return;
        }
        const titles = new Set(projects.map(({ title }) => title));
        let title = "无限画布";
        for (let i = 1; titles.has(title); i++) title = `无限画布 ${i}`;
        router.push(`/canvas/${createProject(title)}`);
    };

    return (
        <main className="relative h-full overflow-x-hidden overflow-y-auto bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-stone-950 dark:bg-[radial-gradient(rgba(245,245,244,.16)_1px,transparent_1px)] dark:text-stone-100">
            <section className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-6">
                <section className="relative flex min-h-[620px] flex-col items-center justify-center py-10 sm:py-14">
                    <HomeBannerCarousel banners={HOME_BANNERS} />
                    <div className="mt-12 w-full max-w-[820px]">
                        <CanvasAssistantComposer
                            prompt={prompt}
                            isRunning={false}
                            references={pendingAssets.map((asset) => asset.reference)}
                            config={effectiveConfig}
                            agentConfig={agentConfig}
                            onAgentConfigChange={(patch) => setAgentConfig((current) => ({ ...current, ...patch }))}
                            onPromptChange={setPrompt}
                            onSubmit={submit}
                            onOpenUpload={() => uploadInputRef.current?.click()}
                            onOpenAssets={() => setAssetPickerOpen(true)}
                            onRemoveReference={(id) => setPendingAssets((current) => current.filter((asset) => asset.nodeId !== id))}
                            onPasteImage={(file) => void uploadFile(file)}
                            showOptions={false}
                        />
                        {hydrated ? <HomeCanvasQuickAccess projects={projects} onCreate={createAndEnter} onOpen={(id) => router.push(`/canvas/${id}`)} /> : null}
                    </div>
                    <input ref={uploadInputRef} hidden type="file" accept="image/*,video/*,audio/*" onChange={onUploadInputChange} />
                </section>

                <section className="relative mx-auto mb-20 max-w-6xl border-t border-stone-200 pt-12 dark:border-stone-800">
                    <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
                        <div />
                        <div className="max-w-2xl text-center">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <h2 className="text-3xl font-semibold text-stone-950 dark:text-stone-100">沉淀每一次好结果</h2>
                            </div>
                            <p className="mt-3 text-base leading-7 text-stone-500 dark:text-stone-400">收藏稳定出图的提示词、参考风格和结果图片，让下一次创作从已有经验开始。</p>
                        </div>
                        <Button type="link" href="/prompts" className="justify-self-center md:justify-self-end" icon={<ArrowRight className="size-4" />} iconPlacement="end">
                            提示词库
                        </Button>
                    </div>
                    <div className="grid auto-rows-[210px] gap-4 md:grid-cols-4">
                        {promptShowcase.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setPreviewIndex(index);
                                    setPreviewOpen(true);
                                }}
                                className={cn(
                                    "group relative cursor-pointer overflow-hidden border border-stone-200 bg-stone-100 text-left dark:border-stone-800 dark:bg-stone-900",
                                    index === 0 && "md:col-span-2 md:row-span-2",
                                    index === 3 && "md:col-span-2",
                                )}
                            >
                                <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4 text-white">
                                    <div className="mb-2 flex flex-wrap gap-1.5">
                                        {item.tags.slice(0, 2).map((tag) => (
                                            <Tag key={tag} variant="filled" className="m-0 bg-white/15 text-[11px] text-white backdrop-blur">
                                                {tag}
                                            </Tag>
                                        ))}
                                    </div>
                                    <h3 className="text-sm font-medium">{item.title}</h3>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{item.prompt}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </section>
            <AssetPickerModal
                open={assetPickerOpen}
                defaultTab="my-assets"
                onInsert={(payload) => {
                    addPendingAsset(payload);
                    setAssetPickerOpen(false);
                }}
                onClose={() => setAssetPickerOpen(false)}
            />
            <Image.PreviewGroup
                items={promptShowcase.map((item) => ({
                    src: item.coverUrl,
                    alt: item.title,
                }))}
                preview={{
                    open: previewOpen,
                    current: previewIndex,
                    onOpenChange: setPreviewOpen,
                    onChange: setPreviewIndex,
                }}
            />
        </main>
    );
}

function HomeCanvasQuickAccess({ projects, onCreate, onOpen }: { projects: CanvasProject[]; onCreate: () => void; onOpen: (id: string) => void }) {
    const recentProjects = [...projects]
        .sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""))
        .slice(0, 5);
    return (
        <section className="mt-5" aria-label="画布快捷入口">
            <div className="mb-2.5 flex items-center justify-between px-1">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Canvas workspace</p>
                    <h2 className="mt-1 text-sm font-medium text-stone-800 dark:text-stone-200">继续你的创作</h2>
                </div>
                {projects.length ? <a href="/canvas" className="text-xs text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">查看全部</a> : null}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button type="button" onClick={onCreate} className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white/40 px-3 text-center transition hover:border-stone-500 hover:bg-white/75 dark:border-stone-700 dark:bg-white/[0.03] dark:hover:border-stone-400 dark:hover:bg-white/[0.07]">
                    <span className="grid size-8 place-items-center rounded-full bg-stone-900 text-white transition group-hover:scale-105 dark:bg-stone-100 dark:text-stone-900"><Plus className="size-4" /></span>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-200">创建画布</span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">从空白空间开始</span>
                </button>
                {recentProjects.map((project) => <HomeCanvasPreviewCard key={project.id} project={project} onOpen={() => onOpen(project.id)} />)}
            </div>
        </section>
    );
}

function HomeCanvasPreviewCard({ project, onOpen }: { project: CanvasProject; onOpen: () => void }) {
    const previewNode = [...project.nodes].reverse().find((node) => (node.type === CanvasNodeType.Video || node.type === CanvasNodeType.Image || node.type === CanvasNodeType.Panorama) && (node.metadata?.content || node.metadata?.storageKey));
    const previewContent = previewNode?.metadata?.content || "";
    const previewStorageKey = previewNode?.metadata?.storageKey;
    const [previewUrl, setPreviewUrl] = useState(previewContent);
    const isVideo = previewNode?.type === CanvasNodeType.Video;

    useEffect(() => {
        let mounted = true;
        setPreviewUrl(previewContent);
        if (!previewContent && !previewStorageKey) {
            return () => { mounted = false; };
        }
        const resolvePreview = isVideo ? resolveMediaUrl(previewStorageKey, previewContent) : resolveImageUrl(previewStorageKey, previewContent);
        void resolvePreview.then((url) => {
            if (mounted && url) setPreviewUrl(url);
        }).catch(() => undefined);
        return () => { mounted = false; };
    }, [isVideo, previewContent, previewStorageKey]);

    return (
        <button type="button" onClick={onOpen} className="group min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white/70 text-left transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-lg dark:border-stone-800 dark:bg-white/[0.04] dark:hover:border-stone-600">
            <div className="relative h-[88px] overflow-hidden bg-stone-100 dark:bg-stone-900">
                {previewUrl ? isVideo ? <video src={previewUrl} muted preload="metadata" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <img src={previewUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center text-stone-300 dark:text-stone-600">{isVideo ? <Layers3 className="size-7" /> : <ImageIcon className="size-7" />}</div>}
                <span className="absolute bottom-2 right-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">{project.nodes.length} 个节点 · {project.connections.length} 条连线</span>
            </div>
            <div className="min-w-0 px-3 py-2.5">
                <p className="truncate text-xs font-medium text-stone-800 dark:text-stone-200" title={project.title}>{project.title || "未命名画布"}</p>
                <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500">更新于 {formatProjectDate(project.updatedAt)}</p>
            </div>
        </button>
    );
}

function formatProjectDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "刚刚";
    return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
