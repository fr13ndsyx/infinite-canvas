"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { Button } from "antd";

import { ModelPicker } from "@/components/model-picker";
import { defaultConfig, findModelCapability, resolveSupportsFirstFrame, resolveSupportsLastFrame, useConfigStore, useEffectiveConfig, type AiConfig } from "@/stores/use-config-store";
import { CreditSymbol, requestCreditCost } from "@/constant/credits";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { CanvasImageSettingsPopover } from "./canvas-image-settings-popover";
import { CanvasCameraControl } from "./canvas-camera-control";
import { CanvasPromptLibrary } from "./canvas-prompt-library";
import { CanvasNodeSkills } from "./canvas-node-skills";
import { CanvasAudioSettingsPopover, type CanvasAudioSettingKey } from "./canvas-audio-settings-popover";
import { CanvasPromptChipInput } from "./canvas-prompt-chip-input";
import { CanvasNodeImageUpload, type CanvasFrameSlot, type CanvasNodeStackItem } from "./canvas-node-image-upload";
import { CanvasVideoSettingsPopover, type CanvasVideoFrameOption } from "./canvas-video-settings-popover";
import { CanvasVideoSizePopover } from "./canvas-video-size-popover";
import { CanvasNodeType, type CanvasGenerationMode, type CanvasNodeData } from "../types";
import { PANORAMA_IMAGE_SIZE, isCanvasImageNodeType, isPanoramaNodeType } from "../utils/canvas-panorama";
import type { CanvasResourceReference } from "../utils/canvas-resource-references";
import type { Skill } from "@/services/api/skills";

export type { CanvasVideoFrameOption };

export type CanvasNodeGenerationMode = CanvasGenerationMode;

type CanvasNodePromptPanelProps = {
    node: CanvasNodeData;
    isRunning: boolean;
    onPromptChange: (nodeId: string, prompt: string) => void;
    onConfigChange: (nodeId: string, patch: Partial<CanvasNodeData["metadata"]>) => void;
    onGenerate: (nodeId: string, mode: CanvasNodeGenerationMode, prompt: string) => void;
    mentionReferences?: CanvasResourceReference[];
    videoFrameOptions?: CanvasVideoFrameOption[];
    stackItems?: CanvasNodeStackItem[];
    onUploadImage?: (file: File) => void;
    onUploadFrame?: (slot: CanvasFrameSlot, file: File) => void;
    onRemoveFrame?: (slot: CanvasFrameSlot) => void;
    onSwapFrames?: () => void;
    onUseSameFrame?: () => void;
    onRemoveItem?: (item: CanvasNodeStackItem) => void;
    onImageSettingsOpenChange?: (open: boolean) => void;
};

