"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Input, Slider, Switch } from "antd";

import { ImageSettingsTheme } from "@/components/image-settings-panel";
import { boolConfig, normalizeSeedanceRatio, seedanceRatioOptions } from "@/lib/seedance-video";
import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AdminModelCapability } from "@/services/api/admin";
import { resolveAudioRequiresMode, resolveSupportsAudioGeneration, resolveSupportsWatermark, resolveVideoModes, resolveVideoRatios, resolveVideoSecondsRange, type AiConfig } from "@/stores/use-config-store";

// 画布弹窗「生成时长」滑块宽度；「生成音频」开关按同宽度区域居中对齐到滑块正下方
const CANVAS_SLIDER_WIDTH = 200;

const resolutionOptions = [
    { value: "480", label: "480P" },
    { value: "720", label: "720P" },
    { value: "1080", label: "1080P" },
];

const sizeOptions = [
    { value: "1280x720", label: "16:9", width: 1280, height: 720 },
    { value: "720x1280", label: "9:16", width: 720, height: 1280 },
    { value: "1024x1024", label: "1:1", width: 1024, height: 1024 },
    { value: "1792x1024", label: "16:9", width: 1792, height: 1024 },
    { value: "1024x1792", label: "9:16", width: 1024, height: 1792 },
    { value: "auto", label: "auto", width: 0, height: 0 },
];

type VideoSettingsPanelProps = {
    config: AiConfig;
    modelName?: string;
    onConfigChange: (key: "vquality" | "size" | "videoSeconds" | "videoMode" | "videoGenerateAudio" | "videoWatermark", value: string) => void;
    theme: CanvasTheme;
    capabilities?: AdminModelCapability;
    showTitle?: boolean;
    className?: string;
    visualOnly?: boolean;
    variant?: "default" | "canvas";
    hideRatioResolution?: boolean;
    sizeOnly?: boolean;
};

