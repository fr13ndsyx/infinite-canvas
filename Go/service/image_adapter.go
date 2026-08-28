package service

import (
	"log"
	"strings"

	"infinite-canvas/model"
)

// ImageAdapterFor 返回模型的生图渠道适配参数；未配置返回 nil（请求归一化走通用默认）。
func ImageAdapterFor(modelName string) *model.ImageAdapterConfig {
	settings, err := PublicSettings()
	if err != nil {
		return nil
	}
	name := strings.TrimSpace(modelName)
	for _, item := range settings.ModelChannel.ModelCapabilities {
		if item.Model == name {
			return item.ImageAdapter
		}
	}
	return nil
}

// SeedImageAdapterConfigs 一次性迁移：把旧版按模型名硬编码的生图适配规则翻译成
// imageAdapter 配置写入后台。只填充尚无 imageAdapter 的模型，已有配置一律不动；
// 之后新增模型一律走通用默认，由管理员按接口文档自行配置。
func SeedImageAdapterConfigs() {
	settings, err := AdminSettings()
	if err != nil {
		log.Printf("seed image adapters skipped: read settings failed: %v", err)
		return
	}

	models := map[string]bool{}
	// 只 seed 已开放模型与已有能力配置条目：能力配置保存时按 AvailableModels 过滤，
	// 未开放模型的配置无法持久化，且其不该被 seed 隐式开放
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
		adapter := legacyImageAdapterConfig(name)
		if adapter == nil {
			continue
		}
		if index, ok := indexByModel[name]; ok {
			if caps[index].ImageAdapter != nil {
				continue
			}
			caps[index].ImageAdapter = adapter
		} else {
			caps = append(caps, model.ModelCapability{Model: name, ImageAdapter: adapter})
			indexByModel[name] = len(caps) - 1
		}
		changed = true
		log.Printf("seed image adapter config: %s", name)
	}
	if !changed {
		return
	}
	settings.Public.ModelChannel.ModelCapabilities = caps
	if _, err := SaveSettings(settings); err != nil {
		log.Printf("seed image adapters failed: save settings: %v", err)
	}
}

// legacyImageAdapterConfig 旧 apimartImageConfig switch 的等价翻译（首个命中即返回）。
// 仅命中与通用默认有差异的模型家族；无差异（如 seedream/seedance-4/wan2-7 只改
// resolutionCase=upper，与默认相同）的不在此列。
func legacyImageAdapterConfig(modelName string) *model.ImageAdapterConfig {
	name := strings.ToLower(strings.TrimSpace(modelName))
	name = strings.NewReplacer("_", "-", ".", "-", "/", "-").Replace(name)

	boolPtr := func(v bool) *bool { return &v }
	switch {
	case strings.Contains(name, "gpt-image-2") && strings.Contains(name, "official"):
		return &model.ImageAdapterConfig{ResolutionCase: "lower", HasQuality: boolPtr(true), HasOutput: boolPtr(true)}
	case strings.Contains(name, "gpt-image-2"):
		return &model.ImageAdapterConfig{ResolutionCase: "lower", HasQuality: boolPtr(true)}
	case strings.Contains(name, "gpt-4o-image"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false)}
	case strings.Contains(name, "gpt-image-1"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false), HasQuality: boolPtr(true), HasOutput: boolPtr(true)}
	case strings.Contains(name, "gemini-3-1-flash-lite"):
		return &model.ImageAdapterConfig{MaxResolution: "1K"}
	case strings.Contains(name, "gemini-3-1"), strings.Contains(name, "gemini-31"), strings.Contains(name, "nano-banana2"):
		return &model.ImageAdapterConfig{HasCount: boolPtr(false)}
	case strings.Contains(name, "gemini-3-pro"), strings.Contains(name, "nano-banana-pro"):
		return &model.ImageAdapterConfig{HasCount: boolPtr(false)}
	case strings.Contains(name, "gemini-2-5"), strings.Contains(name, "nano-banana"):
		return &model.ImageAdapterConfig{MaxResolution: "1K", HasCount: boolPtr(false)}
	case strings.Contains(name, "imagen"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false), HasQuality: boolPtr(false), HasCount: boolPtr(false), HasImageRefs: boolPtr(false)}
	case strings.Contains(name, "seedream-5-0-pro"):
		return &model.ImageAdapterConfig{MaxResolution: "2K", HasCount: boolPtr(false), MaxImageRefs: 10}
	case strings.Contains(name, "seedream-5"):
		return &model.ImageAdapterConfig{MinResolution: "2K", HasOutput: boolPtr(true)}
	case strings.Contains(name, "seedream-4-5"), strings.Contains(name, "seedance-4-5"):
		return &model.ImageAdapterConfig{MinResolution: "2K"}
	case strings.Contains(name, "qwen"):
		return &model.ImageAdapterConfig{MaxResolution: "2K"}
	case strings.Contains(name, "z-image"):
		return &model.ImageAdapterConfig{MaxResolution: "2K", HasCount: boolPtr(false), HasImageRefs: boolPtr(false)}
	case strings.Contains(name, "grok-imagine") && strings.Contains(name, "edit"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false), RequireRefs: boolPtr(true)}
	case strings.Contains(name, "grok-imagine-1-5"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false), HasImageRefs: boolPtr(false)}
	case strings.Contains(name, "grok-imagine"):
		return &model.ImageAdapterConfig{HasResolution: boolPtr(false)}
	case strings.Contains(name, "flux-2"):
		return &model.ImageAdapterConfig{HasCount: boolPtr(false)}
	}
	return nil
}
