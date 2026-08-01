export function modelKey(modelName: string) {
    return modelName.trim().toLowerCase().replace(/[._/]+/g, "-");
}

export function supportsVideoFrameReferences(modelName: string) {
    const model = modelKey(modelName);
    return (
        model === "bytedance-seedance-2" ||
        model === "bytedance-seedance-2-fast" ||
        model === "bytedance-seedance-2-mini" ||
        model === "wan-2-7-image-to-video" ||
        model === "bytedance-v1-lite-image-to-video" ||
        model === "hailuo-02-image-to-video-standard" ||
        model === "hailuo-02-image-to-video-pro" ||
        model === "kling-v2-1-pro" ||
        model === "kling-v2-5-turbo-image-to-video-pro" ||
        model.includes("doubao-seedance-2-0") ||
        model.includes("doubao-seedance-1-5") ||
        model.includes("doubao-seedance-1-0") ||
        model === "happyhorse-1-1" ||
        (model.includes("veo3-1") && model.includes("official")) ||
        model.includes("minimax-hailuo-02") ||
        model.includes("skyreels-v4") ||
        model.includes("pixverse-v6") ||
        model.includes("viduq3") ||
        model.includes("vidu-q3")
    );
}

export function supportsVideoAudioGeneration(modelName: string) {
    const model = modelKey(modelName);
    if (model.includes("motion-control")) return false;
    return (
        model === "kling-2-6-text-to-video" ||
        model === "kling-2-6-image-to-video" ||
        model === "kling-text-to-video" ||
        model === "kling-image-to-video" ||
        model === "bytedance-seedance-2" ||
        model === "bytedance-seedance-2-fast" ||
        model === "bytedance-seedance-2-mini" ||
        model === "wan-2-6-flash-image-to-video" ||
        model === "wan-2-6-flash-video-to-video" ||
        model.includes("bytedance-seedance-1-5") ||
        model.includes("doubao-seedance-2-0") ||
        model.includes("doubao-seedance-1-5") ||
        (model.includes("veo") && model.includes("official")) ||
        model === "wan2-6" ||
        model === "wan2-6-i2v-flash" ||
        model.includes("kling-v2-6") ||
        model.includes("kling-2-6") ||
        ((model.includes("kling-v3") || model.includes("kling-3-0")) && !model.includes("turbo")) ||
        model.includes("pixverse-v6") ||
        model.includes("viduq3-pro") ||
        model.includes("vidu-q3-pro") ||
        model.includes("viduq3-turbo")
    );
}
