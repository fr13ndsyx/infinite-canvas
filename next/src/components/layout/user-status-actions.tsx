"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useState } from "react";
import { Dropdown } from "antd";
import { ChevronDown } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Link from "next/link";

import { canvasThemes } from "@/lib/canvas-theme";
import { useConfigStore } from "@/stores/use-config-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore } from "@/stores/use-user-store";

type UserStatusActionsProps = {
    variant?: "default" | "canvas" | "admin";
    accountOpen?: boolean;
    onAccountOpenChange?: (open: boolean) => void;
    accountRef?: RefObject<HTMLDivElement | null>;
    getPopupContainer?: (node: HTMLElement) => HTMLElement;
};

export function UserStatusActions({ variant = "default", accountOpen, onAccountOpenChange, accountRef, getPopupContainer }: UserStatusActionsProps) {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const user = useUserStore((state) => state.user);
    const logout = useUserStore((state) => state.clearSession);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const canvasTheme = canvasThemes[theme];
    const userName = user?.displayName || user?.username || "";
    const credits = user?.credits ?? 0;
    const [internalAccountOpen, setInternalAccountOpen] = useState(false);
    const isCanvas = variant === "canvas";
    const themeButtonClass = "inline-flex size-7 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white [&_svg]:size-4";
    const iconStyle: CSSProperties | undefined = isCanvas ? { color: canvasTheme.node.text } : undefined;
    const resolvedAccountOpen = accountOpen ?? internalAccountOpen;
    const handleAccountOpenChange = (open: boolean) => {
        if (accountOpen === undefined) setInternalAccountOpen(open);
        onAccountOpenChange?.(open);
    };
    const triggerClassName = isCanvas
        ? "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium transition hover:bg-white/10"
        : "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white";

    return (
        <div className="inline-flex shrink-0 items-center gap-1">
            <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className={themeButtonClass} style={iconStyle} aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} />
            {!user ? (
                <>
                    <Link href="/login" className="px-1.5 text-sm font-medium text-stone-600 underline-offset-4 transition hover:text-stone-950 hover:underline dark:text-stone-300 dark:hover:text-stone-100" style={iconStyle}>
                        登录
                    </Link>
                </>
            ) : (
                <div ref={accountRef}>
                    <Dropdown
                        open={resolvedAccountOpen}
                        onOpenChange={handleAccountOpenChange}
                        trigger={["click"]}
                        zIndex={1200}
                        placement={variant === "admin" ? "bottomRight" : "bottom"}
                        align={{ offset: [0, 14], overflow: { adjustX: 1, adjustY: 1 } }}
                        getPopupContainer={getPopupContainer}
                        dropdownRender={() => (
                            <div data-account-menu className="min-w-[304px] overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 p-2 text-sm shadow-2xl shadow-stone-950/10 backdrop-blur-xl dark:border-stone-700/60 dark:bg-neutral-950/95 dark:shadow-black/30">
                                <AccountRow>个人中心</AccountRow>
                                <AccountAction onClick={() => { handleAccountOpenChange(false); openConfigDialog(false); }}>
                                    <span>配置与偏好</span>
                                </AccountAction>
                                <AccountDivider />
                                <AccountRow className="justify-between">
                                    <span>算力余额</span>
                                    <span className="font-medium tabular-nums">{credits.toLocaleString()}</span>
                                </AccountRow>
                                {user?.role === "admin" ? (
                                    <>
                                        <AccountDivider />
                                        <Link href="/admin" onClick={() => handleAccountOpenChange(false)} className={accountActionClass}>管理后台</Link>
                                    </>
                                ) : null}
                                <AccountDivider />
                                <AccountAction onClick={() => { handleAccountOpenChange(false); logout(); }}>退出登录</AccountAction>
                            </div>
                        )}
                    >
                        <button type="button" className={`${triggerClassName} gap-1.5`} style={iconStyle} aria-label="账户菜单">
                            <span>{userName}</span>
                            <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
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
