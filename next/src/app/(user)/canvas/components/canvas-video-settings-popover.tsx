"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { FileText, Image as ImageIcon, Music2, Plus, Settings2, SlidersHorizontal, Trash2, Video as VideoIcon, Volume2, VolumeX, X } from "lucide-react";
import { Button, Switch } from "antd";

import { VideoSettingsPanel } from "@/components/video-settings-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { boolConfig } from "@/lib/seedance-video";
import { useThemeStore } from "@/stores/use-theme-store";
import { findModelCapability, resolveSupportsFirstFrame, resolveSupportsLastFrame, resolveSupportsMotionControl, resolveSupportsMultiShot, resolveVideoPanelType, resolveVideoProvider, type AiConfig } from "@/stores/use-config-store";
import type { CanvasNodeMetadata } from "../types";
import { PopoverToggleIndicator } from "@/components/popover-toggle-indicator";
import { PopoverArrow } from "@/components/popover-arrow";

export type CanvasVideoFrameOption = { nodeId: string; label: string; previewUrl?: string };
export type CanvasVideoResourceOption = { nodeId: string; kind: "text" | "image" | "video" | "audio"; label: string; previewUrl?: string; text?: string };

type CanvasVideoSettingsPopoverProps = {
    config: AiConfig;
    onConfigChange: (key: "vquality" | "size" | "videoSeconds" | "videoMode" | "videoGenerateAudio" | "videoWatermark" | "videoCharacterOrientation", value: string) => void;
    frameOptions?: CanvasVideoFrameOption[];
    resourceOptions?: CanvasVideoResourceOption[];
    metadata?: CanvasNodeMetadata;
    firstFrameNodeId?: string;
    lastFrameNodeId?: string;
    onFrameChange?: (patch: { firstFrameNodeId?: string; lastFrameNodeId?: string }) => void;
    onMetadataChange?: (patch: Partial<CanvasNodeMetadata>) => void;
    placement?: "topLeft" | "top" | "topRight" | "bottomLeft" | "bottom" | "bottomRight";
    visualOnly?: boolean;
};

export function CanvasVideoSettingsPopover({ config, onConfigChange, resourceOptions = [], metadata, onMetadataChange, placement = "topLeft", visualOnly = false }: CanvasVideoSettingsPopoverProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const model = config.model || config.videoModel || "";
    const cap = findModelCapability(config, model);
    const supportsFirstFrame = resolveSupportsFirstFrame(cap) === true;
    const supportsLastFrame = resolveSupportsLastFrame(cap) === true;
    const hasFrames = !visualOnly && (supportsFirstFrame || supportsLastFrame);
    const showFrameOrReference = hasFrames;
    const activeTab: "frames" | "reference" = hasFrames && metadata?.klingActiveTab === "frames" ? "frames" : "reference";
    const setActiveTab = (tab: "frames" | "reference") => { onMetadataChange?.({ klingActiveTab: tab }); };
    const buttonRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!open) return;
        const syncPosition = () => setButtonRect(buttonRef.current?.getBoundingClientRect() || null);
        const closeOnOutsidePointer = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (target instanceof Element && target.closest(".ant-select-dropdown")) return;
            if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
            setOpen(false);
        };
        syncPosition();
        window.addEventListener("resize", syncPosition);
        window.addEventListener("scroll", syncPosition, true);
        window.addEventListener("pointerdown", closeOnOutsidePointer, true);
        const trigger = buttonRef.current;
        const node = trigger?.closest<HTMLElement>("[data-node-id]");
        const canvasLayer = node?.parentElement;
        const observer = new MutationObserver(syncPosition);
        if (node) observer.observe(node, { attributes: true, attributeFilter: ["style"] });
        if (canvasLayer) observer.observe(canvasLayer, { attributes: true, attributeFilter: ["style"] });
        return () => {
            window.removeEventListener("resize", syncPosition);
            window.removeEventListener("scroll", syncPosition, true);
            window.removeEventListener("pointerdown", closeOnOutsidePointer, true);
            observer.disconnect();
        };
    }, [open]);

    const panel = open && buttonRect ? <VideoSettingsPortal buttonRect={buttonRect} panelRef={panelRef} placement={placement} theme={theme} config={config} onConfigChange={onConfigChange} resourceOptions={resourceOptions} metadata={metadata} onMetadataChange={onMetadataChange} visualOnly={visualOnly} activeTab={activeTab} setActiveTab={setActiveTab} hasFrames={hasFrames} showFrameOrReference={showFrameOrReference} supportsFirstFrame={supportsFirstFrame} supportsLastFrame={supportsLastFrame} /> : null;

    return (
        <>
            <span ref={buttonRef} className="group inline-flex min-w-0 shrink-0">
                <Button
                    size="small"
                    type="text"
                    className="!h-8 !min-w-0 !justify-start !rounded-md !px-1.5 !text-[10.8px] !whitespace-nowrap"
                    style={{ background: "transparent", color: theme.node.text, fontFamily: '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', transition: "background-color 120ms" }}
                    icon={<SlidersHorizontal className="size-3" />}
                    onClick={() => setOpen((current) => !current)}
                    onMouseEnter={(event) => { event.currentTarget.style.background = theme.toolbar.activeBg; }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
                >
                    <span className="inline-flex items-center whitespace-nowrap">
                        {showFrameOrReference && activeTab === "frames" ? (supportsFirstFrame && supportsLastFrame ? "首尾帧" : "首帧") : "全能参考"}
                        <PopoverToggleIndicator open={open} />
                    </span>
                </Button>
            </span>
            {panel}
        </>
    );
}

