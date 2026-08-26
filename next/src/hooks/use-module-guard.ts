"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useConfigStore } from "@/stores/use-config-store";

export type ModuleKey = "imageWorkbench" | "videoWorkbench" | "workflows";

// 功能模块可见性守卫：后台开关关闭时重定向回首页；publicSettings 未加载完成时页面渲染 null。
export function useModuleGuard(moduleKey: ModuleKey) {
    const router = useRouter();
    const publicSettings = useConfigStore((state) => state.publicSettings);
    const enabled = publicSettings ? (publicSettings.modules?.[moduleKey] !== false) : false;
    useEffect(() => {
        if (publicSettings && !enabled) router.replace("/");
    }, [enabled, publicSettings, router]);
    return enabled;
}
