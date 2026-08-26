"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Bot, FileText, ImageIcon, Music2, Plus, Square, Video, X, Zap } from "lucide-react";
import { Dropdown } from "antd";

import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { imageQualityTierLabel, imageSizeLabel, panoramaTierOfQuality } from "@/components/image-settings-panel";
import { videoResolutionLabel, videoSizeRatioLabel } from "@/components/video-settings-panel";
import { ModelPicker } from "@/components/model-picker";
import { CreditSymbol, requestCreditCost } from "@/constant/credits";
import { useConfigStore, type AiConfig } from "@/stores/use-config-store";
import { CanvasNodeType, type CanvasAgentConfig, type CanvasAssistantReference } from "../types";
import { isCanvasImageNodeType } from "../utils/canvas-panorama";

export type CanvasAssistantComposerProps = {
    prompt: string;
    isRunning: boolean;
    references: CanvasAssistantReference[];
    config: AiConfig;
    agentConfig: CanvasAgentConfig;
    onAgentConfigChange: (patch: Partial<CanvasAgentConfig>) => void;
    onPromptChange: (prompt: string) => void;
    onSubmit: () => void | Promise<void>;
    onStop?: () => void;
    onOpenUpload: () => void;
    onOpenAssets: () => void;
    onRemoveReference: (id: string) => void;
    onPasteImage: (file: File) => void;
    showOptions?: boolean;
};

// 选项常量：仅用于底部条 chip 的展示与选择，不引入新数据流；比例值与 image-settings-panel 的 aspectOptions 保持一致（w:h 格式，实际像素由质量档位折算）
const imageRatioOptions = [
    { value: "1:1", label: "1:1" },
    { value: "3:2", label: "3:2" },
    { value: "2:3", label: "2:3" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "21:9", label: "21:9" },
    { value: "auto", label: "智能" },
];
const videoRatioOptions = [
    { value: "1280x720", label: "16:9" },
    { value: "720x1280", label: "9:16" },
    { value: "1024x1024", label: "1:1" },
    { value: "1024x768", label: "4:3" },
    { value: "768x1024", label: "3:4" },
];
const videoQualityOptions = [
    { value: "480", label: "480p" },
    { value: "720", label: "720p" },
    { value: "1080", label: "1080p" },
];
const imageQualityOptions = [
    { value: "standard", label: "标准" },
    { value: "2k", label: "2K" },
    { value: "4k", label: "4K" },
];