// 通用视频设置面板：所有功能由 ModelCapability 能力开关驱动渲染，不再按面板类型分流。
export function VideoSettingsPanel({ config, modelName, onConfigChange, theme, capabilities, showTitle = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5", visualOnly = false, variant = "default", hideRatioResolution = false, sizeOnly = false }: VideoSettingsPanelProps) {
    const size = normalizeVideoSizeValue(config.size);
    const resolution = normalizeVideoResolutionValue(config.vquality);
    const secondsRange = resolveVideoSecondsRange(capabilities);
    const secondsValue = Math.max(secondsRange.min, Math.min(secondsRange.max, Math.floor(Number(config.videoSeconds) || secondsRange.min)));

    // 分辨率：capabilities 未传=默认 480p/720p/1080p（不显示自定义输入）；传了空数组=仅自定义输入；有值=按配置
    const capResolutions = capabilities?.videoResolutions;
    const resolutionOptionsForRender = !capabilities
        ? resolutionOptions
        : (capResolutions || []).map((r) => ({ value: r.replace(/p$/i, ""), label: /p$/i.test(r) ? r.replace(/p$/i, "P") : r }));
    const showCustomResolutionInput = !!capabilities && resolutionOptionsForRender.length === 0;

    // 模式：videoModes 有值时显示
    const modes = resolveVideoModes(capabilities);
    const currentMode = modes.length > 0 ? (modes.some((m) => m.value === config.videoMode) ? config.videoMode : modes[0].value) : "";

    // 比例：videoRatios 有值时按配置，空=默认 sizeOptions（按 label 去重，避免 16:9/9:16 重复；始终保留智能项）
    const ratios = resolveVideoRatios(capabilities);
    const ratioButtonsRaw = ratios.length > 0
        ? ratios.map((r) => {
            const preview = ratioPreview(r);
            const label = seedanceRatioOptions.find((item) => item.value === r)?.label || r;
            return { value: r, label, width: preview.width, height: preview.height, ratio: true };
        })
        : sizeOptions.map((item) => ({ ...item, ratio: false }));
    const ratioButtons = ratioButtonsRaw.filter((item, index, array) => {
        if (item.value === "auto" || item.value === "adaptive") return true;
        return array.findIndex((t) => t.label === item.label) === index;
    });
    if (!ratioButtons.some((item) => item.value === "auto" || item.value === "adaptive")) {
        ratioButtons.unshift({ value: "adaptive", label: "智能", width: 0, height: 0, ratio: true });
    }
    const selectedSize = ratios.length > 0
        ? ((config.size === "auto" || config.size === "adaptive") ? (ratioButtons.find((item) => item.value === "auto" || item.value === "adaptive")?.value || "") : (ratios.includes(normalizeSeedanceRatio(config.size)) ? normalizeSeedanceRatio(config.size) : (ratios[0] || "")))
        : size;

    // 能力开关
    const audioGenerationEnabled = resolveSupportsAudioGeneration(capabilities) === true;
    const watermarkEnabled = resolveSupportsWatermark(capabilities) === true;
    const generateAudio = boolConfig(config.videoGenerateAudio, false);
    const watermark = boolConfig(config.videoWatermark, false);
    const audioRequiresMode = resolveAudioRequiresMode(capabilities);
    const audioHint = audioRequiresMode ? `仅 ${audioRequiresMode} 模式可用` : undefined;
    const showRatioResolution = !hideRatioResolution;
    const showOtherSections = !sizeOnly;

    if (variant === "canvas") {
        return (
            <ImageSettingsTheme theme={theme}>
                <div className={className} style={{ color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()}>
                    {showTitle && showOtherSections ? <div className="text-lg font-semibold">视频设置</div> : null}
                    {showOtherSections && !visualOnly && modes.length > 0 ? (
                        <CanvasSection title="视频生成方式" theme={theme}>
                            <div className="flex min-h-[52px] w-full items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.segmentBg }}>
                                {modes.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className="flex-1 rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                        style={{ background: currentMode === item.value ? theme.node.segmentActive : "transparent", color: theme.node.text, boxShadow: currentMode === item.value ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => onConfigChange("videoMode", item.value)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </CanvasSection>
                    ) : null}
                    {showRatioResolution ? (
                    <CanvasSection title="选择分辨率" theme={theme}>
                        <div className="flex min-h-[52px] w-full items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.segmentBg }}>
                            {resolutionOptionsForRender.map((item) => {
                                const active = resolution === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className="flex-1 rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                        style={{ background: active ? theme.node.segmentActive : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => onConfigChange("vquality", item.value)}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                            {showCustomResolutionInput ? <ResolutionInput value={resolution} theme={theme} onChange={(value) => onConfigChange("vquality", value)} /> : null}
                        </div>
                    </CanvasSection>
                    ) : null}
                    {showRatioResolution ? (
                    <CanvasSection title="选择比例" theme={theme}>
                        <div className="grid grid-cols-4 gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                            {ratioButtons.map((item) => {
                                const isSmart = item.value === "auto" || item.value === "adaptive";
                                const active = selectedSize === item.value;
                                const iconColor = theme.node.text;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md py-1 text-[9px] leading-3 transition hover:opacity-80"
                                        style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => onConfigChange("size", item.value)}
                                    >
                                        <span className="flex h-5 items-center justify-center">
                                            <RatioIcon isSmart={isSmart} label={item.label} color={iconColor} />
                                        </span>
                                        <span className="text-[9px] leading-3">{isSmart ? "智能" : item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </CanvasSection>
                    ) : null}
                    {showOtherSections && !visualOnly ? (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>生成时长</span>
                                <SecondsSlider value={secondsValue} min={secondsRange.min} max={secondsRange.max} theme={theme} onChange={(value) => onConfigChange("videoSeconds", String(value))} sliderWidth={CANVAS_SLIDER_WIDTH} />
                            </div>
                            {audioGenerationEnabled ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>生成音频</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center" style={{ width: CANVAS_SLIDER_WIDTH }}>
                                                <span onMouseDown={(event) => event.stopPropagation()}>
                                                    <Switch size="small" checked={generateAudio} onChange={(checked) => onConfigChange("videoGenerateAudio", String(checked))} />
                                                </span>
                                            </div>
                                            <span className="min-w-[2.5rem]" aria-hidden />
                                        </div>
                                    </div>
                                    {audioHint ? <div className="text-[11px] leading-4 opacity-55">{audioHint}</div> : null}
                                </div>
                            ) : null}
                            {watermarkEnabled ? (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>添加水印</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center" style={{ width: CANVAS_SLIDER_WIDTH }}>
                                            <span onMouseDown={(event) => event.stopPropagation()}>
                                                <Switch size="small" checked={watermark} onChange={(checked) => onConfigChange("videoWatermark", String(checked))} />
                                            </span>
                                        </div>
                                        <span className="min-w-[2.5rem]" aria-hidden />
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </ImageSettingsTheme>
        );
    }

    return (
        <ImageSettingsTheme theme={theme}>
            <div className={className} style={{ color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()}>
                {showTitle ? <div className="text-lg font-semibold">视频设置</div> : null}
                {!visualOnly && modes.length > 0 ? (
                    <SettingGroup title="模式选择" color={theme.node.muted}>
                        <div className={`grid gap-2.5 ${modes.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                            {modes.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-md border bg-transparent px-2 text-sm leading-4 transition hover:opacity-80"
                                    style={{ borderColor: currentMode === item.value ? theme.node.text : theme.node.stroke, color: theme.node.text }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => onConfigChange("videoMode", item.value)}
                                >
                                    <span>{item.label}</span>
                                    {item.desc ? <span className="text-[10px] opacity-55">{item.desc}</span> : null}
                                </button>
                            ))}
                        </div>
                    </SettingGroup>
                ) : null}
                <SettingGroup title="分辨率" color={theme.node.muted}>
                    <div className="grid grid-cols-3 gap-2.5">
                        {resolutionOptionsForRender.map((item) => (
                            <OptionPill key={item.value} selected={resolution === item.value} theme={theme} onClick={() => onConfigChange("vquality", item.value)}>
                                {item.label}
                            </OptionPill>
                        ))}
                        {showCustomResolutionInput ? <ResolutionInput value={resolution} theme={theme} onChange={(value) => onConfigChange("vquality", value)} /> : null}
                    </div>
                </SettingGroup>
                <SettingGroup title="比例" color={theme.node.muted}>
                    <div className="grid grid-cols-3 gap-2.5">
                        {ratioButtons.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className="flex h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border bg-transparent text-xs transition hover:opacity-80"
                                style={{ borderColor: selectedSize === item.value ? theme.node.text : theme.node.stroke, color: theme.node.text }}
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => onConfigChange("size", item.value)}
                            >
                                <RatioIcon isSmart={item.value === "auto" || item.value === "adaptive"} label={item.label} color={theme.node.text} />
                                <span>{item.value === "auto" || item.value === "adaptive" ? "智能" : item.label}</span>
                            </button>
                        ))}
                    </div>
                </SettingGroup>
                {!visualOnly ? (
                    <>
                        <SettingGroup title="秒数" color={theme.node.muted}>
                            <SecondsSlider value={secondsValue} min={secondsRange.min} max={secondsRange.max} theme={theme} onChange={(value) => onConfigChange("videoSeconds", String(value))} />
                        </SettingGroup>
                        {audioGenerationEnabled ? <AudioGenerationSetting checked={generateAudio} hint={audioHint} theme={theme} onChange={(checked) => onConfigChange("videoGenerateAudio", String(checked))} /> : null}
                        {watermarkEnabled ? (
                            <SettingGroup title="输出" color={theme.node.muted}>
                                <div className="grid gap-2 rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                                    <SwitchRow label="添加水印" checked={watermark} theme={theme} onChange={(checked) => onConfigChange("videoWatermark", String(checked))} />
                                </div>
                            </SettingGroup>
                        ) : null}
                    </>
                ) : null}
            </div>
        </ImageSettingsTheme>
    );
}

export function videoResolutionLabel(value: string) {
    const normalized = normalizeVideoResolutionValue(value);
    return /k$/i.test(normalized) ? normalized : `${normalized}P`;
}

export function videoSizeRatioLabel(value: string) {
    if (value === "adaptive" || value === "auto") return "智能";
    const ratio = normalizeSeedanceRatio(value);
    if (ratio && ratio !== value) return seedanceRatioOptions.find((item) => item.value === ratio)?.label || ratio;
    const size = normalizeVideoSizeValue(value);
    const option = sizeOptions.find((item) => item.value === size);
    return option?.label || size;
}

export function videoSecondsLabel(value: string) {
    if (String(value).trim() === "-1") return "智能";
    return `${value || "6"}s`;
}

export function normalizeVideoSizeValue(value: string) {
    if (value === "auto") return "auto";
    if (/^\d+x\d+$/.test(value || "")) return value;
    return ["9:16", "2:3", "3:4"].includes(value) ? "720x1280" : "1280x720";
}

export function normalizeVideoResolutionValue(value: string) {
    if (value === "480p" || value === "low") return "480";
    if (value === "720p" || value === "auto" || value === "high" || value === "medium") return "720";
    return value.replace(/p$/i, "") || "720";
}

function OptionPill({ selected, disabled = false, theme, onClick, children }: { selected: boolean; disabled?: boolean; theme: CanvasTheme; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" disabled={disabled} className="h-8 cursor-pointer rounded-md border px-2 text-xs transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35" style={{ background: "transparent", borderColor: selected ? theme.node.text : theme.node.stroke, color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()} onClick={onClick}>
            {children}
        </button>
    );
}

function SettingGroup({ title, color, children }: { title: string; color: string; children: ReactNode }) {
    return (
        <div className="space-y-2.5">
            <div className="text-xs font-medium" style={{ color }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function ResolutionInput({ value, theme, onChange }: { value: string; theme: CanvasTheme; onChange: (value: string) => void }) {
    return (
        <label className="flex h-8 overflow-hidden rounded-md border text-xs" style={{ borderColor: theme.node.stroke, color: theme.node.text }}>
            <input type="number" min={1} className="min-w-0 flex-1 bg-transparent px-3 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={value} onChange={(event) => onChange(event.target.value)} onMouseDown={(event) => event.stopPropagation()} />
            <span className="grid w-7 place-items-center pr-1" style={{ color: theme.node.muted }}>
                p
            </span>
        </label>
    );
}

function SecondsSlider({ value, min, max, theme, onChange, sliderWidth }: { value: number; min: number; max: number; theme: CanvasTheme; onChange: (value: number) => void; sliderWidth?: number }) {
    return (
        <div className="flex items-center gap-3 px-1 py-1" style={{ color: theme.node.text }}>
            <Slider className={sliderWidth ? "!m-0" : "!flex-1 !m-0"} style={sliderWidth ? { width: sliderWidth } : undefined} min={min} max={max} step={1} value={value} onChange={onChange} tooltip={{ open: false }} />
            <span className="min-w-[2.5rem] text-sm font-medium" style={{ color: theme.node.text }}>{value}s</span>
        </div>
    );
}

export function RatioIcon({ isSmart, label, color }: { isSmart: boolean; label: string; color: string }) {
    const iconName = isSmart ? "auto" : (label || "").replace(":", "-");
    const svgUrl = `/ratios/${iconName}.svg`;
    return (
        <span
            className="shrink-0"
            style={{
                display: "inline-block",
                width: 18,
                height: 18,
                backgroundColor: color,
                mask: `url(${svgUrl}) no-repeat center / contain`,
                WebkitMask: `url(${svgUrl}) no-repeat center / contain`,
            }}
        />
    );
}

function ratioPreview(ratio: string) {
    if (ratio === "9:16") return { width: 9, height: 16 };
    if (ratio === "1:1") return { width: 1, height: 1 };
    if (ratio === "4:3") return { width: 4, height: 3 };
    if (ratio === "3:4") return { width: 3, height: 4 };
    if (ratio === "21:9") return { width: 21, height: 9 };
    if (ratio === "adaptive") return { width: 0, height: 0 };
    return { width: 16, height: 9 };
}

function SwitchRow({ label, checked, theme, onChange }: { label: string; checked: boolean; theme: CanvasTheme; onChange: (checked: boolean) => void }) {
    return (
        <div className="flex h-8 items-center justify-between gap-3">
            <span className="text-sm" style={{ color: theme.node.text }}>
                {label}
            </span>
            <span onMouseDown={(event) => event.stopPropagation()}>
                <Switch size="small" checked={checked} onChange={onChange} />
            </span>
        </div>
    );
}

function AudioGenerationSetting({ checked, hint, theme, onChange }: { checked: boolean; hint?: string; theme: CanvasTheme; onChange: (checked: boolean) => void }) {
    return (
        <SettingGroup title="音频生成" color={theme.node.muted}>
            <div className="grid gap-2 rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                <SwitchRow label="是否生成与视频同步的AI音频" checked={checked} theme={theme} onChange={onChange} />
                {hint ? <div className="text-[11px] leading-4 opacity-55">{hint}</div> : null}
            </div>
        </SettingGroup>
    );
}

export function CanvasSection({ title, theme, children }: { title: string; theme: CanvasTheme; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="text-[10.8px] font-medium" style={{ color: theme.node.titleText }}>{title}</div>
            {children}
        </div>
    );
}

function RatioChip({ selected, theme, width, height, isSmart, onClick, children }: { selected: boolean; theme: CanvasTheme; width: number; height: number; isSmart?: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex min-w-[40px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] leading-3 transition hover:opacity-80"
            style={{ background: selected ? theme.toolbar.activeBg : "transparent", color: theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {isSmart ? <RatioIcon isSmart label={typeof children === "string" ? children : ""} color={theme.node.text} /> : <RatioIcon isSmart={false} label={typeof children === "string" ? children : ""} color={theme.node.text} />}
            <span className="truncate">{children}</span>
        </button>
    );
}

function TextChip({ selected, theme, onClick, children }: { selected: boolean; theme: CanvasTheme; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="cursor-pointer rounded-[10px] px-3 py-1.5 text-xs transition hover:opacity-80"
            style={{ background: selected ? theme.toolbar.activeBg : "transparent", color: theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
