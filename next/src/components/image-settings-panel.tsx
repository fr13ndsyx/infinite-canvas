"use client";

import { useEffect, type ReactNode } from "react";
import { ConfigProvider, Slider } from "antd";

import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AdminModelCapability } from "@/services/api/admin";
import type { AiConfig } from "@/stores/use-config-store";
import { CanvasSection, RatioIcon } from "@/components/video-settings-panel";

const aspectOptions = [
    { value: "1:1", label: "1:1", width: 1024, height: 1024, icon: "square" },
    { value: "3:2", label: "3:2", width: 1536, height: 1024, icon: "landscape" },
    { value: "2:3", label: "2:3", width: 1024, height: 1536, icon: "portrait" },
    { value: "4:3", label: "4:3", width: 1024, height: 768, icon: "landscape" },
    { value: "3:4", label: "3:4", width: 768, height: 1024, icon: "portrait" },
    { value: "16:9", label: "16:9", width: 1920, height: 1080, icon: "landscape" },
    { value: "9:16", label: "9:16", width: 1080, height: 1920, icon: "portrait" },
    { value: "21:9", label: "21:9", width: 1568, height: 672, icon: "landscape" },
    { value: "auto", label: "auto", width: 0, height: 0, icon: "auto" },
];

const resolutionTierOptions = [
    { value: "standard", label: "标准" },
    { value: "2k", label: "2K" },
    { value: "4k", label: "4K" },
];

type ImageSettingsPanelProps = {
    config: AiConfig;
    onConfigChange: (key: "size" | "count" | "quality" | "imageTier", value: string) => void;
    theme: CanvasTheme;
    capabilities?: AdminModelCapability;
    showTitle?: boolean;
    showSize?: boolean;
    showCount?: boolean;
    className?: string;
    maxCount?: number;
    panorama?: boolean;
};

export function ImageSettingsPanel({ config, onConfigChange, theme, capabilities, showTitle = true, showSize = true, showCount = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5", maxCount = 10, panorama = false }: ImageSettingsPanelProps) {
    const count = Math.max(1, Math.floor(Math.abs(Number(config.count)) || 1));
    const activeSize = config.size || "auto";
    const activeTier = (config.imageTier || "standard") as "standard" | "2k" | "4k";
    const selectedAspect = aspectOptions.find((item) => item.value === activeSize);

    // 模型能力过滤：capabilities 未传（undefined）或对应字段为空数组 = 未配置，走默认全部；
    // 传入非空数组 = 按配置过滤。
    const effectiveTiers: ("standard" | "2k" | "4k")[] = !capabilities || !capabilities.imageTiers || capabilities.imageTiers.length === 0
        ? ["standard", "2k", "4k"]
        : capabilities.imageTiers;
    const effectiveAspects: string[] | null = !capabilities || !capabilities.imageAspects || capabilities.imageAspects.length === 0
        ? null
        : capabilities.imageAspects;
    const tierOptions = resolutionTierOptions.filter((item) => effectiveTiers.includes(item.value as "standard" | "2k" | "4k"));
    const effectiveTier = effectiveTiers.includes(activeTier) ? activeTier : effectiveTiers.includes("standard") ? "standard" : effectiveTiers[0];
    // 档位被能力夹紧时回写，保证 config 与展示一致
    useEffect(() => {
        if (!panorama && activeTier !== effectiveTier) onConfigChange("imageTier", effectiveTier);
    }, [activeTier, effectiveTier, panorama]);
    const visibleAspects = aspectOptions.filter((item) => {
        if (item.value === "auto") return true;
        if (!effectiveAspects) return true;
        return effectiveAspects.includes(item.value);
    });
    const selectAspect = (value: string) => {
        onConfigChange("size", value);
    };
    // 档位是独立维度：非全景写 imageTier，与比例互不影响；全景沿用 quality（low/medium/high）。
    // 全景模式：档位直接写入 quality（标准=low / 2K=medium / 4K=high），比例固定 2:1 不展示。
    const panoramaTier = panoramaTierOfQuality(config.quality);
    const changeTier = (tier: "standard" | "2k" | "4k") => {
        if (panorama) {
            onConfigChange("quality", tier === "standard" ? "low" : tier === "2k" ? "medium" : "high");
            return;
        }
        onConfigChange("imageTier", tier);
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
                {showSize || panorama ? (
                    <>
                        {tierOptions.length >= 1 ? (
                            <CanvasSection title="选择分辨率">
                                <div className="flex min-h-[44px] w-full items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                                    {tierOptions.map((item) => {
                                        const active = (panorama ? panoramaTier : effectiveTier) === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                className="flex-1 rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                                style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={() => changeTier(item.value as "standard" | "2k" | "4k")}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CanvasSection>
                        ) : null}
                        {showSize ? (
                            <CanvasSection title="选择比例">
                                <div className="grid grid-cols-4 gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                                    {visibleAspects.map((item) => {
                                        const isSmart = item.value === "auto";
                                        const active = selectedAspect?.value === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md py-1 text-[9px] leading-3 transition hover:opacity-80"
                                                style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={() => selectAspect(item.value)}
                                            >
                                                <span className="flex h-5 items-center justify-center">
                                                    <RatioIcon isSmart={isSmart} label={item.label} color={theme.node.text} />
                                                </span>
                                                <span>{isSmart ? "智能" : item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CanvasSection>
                        ) : null}
                    </>
                ) : null}
                {showCount ? (
                    <CanvasSection title="生成数量">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <span className="text-[10.8px] tabular-nums" style={{ color: theme.node.text }}>{count} 张</span>
                        </div>
                        <div onMouseDown={(event) => event.stopPropagation()}>
                            <Slider min={1} max={maxCount} value={count} onChange={(value) => onConfigChange("count", String(value))} tooltip={{ formatter: (value) => `${value} 张`, color: theme.node.text }} />
                        </div>
                    </CanvasSection>
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

// 全景 quality（low/medium/high，含 1k/2k/4k 别名，auto 折算 medium）对应的分辨率档位。
export function panoramaTierOfQuality(quality: string | undefined): "standard" | "2k" | "4k" {
    const value = (quality || "").trim().toLowerCase();
    if (value === "low" || value === "1k" || value === "standard") return "standard";
    if (value === "high" || value === "4k") return "4k";
    return "2k";
}

export function imageQualityTierLabel(quality: string | undefined) {
    return resolutionTierOptions.find((item) => item.value === panoramaTierOfQuality(quality))?.label || "2K";
}

export function imageSizeLabel(size: string) {
    if (size === "auto") return "智能比例";
    return aspectOptions.find((item) => item.value === size)?.label || size;
}

// 档位标签：直接读 imageTier（standard/2k/4k）。
export function imageResolutionTierLabel(tier: string | undefined) {
    return resolutionTierOptions.find((item) => item.value === (tier || "standard"))?.label || "标准";
}

export function imageFormatLabel(format: string) {
    const map: Record<string, string> = { png: "PNG", jpeg: "JPEG", webp: "WebP" };
    return map[format] || format;
}
