"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useState } from "react";
import { Dropdown } from "antd";
import { ChevronDown } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Link from "next/link";

import { canvasThemes } from "@/lib/canvas-theme";
import { useConfigStore } from "@/stores/use-config-store";
import { usePasswordDialogStore } from "@/stores/use-password-dialog-store";
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
    const openPasswordDialog = usePasswordDialogStore((state) => state.openPasswordDialog);
    const canvasTheme = canvasThemes[theme];
    const userName = user?.displayName || user?.username || "";
    const credits = user?.credits ?? 0;
    const [internalAccountOpen, setInternalAccountOpen] = useState(false);
    const isCanvas = variant === "canvas";
    const themeButtonClass = "inline-flex size-7 shrink-0 items-center justify-center text-muted-foreground transition hover:text-foreground [&_svg]:size-4";
    const iconStyle: CSSProperties | undefined = isCanvas ? { color: canvasTheme.node.text } : undefined;
    const resolvedAccountOpen = accountOpen ?? internalAccountOpen;
    const handleAccountOpenChange = (open: boolean) => {
        if (accountOpen === undefined) setInternalAccountOpen(open);
        onAccountOpenChange?.(open);
    };
    const triggerClassName = isCanvas
        ? "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium transition hover:bg-white/10"
        : "flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground";

    return (
        <div className="inline-flex shrink-0 items-center gap-1">
            <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className={themeButtonClass} style={iconStyle} aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} />
            {!user ? (
                <>
                    <Link href="/login" className="px-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline" style={iconStyle}>
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
                        popupRender={() => (
                            <div data-account-menu className="min-w-[304px] overflow-hidden rounded-2xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/30 [&_.account-menu-divider]:bg-border">
                                <Link href="/account" onClick={() => handleAccountOpenChange(false)} className={accountActionClass}>个人中心</Link>
                                <AccountDivider />
                                <AccountAction onClick={() => { handleAccountOpenChange(false); openConfigDialog(false); }}>
                                    <span>配置与偏好</span>
                                </AccountAction>
                                <AccountDivider />
                                <AccountRow className="justify-between">
                                    <span>算力余额</span>
                                    <span className="font-medium tabular-nums">{credits.toLocaleString()}</span>
                                </AccountRow>
                                <AccountDivider />
                                {user?.role === "admin" ? (
                                    <>
                                        <Link href="/admin" onClick={() => handleAccountOpenChange(false)} className={accountActionClass}>管理后台</Link>
                                        <AccountDivider />
                                    </>
                                ) : null}
                                <AccountAction onClick={() => { handleAccountOpenChange(false); openPasswordDialog(); }}>修改密码</AccountAction>
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

const accountRowClass = "flex min-h-10 items-center gap-3 rounded-lg px-3 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground hover:shadow-sm";
const accountActionClass = `${accountRowClass} w-full text-left`;

function AccountRow({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={`${accountRowClass} ${className}`}>{children}</div>;
}

function AccountAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
    return <button type="button" className={accountActionClass} onClick={onClick}>{children}</button>;
}

function AccountDivider() {
    return <div className="account-menu-divider my-1 h-px" />;
}
