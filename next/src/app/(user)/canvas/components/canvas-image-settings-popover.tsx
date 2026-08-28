"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Settings2 } from "lucide-react";
import { Button } from "antd";

import { ImageSettingsPanel, imageQualityTierLabel, imageSizeLabel, imageResolutionTierLabel } from "@/components/image-settings-panel";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import type { AiConfig } from "@/stores/use-config-store";
import { PopoverToggleIndicator } from "@/components/popover-toggle-indicator";
import { PopoverArrow } from "@/components/popover-arrow";

type CanvasImageSettingsPopoverProps = {
    config: AiConfig;
    onConfigChange: (key: keyof AiConfig, value: string) => void;
    onMissingConfig?: () => void;
    onOpenChange?: (open: boolean) => void;
    buttonClassName?: string;
    getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
    placement?: "topLeft" | "top" | "topRight" | "bottomLeft" | "bottom" | "bottomRight";
    autoAdjustOverflow?: boolean;
    showSize?: boolean;
    showCount?: boolean;
    panorama?: boolean;
    buttonIcon?: ReactNode;
};

export function CanvasImageSettingsPopover({ config, onConfigChange, onOpenChange, buttonClassName, placement = "topLeft", showSize = true, showCount = false, panorama = false, buttonIcon }: CanvasImageSettingsPopoverProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const buttonRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
    const count = Math.max(1, Math.min(15, Math.floor(Math.abs(Number(config.count)) || 1)));
    const activeSize = config.size || "auto";
    const updateOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };

    useEffect(() => {
        if (!open) return;
        const syncPosition = () => setButtonRect(buttonRef.current?.getBoundingClientRect() || null);
        const closeOnOutsidePointer = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
            if (document.activeElement instanceof HTMLElement && panelRef.current?.contains(document.activeElement)) document.activeElement.blur();
            setOpen(false);
            onOpenChange?.(false);
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
    }, [onOpenChange, open]);

    const panel = open && buttonRect ? <ImageSettingsPortal buttonRect={buttonRect} panelRef={panelRef} placement={placement} theme={theme} config={config} onConfigChange={onConfigChange} showSize={showSize} showCount={showCount} panorama={panorama} /> : null;

    return (
        <>
            <span ref={buttonRef} className="group inline-flex min-w-0 shrink-0">
                <Button size="small" type="text" className={buttonClassName || "!h-8 !justify-start !rounded-full !px-2.5"} style={{ background: "transparent", color: theme.node.text, transition: "background-color 120ms" }} icon={buttonIcon || <Settings2 className="size-3" />} onClick={() => updateOpen(!open)} onMouseEnter={(event) => { event.currentTarget.style.background = theme.toolbar.activeBg; }} onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}>
                    <span className="inline-flex items-center whitespace-nowrap">
                        {showSize ? (
                            <>
                                {imageResolutionTierLabel(config.imageTier)}
                                <span className="shrink-0 px-1 opacity-30">·</span>
                                {imageSizeLabel(activeSize)}
                                {showCount ? <><span className="shrink-0 px-1 opacity-30">·</span>{count} 张</> : null}
                            </>
                        ) : panorama ? (
                            imageQualityTierLabel(config.quality)
                        ) : (
                            <>
                                {showCount ? `${count} 张` : "设置"}
                            </>
                        )}
                        <PopoverToggleIndicator open={open} />
                    </span>
                </Button>
            </span>
            {panel}
        </>
    );
}

function ImageSettingsPortal({
    buttonRect,
    panelRef,
    placement,
    theme,
    config,
    onConfigChange,
    showSize,
    showCount,
    panorama,
}: {
    buttonRect: DOMRect;
    panelRef: RefObject<HTMLDivElement | null>;
    placement: CanvasImageSettingsPopoverProps["placement"];
    theme: (typeof canvasThemes)[keyof typeof canvasThemes];
    config: AiConfig;
    onConfigChange: (key: keyof AiConfig, value: string) => void;
    showSize: boolean;
    showCount: boolean;
    panorama: boolean;
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

    return createPortal(
        <>
            <div
                ref={panelRef}
                className="canvas-image-settings-popover"
                style={style}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <ImageSettingsPanel config={config} onConfigChange={(key, value) => onConfigChange(key, value)} theme={theme} className="space-y-3" showTitle={false} showSize={showSize} showCount={showCount} panorama={panorama} capabilities={config.modelCapabilities?.find((item) => item.model === config.model)} />
            </div>
            <PopoverArrow buttonRect={buttonRect} direction={topPlacement ? "down" : "up"} gap={8} background={theme.toolbar.panel} border={theme.toolbar.border} />
        </>,
        document.body,
    );
}