function VideoSettingsPortal({ buttonRect, panelRef, placement, theme, config, onConfigChange, resourceOptions, metadata, onMetadataChange, visualOnly, activeTab, setActiveTab, hasFrames, showFrameOrReference, supportsFirstFrame, supportsLastFrame }: { buttonRect: DOMRect; panelRef: RefObject<HTMLDivElement | null>; placement: CanvasVideoSettingsPopoverProps["placement"]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; config: AiConfig; onConfigChange: CanvasVideoSettingsPopoverProps["onConfigChange"]; resourceOptions: CanvasVideoResourceOption[]; metadata?: CanvasNodeMetadata; onMetadataChange?: CanvasVideoSettingsPopoverProps["onMetadataChange"]; visualOnly: boolean; activeTab: "frames" | "reference"; setActiveTab: (tab: "frames" | "reference") => void; hasFrames: boolean; showFrameOrReference: boolean; supportsFirstFrame: boolean; supportsLastFrame: boolean }) {
    const width = 356;
    const gap = 8;
    const margin = 12;
    const left = buttonRect.left + buttonRect.width / 2 - width / 2;
    const topPlacement = window.innerHeight - buttonRect.bottom < 320;
    const style = { position: "fixed", zIndex: 1200, width, left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)), ...(topPlacement ? { bottom: window.innerHeight - buttonRect.top + gap, maxHeight: Math.max(260, buttonRect.top - margin * 2) } : { top: buttonRect.bottom + gap, maxHeight: Math.max(260, window.innerHeight - buttonRect.bottom - margin * 2) }), background: theme.toolbar.panel, border: `1px solid ${theme.toolbar.border}`, borderRadius: 18, boxShadow: "none", padding: 18, overflowY: "auto", color: theme.node.text } as const;
    const model = config.model || config.videoModel || "";
    const cap = findModelCapability(config, model);
    const panelType = resolveVideoPanelType(cap);
    const provider = resolveVideoProvider(cap);
    const supportsMultiShot = resolveSupportsMultiShot(cap) === true;
    const supportsMotionControl = resolveSupportsMotionControl(cap) === true;
    const useKlingMultiShotBehavior = panelType === "kling-v3" && provider === "kie";

    return createPortal(
        <>
        <div ref={panelRef} className="canvas-image-settings-popover" style={style} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            <div className="space-y-4">
                {showFrameOrReference ? (
                    <>
                        <div className="grid gap-2">
                            <span className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>视频能力</span>
                            <div className="grid min-h-[52px] grid-cols-2 items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.segmentBg }}>
                                <button type="button" aria-pressed={activeTab === "reference"} className="rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80" style={{ background: activeTab === "reference" ? theme.node.segmentActive : "transparent", color: theme.node.text, boxShadow: activeTab === "reference" ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }} onClick={() => setActiveTab("reference")}>全能参考</button>
                                <button type="button" aria-pressed={activeTab === "frames"} disabled={!hasFrames} className="rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35" style={{ background: activeTab === "frames" ? theme.node.segmentActive : "transparent", color: theme.node.text, boxShadow: activeTab === "frames" ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }} onClick={() => setActiveTab("frames")}>{supportsFirstFrame && supportsLastFrame ? "首尾帧" : "首帧"}</button>
                            </div>
                        </div>
                    </>
                ) : null}
                {!visualOnly && supportsMotionControl ? <CharacterOrientationSetting value={config.videoCharacterOrientation} theme={theme} onChange={(value) => onConfigChange("videoCharacterOrientation", value)} /> : null}
                {!visualOnly && supportsMultiShot ? <AdvancedVideoSettings metadata={metadata} resourceOptions={resourceOptions} theme={theme} supportsMultiShot={supportsMultiShot} useKlingMultiShotBehavior={useKlingMultiShotBehavior} onMetadataChange={onMetadataChange} /> : null}
                <VideoSettingsPanel config={config} modelName={visualOnly ? config.videoModel || config.model : undefined} onConfigChange={(key, value) => onConfigChange(key, value)} theme={theme} showTitle={false} className="space-y-3" variant="canvas" visualOnly={visualOnly} capabilities={cap} hideRatioResolution />
            </div>
        </div>
        <PopoverArrow buttonRect={buttonRect} direction={topPlacement ? "down" : "up"} gap={8} background={theme.toolbar.panel} border={theme.toolbar.border} />
        </>,
        document.body,
    );
}

