package service

import (
	"log"
	"strings"

	"infinite-canvas/model"
)

// VideoAdapterFor 返回模型的生视频渠道适配参数；未配置返回 nil（请求归一化走通用默认）。
func VideoAdapterFor(modelName string) *model.VideoAdapterConfig {
	settings, err := PublicSettings()
	if err != nil {
		return nil
	}
	name := strings.TrimSpace(modelName)
	for _, item := range settings.ModelChannel.ModelCapabilities {
		if item.Model == name {
			return item.VideoAdapter
		}
	}
	return nil
}

// SeedVideoAdapterConfigs 一次性迁移：把旧版按模型名硬编码的视频适配规则翻译成
// videoAdapter 配置写入后台。只填充尚无 videoAdapter 的模型，已有配置一律不动；
// 之后新增模型一律走通用默认，由管理员按接口文档自行配置。
func SeedVideoAdapterConfigs() {
	settings, err := AdminSettings()
	if err != nil {
		log.Printf("seed video adapters skipped: read settings failed: %v", err)
		return
	}

	models := map[string]bool{}
	// 只 seed 已开放模型与已有能力配置条目（理由同 SeedImageAdapterConfigs）
	for _, name := range settings.Public.ModelChannel.AvailableModels {
		models[strings.TrimSpace(name)] = true
	}
	for _, item := range settings.Public.ModelChannel.ModelCapabilities {
		models[strings.TrimSpace(item.Model)] = true
	}

	caps := settings.Public.ModelChannel.ModelCapabilities
	indexByModel := map[string]int{}
	for i, item := range caps {
		indexByModel[item.Model] = i
	}
	changed := false
	for name := range models {
		if name == "" {
			continue
		}
		adapter := legacyVideoAdapterConfig(name)
		if adapter == nil {
			continue
		}
		if index, ok := indexByModel[name]; ok {
			if caps[index].VideoAdapter != nil {
				continue
			}
			caps[index].VideoAdapter = adapter
		} else {
			caps = append(caps, model.ModelCapability{Model: name, VideoAdapter: adapter})
			indexByModel[name] = len(caps) - 1
		}
		changed = true
		log.Printf("seed video adapter config: %s", name)
	}
	if !changed {
		return
	}
	settings.Public.ModelChannel.ModelCapabilities = caps
	if _, err := SaveSettings(settings); err != nil {
		log.Printf("seed video adapters failed: save settings: %v", err)
	}
}

