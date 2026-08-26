"use client";

import type { CSSProperties } from "react";

type PopoverArrowProps = {
    buttonRect: DOMRect;
    /** 箭头朝向按钮：弹窗在按钮下方时朝上 "up"，在上方时朝下 "down" */
    direction: "up" | "down";
    gap: number;
    background: string;
    border: string;
};

/**
 * 弹窗指向按钮的小三角箭头。独立 fixed 元素，不嵌入弹窗滚动容器，
 * 避免被 overflow 裁剪。水平居中于按钮，垂直卡在按钮与弹窗之间的缝隙。
 */
export function PopoverArrow({ buttonRect, direction, gap, background, border }: PopoverArrowProps) {
    const isUp = direction === "up";
    const size = 12;
    const half = size / 2;
    const left = buttonRect.left + buttonRect.width / 2 - half;
    const style: CSSProperties = {
        position: "fixed",
        zIndex: 1200,
        left,
        width: size,
        height: size,
        background,
        transform: "rotate(45deg)",
        pointerEvents: "none",
    };
    if (isUp) {
        // 弹窗在下方，箭头在弹窗顶边、朝上指向按钮
        style.top = buttonRect.bottom + gap - half;
        style.borderTop = `1px solid ${border}`;
        style.borderLeft = `1px solid ${border}`;
    } else {
        // 弹窗在上方，箭头在弹窗底边、朝下指向按钮
        style.bottom = window.innerHeight - buttonRect.top + gap - half;
        style.borderBottom = `1px solid ${border}`;
        style.borderRight = `1px solid ${border}`;
    }
    return <span aria-hidden style={style} />;
}