function CharacterOrientationSetting({ value, theme, onChange }: { value?: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (value: string) => void }) {
    const current = value === "image" ? "image" : "video";
    return (
        <CanvasSettingGroup title="角色朝向参考" color={theme.node.titleText}>
            <div className="grid grid-cols-2 gap-2.5">
                <OptionPill selected={current === "image"} theme={theme} onClick={() => onChange("image")}>图片</OptionPill>
                <OptionPill selected={current === "video"} theme={theme} onClick={() => onChange("video")}>视频</OptionPill>
            </div>
        </CanvasSettingGroup>
    );
}

function AdvancedVideoSettings({ metadata, resourceOptions, theme, supportsMultiShot, useKlingMultiShotBehavior, onMetadataChange }: { metadata?: CanvasNodeMetadata; resourceOptions: CanvasVideoResourceOption[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; supportsMultiShot: boolean; useKlingMultiShotBehavior: boolean; onMetadataChange?: CanvasVideoSettingsPopoverProps["onMetadataChange"] }) {
    const multiShot = boolValue(metadata?.multiShot);
    const shotType = metadata?.shotType === "customize" ? "customize" : "intelligence";
    const multiPrompt = normalizeKlingMultiPrompt(metadata?.klingMultiPrompt);
    const textOptions = resourceOptions.filter((item) => item.kind === "text");
    const updateMultiPrompt = (items: { textNodeId?: string; duration?: string }[]) => onMetadataChange?.({ klingMultiPrompt: normalizeKlingMultiPrompt(items) });

    return (
        <>
            {supportsMultiShot ? (
                <>
                    <CanvasSettingGroup title="多镜头分镜" color={theme.node.titleText}>
                        <div className="grid gap-1 rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                            <SwitchRow label="多镜头分镜" hint="是否启用多镜头分镜模式" checked={multiShot} theme={theme} onChange={(checked) => onMetadataChange?.(useKlingMultiShotBehavior ? { multiShot: String(checked) } : { multiShot: String(checked), shotType: checked ? shotType : "intelligence" })} />
                        </div>
                    </CanvasSettingGroup>
                    {multiShot && !useKlingMultiShotBehavior ? (
                        <CanvasSettingGroup title="分镜模式" color={theme.node.titleText}>
                            <div className="grid grid-cols-2 gap-2.5">
                                <OptionPill selected={shotType === "customize"} theme={theme} onClick={() => onMetadataChange?.({ shotType: "customize" })}>自定义</OptionPill>
                                <OptionPill selected={shotType === "intelligence"} theme={theme} onClick={() => onMetadataChange?.({ shotType: "intelligence" })}>智能分镜</OptionPill>
                            </div>
                        </CanvasSettingGroup>
                    ) : null}
                    {multiShot && (useKlingMultiShotBehavior || shotType === "customize") ? <KlingMultiPromptSection items={multiPrompt} options={textOptions} theme={theme} onChange={updateMultiPrompt} /> : null}
                </>
            ) : null}
        </>
    );
}

function KlingMultiPromptSection({ items, options, theme, onChange }: { items: { textNodeId?: string; duration?: string }[]; options: CanvasVideoResourceOption[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (items: { textNodeId?: string; duration?: string }[]) => void }) {
    const update = (index: number, patch: Partial<{ textNodeId?: string; duration?: string }>) => onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    return (
        <CanvasSettingGroup title="分镜提示词" color={theme.node.titleText}>
            <div className="grid gap-2 rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                {items.map((item, index) => (
                    <div key={index} className="grid gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">分镜提示词{index + 1}</span>
                            <div className="flex items-center gap-1.5">
                                <NumberField value={item.duration || "1"} min={1} max={15} theme={theme} onChange={(value) => update(index, { duration: value })} />
                                <IconButton title="新增分镜提示词" theme={theme} onClick={() => onChange([...items, { textNodeId: "", duration: "1" }])}><Plus className="size-3.5" /></IconButton>
                                <IconButton title="删除分镜提示词" disabled={items.length <= 1} danger theme={theme} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-3.5" /></IconButton>
                            </div>
                        </div>
                        <ResourceSinglePicker value={item.textNodeId || ""} options={options} placeholder="请选择文字节点" emptyText="暂无已连接文字节点" theme={theme} onChange={(value) => update(index, { textNodeId: value })} />
                    </div>
                ))}
            </div>
        </CanvasSettingGroup>
    );
}

