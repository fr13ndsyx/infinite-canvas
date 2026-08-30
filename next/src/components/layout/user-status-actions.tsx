"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { Dropdown } from "antd";
import { ChevronDown, Settings2 } from "lucide-react";
import Link from "next/link";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { canvasThemes } from "@/lib/canvas-theme";
import { useConfigStore } from "@/stores/use-config-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore } from "@/stores/use-user-store";

type UserStatusActionsProps = {
    showConfig?: boolean;
    variant?: "default" | "canvas";
    accountOpen?: boolean;
    onAccountOpenChange?: (open: boolean) => void;
    accountRef?: RefObject<HTMLDivElement | null>;
    getPopupContainer?: (node: HTMLElement) => HTMLElement;
};

export function UserStatusActions({ showConfig = true, variant = "default", accountOpen, onAccountOpenChange, accountRef, getPopupContainer }: UserStatusActionsProps) {
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
                        zIndex={1200}
                        placement="bottomRight"
                        align={{ offset: [0, 14], overflow: { adjustX: 1, adjustY: 1 } }}
                        getPopupContainer={getPopupContainer}
                        dropdownRender={() => (
                            <div data-account-menu className="min-w-[292px] overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 p-2 text-sm shadow-2xl backdrop-blur-xl dark:border-stone-700/60 dark:bg-neutral-950/95">
                                <AccountThemeRow colorTheme={theme} label="主题" onThemeChange={setTheme} />
                                <AccountDivider />
                                <AccountRow>个人中心</AccountRow>
                                <AccountDivider />
                                <AccountRow className="justify-between">
                                    <span>算力余额</span>
                                    <span className="font-medium tabular-nums">{credits.toLocaleString()}</span>
                                </AccountRow>
                                {user?.role === "admin" ? (
                                    <>
                                        <AccountDivider />
                                        <Link href="/admin" onClick={() => onAccountOpenChange?.(false)} className={accountActionClass}>管理后台</Link>
                                    </>
                                ) : null}
                                <AccountDivider />
                                <AccountAction onClick={() => { onAccountOpenChange?.(false); logout(); }}>退出登录</AccountAction>
                            </div>
                        )}
                    >
                        <button type="button" className={`${triggerClassName} gap-1.5`} style={iconStyle} aria-label="账户菜单">
                            <span>{userName}</span>
                            <ChevronDown className="size-3.5 opacity-60" />
                        </button>
                    </Dropdown>
                </div>
            )}
        </div>
    );
}

const accountRowClass = "flex min-h-10 items-center gap-3 rounded-lg px-3 text-stone-600 transition hover:bg-stone-100/80 hover:shadow-sm dark:text-stone-300 dark:hover:bg-white/[0.08]";
const accountActionClass = `${accountRowClass} w-full text-left`;

function AccountRow({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={`${accountRowClass} ${className}`}>{children}</div>;
}

function AccountAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
    return <button type="button" className={accountActionClass} onClick={onClick}>{children}</button>;
}

function AccountDivider() {
    return <div className="my-1 h-px bg-stone-200/70 dark:bg-stone-800/70" />;
}

function AccountThemeRow({ colorTheme, label, onThemeChange }: { colorTheme: "light" | "dark"; label: string; onThemeChange: (theme: "light" | "dark") => void }) {
    return (
        <div className={`${accountRowClass} justify-between`}>
            <span>{label}</span>
            <div className="flex items-center gap-0.5">
                <button type="button" aria-pressed={colorTheme === "light"} onClick={() => onThemeChange("light")} className={`rounded-md px-2 py-1 text-xs transition hover:bg-stone-100 hover:shadow-sm dark:hover:bg-white/[0.08] ${colorTheme === "light" ? "font-medium text-stone-900 dark:text-stone-100" : "opacity-55"}`}>浅色</button>
                <button type="button" aria-pressed={colorTheme === "dark"} onClick={() => onThemeChange("dark")} className={`rounded-md px-2 py-1 text-xs transition hover:bg-stone-100 hover:shadow-sm dark:hover:bg-white/[0.08] ${colorTheme === "dark" ? "font-medium text-stone-900 dark:text-stone-100" : "opacity-55"}`}>深色</button>
            </div>
        </div>
    );
}
