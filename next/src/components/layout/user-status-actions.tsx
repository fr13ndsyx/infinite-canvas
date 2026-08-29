"use client";

import type { CSSProperties, RefObject } from "react";
import { Dropdown } from "antd";
import { Keyboard, LogOut, Settings2, Shield } from "lucide-react";
import type { ItemType } from "antd/es/menu/interface";
import Link from "next/link";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { CreditSymbol } from "@/constant/credits";
import { canvasThemes } from "@/lib/canvas-theme";
import { useConfigStore } from "@/stores/use-config-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore } from "@/stores/use-user-store";

type UserStatusActionsProps = {
    showConfig?: boolean;
    variant?: "default" | "canvas";
    onOpenShortcuts?: () => void;
    accountOpen?: boolean;
    onAccountOpenChange?: (open: boolean) => void;
    accountRef?: RefObject<HTMLDivElement | null>;
    getPopupContainer?: (node: HTMLElement) => HTMLElement;
};

export function UserStatusActions({ showConfig = true, variant = "default", onOpenShortcuts, accountOpen, onAccountOpenChange, accountRef, getPopupContainer }: UserStatusActionsProps) {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const user = useUserStore((state) => state.user);
    const logout = useUserStore((state) => state.clearSession);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const publicSettings = useConfigStore((state) => state.publicSettings);
    const canvasTheme = canvasThemes[theme];
    const userName = user?.displayName || user?.username || "";
    const credits = user?.credits ?? 0;
    const isCanvas = variant === "canvas";
    const naturalIconClass = "inline-flex size-7 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white [&_svg]:size-4";
    const iconStyle: CSSProperties | undefined = isCanvas ? { color: canvasTheme.node.text } : undefined;
    // 未登录用户：仅在 publicSettings 加载完成且后台开启 allowGuestConfig 时才显示配置按钮
    // publicSettings 未加载时不显示，避免刷新时闪出按钮
    const publicSettingsLoaded = publicSettings !== null;
    const allowGuestConfig = !user ? publicSettingsLoaded && publicSettings?.modelChannel?.allowGuestConfig !== false : true;
    const configButtonVisible = showConfig && allowGuestConfig;
    const menuItems: ItemType[] = [
        ...(user?.role === "admin" ? [{ key: "admin", icon: <Shield className="size-4" />, label: <Link href="/admin">管理后台</Link> }] : []),
        ...(onOpenShortcuts ? [{ key: "shortcuts", icon: <Keyboard className="size-4" />, label: "快捷键", onClick: onOpenShortcuts }] : []),
        { type: "divider" },
        { key: "logout", icon: <LogOut className="size-4" />, label: "退出登录", onClick: logout },
    ];
    const triggerClassName = isCanvas
        ? "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium transition hover:bg-white/10"
        : "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white";

    return (
        <div className="inline-flex shrink-0 items-center gap-1">
            {configButtonVisible ? (
                <button type="button" className={naturalIconClass} style={iconStyle} onClick={() => openConfigDialog(false)} aria-label="配置" title="配置">
                    <Settings2 className="size-4" />
                </button>
            ) : null}
            {!user ? (
                <>
                    <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className={naturalIconClass} style={iconStyle} aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} />
                    {onOpenShortcuts ? (
                        <button type="button" className={naturalIconClass} style={iconStyle} onClick={onOpenShortcuts} aria-label="快捷键" title="快捷键">
                            <Keyboard className="size-4" />
                        </button>
                    ) : null}
                    <Link href="/login" className="px-1.5 text-sm font-medium text-stone-600 underline-offset-4 transition hover:text-stone-950 hover:underline dark:text-stone-300 dark:hover:text-stone-100" style={iconStyle}>
                        登录
                    </Link>
                </>
            ) : (
                <div ref={accountRef}>
                    <Dropdown
                        open={accountOpen}
                        onOpenChange={onAccountOpenChange}
                        trigger={["click"]}
                        placement="bottom"
                        align={{ offset: [0, 14], overflow: { adjustX: 1, adjustY: 1 } }}
                        getPopupContainer={getPopupContainer}
                        menu={{ items: menuItems }}
                        dropdownRender={(menu) => (
                            <div className="min-w-[260px] overflow-hidden rounded-xl border border-stone-200 bg-white py-1.5 text-sm shadow-xl dark:border-stone-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between gap-3 px-3 py-2">
                                    <span className="font-medium text-stone-800 dark:text-stone-100">{userName}</span>
                                    {user?.role === "admin" ? (
                                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">管理员</span>
                                    ) : null}
                                </div>
                                <div className="my-1 h-px bg-stone-100 dark:bg-stone-800" />
                                <div className="flex items-center justify-between gap-3 px-3 py-1.5 text-stone-600 dark:text-stone-300">
                                    <span>余额</span>
                                    <span className="flex items-center gap-1 font-medium tabular-nums text-stone-800 dark:text-stone-100">
                                        <CreditSymbol className="size-3.5" />
                                        {credits.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 px-3 py-1.5 text-stone-600 dark:text-stone-300">
                                    <span>主题</span>
                                    <AnimatedThemeToggler
                                        theme={theme}
                                        onThemeChange={setTheme}
                                        className="inline-flex size-7 items-center justify-center rounded-md text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white [&_svg]:size-4"
                                        aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
                                        title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
                                    />
                                </div>
                                <div className="my-1 h-px bg-stone-100 dark:bg-stone-800" />
                                {menu}
                            </div>
                        )}
                    >
                        <button type="button" className={triggerClassName} style={iconStyle} aria-label="账户菜单">
                            <span>{userName}</span>
                        </button>
                    </Dropdown>
                </div>
            )}
        </div>
    );
}