export function CanvasNodePromptPanel({ node, isRunning, onPromptChange, onConfigChange, onGenerate, mentionReferences = [], videoFrameOptions = [], stackItems = [], onUploadImage, onUploadFrame, onRemoveFrame, onSwapFrames, onUseSameFrame, onRemoveItem, onImageSettingsOpenChange }: CanvasNodePromptPanelProps) {
    const globalConfig = useEffectiveConfig();
    const modelCosts = useConfigStore((state) => state.publicSettings?.modelChannel.modelCosts);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const mode = defaultMode(node.type);
    const config = buildNodeConfig(globalConfig, node, mode);
    const videoCapability = mode === "video" ? findModelCapability(config, config.model || config.videoModel) : undefined;
    const supportsFirstFrame = resolveSupportsFirstFrame(videoCapability) === true;
    const supportsLastFrame = resolveSupportsLastFrame(videoCapability) === true;
    const frameMode = mode === "video" && node.metadata?.klingActiveTab === "frames" && (supportsFirstFrame || supportsLastFrame);
    const connectedFrameCount = new Set(videoFrameOptions.map((option) => option.nodeId)).size;
    const firstFrame = stackItems.find((item) => item.nodeId === node.metadata?.firstFrameNodeId && item.kind === "image");
    const lastFrame = stackItems.find((item) => item.nodeId === node.metadata?.lastFrameNodeId && item.kind === "image");
    const isPanorama = isPanoramaNodeType(node.type);
    const hasUpload = mode !== "audio" && Boolean(onUploadImage);
    const uploadInset = frameMode ? (supportsFirstFrame && supportsLastFrame ? 164 : 84) : hasUpload ? 80 : 0;
    const hasTextContent = node.type === CanvasNodeType.Text && Boolean(node.metadata?.content?.trim());
    const hasImageContent = isCanvasImageNodeType(node.type) && Boolean(node.metadata?.content);
    // 全景图回显源提示词；文本节点回显节点提示词；图片/视频/音频节点只回显 inputPrompt（用户输入原词），
    // 不回显 metadata.prompt（含上游文本拼接的生成记录，回显会导致再次生成时上游内容重复）
    const sourcePrompt = isPanorama ? node.metadata?.panoramaSourcePrompt || "" : node.type === CanvasNodeType.Text ? node.metadata?.prompt || "" : node.metadata?.inputPrompt || "";
    const persistedSkill = node.metadata?.skillId && node.metadata.skillName && node.metadata.skillPrompt ? { id: node.metadata.skillId, name: node.metadata.skillName, prompt: node.metadata.skillPrompt } : null;
    const visibleSourcePrompt = stripSkillPrompt(sourcePrompt, persistedSkill?.prompt);
    const [prompt, setPrompt] = useState(visibleSourcePrompt);
    const [selectedSkill, setSelectedSkill] = useState<Pick<Skill, "id" | "name" | "prompt"> | null>(persistedSkill);
    const credits = requestCreditCost({ channelMode: config.channelMode, modelCosts, model: config.model, count: 1 });

    useEffect(() => {
        setPrompt(visibleSourcePrompt);
        setSelectedSkill(persistedSkill);
    }, [node.id, persistedSkill?.id, persistedSkill?.name, persistedSkill?.prompt, visibleSourcePrompt]);

    const frameSyncRef = useRef<{ nodeId: string; active: boolean; initialized: boolean; connectedImageIds: string[] }>({ nodeId: "", active: false, initialized: false, connectedImageIds: [] });

    useEffect(() => {
        const connectedImageIds = [...new Set(videoFrameOptions.map((option) => option.nodeId).filter(Boolean))];
        const previous = frameSyncRef.current;
        const sameNode = previous.nodeId === node.id;
        const initializeFrameMode = frameMode && (!sameNode || !previous.initialized);
        const addedImageIds = initializeFrameMode ? connectedImageIds : connectedImageIds.filter((id) => !previous.connectedImageIds.includes(id));
        frameSyncRef.current = { nodeId: node.id, active: frameMode, initialized: sameNode ? previous.initialized || frameMode : frameMode, connectedImageIds };
        if (!frameMode || !connectedImageIds.length) return;

        let firstFrameNodeId = node.metadata?.firstFrameNodeId;
        let lastFrameNodeId = node.metadata?.lastFrameNodeId;
        const patch: Partial<CanvasNodeData["metadata"]> = {};
        if (firstFrameNodeId && !connectedImageIds.includes(firstFrameNodeId)) {
            firstFrameNodeId = undefined;
            patch.firstFrameNodeId = undefined;
        }
        if (lastFrameNodeId && !connectedImageIds.includes(lastFrameNodeId)) {
            lastFrameNodeId = undefined;
            patch.lastFrameNodeId = undefined;
        }

        if (initializeFrameMode || (frameMode && addedImageIds.length)) {
            if (!firstFrameNodeId) {
                const nextFirst = (addedImageIds.length ? addedImageIds : connectedImageIds).find((id) => id !== lastFrameNodeId) || connectedImageIds[0];
                if (nextFirst) {
                    firstFrameNodeId = nextFirst;
                    patch.firstFrameNodeId = nextFirst;
                }
            }
            if (supportsLastFrame && (!lastFrameNodeId || lastFrameNodeId === firstFrameNodeId)) {
                const nextLast = addedImageIds.find((id) => id !== firstFrameNodeId) || connectedImageIds.find((id) => id !== firstFrameNodeId);
                if (nextLast) {
                    lastFrameNodeId = nextLast;
                    patch.lastFrameNodeId = nextLast;
                }
            }
        }

        if (Object.keys(patch).length) onConfigChange(node.id, { ...patch, klingActiveTab: "frames" });
    }, [frameMode, node.id, node.metadata?.firstFrameNodeId, node.metadata?.lastFrameNodeId, onConfigChange, supportsLastFrame, videoFrameOptions]);

    const updatePrompt = (value: string) => {
        setPrompt(value);
        onPromptChange(node.id, composeSkillPrompt(value, selectedSkill));
    };

    const selectSkill = (skill: Skill) => {
        const nextSkill = { id: skill.id, name: skill.name, prompt: skill.prompt };
        setSelectedSkill(nextSkill);
        onConfigChange(node.id, { skillId: skill.id, skillName: skill.name, skillPrompt: skill.prompt });
        onPromptChange(node.id, composeSkillPrompt(prompt, nextSkill));
    };

    const removeSkill = () => {
        setSelectedSkill(null);
        onConfigChange(node.id, { skillId: undefined, skillName: undefined, skillPrompt: undefined });
        onPromptChange(node.id, prompt);
    };

    // 连接了带内容的文本节点时（生成时会自动拼为上游提示词），允许不输入文字直接生成
    const hasUpstreamText = mode !== "text" && !node.metadata?.excludeUpstreamText && mentionReferences.some((reference) => reference.kind === "text" && reference.nodeId !== node.id && Boolean(reference.text?.trim()));
    const canSubmit = Boolean(prompt.trim()) || Boolean(selectedSkill) || hasUpstreamText || (isPanorama && (hasImageContent || mentionReferences.length > 0));

    const submit = () => {
        const text = composeSkillPrompt(prompt, selectedSkill).trim();
        if (!canSubmit || isRunning) return;
        onGenerate(node.id, mode, text);
        // 保留输入内容便于查看与失败后修改（图片/视频/音频节点不再回显 metadata.prompt）
        if (isPanorama) setPrompt("");
    };

    return (
        <div
            data-canvas-no-zoom
            className="relative rounded-2xl border p-3 shadow-2xl backdrop-blur"
            style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text, transform: "scale(var(--canvas-inverse-scale, 1))", transformOrigin: "top center" }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
        >
            {hasUpload ? frameMode ? <CanvasNodeImageUpload items={[]} variant="video-frames" firstFrame={firstFrame} lastFrame={lastFrame} showFirstFrame={supportsFirstFrame} showLastFrame={supportsLastFrame} onUploadFrame={onUploadFrame} onRemoveFrame={onRemoveFrame} onSwapFrames={onSwapFrames} onUseSameFrame={onUseSameFrame} connectedFrameCount={connectedFrameCount} /> : <CanvasNodeImageUpload items={stackItems} onUpload={onUploadImage!} onRemove={onRemoveItem} /> : null}
            <CanvasPromptChipInput
                value={prompt}
                references={mentionReferences}
                skill={selectedSkill}
                onRemoveSkill={removeSkill}
                onChange={updatePrompt}
                onSubmit={submit}
                className="thin-scrollbar h-40 w-full resize-none rounded-xl px-3 py-2 text-sm leading-5 outline-none"
                style={{ background: "transparent", color: theme.node.text, paddingLeft: uploadInset || undefined }}
                placeholder={isPanorama ? "描述想生成的全景，或上传/连接图片作为参考" : promptPlaceholder(mode, hasImageContent, hasTextContent)}
                placeholderIndent={uploadInset ? uploadInset - 12 : 0}
            />

            <div className="canvas-composer-bar mt-2 flex min-w-0 items-center gap-1 text-[10.8px]" style={{ fontFamily: '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
                <div className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    <CanvasPromptLibrary onSelect={updatePrompt} />
                    {mode !== "audio" ? <CanvasNodeSkills nodeType={mode} onSelect={selectSkill} /> : null}
                    {mode === "image" ? (
                        <>
                            <ModelPicker className="!min-w-0 !text-[10.8px]" config={config} value={config.model} channelId={config.imageChannelId} onChange={(model, channelId) => onConfigChange(node.id, { model, channelId })} capability="image" onMissingConfig={() => openConfigDialog(true)} showToggleIndicator />
                            <CanvasImageSettingsPopover
                                config={config}
                                placement="topLeft"
                                buttonClassName="!h-8 !justify-start !rounded-md !px-1.5 !text-[10.8px]"
                                onConfigChange={(key, value) => onConfigChange(node.id, key === "count" ? { count: Number(value) || 1 } : { [key]: value })}
                                onMissingConfig={() => openConfigDialog(true)}
                                onOpenChange={onImageSettingsOpenChange}
                                showSize={!isPanorama}
                                panorama={isPanorama}
                            />
                        </>
                    ) : mode === "video" ? (
                        <>
                            <ModelPicker className="!min-w-0 !text-[10.8px]" config={config} value={config.model} channelId={config.videoChannelId} onChange={(model, channelId) => onConfigChange(node.id, { model, channelId })} capability="video" onMissingConfig={() => openConfigDialog(true)} showToggleIndicator nameMaxWidth={50} />
                            <CanvasVideoSettingsPopover config={config} frameOptions={videoFrameOptions} metadata={node.metadata} firstFrameNodeId={node.metadata?.firstFrameNodeId} lastFrameNodeId={node.metadata?.lastFrameNodeId} onFrameChange={(patch) => onConfigChange(node.id, patch)} onMetadataChange={(patch) => onConfigChange(node.id, patch)} onConfigChange={(key, value) => onConfigChange(node.id, videoConfigPatch(key, value))} />
                            <CanvasVideoSizePopover config={config} onConfigChange={(key, value) => onConfigChange(node.id, videoConfigPatch(key, value))} />
                        </>
                    ) : mode === "audio" ? (
                        <>
                            <ModelPicker className="!text-[10.8px]" config={config} value={config.model} channelId={config.audioChannelId || config.activeChannelId} onChange={(model, channelId) => onConfigChange(node.id, { model, channelId })} capability="audio" onMissingConfig={() => openConfigDialog(true)} showToggleIndicator />
                            <CanvasAudioSettingsPopover config={config} buttonClassName="!h-8 !justify-start !rounded-md !px-1.5 !text-[10.8px]" onConfigChange={(key, value) => onConfigChange(node.id, audioConfigPatch(key, value))} />
                        </>
                    ) : (
                        <ModelPicker className="!text-[10.8px]" config={config} value={config.model} channelId={config.textChannelId} onChange={(model, channelId) => onConfigChange(node.id, { model, channelId })} capability="text" onMissingConfig={() => openConfigDialog(true)} showToggleIndicator />
                    )}
                    {mode === "video" || (mode === "image" && !isPanorama) ? (
                        <CanvasCameraControl value={node.metadata?.cameraControl} onChange={(cameraControl) => onConfigChange(node.id, { cameraControl })} buttonClassName="!h-8 !min-w-0 !justify-start !rounded-md !px-1.5 !text-[10.8px]" />
                    ) : null}
                </div>
                <Button
                    type="primary"
                    className="!ml-auto !h-8 !min-w-14 shrink-0 !rounded-full !px-3"
                    disabled={isRunning || !canSubmit}
                    onClick={submit}
                    aria-label="生成"
                >
                    <span className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums">
                            <CreditSymbol />
                            {credits.toLocaleString()}
                        </span>
                        {isRunning ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                    </span>
                </Button>
            </div>
        </div>
    );
}

function defaultMode(type: CanvasNodeData["type"]): CanvasNodeGenerationMode {
    return type === CanvasNodeType.Text ? "text" : type === CanvasNodeType.Video ? "video" : type === CanvasNodeType.Audio ? "audio" : "image";
}

function buildNodeConfig(globalConfig: AiConfig, node: CanvasNodeData, mode: CanvasNodeGenerationMode): AiConfig {
    const defaultModel = mode === "image" ? globalConfig.imageModel : mode === "video" ? globalConfig.videoModel : mode === "audio" ? globalConfig.audioModel : globalConfig.textModel;
    const channelId = node.metadata?.channelId || "";
    const imageChannelId = mode === "image" ? channelId || globalConfig.imageChannelId : globalConfig.imageChannelId;
    const videoChannelId = mode === "video" ? channelId || globalConfig.videoChannelId : globalConfig.videoChannelId;
    const textChannelId = mode === "text" ? channelId || globalConfig.textChannelId : globalConfig.textChannelId;
    const audioChannelId = mode === "audio" ? channelId || globalConfig.audioChannelId : globalConfig.audioChannelId;
    const activeChannelId = mode === "image" ? imageChannelId : mode === "video" ? videoChannelId : mode === "text" ? textChannelId : mode === "audio" ? audioChannelId || globalConfig.activeChannelId : globalConfig.activeChannelId;
    return {
        ...globalConfig,
        model: node.metadata?.model || defaultModel || (mode === "audio" ? defaultConfig.audioModel : globalConfig.model || defaultConfig.model),
        activeChannelId,
        imageChannelId,
        videoChannelId,
        textChannelId,
        audioChannelId,
        quality: node.metadata?.quality || globalConfig.quality || defaultConfig.quality,
        size: isPanoramaNodeType(node.type) ? PANORAMA_IMAGE_SIZE : node.metadata?.size || (mode === "video" ? globalConfig.videoSize || defaultConfig.videoSize : globalConfig.size || defaultConfig.size),
        imageTier: isPanoramaNodeType(node.type) ? defaultConfig.imageTier : node.metadata?.imageTier || globalConfig.imageTier || defaultConfig.imageTier,
        videoSeconds: node.metadata?.seconds || globalConfig.videoSeconds || defaultConfig.videoSeconds,
        vquality: node.metadata?.vquality || globalConfig.vquality || defaultConfig.vquality,
        videoMode: node.metadata?.mode || globalConfig.videoMode || defaultConfig.videoMode,
        videoMultiShot: node.metadata?.multiShot || globalConfig.videoMultiShot || defaultConfig.videoMultiShot,
        videoShotType: node.metadata?.shotType || globalConfig.videoShotType || defaultConfig.videoShotType,
        videoGenerateAudio: node.metadata?.generateAudio || globalConfig.videoGenerateAudio || defaultConfig.videoGenerateAudio,
        videoCharacterOrientation: node.metadata?.characterOrientation || globalConfig.videoCharacterOrientation || defaultConfig.videoCharacterOrientation,
        videoWatermark: node.metadata?.watermark || globalConfig.videoWatermark || defaultConfig.videoWatermark,
        audioVoice: node.metadata?.audioVoice || globalConfig.audioVoice || defaultConfig.audioVoice,
        audioFormat: node.metadata?.audioFormat || globalConfig.audioFormat || defaultConfig.audioFormat,
        audioSpeed: node.metadata?.audioSpeed || globalConfig.audioSpeed || defaultConfig.audioSpeed,
        audioInstructions: node.metadata?.audioInstructions || globalConfig.audioInstructions || defaultConfig.audioInstructions,
        count: String(node.metadata?.count || (mode === "image" ? globalConfig.canvasImageCount || globalConfig.count : globalConfig.count) || defaultConfig.count),
    };
}

function promptPlaceholder(mode: CanvasNodeGenerationMode, hasImageContent: boolean, hasTextContent: boolean) {
    if (mode === "video") return "描述要生成的视频内容";
    if (mode === "audio") return "描述要生成的音频内容";
    if (mode === "image") return hasImageContent ? "请输入你想要把这张图修改成什么" : "描述要生成的图片内容";
    return hasTextContent ? "请输入你想要将本段文本修改成什么" : "请输入你想要生成的文本内容或在上方输入你的提示词";
}

function composeSkillPrompt(prompt: string, skill?: Pick<Skill, "prompt"> | null) {
    return [skill?.prompt.trim(), prompt.trim()].filter(Boolean).join("\n\n");
}

function stripSkillPrompt(prompt: string, skillPrompt?: string) {
    const skill = skillPrompt?.trim();
    if (!skill) return prompt;
    const value = prompt.trimStart();
    return value.startsWith(skill) ? value.slice(skill.length).replace(/^\s+/, "") : prompt;
}

function videoConfigPatch(key: keyof AiConfig, value: string) {
    if (key === "videoSeconds") return { seconds: value };
    if (key === "videoMode") return { mode: value };
    if (key === "videoGenerateAudio") return { generateAudio: value };
    if (key === "videoWatermark") return { watermark: value };
    return { [key]: value };
}

function audioConfigPatch(key: CanvasAudioSettingKey, value: string) {
    if (key === "audioVoice") return { audioVoice: value };
    if (key === "audioFormat") return { audioFormat: value };
    if (key === "audioSpeed") return { audioSpeed: value };
    return { audioInstructions: value };
}
