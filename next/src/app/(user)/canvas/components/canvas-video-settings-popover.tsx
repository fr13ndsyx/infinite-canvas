"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { FileText, Image as ImageIcon, Music2, Plus, Settings2, SlidersHorizontal, Trash2, Video as VideoIcon, Volume2, VolumeX, X } from "lucide-react";
import { Button, Input, Switch } from "antd";

import { VideoSettingsPanel, videoResolutionLabel, videoSecondsLabel, videoSizeRatioLabel } from "@/components/video-settings-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { boolConfig } from "@/lib/seedance-video";
import { useThemeStore } from "@/stores/use-theme-store";
import { findModelCapability, resolveSupportsElementList, resolveSupportsFirstFrame, resolveSupportsLastFrame, resolveSupportsMotionControl, resolveSupportsMultiShot, resolveVideoModes, resolveVideoPanelType, resolveVideoProvider, type AiConfig } from "@/stores/use-config-store";
import type { CanvasNodeMetadata } from "../types";
import { PopoverToggleIndicator } from "@/components/popover-toggle-indicator";
import { PopoverArrow } from "@/components/popover-arrow";

export type CanvasVideoFrameOption = { nodeId: string; label: string; previewUrl?: string };
export type CanvasVideoResourceOption = { nodeId: string; kind: "text" | "image" | "video" | "audio"; label: string; previewUrl?: string; text?: string };

type CanvasVideoSettingsPopoverProps = {
    config: AiConfig;
    onConfigChange: (key: "vquality" | "size" | "videoSeconds" | "videoMode" | "videoNegativePrompt" | "videoGenerateAudio" | "videoWatermark" | "videoCharacterOrientation", value: string) => void;
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

export function CanvasVideoSettingsPopover({ config, onConfigChange, frameOptions = [], resourceOptions = [], metadata, firstFrameNodeId, lastFrameNodeId, onFrameChange, onMetadataChange, placement = "topLeft", visualOnly = false }: CanvasVideoSettingsPopoverProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const model = config.model || config.videoModel || "";
    const cap = findModelCapability(config, model);
    const modes = resolveVideoModes(cap);
    const currentMode = modes.length > 0 ? (modes.some((item) => item.value === config.videoMode) ? config.videoMode : modes[0].value) : "";
    const modeLabel = modes.find((item) => item.value === currentMode)?.label || "";
    const audioOn = boolConfig(config.videoGenerateAudio, false);
    const supportsFirstFrame = resolveSupportsFirstFrame(cap) === true;
    const supportsLastFrame = resolveSupportsLastFrame(cap) === true;
    const supportsElementList = resolveSupportsElementList(cap) === true;
    const hasFrames = !visualOnly && (supportsFirstFrame || supportsLastFrame);
    const showFrameOrReference = hasFrames;
    const activeTab: "frames" | "reference" = hasFrames && metadata?.klingActiveTab === "frames" ? "frames" : "reference";
    const setActiveTab = (tab: "frames" | "reference") => { onMetadataChange?.({ klingActiveTab: tab }); };
    const ratioLabel = (value: string) => (value === "auto" || value === "adaptive" ? "智能比例" : videoSizeRatioLabel(value));
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

    const panel = open && buttonRect ? <VideoSettingsPortal buttonRect={buttonRect} panelRef={panelRef} placement={placement} theme={theme} config={config} onConfigChange={onConfigChange} frameOptions={frameOptions} resourceOptions={resourceOptions} metadata={metadata} firstFrameNodeId={firstFrameNodeId} lastFrameNodeId={lastFrameNodeId} onFrameChange={onFrameChange} onMetadataChange={onMetadataChange} visualOnly={visualOnly} activeTab={activeTab} setActiveTab={setActiveTab} hasFrames={hasFrames} showFrameOrReference={showFrameOrReference} supportsFirstFrame={supportsFirstFrame} supportsLastFrame={supportsLastFrame} supportsElementList={supportsElementList} /> : null;

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
                        视频模式
                        <PopoverToggleIndicator open={open} />
                    </span>
                </Button>
            </span>
            {panel}
        </>
    );
}

