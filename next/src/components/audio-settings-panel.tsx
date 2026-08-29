"use client";

import { ImageSettingsTheme } from "@/components/image-settings-panel";
import { CanvasSection } from "@/components/video-settings-panel";
import { audioFormatOptions, audioSpeedLabel, audioVoiceOptions, normalizeAudioFormatValue, normalizeAudioSpeedValue, normalizeAudioVoiceValue } from "@/lib/audio-generation";
import { type CanvasTheme } from "@/lib/canvas-theme";
import type { AiConfig } from "@/stores/use-config-store";

const speedOptions = ["0.75", "1", "1.25", "1.5"];

type AudioSettingKey = "audioVoice" | "audioFormat" | "audioSpeed" | "audioInstructions";

type AudioSettingsPanelProps = {
    config: AiConfig;
    onConfigChange: (key: AudioSettingKey, value: string) => void;
    theme: CanvasTheme;
    showTitle?: boolean;
    className?: string;
};

export function AudioSettingsPanel({ config, onConfigChange, theme, showTitle = true, className = "w-[320px] space-y-4 rounded-2xl px-1 py-0.5" }: AudioSettingsPanelProps) {
    const voice = normalizeAudioVoiceValue(config.audioVoice);
    const format = normalizeAudioFormatValue(config.audioFormat);
    const speed = normalizeAudioSpeedValue(config.audioSpeed);

    return (
        <ImageSettingsTheme theme={theme}>
            <div className={className} style={{ color: theme.node.text }} onMouseDown={(event) => event.stopPropagation()}>
                {showTitle ? <div className="text-lg font-semibold">音频设置</div> : null}
                <CanvasSection title="声音" theme={theme}>
                    <div className="grid grid-cols-4 gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                        {audioVoiceOptions.map((item) => {
                            const active = voice === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="min-h-[36px] cursor-pointer rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                    style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => onConfigChange("audioVoice", item.value)}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </CanvasSection>
                <CanvasSection title="格式" theme={theme}>
                    <div className="grid grid-cols-3 gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                        {audioFormatOptions.map((item) => {
                            const active = format === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="min-h-[36px] cursor-pointer rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                    style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => onConfigChange("audioFormat", item.value)}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </CanvasSection>
                <CanvasSection title="语速" theme={theme}>
                    <div className="flex min-h-[44px] w-full items-stretch gap-0.5 rounded-lg p-1" style={{ background: theme.node.subtleFill }}>
                        {speedOptions.map((value) => {
                            const active = speed === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    className="flex-1 rounded-md py-1 text-center text-[10.8px] transition hover:opacity-80"
                                    style={{ background: active ? theme.node.panel : "transparent", color: theme.node.text, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => onConfigChange("audioSpeed", value)}
                                >
                                    {audioSpeedLabel(value)}
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="number"
                        min={0.25}
                        max={4}
                        step={0.05}
                        className="mt-1.5 h-9 w-full rounded-full border bg-transparent px-3 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        style={{ borderColor: theme.node.stroke, color: theme.node.text, WebkitTextFillColor: theme.node.text }}
                        value={config.audioSpeed || "1"}
                        onChange={(event) => onConfigChange("audioSpeed", event.target.value)}
                        onBlur={(event) => onConfigChange("audioSpeed", normalizeAudioSpeedValue(event.target.value))}
                        onMouseDown={(event) => event.stopPropagation()}
                    />
                </CanvasSection>
                <CanvasSection title="声音指令" theme={theme}>
                    <textarea
                        value={config.audioInstructions || ""}
                        placeholder="例如：自然、温暖、适合旁白。"
                        className="thin-scrollbar h-20 w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-sm leading-5 outline-none"
                        style={{ borderColor: theme.node.stroke, color: theme.node.text }}
                        onChange={(event) => onConfigChange("audioInstructions", event.target.value)}
                        onMouseDown={(event) => event.stopPropagation()}
                    />
                </CanvasSection>
            </div>
        </ImageSettingsTheme>
    );
}
