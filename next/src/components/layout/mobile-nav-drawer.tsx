"use client";

import { Drawer } from "antd";
import Link from "next/link";

import { filterNavigationTools, navigationTools, type NavigationSlug } from "@/constant/navigation-tools";
import { useConfigStore } from "@/stores/use-config-store";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
    open: boolean;
    activeToolSlug?: NavigationSlug;
    onClose: () => void;
};

export function MobileNavDrawer({ open, activeToolSlug, onClose }: MobileNavDrawerProps) {
    const publicSettings = useConfigStore((state) => state.publicSettings);
    const isPublicSettingsLoading = useConfigStore((state) => state.isPublicSettingsLoading);
    const hasLoadedPublicSettings = useConfigStore((state) => state.hasLoadedPublicSettings);
    const visibleTools = publicSettings ? filterNavigationTools(navigationTools, publicSettings.modules) : navigationTools;
    const navigationReady = hasLoadedPublicSettings || (!isPublicSettingsLoading && Boolean(publicSettings));
    const rowClassName = (active: boolean) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition",
            active ? "bg-stone-100 font-medium text-stone-950 dark:bg-stone-800 dark:text-stone-100" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100",
        );

    return (
        <Drawer title="导航" placement="left" size={280} open={open} onClose={onClose} className="md:hidden">
            <div className="space-y-1">
                {navigationReady ? visibleTools.map((tool) => {
                    // link 或 dropdown 单子项 → 渲染为单行 Link
                    if (tool.kind === "link" || tool.children.length === 1) {
                        const target = tool.kind === "link" ? tool : tool.children[0];
                        const Icon = target.icon;
                        const active = target.slug === activeToolSlug;
                        return (
                            <Link key={tool.slug} href={`/${target.slug}`} onClick={onClose} className={rowClassName(active)}>
                                <Icon className="size-5" />
                                <span>{tool.label}</span>
                            </Link>
                        );
                    }

                    // dropdown 多子项：平铺渲染，子项缩进一级
                    return (
                        <div key={tool.slug} className="space-y-1">
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{tool.label}</div>
                            {tool.children.map((child) => {
                                const Icon = child.icon;
                                const active = child.slug === activeToolSlug;
                                return (
                                    <Link key={child.slug} href={`/${child.slug}`} onClick={onClose} className={cn(rowClassName(active), "pl-6")}>
                                        <Icon className="size-5" />
                                        <span>{child.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    );
                }) : null}
            </div>
        </Drawer>
    );
}
