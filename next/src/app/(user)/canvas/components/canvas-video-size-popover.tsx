"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Settings2 } from "lucide-react";
import { Button } from "antd";

import { VideoSettingsPanel, videoResolutionLabel, videoSizeRatioLabel } from "@/components/video-settings-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import type { AiConfig } from "@/stores/use-config-store";
import type { CanvasTheme } from "@/lib/canvas-theme";
import type { AdminModelCapability } from "@/services/api/admin";
import { PopoverToggleIndicator } from "@/components/popover-toggle-indicator";
import { PopoverArrow } from "@/components/popover-arrow";

type CanvasVideoSizePopoverProps = {
    config: AiConfig;
    onConfigChange: (key: "vquality" | "size", value: string) => void;
    placement?: "topLeft" | "top" | "topRight" | "bottomLeft" | "bottom" | "bottomRight";
    buttonClassName?: string;
};

export function CanvasVideoSizePopover({ config, onConfigChange, placement = "topLeft", buttonClassName }: CanvasVideoSizePopoverProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
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

    const panel = open && buttonRect ? <VideoSizePortal buttonRect={buttonRect} panelRef={panelRef} placement={placement} theme={theme} config={config} onConfigChange={onConfigChange} /> : null;

    return (
        <>
            <span ref={buttonRef} className="group inline-flex min-w-0 shrink-0">
                <Button
                    size="small"
                    type="text"
                    className={buttonClassName || "!h-8 !justify-start !rounded-md !px-1.5 !text-[10.8px]"}
                    style={{ background: "transparent", color: theme.node.text, fontFamily: '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', transition: "background-color 120ms" }}
                    icon={<Settings2 className="size-3" />}
                    onClick={() => setOpen((current) => !current)}
                    onMouseEnter={(event) => { event.currentTarget.style.background = theme.toolbar.activeBg; }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
                >
                    <span className="inline-flex items-center whitespace-nowrap">
                        {videoResolutionLabel(config.vquality)}
                        <span className="shrink-0 px-1 opacity-30">·</span>
                        {config.size === "auto" || config.size === "adaptive" ? "智能比例" : videoSizeRatioLabel(config.size)}
                        <PopoverToggleIndicator open={open} />
                    </span>
                </Button>
            </span>
            {panel}
        </>
    );
}

function VideoSizePortal({ buttonRect, panelRef, placement, theme, config, onConfigChange }: {
    buttonRect: DOMRect;
    panelRef: RefObject<HTMLDivElement | null>;
    placement: CanvasVideoSizePopoverProps["placement"];
    theme: CanvasTheme;
    config: AiConfig;
    onConfigChange: (key: "vquality" | "size", value: string) => void;
}) {
    const width = 356;
    const gap = 8;
    const margin = 12;
    const left = buttonRect.left + buttonRect.width / 2 - width / 2;
    const topPlacement = window.innerHeight - buttonRect.bottom < 320;
    const style = {
        position: "fixed",
        zIndex: 1200,
        width,
        left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)),
        ...(topPlacement ? { bottom: window.innerHeight - buttonRect.top + gap, maxHeight: Math.max(260, buttonRect.top - margin * 2) } : { top: buttonRect.bottom + gap, maxHeight: Math.max(260, window.innerHeight - buttonRect.bottom - margin * 2) }),
        background: theme.toolbar.panel,
        border: `1px solid ${theme.toolbar.border}`,
        borderRadius: 18,
        boxShadow: "none",
        padding: 18,
        overflowY: "auto",
        color: theme.node.text,
    } as const;

    const cap = config.modelCapabilities?.find((item) => item.model === (config.model || config.videoModel || ""));

    return createPortal(
        <>
            <div
                ref={panelRef}
                className="canvas-video-size-popover"
                style={style}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <VideoSettingsPanel config={config} onConfigChange={(key, value) => onConfigChange(key as "vquality" | "size", value)} theme={theme} showTitle={false} className="space-y-3" variant="canvas" capabilities={cap} sizeOnly />
            </div>
            <PopoverArrow buttonRect={buttonRect} direction={topPlacement ? "down" : "up"} gap={8} background={theme.toolbar.panel} border={theme.toolbar.border} />
        </>,
        document.body,
    );
}
