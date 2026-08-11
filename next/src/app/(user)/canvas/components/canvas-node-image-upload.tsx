"use client";

import { useRef, useState } from "react";
import { FileText, Plus, X } from "lucide-react";

import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";

export type CanvasNodeStackItem = {
    nodeId: string;
    kind: "image" | "text";
    url?: string;
    label: string;
    uploaded?: boolean;
};

type CanvasNodeImageUploadProps = {
    items: CanvasNodeStackItem[];
    onUpload: (file: File) => void;
    onRemove?: (item: CanvasNodeStackItem) => void;
    offset?: { left: number; top: number };
};

const BOX_WIDTH = 60;
const BOX_HEIGHT = 90;

export function CanvasNodeImageUpload({ items, onUpload, onRemove, offset = { left: 14, top: 10 } }: CanvasNodeImageUploadProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const inputRef = useRef<HTMLInputElement>(null);
    const [hovered, setHovered] = useState(false);
    const [boxHovered, setBoxHovered] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const count = items.length;
    const expanded = hovered && count > 0;
    const pick = () => inputRef.current?.click();

    return (
        <div
            data-canvas-no-zoom
            className="absolute"
            style={{ left: offset.left, top: offset.top, width: expanded ? (count + 1) * BOX_WIDTH : BOX_WIDTH, height: BOX_HEIGHT, transform: expanded ? "rotate(0deg)" : "rotate(-6deg)", transition: "width 200ms ease-out, transform 200ms ease-out", zIndex: 80 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setHoveredIndex(null);
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
        >
            {items.map((item, index) => {
                const active = expanded && hoveredIndex === index;
                return (
                    <div
                        key={item.nodeId}
                        className="absolute top-0 rounded-md"
                        style={{
                            left: expanded ? index * BOX_WIDTH : 0,
                            width: BOX_WIDTH,
                            height: BOX_HEIGHT,
                            zIndex: active ? count + 3 : count - index,
                            transform: stackTransform(index, expanded, active),
                            boxShadow: active ? "0 6px 16px rgba(0,0,0,0.3)" : "none",
                            transition: "left 200ms ease-out, transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease-out",
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {item.kind === "image" && item.url ? (
                            <div className="h-full w-full overflow-hidden rounded-md border" style={{ borderColor: theme.node.stroke }}>
                                <img src={item.url} alt="" draggable={false} className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border" style={{ borderColor: theme.node.stroke, background: theme.node.fill }}>
                                <FileText className="size-4" style={{ color: theme.node.muted }} />
                                <span className="max-w-full truncate px-1 text-[9px] leading-3" style={{ color: theme.node.muted }}>{item.label}</span>
                            </div>
                        )}
                        {item.kind === "image" ? (
                            <span className="pointer-events-none absolute bottom-0.5 left-0.5 right-0.5 truncate rounded text-center text-[8px] leading-3" style={{ background: "rgba(0,0,0,0.45)", color: "#ffffff" }}>{item.label}</span>
                        ) : null}
                        {active && onRemove ? (
                            <button
                                type="button"
                                aria-label={item.uploaded ? "删除图片" : "移除引用"}
                                className="absolute right-1 top-1 grid size-4 place-items-center rounded-full"
                                style={{ background: theme.toolbar.activeBg, color: theme.toolbar.activeText }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRemove(item);
                                }}
                            >
                                <X className="size-2.5" />
                            </button>
                        ) : null}
                    </div>
                );
            })}
            <button
                type="button"
                aria-label="上传图片"
                className="absolute top-0 grid place-items-center rounded-md border"
                style={{
                    left: count === 0 ? 0 : expanded ? count * BOX_WIDTH : (count - 1) * BOX_WIDTH,
                    width: BOX_WIDTH,
                    height: BOX_HEIGHT,
                    zIndex: count + 1,
                    opacity: count === 0 || expanded ? 1 : 0,
                    pointerEvents: count === 0 || expanded ? "auto" : "none",
                    borderColor: boxHovered ? theme.node.activeStroke : theme.node.stroke,
                    background: boxHovered ? theme.toolbar.activeBg : "transparent",
                    color: boxHovered ? theme.toolbar.activeText : theme.node.muted,
                    transform: boxHovered ? "scale(1.1)" : "none",
                    transition: "left 200ms ease-out, opacity 200ms ease-out, transform 200ms ease-out, background 200ms ease-out",
                }}
                onMouseEnter={() => setBoxHovered(true)}
                onMouseLeave={() => setBoxHovered(false)}
                onClick={pick}
            >
                <Plus className="size-4" />
            </button>
            {count === 1 ? (
                <button
                    type="button"
                    aria-label="继续上传图片"
                    className="absolute grid size-4 place-items-center rounded-full"
                    style={{ left: BOX_WIDTH - 10, top: BOX_HEIGHT - 10, zIndex: count + 2, background: theme.toolbar.activeBg, color: theme.toolbar.activeText }}
                    onClick={pick}
                >
                    <Plus className="size-2.5" />
                </button>
            ) : null}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUpload(file);
                    event.target.value = "";
                }}
            />
        </div>
    );
}

const STACK_TILTS = [5, -8, 7, -6, 9, -9];

function stackTransform(index: number, expanded: boolean, active: boolean) {
    if (active) return "rotate(0deg) scale(1.15)";
    const tilt = STACK_TILTS[index % STACK_TILTS.length];
    return `rotate(${expanded ? tilt : tilt + 6}deg)${expanded ? "" : ` translateX(${tilt > 0 ? 2 : -2}px)`}`;
}
