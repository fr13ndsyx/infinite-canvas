"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Film, Sparkles } from "lucide-react";
import { Input, Slider, Switch } from "antd";

import { ImageSettingsTheme } from "@/components/image-settings-panel";
import { boolConfig, normalizeSeedanceRatio, seedanceRatioOptions } from "@/lib/seedance-video";
import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AdminModelCapability } from "@/services/api/admin";
import { resolveAudioRequiresMode, resolveSupportsAudioGeneration, resolveSupportsNegativePrompt, resolveSupportsWatermark, resolveVideoModes, resolveVideoRatios, resolveVideoSecondsRange, type AiConfig } from "@/stores/use-config-store";

const resolutionOptions = [
    { value: "480", label: "480p" },
    { value: "720", label: "720p" },
    { value: "1080", label: "1080p" },
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
    onConfigChange: (key: "vquality" | "size" | "videoSeconds" | "videoMode" | "videoNegativePrompt" | "videoGenerateAudio" | "videoWatermark", value: string) => void;
    theme: CanvasTheme;
    capabilities?: AdminModelCapability;
    showTitle?: boolean;
    className?: string;
    hideNegativePrompt?: boolean;
    visualOnly?: boolean;
    variant?: "default" | "canvas";
};

// 通用视频设置面板：所有功能由 ModelCapability 能力开关驱动渲染，不再按面板类型分流。
export function VideoSettingsPanel({ config, modelName, onConfigChange, theme, capabilities, showTitle = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5", hideNegativePrompt = false, visualOnly = false, variant = "default" }: VideoSettingsPanelProps) {
    const size = normalizeVideoSizeValue(config.size);
    const resolution = normalizeVideoResolutionValue(config.vquality);
    const secondsRange = resolveVideoSecondsRange(capabilities);
    const secondsValue = Math.max(secondsRange.min, Math.min(secondsRange.max, Math.floor(Number(config.videoSeconds) || secondsRange.min)));

    // 分辨率：capabilities 未传=默认 480p/720p/1080p + 自定义输入；传了空数组=仅自定义输入；有值=按配置
    const capResolutions = capabilities?.videoResolutions;
    const resolutionOptionsForRender = !capabilities
        ? resolutionOptions
        : (capResolutions || []).map((r) => ({ value: r.replace(/p$/, ""), label: r }));
    const showCustomResolutionInput = !capabilities || resolutionOptionsForRender.length === 0;

    // 模式：videoModes 有值时显示
    const modes = resolveVideoModes(capabilities);
    const currentMode = modes.length > 0 ? (modes.some((m) => m.value === config.videoMode) ? config.videoMode : modes[0].value) : "";

    // 比例：videoRatios 有值时按配置，空=默认 sizeOptions
    const ratios = resolveVideoRatios(capabilities);
    const ratioButtons = ratios.length > 0
        ? ratios.map((r) => {
            const preview = ratioPreview(r);
            const label = seedanceRatioOptions.find((item) => item.value === r)?.label || r;
            return { value: r, label, width: preview.width, height: preview.height, ratio: true };
        })
        : sizeOptions.map((item) => ({ ...item, ratio: false }));
    const selectedSize = ratios.length > 0
        ? (ratios.includes(normalizeSeedanceRatio(config.size)) ? normalizeSeedanceRatio(config.size) : (ratios[0] || ""))
        : size;

    // 能力开关
    const showNegativePrompt = !hideNegativePrompt && !visualOnly && resolveSupportsNegativePrompt(capabilities) === true;
    const audioGenerationEnabled = resolveSupportsAudioGeneration(capabilities) === true;
    const watermarkEnabled = resolveSupportsWatermark(capabilities) === true;
    const generateAudio = boolConfig(config.videoGenerateAudio, false);
    const watermark = boolConfig(config.videoWatermark, false);
    const audioRequiresMode = resolveAudioRequiresMode(capabilities);
    const audioHint = audioRequiresMode ? `仅 ${audioRequiresMode} 模式可用` : undefined;

    if (variant === "canvas") {
        return (
            <ImageSettingsTheme theme={theme}>
                <div className={className} style={{ color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()}>
                    {showTitle ? <div className="text-lg font-semibold">视频设置</div> : null}
                    {showNegativePrompt ? (
                        <CanvasSection title="负面提示词">
                            <Input.TextArea
                                value={config.videoNegativePrompt || ""}
                                placeholder="描述不希望出现在视频中的内容"
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                className="rounded-xl placeholder:!text-[var(--canvas-placeholder)] placeholder:!opacity-55"
                                style={{ background: theme.node.fill, borderColor: theme.node.stroke, color: theme.node.text, WebkitTextFillColor: theme.node.text, "--canvas-placeholder": theme.node.placeholder } as CSSProperties}
                                onMouseDown={(event) => event.stopPropagation()}
                                onChange={(event) => onConfigChange("videoNegativePrompt", event.target.value)}
                            />
                        </CanvasSection>
                    ) : null}
                    {!visualOnly && modes.length > 0 ? (
                        <CanvasSection title="视频生成方式">
                            <div className="flex gap-1.5">
                                {modes.map((item) => (
                                    <SegmentedPill key={item.value} selected={currentMode === item.value} theme={theme} icon={modeIcon(item.value)} onClick={() => onConfigChange("videoMode", item.value)}>
                                        {item.label}
                                    </SegmentedPill>
                                ))}
                            </div>
                        </CanvasSection>
                    ) : null}
                    <CanvasSection title="选择比例">
                        <div className="flex flex-wrap gap-1.5">
                            {ratioButtons.map((item) => {
                                const isSmart = item.value === "auto" || item.value === "adaptive";
                                return (
                                    <RatioChip key={item.value} selected={selectedSize === item.value} theme={theme} width={item.width} height={item.height} isSmart={isSmart} onClick={() => onConfigChange("size", item.value)}>
                                        {isSmart ? "智能" : item.label}
                                    </RatioChip>
                                );
                            })}
                        </div>
                    </CanvasSection>
                    <CanvasSection title="选择分辨率">
                        <div className="flex flex-wrap gap-1.5">
                            {resolutionOptionsForRender.map((item) => (
                                <TextChip key={item.value} selected={resolution === item.value} theme={theme} onClick={() => onConfigChange("vquality", item.value)}>
                                    {item.label}
                                </TextChip>
                            ))}
                            {showCustomResolutionInput ? <ResolutionInput value={resolution} theme={theme} onChange={(value) => onConfigChange("vquality", value)} /> : null}
                        </div>
                    </CanvasSection>
                    {!visualOnly ? (
                        <>
                            <CanvasSection title="生成时长">
                                <SecondsSlider value={secondsValue} min={secondsRange.min} max={secondsRange.max} theme={theme} onChange={(value) => onConfigChange("videoSeconds", String(value))} />
                            </CanvasSection>
                            {audioGenerationEnabled ? (
                                <CanvasSection title="生成音频">
                                    <div className="flex gap-1.5">
                                        <SegmentedPill selected={!generateAudio} theme={theme} onClick={() => onConfigChange("videoGenerateAudio", "false")}>关闭</SegmentedPill>
                                        <SegmentedPill selected={generateAudio} theme={theme} onClick={() => onConfigChange("videoGenerateAudio", "true")}>开启</SegmentedPill>
                                    </div>
                                    {audioHint ? <div className="mt-1 text-[11px] leading-4 opacity-55">{audioHint}</div> : null}
                                </CanvasSection>
                            ) : null}
                            {watermarkEnabled ? (
                                <CanvasSection title="输出">
                                    <div className="rounded-xl border p-2.5" style={{ borderColor: theme.node.stroke }}>
                                        <SwitchRow label="添加水印" checked={watermark} theme={theme} onChange={(checked) => onConfigChange("videoWatermark", String(checked))} />
                                    </div>
                                </CanvasSection>
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
                {showNegativePrompt ? (
                    <SettingGroup title="负面提示词" color={theme.node.muted}>
                        <Input.TextArea
                            value={config.videoNegativePrompt || ""}
                            placeholder="描述不希望出现在视频中的内容"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            className="rounded-xl placeholder:!text-[var(--canvas-placeholder)] placeholder:!opacity-55"
                            style={{ background: theme.node.fill, borderColor: theme.node.stroke, color: theme.node.text, WebkitTextFillColor: theme.node.text, "--canvas-placeholder": theme.node.placeholder } as CSSProperties}
                            onMouseDown={(event) => event.stopPropagation()}
                            onChange={(event) => onConfigChange("videoNegativePrompt", event.target.value)}
                        />
                    </SettingGroup>
                ) : null}
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
                                <SizePreview width={item.width} height={item.height} color={theme.node.text} />
                                <span>{item.value === "auto" || item.value === "adaptive" ? item.value : item.label}</span>
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
    return `${normalizeVideoResolutionValue(value)}p`;
}

export function videoSizeRatioLabel(value: string) {
    if (value === "adaptive" || value === "auto") return "自适应";
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

function SecondsSlider({ value, min, max, theme, onChange }: { value: number; min: number; max: number; theme: CanvasTheme; onChange: (value: number) => void }) {
    return (
        <div className="flex items-center gap-3 px-1 py-1" style={{ color: theme.node.text }}>
            <Slider className="!flex-1 !m-0" min={min} max={max} step={1} value={value} onChange={onChange} tooltip={{ open: false }} />
            <span className="min-w-[2.5rem] text-sm font-medium" style={{ color: theme.node.text }}>{value}s</span>
        </div>
    );
}

function SizePreview({ width, height, color }: { width: number; height: number; color: string }) {
    if (!width || !height) return null;
    const longSide = Math.max(width, height);
    const previewWidth = Math.max(6, Math.round((width / longSide) * 18));
    const previewHeight = Math.max(6, Math.round((height / longSide) * 18));
    return <span className="rounded-[3px] border-[1.5px]" style={{ width: previewWidth, height: previewHeight, borderColor: color }} />;
}

function SmartRatioIcon({ color }: { color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <rect x="4" y="4" width="10" height="10" rx="2" stroke={color} strokeWidth="1.5" />
            <path d="M2 5V3C2 2.44772 2.44772 2 3 2H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 5V3C16 2.44772 15.5523 2 15 2H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 13V15C2 15.5523 2.44772 16 3 16H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 13V15C16 15.5523 15.5523 16 15 16H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
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

function CanvasSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="text-[11px] font-medium opacity-55">{title}</div>
            {children}
        </div>
    );
}

function SegmentedPill({ selected, theme, icon, onClick, children }: { selected: boolean; theme: CanvasTheme; icon?: ReactNode; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-[13px] transition hover:opacity-80"
            style={{ background: selected ? theme.toolbar.activeBg : "transparent", borderColor: selected ? theme.toolbar.activeBg : theme.node.stroke, color: selected ? theme.toolbar.activeText : theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {icon ? <span className="shrink-0">{icon}</span> : null}
            <span className="truncate">{children}</span>
        </button>
    );
}

function RatioChip({ selected, theme, width, height, isSmart, onClick, children }: { selected: boolean; theme: CanvasTheme; width: number; height: number; isSmart?: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex min-w-[40px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] leading-3 transition hover:opacity-80"
            style={{ background: selected ? theme.toolbar.activeBg : "transparent", color: selected ? theme.toolbar.activeText : theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {isSmart ? <SmartRatioIcon color={selected ? theme.toolbar.activeText : theme.node.text} /> : <SizePreview width={width} height={height} color={selected ? theme.toolbar.activeText : theme.node.text} />}
            <span className="truncate">{children}</span>
        </button>
    );
}

function TextChip({ selected, theme, onClick, children }: { selected: boolean; theme: CanvasTheme; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            className="cursor-pointer rounded-[10px] border px-3 py-1.5 text-xs transition hover:opacity-80"
            style={{ background: selected ? theme.toolbar.activeBg : "transparent", borderColor: selected ? theme.toolbar.activeBg : theme.node.stroke, color: selected ? theme.toolbar.activeText : theme.node.text }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function modeIcon(value: string) {
    if (/frame|first|last/i.test(value)) return <Film className="size-3.5" />;
    return <Sparkles className="size-3.5" />;
}