function ResourceSinglePicker({ label, value, options, placeholder, emptyText, theme, onChange }: { label?: string; value: string; options: CanvasVideoResourceOption[]; placeholder: string; emptyText: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((item) => item.nodeId === value);
    const items = [{ nodeId: "", kind: "text" as const, label: placeholder }, ...options];
    return <div className="relative grid gap-1.5 text-xs" style={{ color: theme.node.muted }}>{label ? <div>{label}</div> : null}<button type="button" className="flex h-14 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border px-2 text-left transition hover:opacity-90" style={{ background: theme.node.subtleFill, borderColor: open ? theme.toolbar.activeText : theme.node.stroke, color: theme.node.text }} onClick={() => setOpen((current) => !current)}><ResourcePreview option={selected} theme={theme} /><span className="min-w-0 flex-1 overflow-hidden"><span className="block truncate font-medium">{selected ? optionTitle(selected) : placeholder}</span><span className="block truncate opacity-55">{selected ? optionSubtitle(selected) : emptyText}</span></span>{selected ? <ClearButton onClick={() => onChange("")} /> : null}</button>{open ? <PickerMenu items={items} value={value} theme={theme} renderPreview={(item) => <ResourcePreview option={item.nodeId ? item : undefined} theme={theme} />} renderTitle={(item) => (item.nodeId ? optionTitle(item) : placeholder)} renderSubtitle={(item) => (item.nodeId ? optionSubtitle(item) : emptyText)} onSelect={(nodeId) => { onChange(nodeId); setOpen(false); }} /> : null}</div>;
}

function PickerMenu<T extends { nodeId: string }>({ items, value, theme, renderPreview, renderTitle, renderSubtitle, onSelect }: { items: T[]; value: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; renderPreview: (item: T) => ReactNode; renderTitle: (item: T) => ReactNode; renderSubtitle: (item: T) => ReactNode; onSelect: (nodeId: string) => void }) {
    return <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1300] max-h-56 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-md" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}>{items.map((item) => { const active = item.nodeId === value; return <button key={item.nodeId || "empty"} type="button" className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition" style={{ background: active ? theme.toolbar.activeBg : "transparent", color: active ? theme.toolbar.activeText : theme.node.text }} onClick={() => onSelect(item.nodeId)}>{renderPreview(item)}<span className="min-w-0 flex-1"><span className="block truncate font-medium">{renderTitle(item)}</span><span className="block truncate opacity-65">{renderSubtitle(item)}</span></span></button>; })}</div>;
}