export function CanvasAssistantComposer({
    prompt,
    isRunning,
    references,
    config,
    agentConfig,
    onAgentConfigChange,
    onPromptChange,
    onSubmit,
    onStop,
    onOpenUpload,
    onOpenAssets,
    onRemoveReference,
    onPasteImage,
    showOptions = true,
}: CanvasAssistantComposerProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const modelCosts = useConfigStore((state) => state.publicSettings?.modelChannel.modelCosts);
    const agentModel = agentConfig.textModel || config.textModel || config.model;
    const credits = requestCreditCost({ channelMode: config.channelMode, modelCosts, model: agentModel, count: 1 });

    return (
        <div className="px-2 pb-2" onWheelCapture={(event) => event.stopPropagation()}>
            {references.length ? (
                <div className="thin-scrollbar mb-1.5 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
                    {references.map((item) => (
                        <AssistantReferenceChip key={item.id} item={item} onRemove={() => onRemoveReference(item.id)} />
                    ))}
                </div>
            ) : null}
            <div className="rounded-2xl border px-3 pb-2 pt-3" style={{ background: theme.toolbar.panel, borderColor: theme.node.stroke }}>
                <textarea
                    value={prompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                    onPaste={(event) => {
                        const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
                        if (!file) return;
                        event.preventDefault();
                        onPasteImage(file);
                    }}
                    onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.ctrlKey || event.metaKey || event.shiftKey) return;
                        event.preventDefault();
                        void onSubmit();
                    }}
                    className="thin-scrollbar h-16 w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-5 outline-none placeholder:opacity-40"
                    style={{ color: theme.node.text }}
                    placeholder="描述创作目标，或让我继续操作画布"
                />
                <div className="mt-1.5 flex min-h-8 flex-wrap items-center gap-1.5">
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                { key: "upload", label: "上传文件" },
                                { key: "assets", label: "我的素材" },
                            ],
                            onClick: ({ key }) => (key === "upload" ? onOpenUpload() : onOpenAssets()),
                        }}
                    >
                        <button
                            type="button"
                            className="grid size-8 shrink-0 place-items-center rounded-lg transition hover:opacity-70"
                            style={{ color: theme.node.muted }}
                            aria-label="添加素材"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <Plus className="size-4" />
                        </button>
                    </Dropdown>
                    {showOptions ? null : (
                        <ModelPicker
                            config={config}
                            capability="text"
                            value={agentConfig.textModel || config.textModel || config.model}
                            channelId={agentConfig.textChannelId || config.textChannelId}
                            placeholder="选择模型"
                            onChange={(model, channelId) => onAgentConfigChange({ textModel: model, textChannelId: channelId || "" })}
                        />
                    )}
                    {showOptions ? (
                        <>
                            <ComposerMediaChip
                                label={"图片 " + (agentConfig.imageSize === "auto" || !agentConfig.imageSize ? "智能" : imageSizeLabel(agentConfig.imageSize)) + " · " + imageQualityTierLabel(agentConfig.imageQuality)}
                                title="图片参数"
                                groups={[
                                    {
                                        title: "比例",
                                        options: imageRatioOptions,
                                        value: agentConfig.imageSize || "auto",
                                        onSelect: (value) => onAgentConfigChange({ imageSize: value }),
                                    },
                                    {
                                        title: "质量",
                                        options: imageQualityOptions,
                                        value: panoramaTierOfQuality(agentConfig.imageQuality),
                                        onSelect: (value) => onAgentConfigChange({ imageQuality: value }),
                                    },
                                ]}
                                theme={theme}
                            />
                            <ComposerMediaChip
                                label={"视频 " + videoSizeRatioLabel(agentConfig.videoSize) + " · " + videoResolutionLabel(agentConfig.videoQuality)}
                                title="视频参数"
                                groups={[
                                    {
                                        title: "比例",
                                        options: videoRatioOptions,
                                        value: agentConfig.videoSize,
                                        onSelect: (value) => onAgentConfigChange({ videoSize: value }),
                                    },
                                    {
                                        title: "清晰度",
                                        options: videoQualityOptions,
                                        value: agentConfig.videoQuality,
                                        onSelect: (value) => onAgentConfigChange({ videoQuality: value }),
                                    },
                                ]}
                                theme={theme}
                            />
                        </>
                    ) : null}
                    <div className="flex-1" />
                    {config.channelMode === "remote" ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums" style={{ color: theme.node.muted }} title="本次对话消耗的算力点">
                            <CreditSymbol />
                            {credits.toLocaleString()}
                        </span>
                    ) : null}
                    <button
                        type="button"
                        disabled={!isRunning && !prompt.trim()}
                        onClick={() => (isRunning ? onStop?.() : void onSubmit())}
                        aria-label={isRunning ? "停止" : "发送"}
                        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: theme.node.text, color: theme.toolbar.panel }}
                    >
                        {isRunning ? <Square className="size-3.5 fill-current" /> : <Zap className="size-3.5" />}
                        <ArrowUp className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// 可灵风格 chip：点击弹出分组设置弹窗（如"图片参数"含比例+质量两组）
function ComposerMediaChip({ label, title, groups, theme }: { label: string; title: string; groups: { title: string; options: { value: string; label: string }[]; value: string; onSelect: (value: string) => void }[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes] }) {
    const ref = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!open) return;
        const sync = () => setRect(ref.current?.getBoundingClientRect() || null);
        const close = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            // chip 按钮和弹窗内部（portal 挂在 body）的点击都不算外部点击
            if (ref.current?.contains(target) || popoverRef.current?.contains(target)) return;
            setOpen(false);
        };
        sync();
        window.addEventListener("resize", sync);
        window.addEventListener("scroll", sync, true);
        window.addEventListener("pointerdown", close, true);
        return () => {
            window.removeEventListener("resize", sync);
            window.removeEventListener("scroll", sync, true);
            window.removeEventListener("pointerdown", close, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={ref}
                type="button"
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition hover:opacity-70"
                style={{ color: theme.node.muted }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((current) => !current);
                }}
            >
                <span>{label}</span>
            </button>
            {open && rect ? createPortal(<ComposerMediaPopover popoverRef={popoverRef} rect={rect} title={title} groups={groups} theme={theme} />, document.body) : null}
        </>
    );
}