// legacyVideoAdapterConfig 旧 apimartVideoConfig switch 的等价翻译（首个命中即返回）。
// 仅命中与通用默认（aspect_ratio/image_urls/array/支持 resolution）有差异的模型家族；
// 无差异的（如 veo、kling-v3 的 aspect_ratio）不在此列。
// aspectField 空串（不支持比例）翻译为特殊值 "none"。
func legacyVideoAdapterConfig(modelName string) *model.VideoAdapterConfig {
	name := strings.ToLower(strings.TrimSpace(modelName))
	name = strings.NewReplacer("_", "-", ".", "-", "/", "-").Replace(name)

	boolPtr := func(v bool) *bool { return &v }
	switch {
	case strings.Contains(name, "doubao-seedance-2"):
		return &model.VideoAdapterConfig{AspectField: "size", ImageRefKind: "seedance2", VideoRefField: "video_urls", VideoRefKind: "array", AudioRefField: "audio_urls", AudioRefKind: "array"}
	case strings.Contains(name, "doubao-seedance-1-0"):
		return &model.VideoAdapterConfig{ImageRefField: "image_with_roles", ImageRefKind: "roles"}
	case strings.Contains(name, "doubao-seedance-1-5"), strings.Contains(name, "seedance-1"):
		return &model.VideoAdapterConfig{ImageRefField: "image_with_roles", ImageRefKind: "roles"}
	case strings.Contains(name, "sora-2-pro"):
		return &model.VideoAdapterConfig{DropAspectWithImage: boolPtr(true), MaxImageRefs: 1}
	case strings.Contains(name, "sora-2"):
		return &model.VideoAdapterConfig{MaxResolution: "720p", DropAspectWithImage: boolPtr(true), MaxImageRefs: 1}
	case strings.Contains(name, "veo") && strings.Contains(name, "official"):
		return &model.VideoAdapterConfig{ImageRefField: "first_frame_image", ImageRefKind: "first_last"}
	case strings.Contains(name, "minimax-h3"):
		return &model.VideoAdapterConfig{ImageRefKind: "minimax_h3", VideoRefField: "video_urls", VideoRefKind: "array", AudioRefField: "audio_urls", AudioRefKind: "array"}
	case strings.Contains(name, "minimax-hailuo-2-3"):
		return &model.VideoAdapterConfig{AspectField: "none", ImageRefField: "first_frame_image", ImageRefKind: "first_only"}
	case strings.Contains(name, "minimax"), strings.Contains(name, "hailuo"):
		return &model.VideoAdapterConfig{AspectField: "none", ImageRefField: "first_frame_image", ImageRefKind: "first_last"}
	case strings.Contains(name, "skyreels"):
		return &model.VideoAdapterConfig{ImageRefField: "first_frame_image", ImageRefKind: "skyreels", VideoRefField: "ref_videos", VideoRefKind: "skyreels", AudioRefKind: "skyreels_ref_images"}
	case name == "kling-3-0-turbo":
		return &model.VideoAdapterConfig{ImageRefField: "first_frame_image", ImageRefKind: "first_only", DropAspectWithImage: boolPtr(true)}
	case name == "happyhorse-1-1":
		return &model.VideoAdapterConfig{AspectField: "size", ResolutionCase: "upper_video", ImageRefKind: "happyhorse11"}
	case strings.Contains(name, "happyhorse"):
		return &model.VideoAdapterConfig{AspectField: "size", ResolutionCase: "upper_video", ImageRefKind: "happyhorse", VideoRefField: "video_url", VideoRefKind: "single"}
	case strings.Contains(name, "gemini-omni-flash-preview"):
		return &model.VideoAdapterConfig{MaxResolution: "720p", VideoRefField: "video_urls", VideoRefKind: "array"}
	case strings.Contains(name, "wan2-7-r2v"), strings.Contains(name, "wan2.7-r2v"):
		return &model.VideoAdapterConfig{AspectField: "size", ResolutionCase: "upper_video", ImageRefField: "image_with_roles", ImageRefKind: "roles", VideoRefField: "video_urls", VideoRefKind: "array", AudioRefKind: "wan_r2v_voice"}
	case strings.Contains(name, "wan2-7-videoedit"), strings.Contains(name, "wan2.7-videoedit"):
		return &model.VideoAdapterConfig{AspectField: "size", ResolutionCase: "upper_video", VideoRefField: "video_urls", VideoRefKind: "array"}
	case strings.Contains(name, "wan2-7"), strings.Contains(name, "wan2.7"):
		return &model.VideoAdapterConfig{AspectField: "size", ResolutionCase: "upper_video", ImageRefField: "image_with_roles", ImageRefKind: "roles", VideoRefField: "video_urls", VideoRefKind: "array", AudioRefField: "audio_url", AudioRefKind: "single"}
	case strings.Contains(name, "wan2-6-i2v-flash"), strings.Contains(name, "wan2.6-i2v-flash"):
		return &model.VideoAdapterConfig{AspectField: "none", AudioRefField: "audio_url", AudioRefKind: "single"}
	case strings.Contains(name, "wan2-5"), strings.Contains(name, "wan2.5"):
		return &model.VideoAdapterConfig{AspectField: "size", DropAspectWithImage: boolPtr(true), AudioRefField: "audio_url", AudioRefKind: "single"}
	case strings.Contains(name, "wan2-6"), strings.Contains(name, "wan2.6"):
		return &model.VideoAdapterConfig{DropAspectWithImage: boolPtr(true), AudioRefField: "audio_url", AudioRefKind: "single"}
	case strings.Contains(name, "kling-v2-6-motion"), strings.Contains(name, "motion-control"):
		return &model.VideoAdapterConfig{AspectField: "none", HasResolution: boolPtr(false), ImageRefField: "image_url", ImageRefKind: "single", VideoRefField: "video_url", VideoRefKind: "single"}
	case strings.Contains(name, "kling-v2-6"), strings.Contains(name, "kling-2-6"):
		return &model.VideoAdapterConfig{HasResolution: boolPtr(false), ImageRefKind: "array_frames"}
	case name == "kling-v3":
		return &model.VideoAdapterConfig{HasResolution: boolPtr(false), ImageRefKind: "array_frames"}
	case strings.Contains(name, "kling-v3-omni"), strings.Contains(name, "kling-video-o1"):
		return &model.VideoAdapterConfig{HasResolution: boolPtr(false), ModeFromRes: boolPtr(true), VideoRefField: "video_list", VideoRefKind: "kling_video_list"}
	case strings.Contains(name, "kling"):
		return &model.VideoAdapterConfig{HasResolution: boolPtr(false), ModeFromRes: boolPtr(true)}
	case strings.Contains(name, "vidu"):
		adapter := &model.VideoAdapterConfig{ImageRefKind: "array_frames"}
		if name != "viduq3" && name != "viduq3-mix" {
			adapter.DropAspectWithImage = boolPtr(true)
		}
		return adapter
	case strings.Contains(name, "grok-imagine"):
		return &model.VideoAdapterConfig{AspectField: "size", HasResolution: boolPtr(false), HasQuality: boolPtr(true)}
	case strings.Contains(name, "pixverse"):
		return &model.VideoAdapterConfig{AspectField: "size", ImageRefKind: "pixverse"}
	case strings.Contains(name, "omni-flash"):
		return &model.VideoAdapterConfig{VideoRefField: "video_urls", VideoRefKind: "array"}
	}
	return nil
}