function ResourcePreview({ option, theme, small = false }: { option?: CanvasVideoResourceOption; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; small?: boolean }) {
    const size = small ? "size-5" : "size-9";
    if (option?.kind === "image" && option.previewUrl) return <img src={option.previewUrl} alt="" className={[size, "shrink-0 rounded-md object-cover"].join(" ")} />;
    if (option?.kind === "video" && option.previewUrl) return <video src={option.previewUrl} className={[size, "shrink-0 rounded-md bg-black object-cover"].join(" ")} muted preload="metadata" />;
    const Icon = option?.kind === "audio" ? Music2 : option?.kind === "video" ? VideoIcon : option?.kind === "text" ? FileText : ImageIcon;
    return <span className={["flex shrink-0 items-center justify-center rounded-md", size].join(" ")} style={{ background: theme.node.subtleFill }}><Icon className="size-4 opacity-55" /></span>;
}

function ClearButton({ onClick }: { onClick: () => void }) {
    return <span role="button" tabIndex={0} className="rounded-full p-1 opacity-55 transition hover:opacity-100" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClick(); }}><X className="size-3.5" /></span>;
}

function IconButton({ title, disabled = false, danger = false, theme, onClick, children }: { title: string; disabled?: boolean; danger?: boolean; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onClick: () => void; children: ReactNode }) {
    return <button type="button" title={title} disabled={disabled} className="grid size-8 place-items-center rounded-lg border text-xs transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35" style={{ background: theme.node.subtleFill, borderColor: theme.node.stroke, color: danger ? "#ef4444" : theme.node.text }} onClick={onClick}>{children}</button>;
}

function NumberField({ value, min, max, theme, onChange }: { value: string; min: number; max: number; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (value: string) => void }) {
    return <input type="number" min={min} max={max} className="h-8 w-16 rounded-full border bg-transparent px-2 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" style={{ borderColor: theme.node.stroke, color: theme.node.text, WebkitTextFillColor: theme.node.text }} value={value} onChange={(event) => onChange(event.target.value)} onMouseDown={(event) => event.stopPropagation()} />;
}

function OptionPill({ selected, theme, onClick, children }: { selected: boolean; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onClick: () => void; children: ReactNode }) {
    return <button type="button" className="h-9 cursor-pointer rounded-full px-2 text-sm transition hover:opacity-80" style={{ background: selected ? theme.toolbar.activeBg : "transparent", color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()} onClick={onClick}>{children}</button>;
}

function CanvasSettingGroup({ title, color, children }: { title: string; color: string; children: ReactNode }) {
    return <div className="space-y-1.5"><div className="text-[10.8px] font-medium" style={{ color }}>{title}</div>{children}</div>;
}

function SwitchRow({ label, hint, checked, theme, onChange }: { label: string; hint?: string; checked: boolean; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (checked: boolean) => void }) {
    return <div className="flex min-h-9 items-center justify-between gap-3"><span className="min-w-0"><span className="block text-sm" style={{ color: theme.node.text }}>{label}</span>{hint ? <span className="block text-[11px] leading-4 opacity-55">{hint}</span> : null}</span><span onMouseDown={(event) => event.stopPropagation()}><Switch size="small" checked={checked} onChange={onChange} /></span></div>;
}

function normalizeKlingMultiPrompt(value: CanvasNodeMetadata["klingMultiPrompt"] | undefined) {
    return Array.isArray(value) && value.length ? value.map((item) => ({ textNodeId: item.textNodeId || "", duration: item.duration || "1" })) : [{ textNodeId: "", duration: "1" }];
}

function boolValue(value: string | undefined) {
    return String(value || "").toLowerCase() === "true";
}

function optionTitle(item: CanvasVideoResourceOption) {
    if (item.kind === "text") return shortText(item.text || item.label, 10);
    return item.label;
}

function optionSubtitle(item: CanvasVideoResourceOption) {
    if (item.kind === "text") return item.text ? shortText(item.text, 24) : "文字节点";
    if (item.kind === "image") return "图片节点";
    if (item.kind === "video") return "视频节点";
    return "音频节点";
}

function shortText(value: string, max: number) {
    const text = String(value || "").trim();
    return text.length > max ? text.slice(0, max) + "..." : text;
}