// 可灵风格弹窗：浮在 chip 上方，按组展示选项（组标题 + 自动换行选项 + 选中高亮），选完不自动关闭，可连续调整多组参数
function ComposerMediaPopover({ popoverRef, rect, title, groups, theme }: { popoverRef: React.RefObject<HTMLDivElement | null>; rect: DOMRect; title: string; groups: { title: string; options: { value: string; label: string }[]; value: string; onSelect: (value: string) => void }[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes] }) {
    const width = 216;
    const gap = 8;
    const margin = 12;
    const left = Math.max(margin, Math.min(window.innerWidth - width - margin, rect.left + rect.width / 2 - width / 2));
    const style: React.CSSProperties = {
        position: "fixed",
        zIndex: 1300,
        width,
        left,
        bottom: window.innerHeight - rect.top + gap,
        maxHeight: Math.max(220, rect.top - margin * 2),
        background: theme.toolbar.panel,
        border: `1px solid ${theme.toolbar.border}`,
        borderRadius: 12,
        boxShadow: "0 18px 54px rgba(28,25,23,0.16)",
        padding: 8,
        overflowY: "auto",
        color: theme.node.text,
    };
    return (
        <div
            ref={popoverRef}
            style={style}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="px-1 pb-1 text-xs font-medium" style={{ color: theme.node.muted }}>{title}</div>
            {groups.map((group) => (
                <div key={group.title} className="mb-1.5 last:mb-0">
                    <div className="px-1 py-1 text-[10px]" style={{ color: theme.node.muted }}>{group.title}</div>
                    <div className="flex min-w-0 flex-wrap gap-0.5 rounded-lg p-0.5" style={{ background: theme.node.fill }}>
                        {group.options.map((option) => {
                            const active = option.value === group.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className="flex min-w-0 basis-[calc(25%-2px)] items-center justify-center rounded-md px-1.5 py-1.5 text-xs transition hover:opacity-80"
                                    style={{ background: active ? theme.toolbar.panel : "transparent", color: active ? theme.toolbar.activeText : theme.node.muted }}
                                    onClick={() => group.onSelect(option.value)}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AssistantReferenceChip({ item, onRemove }: { item: CanvasAssistantReference; onRemove?: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    return (
        <div className="group/chip relative inline-flex h-8 max-w-[160px] shrink-0 items-center gap-1.5 rounded-lg text-sm" style={{ color: theme.node.text }}>
            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border" style={{ background: theme.node.panel, borderColor: theme.node.stroke }}>
                {item.dataUrl ? <img src={item.dataUrl} alt="" className="size-8 object-cover" /> : <ReferenceIcon type={item.type} />}
            </span>
            <span className="max-w-[112px] truncate text-xs">{item.title}</span>
            {onRemove ? (
                <button
                    type="button"
                    className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border opacity-0 transition group-hover/chip:opacity-100"
                    style={{ background: theme.toolbar.panel, borderColor: theme.node.stroke }}
                    onClick={onRemove}
                    aria-label="移除引用"
                >
                    <X className="size-3" />
                </button>
            ) : null}
        </div>
    );
}

function ReferenceIcon({ type }: { type: CanvasNodeType }) {
    if (type === CanvasNodeType.Video) return <Video className="size-4" />;
    if (type === CanvasNodeType.Audio) return <Music2 className="size-4" />;
    if (type === CanvasNodeType.Text) return <FileText className="size-4" />;
    if (isCanvasImageNodeType(type)) return <ImageIcon className="size-4" />;
    return <Bot className="size-4" />;
}
