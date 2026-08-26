"use client";

import { ChevronDown } from "lucide-react";

/**
 * 单个下箭头指示器：打开时旋转 180° 翻转成向上。用于可展开的参数栏按钮。
 */
export function PopoverToggleIndicator({ open }: { open: boolean }) {
    return (
        <ChevronDown
            className={`ml-1 size-2.5 shrink-0 opacity-50 transition-transform duration-200 group-hover:opacity-100 ${open ? "rotate-180" : ""}`}
            aria-hidden
        />
    );
}
