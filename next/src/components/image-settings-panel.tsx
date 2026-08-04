"use client";

import { useEffect, type ReactNode, useState } from "react";
import { ConfigProvider, Segmented, Slider } from "antd";

import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AdminModelCapability } from "@/services/api/admin";
import type { AiConfig } from "@/stores/use-config-store";

const aspectOptions = [
    { value: "1:1", label: "1:1", width: 1024, height: 1024, icon: "square", tier: "standard" as const },
    { value: "3:2", label: "3:2", width: 1536, height: 1024, icon: "landscape", tier: "standard" as const },
    { value: "2:3", label: "2:3", width: 1024, height: 1536, icon: "portrait", tier: "standard" as const },
    { value: "4:3", label: "4:3", width: 1024, height: 768, icon: "landscape", tier: "standard" as const },
    { value: "3:4", label: "3:4", width: 768, height: 1024, icon: "portrait", tier: "standard" as const },
    { value: "16:9", label: "16:9", width: 1920, height: 1080, icon: "landscape", tier: "standard" as const },
    { value: "9:16", label: "9:16", width: 1080, height: 1920, icon: "portrait", tier: "standard" as const },
    { value: "21:9", label: "21:9", width: 1568, height: 672, icon: "landscape", tier: "standard" as const },
    { value: "1:1-2k", label: "1:1", size: "2048x2048", width: 2048, height: 2048, icon: "square", tier: "2k" as const },
    { value: "3:2-2k", label: "3:2", size: "2048x1360", width: 2048, height: 1360, icon: "landscape", tier: "2k" as const },
    { value: "2:3-2k", label: "2:3", size: "1360x2048", width: 1360, height: 2048, icon: "portrait", tier: "2k" as const },
    { value: "4:3-2k", label: "4:3", size: "2048x1536", width: 2048, height: 1536, icon: "landscape", tier: "2k" as const },
    { value: "3:4-2k", label: "3:4", size: "1536x2048", width: 1536, height: 2048, icon: "portrait", tier: "2k" as const },
    { value: "16:9-2k", label: "16:9", size: "2048x1152", width: 2048, height: 1152, icon: "landscape", tier: "2k" as const },
    { value: "9:16-2k", label: "9:16", size: "1152x2048", width: 1152, height: 2048, icon: "portrait", tier: "2k" as const },
    { value: "21:9-2k", label: "21:9", size: "3136x1344", width: 3136, height: 1344, icon: "landscape", tier: "2k" as const },
    { value: "1:1-4k", label: "1:1", size: "4096x4096", width: 4096, height: 4096, icon: "square", tier: "4k" as const },
    { value: "3:2-4k", label: "3:2", size: "4096x2720", width: 4096, height: 2720, icon: "landscape", tier: "4k" as const },
    { value: "2:3-4k", label: "2:3", size: "2720x4096", width: 2720, height: 4096, icon: "portrait", tier: "4k" as const },
    { value: "4:3-4k", label: "4:3", size: "4096x3072", width: 4096, height: 3072, icon: "landscape", tier: "4k" as const },
    { value: "3:4-4k", label: "3:4", size: "3072x4096", width: 3072, height: 4096, icon: "portrait", tier: "4k" as const },
    { value: "16:9-4k", label: "16:9", size: "3840x2160", width: 3840, height: 2160, icon: "landscape", tier: "4k" as const },
    { value: "9:16-4k", label: "9:16", size: "2160x3840", width: 2160, height: 3840, icon: "portrait", tier: "4k" as const },
    { value: "21:9-4k", label: "21:9", size: "6272x2688", width: 6272, height: 2688, icon: "landscape", tier: "4k" as const },
    { value: "auto", label: "auto", width: 0, height: 0, icon: "auto", tier: "standard" as const },
];

const resolutionTierOptions = [
    { value: "standard", label: "标准" },
    { value: "2k", label: "2K" },
    { value: "4k", label: "4K" },
];

function tierOfAspect(value: string): "standard" | "2k" | "4k" {
    if (value.endsWith("-2k")) return "2k";
    if (value.endsWith("-4k")) return "4k";
    return "standard";
}

type ImageSettingsPanelProps = {
    config: AiConfig;
    onConfigChange: (key: "size" | "count", value: string) => void;
    theme: CanvasTheme;
    capabilities?: AdminModelCapability;
    showTitle?: boolean;
    showSize?: boolean;
    showCount?: boolean;
    className?: string;
    maxCount?: number;
};

