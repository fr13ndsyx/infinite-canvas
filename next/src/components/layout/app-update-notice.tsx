"use client";

import { Button, Tag } from "antd";

import { getTagColor, renderReleaseContent } from "@/components/layout/version-release-modal";
import { APP_VERSION } from "@/constant/env";
import { useVersionCheck } from "@/hooks/use-version-check";

export function AppUpdateNotice() {
    const { updateVisible, latestVersion, latestRelease, applyUpdate, dismissUpdate } = useVersionCheck();
    if (!updateVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <div className="flex items-center gap-2">
                <span className="relative inline-flex size-2 shrink-0">
                    <span className="absolute inset-0 rounded-full bg-green-500" />
                </span>
                <span className="text-sm font-semibold text-stone-950 dark:text-stone-100">发现新版本 {latestVersion}</span>
            </div>
            <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                当前 {APP_VERSION} → 最新 {latestVersion}
            </div>
            {latestRelease?.items.length ? (
                <div className="mt-3 space-y-1.5">
                    {latestRelease.items.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                            <Tag color={getTagColor(item.type)} className="m-0 mt-0.5 shrink-0 whitespace-nowrap">
                                {item.type}
                            </Tag>
                            <span className="min-w-0 flex-1">{renderReleaseContent(item.content)}</span>
                        </div>
                    ))}
                </div>
            ) : null}
            <div className="mt-3 text-xs leading-5 text-stone-400 dark:text-stone-500">更新将刷新页面，请先保存当前编辑内容。</div>
            <div className="mt-3 flex justify-end gap-2">
                <Button size="small" onClick={dismissUpdate}>
                    稍后
                </Button>
                <Button size="small" type="primary" onClick={applyUpdate}>
                    立即更新
                </Button>
            </div>
        </div>
    );
}
