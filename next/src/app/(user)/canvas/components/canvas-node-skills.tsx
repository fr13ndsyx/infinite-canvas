"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Tooltip } from "antd";
import { Sparkles } from "lucide-react";

import { fetchSkills, type Skill, type SkillNodeType } from "@/services/api/skills";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { useQuery } from "@tanstack/react-query";
import { PopoverArrow } from "@/components/popover-arrow";

export function CanvasNodeSkills({ nodeType, onSelect }: { nodeType: SkillNodeType; onSelect: (skill: Skill) => void }) {
    const [open, setOpen] = useState(false);
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const buttonRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
    const { data: skills = [], isLoading } = useQuery({ queryKey: ["skills", nodeType], queryFn: () => fetchSkills(nodeType), enabled: open, staleTime: 5 * 60 * 1000 });

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
        const node = buttonRef.current?.closest<HTMLElement>("[data-node-id]");
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

    return (
        <>
            <span ref={buttonRef} className="inline-flex shrink-0">
                <Tooltip title="技能">
                    <Button
                        type="text"
                        className="!h-8 !w-8 !min-w-8 shrink-0 !rounded-full !p-0"
                        style={{ background: "transparent", color: theme.node.text, transition: "background-color 120ms" }}
                        icon={<Sparkles className="size-3.5" />}
                        onClick={() => setOpen((current) => !current)}
                        aria-label="技能"
                        onMouseEnter={(event) => { event.currentTarget.style.background = theme.toolbar.activeBg; }}
                        onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
                    />
                </Tooltip>
            </span>
            {open && buttonRect ? createPortal(
                <>
                    <div
                        ref={panelRef}
                        className="fixed z-[1200] overflow-y-auto backdrop-blur-md"
                        style={popoverStyle(buttonRect, theme)}
                        data-canvas-no-zoom
                        onWheelCapture={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                    {isLoading ? <div className="px-2 py-6 text-center text-xs">加载中…</div> : null}
                    {!isLoading && !skills.length ? <div className="px-2 py-6 text-center text-xs">暂无可用技能</div> : null}
                    <div className="flex flex-col gap-0.5">
                        {skills.map((skill) => (
                            <button key={skill.id} type="button" className="flex w-full min-w-0 items-center rounded-lg px-2 py-2 text-left text-xs transition-colors" style={{ color: theme.node.text, background: "transparent" }} onMouseEnter={(event) => { event.currentTarget.style.background = theme.toolbar.activeBg; }} onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }} onClick={() => { onSelect(skill); setOpen(false); }}>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{skill.name}</span>
                                    {skill.description ? <span className="mt-0.5 block line-clamp-2 text-[10.8px] leading-4 opacity-70">{skill.description}</span> : null}
                                </span>
                            </button>
                        ))}
                    </div>
                    </div>
                    <PopoverArrow buttonRect={buttonRect} direction={isPopoverAbove(buttonRect) ? "down" : "up"} gap={8} background={theme.toolbar.panel} border={theme.toolbar.border} />
                </>,
                document.body,
            ) : null}
        </>
    );
}

function popoverStyle(rect: DOMRect, theme: (typeof canvasThemes)[keyof typeof canvasThemes]) {
    const width = 356;
    const gap = 8;
    const margin = 12;
    const left = rect.left + rect.width / 2 - width / 2;
    const topPlacement = isPopoverAbove(rect);
    return {
        position: "fixed" as const,
        zIndex: 1200,
        width,
        left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)),
        ...(topPlacement ? { bottom: window.innerHeight - rect.top + gap, maxHeight: Math.max(260, rect.top - margin * 2) } : { top: rect.bottom + gap, maxHeight: Math.max(260, window.innerHeight - rect.bottom - margin * 2) }),
        background: theme.toolbar.panel,
        border: `1px solid ${theme.toolbar.border}`,
        borderRadius: 18,
        boxShadow: "none",
        padding: 18,
        overflowY: "auto" as const,
        color: theme.node.text,
    };
}

function isPopoverAbove(rect: DOMRect) {
    return window.innerHeight - rect.bottom < 320;
}