export function ImageSettingsPanel({ config, onConfigChange, theme, capabilities, showTitle = true, showSize = true, showCount = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5", maxCount = 10 }: ImageSettingsPanelProps) {
    const [resolutionTier, setResolutionTier] = useState<"standard" | "2k" | "4k">(() => tierOfAspect(config.size || "auto"));
    const count = Math.max(1, Math.floor(Math.abs(Number(config.count)) || 1));
    const activeSize = config.size || "auto";
    const selectedAspect = aspectOptions.find((item) => (item.size || item.value) === activeSize || item.value === activeSize);

    // 模型能力过滤：capabilities 未传（undefined）或对应字段为空数组 = 未配置，走默认全部；
    // 传入非空数组 = 按配置过滤。
    const effectiveTiers: ("standard" | "2k" | "4k")[] = !capabilities || !capabilities.imageTiers || capabilities.imageTiers.length === 0
        ? ["standard", "2k", "4k"]
        : capabilities.imageTiers;
    const effectiveAspects: string[] | null = !capabilities || !capabilities.imageAspects || capabilities.imageAspects.length === 0
        ? null
        : capabilities.imageAspects;
    const tierOptions = resolutionTierOptions.filter((item) => effectiveTiers.includes(item.value as "standard" | "2k" | "4k"));
    const effectiveResolutionTier = effectiveTiers.includes(resolutionTier) ? resolutionTier : effectiveTiers[0];
    useEffect(() => {
        if (resolutionTier !== effectiveResolutionTier) setResolutionTier(effectiveResolutionTier);
    }, [effectiveResolutionTier, resolutionTier]);
    const visibleAspects = aspectOptions.filter((item) => {
        if (item.value === "auto") return true;
        if (item.tier !== effectiveResolutionTier) return false;
        if (!effectiveAspects) return true;
        return effectiveAspects.includes(item.value.replace(/-(2k|4k)$/, ""));
    });
    const selectAspect = (value: string) => {
        const option = aspectOptions.find((item) => item.value === value);
        onConfigChange("size", option?.size || option?.value || "auto");
    };
    const changeResolutionTier = (next: "standard" | "2k" | "4k") => {
        setResolutionTier(next);
        if (activeSize !== "auto" && tierOfAspect(activeSize) !== next) onConfigChange("size", "auto");
    };

    return (
        <ImageSettingsTheme theme={theme}>
            <div
                className={className}
                style={{ color: theme.node.text }}
                onMouseDown={(event) => {
                    event.stopPropagation();
                    if (event.target instanceof HTMLInputElement) return;
                    if (document.activeElement instanceof HTMLInputElement && event.currentTarget.contains(document.activeElement)) document.activeElement.blur();
                }}
            >
                {showTitle ? <div className="text-lg font-semibold">图像设置</div> : null}
                {showSize ? (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <SettingTitle color={theme.node.muted}>比例</SettingTitle>
                            {tierOptions.length >= 1 ? (
                                <span onMouseDown={(event) => event.stopPropagation()}>
                                    <Segmented
                                        size="small"
                                        value={effectiveResolutionTier}
                                        onChange={(value) => changeResolutionTier(value as "standard" | "2k" | "4k")}
                                        options={tierOptions}
                                    />
                                </span>
                            ) : null}
                        </div>
                        <div className="grid grid-cols-4 gap-2.5">
                            {visibleAspects.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="flex h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border bg-transparent text-xs transition hover:opacity-80"
                                    style={{ borderColor: selectedAspect?.value === item.value ? theme.node.text : theme.node.stroke, background: "transparent", color: theme.node.text }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => selectAspect(item.value)}
                                >
                                    <AspectIcon type={item.icon} width={item.width} height={item.height} color={theme.node.text} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
                {showCount ? (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <SettingTitle color={theme.node.text}>生成数量</SettingTitle>
                            <span className="text-xs tabular-nums" style={{ color: theme.node.text }}>{count} 张</span>
                        </div>
                        <div onMouseDown={(event) => event.stopPropagation()}>
                            <Slider min={1} max={maxCount} value={count} onChange={(value) => onConfigChange("count", String(value))} tooltip={{ formatter: (value) => `${value} 张`, color: theme.node.text }} />
                        </div>
                    </div>
                ) : null}
            </div>
        </ImageSettingsTheme>
    );
}

export function ImageSettingsTheme({ theme, children }: { theme: CanvasTheme; children: ReactNode }) {
    return (
        <ConfigProvider
            theme={{
                token: { colorBgContainer: theme.toolbar.panel, colorBgElevated: theme.toolbar.panel, colorBorder: theme.node.stroke, colorPrimary: theme.node.activeStroke, colorText: theme.node.text, colorTextLightSolid: theme.node.panel },
                components: { Button: { defaultBg: theme.toolbar.panel, defaultBorderColor: theme.node.stroke, defaultColor: theme.node.text } },
            }}
        >
            {children}
        </ConfigProvider>
    );
}

export function imageSizeLabel(size: string) {
    return aspectOptions.find((item) => (item.size || item.value) === size || item.value === size)?.label || size;
}

function AspectIcon({ type, width, height, color }: { type: string; width: number; height: number; color: string }) {
    if (type === "auto") return null;
    const ratio = width / Math.max(1, height);
    const boxWidth = ratio >= 1 ? 18 : Math.max(8, 18 * ratio);
    const boxHeight = ratio >= 1 ? Math.max(8, 18 / ratio) : 18;
    return (
        <span className="grid h-5 w-7 place-items-center">
            <span className="border-2" style={{ width: boxWidth, height: boxHeight, borderColor: color }} />
        </span>
    );
}

function SettingTitle({ children, color }: { children: string; color: string }) {
    return (
        <div className="text-xs font-medium" style={{ color }}>
            {children}
        </div>
    );
}

export function imageFormatLabel(format: string) {
    const map: Record<string, string> = { png: "PNG", jpeg: "JPEG", webp: "WebP" };
    return map[format] || format;
}