function VideoSettingsPortal({ buttonRect, panelRef, placement, theme, config, onConfigChange, frameOptions, resourceOptions, metadata, firstFrameNodeId, lastFrameNodeId, onFrameChange, onMetadataChange, visualOnly, activeTab, setActiveTab, hasFrames, showFrameOrReference, supportsFirstFrame, supportsLastFrame, supportsElementList }: { buttonRect: DOMRect; panelRef: RefObject<HTMLDivElement | null>; placement: CanvasVideoSettingsPopoverProps["placement"]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; config: AiConfig; onConfigChange: CanvasVideoSettingsPopoverProps["onConfigChange"]; frameOptions: CanvasVideoFrameOption[]; resourceOptions: CanvasVideoResourceOption[]; metadata?: CanvasNodeMetadata; firstFrameNodeId?: string; lastFrameNodeId?: string; onFrameChange?: CanvasVideoSettingsPopoverProps["onFrameChange"]; onMetadataChange?: CanvasVideoSettingsPopoverProps["onMetadataChange"]; visualOnly: boolean; activeTab: "frames" | "reference"; setActiveTab: (tab: "frames" | "reference") => void; hasFrames: boolean; showFrameOrReference: boolean; supportsFirstFrame: boolean; supportsLastFrame: boolean; supportsElementList: boolean }) {
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
    // 首尾帧存储格式：kling-v3 请求体使用 klingImageNodeIds 元数据；其他使用 firstFrameNodeId/lastFrameNodeId
    const useKlingFrameStorage = panelType === "kling-v3";
    const useKlingMultiShotBehavior = panelType === "kling-v3" && provider === "kie";
    const optionIds = useMemo(() => new Set(frameOptions.map((item) => item.nodeId)), [frameOptions]);
    const firstFrameValue = firstFrameNodeId && optionIds.has(firstFrameNodeId) ? firstFrameNodeId : "";
    const lastFrameValue = lastFrameNodeId && optionIds.has(lastFrameNodeId) ? lastFrameNodeId : "";
    const imageNodeIds = normalizeNodeIds(metadata?.klingImageNodeIds, 2);
    const elementList = normalizeKlingElementList(metadata?.klingElementList);
    const imageOptions = resourceOptions.filter((item) => item.kind === "image");
    const mediaOptions = resourceOptions.filter((item) => item.kind === "image" || item.kind === "video" || item.kind === "audio");
    const updateElementList = (items: { name?: string; description?: string; nodeIds?: string[] }[]) => onMetadataChange?.({ klingElementList: normalizeKlingElementList(items) });

    return createPortal(
        <>
        <div ref={panelRef} className="canvas-image-settings-popover" style={style} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            <div className="space-y-4">
                {showFrameOrReference ? (
                    <>
                        <div className="flex min-h-[52px] w-full items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                            <button type="button" className="flex flex-1 items-center justify-center rounded-md py-1 text-[10.8px] transition hover:opacity-80" style={{ background: activeTab === "frames" ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: activeTab === "frames" ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }} onMouseDown={(event) => event.stopPropagation()} onClick={() => setActiveTab("frames")}>首尾帧</button>
                            <button type="button" className="flex flex-1 items-center justify-center rounded-md py-1 text-[10.8px] transition hover:opacity-80" style={{ background: activeTab === "reference" ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: activeTab === "reference" ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }} onMouseDown={(event) => event.stopPropagation()} onClick={() => setActiveTab("reference")}>全能参考</button>
                        </div>
                        {activeTab === "frames" && hasFrames ? (
                            <div className="flex items-stretch gap-2">
                                {supportsFirstFrame ? (
                                    <div className="flex-1" title="首帧">
                                        {useKlingFrameStorage ? (
                                            <ResourceSinglePicker value={imageNodeIds[0] || ""} options={imageOptions} placeholder="首帧" emptyText="暂无已连接图片" theme={theme} onChange={(value) => onMetadataChange?.({ klingImageNodeIds: [value, imageNodeIds[1]].filter(Boolean) })} />
                                        ) : (
                                            <FrameReferencePicker value={firstFrameValue} options={frameOptions} theme={theme} onChange={(value) => onFrameChange?.({ firstFrameNodeId: value || undefined })} />
                                        )}
                                    </div>
                                ) : null}
                                {supportsFirstFrame && supportsLastFrame ? <div className="flex items-center text-sm opacity-40">+</div> : null}
                                {supportsLastFrame ? (
                                    <div className="flex-1" title="尾帧">
                                        {useKlingFrameStorage ? (
                                            <ResourceSinglePicker value={imageNodeIds[1] || ""} options={imageOptions} placeholder="尾帧" emptyText="暂无已连接图片" theme={theme} onChange={(value) => onMetadataChange?.({ klingImageNodeIds: [imageNodeIds[0], value].filter(Boolean) })} />
                                        ) : (
                                            <FrameReferencePicker value={lastFrameValue} options={frameOptions} theme={theme} onChange={(value) => onFrameChange?.({ lastFrameNodeId: value || undefined })} />
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </>
                ) : null}
                {!visualOnly && supportsElementList ? <KlingElementListSection items={elementList} options={mediaOptions} theme={theme} onChange={updateElementList} /> : null}
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
        <CanvasSettingGroup title="角色朝向参考" color={theme.node.muted}>
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
                    <CanvasSettingGroup title="多镜头分镜" color={theme.node.muted}>
                        <div className="grid gap-1 rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                            <SwitchRow label="多镜头分镜" hint="是否启用多镜头分镜模式" checked={multiShot} theme={theme} onChange={(checked) => onMetadataChange?.(useKlingMultiShotBehavior ? { multiShot: String(checked) } : { multiShot: String(checked), shotType: checked ? shotType : "intelligence" })} />
                        </div>
                    </CanvasSettingGroup>
                    {multiShot && !useKlingMultiShotBehavior ? (
                        <CanvasSettingGroup title="分镜模式" color={theme.node.muted}>
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
        <CanvasSettingGroup title="分镜提示词" color={theme.node.muted}>
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

function KlingElementListSection({ items, options, theme, onChange }: { items: { name?: string; description?: string; nodeIds?: string[] }[]; options: CanvasVideoResourceOption[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (items: { name?: string; description?: string; nodeIds?: string[] }[]) => void }) {
    const update = (index: number, patch: Partial<{ name?: string; description?: string; nodeIds?: string[] }>) => onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    return (
        <CanvasSettingGroup title="元素列表" color={theme.node.muted}>
            <div className="grid gap-3">
                {items.map((item, index) => (
                    <div key={index} className="rounded-xl border" style={{ borderColor: theme.node.stroke }}>
                        <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: theme.node.stroke }}>
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">元素列表{index + 1}</span><span className="rounded-md px-1.5 py-0.5 text-xs" style={{ background: theme.node.subtleFill }}>{item.nodeIds?.length || 0}</span></div>
                            <div className="flex items-center gap-1.5"><IconButton title="新增元素" disabled={items.length >= 3} theme={theme} onClick={() => onChange([...items, { name: "", description: "", nodeIds: [] }])}><Plus className="size-3.5" /></IconButton><IconButton title="删除元素" disabled={items.length <= 1} danger theme={theme} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-3.5" /></IconButton></div>
                        </div>
                        <div className="grid gap-2 p-2.5">
                            <Input value={item.name || ""} placeholder="元素名称，在提示词中使用@前缀引用" style={{ background: theme.node.subtleFill, borderColor: theme.node.stroke, color: theme.node.text }} onChange={(event) => update(index, { name: event.target.value })} />
                            <Input value={item.description || ""} placeholder="元素描述" style={{ background: theme.node.subtleFill, borderColor: theme.node.stroke, color: theme.node.text }} onChange={(event) => update(index, { description: event.target.value })} />
                            <MultiResourcePicker values={item.nodeIds || []} options={options} theme={theme} onChange={(nodeIds) => update(index, { nodeIds })} />
                        </div>
                    </div>
                ))}
            </div>
        </CanvasSettingGroup>
    );
}

function FrameReferencePicker({ label, value, options, theme, onChange }: { label?: string; value: string; options: CanvasVideoFrameOption[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((item) => item.nodeId === value);
    const items = [{ nodeId: "", label: "不指定" }, ...options];
    return <div className="relative grid gap-1.5 text-xs" style={{ color: theme.node.muted }}>{label ? <div>{label}</div> : null}<button type="button" className="flex h-12 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border px-2 text-left transition hover:opacity-90" style={{ background: theme.node.subtleFill, borderColor: open ? theme.toolbar.activeText : theme.node.stroke, color: theme.node.text }} onClick={() => setOpen((current) => !current)}><FramePreview option={selected} /><span className="min-w-0 flex-1 overflow-hidden"><span className="block truncate font-medium">{selected?.label || "不指定"}</span><span className="block truncate opacity-55">{selected ? "已连接图片节点" : options.length ? "点击选择已连接图片" : "暂无已连接图片"}</span></span>{selected ? <ClearButton onClick={() => onChange("")} /> : null}</button>{open ? <PickerMenu items={items} value={value} theme={theme} renderPreview={(item) => <FramePreview option={item.nodeId ? item : undefined} />} renderTitle={(item) => item.label} renderSubtitle={(item) => (item.nodeId ? "已连接图片节点" : "不使用首尾帧图片")} onSelect={(nodeId) => { onChange(nodeId); setOpen(false); }} /> : null}</div>;
}

function ResourceSinglePicker({ label, value, options, placeholder, emptyText, theme, onChange }: { label?: string; value: string; options: CanvasVideoResourceOption[]; placeholder: string; emptyText: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((item) => item.nodeId === value);
    const items = [{ nodeId: "", kind: "text" as const, label: placeholder }, ...options];
    return <div className="relative grid gap-1.5 text-xs" style={{ color: theme.node.muted }}>{label ? <div>{label}</div> : null}<button type="button" className="flex h-14 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border px-2 text-left transition hover:opacity-90" style={{ background: theme.node.subtleFill, borderColor: open ? theme.toolbar.activeText : theme.node.stroke, color: theme.node.text }} onClick={() => setOpen((current) => !current)}><ResourcePreview option={selected} theme={theme} /><span className="min-w-0 flex-1 overflow-hidden"><span className="block truncate font-medium">{selected ? optionTitle(selected) : placeholder}</span><span className="block truncate opacity-55">{selected ? optionSubtitle(selected) : emptyText}</span></span>{selected ? <ClearButton onClick={() => onChange("")} /> : null}</button>{open ? <PickerMenu items={items} value={value} theme={theme} renderPreview={(item) => <ResourcePreview option={item.nodeId ? item : undefined} theme={theme} />} renderTitle={(item) => (item.nodeId ? optionTitle(item) : placeholder)} renderSubtitle={(item) => (item.nodeId ? optionSubtitle(item) : emptyText)} onSelect={(nodeId) => { onChange(nodeId); setOpen(false); }} /> : null}</div>;
}

function MultiResourcePicker({ values, options, theme, onChange }: { values: string[]; options: CanvasVideoResourceOption[]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onChange: (values: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const selected = values.map((nodeId) => options.find((item) => item.nodeId === nodeId)).filter((item): item is CanvasVideoResourceOption => Boolean(item));
    const toggle = (nodeId: string) => { if (values.includes(nodeId)) onChange(values.filter((item) => item !== nodeId)); else if (values.length < 4) onChange([...values, nodeId]); };
    return <div className="relative"><button type="button" className="flex min-h-24 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-dashed p-2 text-center text-sm transition hover:opacity-90" style={{ background: theme.node.subtleFill, borderColor: open ? theme.toolbar.activeText : theme.node.stroke, color: theme.node.text }} onClick={() => setOpen((current) => !current)}>{selected.length ? <span className="grid w-full min-w-0 gap-1.5 text-left">{selected.map((item) => <span key={item.nodeId} className="flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-lg border px-2 py-1 text-xs" style={{ borderColor: theme.node.stroke }}><ResourcePreview option={item} theme={theme} small /><span className="block min-w-0 flex-1 truncate">{optionTitle(item)}</span></span>)}</span> : <span className="opacity-55">请连接画布节点后选择素材</span>}</button>{open ? <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1300] max-h-64 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-md" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}>{options.length ? options.map((item) => { const active = values.includes(item.nodeId); const disabled = !active && values.length >= 4; return <button key={item.nodeId} type="button" disabled={disabled} className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition disabled:opacity-35" style={{ background: active ? theme.toolbar.activeBg : "transparent", color: active ? theme.toolbar.activeText : theme.node.text }} onClick={() => toggle(item.nodeId)}><ResourcePreview option={item} theme={theme} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{optionTitle(item)}</span><span className="block truncate opacity-65">{optionSubtitle(item)}</span></span><span className="text-xs opacity-60">{active ? "已选" : "选择"}</span></button>; }) : <div className="px-2 py-3 text-center text-xs opacity-55">暂无已连接素材</div>}</div> : null}</div>;
}

function PickerMenu<T extends { nodeId: string }>({ items, value, theme, renderPreview, renderTitle, renderSubtitle, onSelect }: { items: T[]; value: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; renderPreview: (item: T) => ReactNode; renderTitle: (item: T) => ReactNode; renderSubtitle: (item: T) => ReactNode; onSelect: (nodeId: string) => void }) {
    return <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1300] max-h-56 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-md" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}>{items.map((item) => { const active = item.nodeId === value; return <button key={item.nodeId || "empty"} type="button" className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition" style={{ background: active ? theme.toolbar.activeBg : "transparent", color: active ? theme.toolbar.activeText : theme.node.text }} onClick={() => onSelect(item.nodeId)}>{renderPreview(item)}<span className="min-w-0 flex-1"><span className="block truncate font-medium">{renderTitle(item)}</span><span className="block truncate opacity-65">{renderSubtitle(item)}</span></span></button>; })}</div>;
}

function FramePreview({ option }: { option?: CanvasVideoFrameOption }) {
    if (option?.previewUrl) return <img src={option.previewUrl} alt="" className="size-9 shrink-0 rounded-md object-cover" />;
    return <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10"><ImageIcon className="size-4 opacity-55" /></span>;
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

function normalizeKlingElementList(value: CanvasNodeMetadata["klingElementList"] | undefined) {
    return Array.isArray(value) && value.length ? value.slice(0, 3).map((item) => ({ name: item.name || "", description: item.description || "", nodeIds: normalizeNodeIds(item.nodeIds, 4) })) : [{ name: "", description: "", nodeIds: [] }];
}

function normalizeNodeIds(value: string[] | undefined, max: number) {
    return Array.from(new Set(Array.isArray(value) ? value.filter(Boolean) : [])).slice(0, max);
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
