"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Dropdown } from "antd";

import { navigationSlugs, navigationTools, type NavigationSlug } from "@/constant/navigation-tools";
import { AppConfigModal } from "@/components/layout/app-config-modal";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { UserStatusActions } from "@/components/layout/user-status-actions";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppTopNav() {
    const pathname = usePathname();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const hideHeader = /^\/canvas\/[^/]+/.test(pathname);
    const slug = pathname.split("/").filter(Boolean)[0];
    const activeToolSlug = navigationSlugs.includes(slug as NavigationSlug) ? (slug as NavigationSlug) : undefined;

    const linkClassName = (active: boolean) =>
        cn(
            "relative flex h-16 shrink-0 items-center gap-2 text-sm leading-6 transition-transform duration-200 ease-out hover:-translate-y-0.5 after:absolute after:inset-x-0 after:bottom-0 after:h-px cursor-pointer",
            active
                ? "font-medium text-stone-950 after:bg-stone-950 dark:text-stone-100 dark:after:bg-stone-100"
                : "text-stone-500 after:bg-transparent hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-100",
        );

    return (
        <>
            {!hideHeader ? (
                <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-stone-200 bg-background/90 backdrop-blur-xl dark:border-stone-800">
                    <div className="mx-auto flex h-full max-w-7xl items-stretch justify-between gap-5 px-6">
                        <div className="flex min-w-0 items-center">
                            <Link href="/" className="flex h-full shrink-0 items-center gap-2 text-sm font-semibold leading-none tracking-tight text-stone-950 transition hover:text-stone-600 dark:text-stone-100 dark:hover:text-stone-300">
                                <span
                                    className="size-5 shrink-0 bg-current"
                                    style={{
                                        mask: "url(/logo.svg) center / contain no-repeat",
                                        WebkitMask: "url(/logo.svg) center / contain no-repeat",
                                    }}
                                />
                                <span className="text-base font-medium">无限画布</span>
                            </Link>

                            <button
                                type="button"
                                className="ml-3 inline-flex size-8 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 md:hidden dark:text-stone-300 dark:hover:text-white"
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="打开导航菜单"
                                title="导航菜单"
                            >
                                <Menu className="size-5" />
                            </button>

                            <nav className="hide-scrollbar ml-8 hidden h-16 min-w-0 items-center gap-7 overflow-x-auto md:flex">
                                {navigationTools.map((tool) => {
                                    if (tool.kind === "link") {
                                        const Icon = tool.icon;
                                        const active = tool.slug === activeToolSlug;
                                        return (
                                            <Link key={tool.slug} href={`/${tool.slug}`} className={linkClassName(active)}>
                                                <Icon className="size-4" />
                                                <span className="truncate">{tool.label}</span>
                                            </Link>
                                        );
                                    }

                                    // dropdown：children 只有 1 项 → 渲染为 Link 直跳
                                    if (tool.children.length === 1) {
                                        const only = tool.children[0];
                                        const Icon = only.icon;
                                        const active = only.slug === activeToolSlug;
                                        return (
                                            <Link key={tool.slug} href={`/${only.slug}`} className={linkClassName(active)}>
                                                <Icon className="size-4" />
                                                <span className="truncate">{tool.label}</span>
                                            </Link>
                                        );
                                    }

                                    // dropdown：children ≥2 项 → 渲染为 antd Dropdown
                                    const Icon = tool.icon;
                                    const active = pathname.startsWith(`/${tool.slug}`);
                                    return (
                                        <Dropdown
                                            key={tool.slug}
                                            menu={{
                                                items: tool.children.map((child) => ({
                                                    key: child.slug,
                                                    label: <Link href={`/${child.slug}`}>{child.label}</Link>,
                                                })),
                                            }}
                                            trigger={["hover"]}
                                        >
                                            <span className={linkClassName(active)}>
                                                <Icon className="size-4" />
                                                <span className="truncate">{tool.label}</span>
                                                <ChevronDown className="size-3 opacity-60" />
                                            </span>
                                        </Dropdown>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="my-auto flex h-9 min-w-0 items-center justify-end gap-2 justify-self-end whitespace-nowrap">
                            <UserStatusActions />
                        </div>
                    </div>
                </header>
            ) : null}

            <MobileNavDrawer open={mobileNavOpen} activeToolSlug={activeToolSlug} onClose={() => setMobileNavOpen(false)} />
            <AppConfigModal />
        </>
    );
}
