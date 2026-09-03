"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "antd";

import { VideoSettingsPanel } from "@/components/video-settings-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { findModelCapability, resolveSupportsFirstFrame, resolveSupportsLastFrame, type AiConfig } from "@/stores/use-config-store";
import type { CanvasNodeMetadata } from "../types";
import { PopoverToggleIndicator } from "@/components/popover-toggle-indicator";
import { PopoverArrow } from "@/components/popover-arrow";

export type CanvasVideoFrameOption = { nodeId: string; label: string; previewUrl?: string };

type CanvasVideoSettingsPopoverProps = {
    config: AiConfig;
    onConfigChange: (key: "vquality" | "size" | "videoSeconds" | "videoMode" | "videoGenerateAudio" | "videoWatermark", value: string) => void;
    frameOptions?: CanvasVideoFrameOption[];
    metadata?: CanvasNodeMetadata;
    firstFrameNodeId?: string;
    lastFrameNodeId?: string;
    onFrameChange?: (patch: { firstFrameNodeId?: string; lastFrameNodeId?: string }) => void;
    onMetadataChange?: (patch: Partial<CanvasNodeMetadata>) => void;
    placement?: "topLeft" | "top" | "topRight" | "bottomLeft" | "bottom" | "bottomRight";
    visualOnly?: boolean;
};

export function CanvasVideoSettingsPopover({ config, onConfigChange, metadata, onMetadataChange, placement = "topLeft", visualOnly = false }: CanvasVideoSettingsPopoverProps) {
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

    const panel = open && buttonRect ? <VideoSettingsPortal buttonRect={buttonRect} panelRef={panelRef} placement={placement} theme={theme} config={config} onConfigChange={onConfigChange} visualOnly={visualOnly} activeTab={activeTab} setActiveTab={setActiveTab} hasFrames={hasFrames} showFrameOrReference={showFrameOrReference} supportsFirstFrame={supportsFirstFrame} supportsLastFrame={supportsLastFrame} /> : null;

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

function VideoSettingsPortal({ buttonRect, panelRef, placement, theme, config, onConfigChange, visualOnly, activeTab, setActiveTab, hasFrames, showFrameOrReference, supportsFirstFrame, supportsLastFrame }: { buttonRect: DOMRect; panelRef: RefObject<HTMLDivElement | null>; placement: CanvasVideoSettingsPopoverProps["placement"]; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; config: AiConfig; onConfigChange: CanvasVideoSettingsPopoverProps["onConfigChange"]; visualOnly: boolean; activeTab: "frames" | "reference"; setActiveTab: (tab: "frames" | "reference") => void; hasFrames: boolean; showFrameOrReference: boolean; supportsFirstFrame: boolean; supportsLastFrame: boolean }) {
    const width = 356;
    const gap = 8;
    const margin = 12;
    const left = buttonRect.left + buttonRect.width / 2 - width / 2;
    const topPlacement = window.innerHeight - buttonRect.bottom < 320;
    const style = { position: "fixed", zIndex: 1200, width, left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)), ...(topPlacement ? { bottom: window.innerHeight - buttonRect.top + gap, maxHeight: Math.max(260, buttonRect.top - margin * 2) } : { top: buttonRect.bottom + gap, maxHeight: Math.max(260, window.innerHeight - buttonRect.bottom - margin * 2) }), background: theme.toolbar.panel, border: `1px solid ${theme.toolbar.border}`, borderRadius: 18, boxShadow: "none", padding: 18, overflowY: "auto", color: theme.node.text } as const;
    const model = config.model || config.videoModel || "";
    const cap = findModelCapability(config, model);

    return createPortal(
        <>
        <div ref={panelRef} className="canvas-image-settings-popover" style={style} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            <div className="space-y-4">
                {showFrameOrReference ? (
                    <>
                        <div className="grid gap-2">
                            <span className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>视频能力</span>
                            <div className="grid min-h-[52px] grid-cols-2 items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.segmentBg, boxShadow: theme.toolbar.panel === "#1f1f1f" ? "0 4px 16px rgba(0,0,0,0.52), inset 0 0 0 1px rgba(255,255,255,0.06)" : "0 2px 8px rgba(0,0,0,0.12)" }}>
                                <button type="button" aria-pressed={activeTab === "reference"} className="rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80" style={{ background: activeTab === "reference" ? theme.node.segmentActive : "transparent", color: theme.node.text }} onClick={() => setActiveTab("reference")}>全能参考</button>
                                <button type="button" aria-pressed={activeTab === "frames"} disabled={!hasFrames} className="rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35" style={{ background: activeTab === "frames" ? theme.node.segmentActive : "transparent", color: theme.node.text }} onClick={() => setActiveTab("frames")}>{supportsFirstFrame && supportsLastFrame ? "首尾帧" : "首帧"}</button>
                            </div>
                        </div>
                    </>
                ) : null}
                <VideoSettingsPanel config={config} modelName={visualOnly ? config.videoModel || config.model : undefined} onConfigChange={(key, value) => onConfigChange(key, value)} theme={theme} showTitle={false} className="space-y-3" variant="canvas" visualOnly={visualOnly} capabilities={cap} hideRatioResolution />
            </div>
        </div>
        <PopoverArrow buttonRect={buttonRect} direction={topPlacement ? "down" : "up"} gap={8} background={theme.toolbar.panel} border={theme.toolbar.border} />
        </>,
        document.body,
    );
}
