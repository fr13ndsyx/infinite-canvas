# 视频专属面板参数清单

本文档梳理当前视频工作台和画布节点设置面板中，按模型/渠道硬编码的所有专属参数，作为后续后端 `ModelCapability` 统一控制的参考。

## 重构进度

已完成的 `ModelCapability` 字段接入（详见 [pending-test.md](../progress/pending-test.md)「视频专属面板能力后台化重构」）：

| 字段 | 接入状态 | 说明 |
|---|---|---|
| `videoPanelType` | ✅ 已接入 | 面板分流（通用/Kling V26/Kling V3/Seedance/Grok/Motion Control/Agnes） |
| `videoProvider` | ✅ 已接入 | 厂商区分（apimart/kie），影响 Kling V3 / Motion Control 请求体格式 |
| `videoModes` | ✅ 已接入 | 模式选项（Kling std/pro/4k、Grok fun/normal/spicy），空=走默认硬编码档位 |
| `videoRatios` | ✅ 已接入 | 比例选项，空=走默认 sizeOptions / klingV26RatioOptions / seedanceRatioOptions |
| `videoSecondsMin`/`Max` | ✅ 已接入 | 秒数范围（Slider），空=默认 4-20 |
| `videoSecondsPresets` | ✅ 已接入 | 秒数预设档位（Seedance 面板），空=走默认 seedanceDurationOptions |
| `videoSecondsSmart` | ⚠️ 待接入 | 字段与 resolve 已定义，Seedance 面板仍硬编码显示 `-1` 智能选项 |
| `supportsNegativePrompt` | ✅ 已接入 | 负面提示词显隐 |
| `supportsFirstLastFrame` | ✅ 已接入 | 尾帧显隐（兼容字段：勾选=首尾帧都支持） |
| `supportsFirstFrame` | ✅ 已接入 | 首帧显隐（仅首帧模型勾选；未配置时若 supportsFirstLastFrame=true 视为同时支持首帧） |
| `supportsMotionControl` | ✅ 已接入 | 运动控制 |
| `supportsAudioGeneration` | ✅ 已接入 | 音频生成开关 |
| `supportsWatermark` | ✅ 已接入 | 水印开关（Seedance） |
| `supportsMultiShot` | ✅ 已接入 | 多镜头分镜（Kling V3） |
| `supportsElementList` | ✅ 已接入 | 元素列表（Kling V3） |
| `audioRequiresMode` | ✅ 已接入 | 音频生成所需模式（Kling V26 pro） |
| `audioMaxReferences` | ✅ 已接入 | 音频生成最大参考图数量 |
| Seedance 分辨率 | ⚠️ 待接入 | 仍用 `seedanceResolutionOptions` 硬编码，未读 `videoResolutions` |
| Seedance 参考素材限制 | ⚠️ 待接入 | 仍硬编码 `SEEDANCE_REFERENCE_LIMITS` |

## 现状概览

当前视频面板按"模型 + 渠道"分三套硬编码实现，所有参数散落在前端代码里，模型厂商调整后必须改前端代码：

| 面板 | 适用模型 | 渠道 | 实现位置 |
|---|---|---|---|
| 通用视频面板 | 除 Kling / Seedance / Grok 外的所有视频模型 | 任意 | `next/src/components/video-settings-panel.tsx` `VideoSettingsPanel` |
| Kling V26/V3 面板 | `kling-v2-6` / `kling-v3` / `kling-3-0-video` | apimart / kie | `video-settings-panel.tsx` `KlingV26VideoSettingsPanel` + `next/src/app/(user)/video/components/kling-v26-workbench-panel.tsx` |
| Seedance 面板 | `seedance` / `doubao-seedance` 系列 + ark plan baseUrl | 任意 | `video-settings-panel.tsx` `SeedanceVideoSettingsPanel` |
| Grok 模式 | `grok-imagine/text-to-video` / `grok-imagine/image-to-video` | kie | 通用面板内分支 |

## 通用视频面板参数

适用模型：除 Kling / Seedance / Grok 外的所有视频模型。

### 分辨率（vquality）

- 取值：`480p` / `720p` / `1080p`
- 默认：`720p`
- 来源：`video-settings-panel.tsx` L13-16 `resolutionOptions`
- 后台控制：已接入 `ModelCapability.videoResolutions`
  - 未配置 = 三档全显 + 自定义输入兜底
  - 空数组 = 隐藏按钮，仅自定义输入
  - 有值 = 按配置生成按钮，隐藏自定义输入

### 比例（size）

- 取值：`1280x720` / `720x1280` / `1024x1024` / `1792x1024` / `1024x1792` / `auto`
- 默认：`1280x720`
- 来源：`video-settings-panel.tsx` L18-25 `sizeOptions`
- 后台控制：✅ 已接入 `ModelCapability.videoRatios`（空=走默认 `sizeOptions`）

### 秒数（videoSeconds）

- 取值：`6` / `10` / `12` / `16` / `20`（OptionPill）+ `1-30` 任意整数（NumberInput 兜底）
- 默认：`6`
- 来源：`video-settings-panel.tsx` L27 `secondOptions`，L146 `NumberInput min=1 max=30`
- 后台控制：✅ 范围已接入 `ModelCapability.videoSecondsMin`/`videoSecondsMax`（通用面板用 `SecondsSlider`，空=默认 4-20）

### 模式（videoMode）— 仅 Grok

- 取值：`fun` / `normal` / `spicy`
- 默认：`normal`
- 来源：`video-settings-panel.tsx` L486-490 `grokVideoModeOptions`
- 后台控制：✅ 已接入 `ModelCapability.videoModes` + `videoPanelType=grok`（替代 `isKIEGrokVideoModel`）

### 生成音频（videoGenerateAudio）

- 取值：`true` / `false`
- 默认：`false`
- 显示条件：`resolveSupportsAudioGeneration(cap) === true`（替代 `supportsVideoAudioGeneration`）
- 来源：`next/src/lib/video-model-capabilities.ts` `supportsVideoAudioGeneration`（已删除）
- 后台控制：✅ 已接入 `ModelCapability.supportsAudioGeneration`

## Kling V26 / V3 面板参数

适用条件：`resolveVideoPanelType(cap)` ∈ {`kling-v26`, `kling-v3`}（替代原 `modelKey(model)` + 渠道文本判断）；`videoProvider` 区分 `apimart`/`kie` 请求体格式。

### 负面提示词（videoNegativePrompt）

- 取值：任意文本
- 显示条件：渠道非 kie（`resolveVideoProvider(cap) !== "kie"`）
- 来源：`kling-v26-workbench-panel.tsx` L246 `!isKIEKlingV3`
- 后台控制：✅ 已接入 `ModelCapability.videoProvider`（kie 隐藏）+ `supportsNegativePrompt`

### 模式（videoMode）

- V26 取值：`std`（标准模式 720P 无声）/ `pro`（专业模式 1080P 音频）
- V3 取值：`std`（720P）/ `pro`（1080P）/ `4k`（4K）
- 默认：`std`
- 来源：`video-settings-panel.tsx` L28-36 `klingV26ModeOptions` / `klingV3ModeOptions`
- 后台控制：✅ 已接入 `ModelCapability.videoModes`（空=走默认 `klingV26ModeOptions`/`klingV3ModeOptions`）

### 比例（size）

- 取值：`16:9` / `9:16` / `1:1`
- 默认：`16:9`
- V26 像素映射：`16:9 → 1280x720`，`9:16 → 720x1280`，`1:1 → 960x960`
- 来源：`video-settings-panel.tsx` L37 `klingV26RatioOptions`，L40-44 `klingV26RatioLabels`
- 后台控制：✅ 已接入 `ModelCapability.videoRatios`（空=走默认 `klingV26RatioOptions`）

### 秒数（videoSeconds）

- V26 取值：`5` / `10`（仅两档，无数值输入）
- V3 取值：`3` / `15`（OptionPill）+ `3-15` 任意整数（NumberInput 兜底）
- 默认：V26 `5`，V3 `3`（初始化时若为 `6` 自动改 `3`）
- 来源：`video-settings-panel.tsx` L38-39 `klingV26DurationOptions` / `klingV3DurationOptions`，L475-478 `normalizeKlingV26Duration` / `normalizeKlingV3Duration`
- 后台控制：✅ 范围已接入 `ModelCapability.videoSecondsMin`/`videoSecondsMax`（Kling 面板用 `SecondsSlider`）

### 生成音频（videoGenerateAudio）

- 取值：`true` / `false`
- 默认：`false`
- V26 限制：仅 `pro` 模式且参考图 ≤1 张可用，否则开关禁用
- V3 限制：无限制
- 来源：`kling-v26-workbench-panel.tsx` L130 `audioDisabled`
- 后台控制：✅ 已接入 `ModelCapability.supportsAudioGeneration` + `audioRequiresMode`（如 `pro`）+ `audioMaxReferences`（如 `1`）

### 多镜头分镜（videoMultiShot）— 仅 V3

- 取值：`true` / `false`
- 默认：`false`
- 显示条件：`resolveVideoPanelType(cap) === "kling-v3"`（替代 `isKlingV3`）
- 关联字段：
  - `videoShotType`：`customize`（自定义）/ `intelligence`（智能分镜），默认 `intelligence`
  - `videoMultiPrompt`：分镜提示词数组，每项含 `prompt` + `duration`（1-15 秒），默认 1 条空提示词
- 来源：`kling-v26-workbench-panel.tsx` L131-158
- 后台控制：✅ 已接入 `ModelCapability.supportsMultiShot`

### 元素列表（videoElementList）— 仅 V3

- 取值：数组，每项含 `name` + `description` + `references`（图/视频/音频）
- 限制：1-3 个元素，每个元素 1-4 个参考素材
- 显示条件：`resolveVideoPanelType(cap) === "kling-v3"`
- 来源：`kling-v26-workbench-panel.tsx` L173-189，L506-509 `normalizeElementList`
- 后台控制：✅ 已接入 `ModelCapability.supportsElementList`

### 首帧 / 尾帧（firstFrame / lastFrame）

- 取值：参考图对象
- 显示条件：首帧 `resolveSupportsFirstFrame(cap) === true`，尾帧 `resolveSupportsLastFrame(cap) === true`（替代 `supportsVideoFrameReferences`，Kling V2.1 Pro / V2.5 Turbo 等在通用面板走此路径）
- 来源：`next/src/lib/video-model-capabilities.ts` `supportsVideoFrameReferences`（已删除）
- 后台控制：✅ 已接入 `ModelCapability.supportsFirstFrame`（仅首帧）+ `ModelCapability.supportsFirstLastFrame`（尾帧，兼容字段：勾选=首尾帧都支持）

### 角色朝向参考（videoCharacterOrientation）— 仅 Motion Control

- 取值：`image` / `video`
- 默认：`video`
- 显示条件：`resolveVideoPanelType(cap) === "motion-control"`（替代 `isAPIMartKlingMotionControlConfig` / `isKIEKlingMotionControlConfig`）
- 适用模型：`kling-v2-6-motion-control` / `kling-2-6-motion-control` / `kling-3-0-motion-control`
- 来源：`video/page.tsx` L2801 `characterOrientationOptions`，L1321 `motionControl`
- 后台控制：✅ 已接入 `ModelCapability.videoPanelType=motion-control`

## Seedance 面板参数

适用条件：`resolveVideoPanelType(cap) === "seedance"`（替代原模型名 + baseUrl 判断）。

### 分辨率（vquality）

- 取值：`480p` / `720p` / `1080p`
- 默认：`720p`
- 限制：`fast` / `mini` 模型不支持 `1080p`，自动降级 `720p`
- 来源：`next/src/lib/seedance-video.ts` L14-18 `seedanceResolutionOptions`，L77-81 `normalizeSeedanceResolution`
- 后台控制：⚠️ 待接入（仍用 `seedanceResolutionOptions` 硬编码，未读 `videoResolutions`）

### 比例（size）

- 取值：`16:9` / `9:16` / `1:1` / `4:3` / `3:4` / `21:9` / `adaptive`
- 默认：`adaptive`
- 像素映射：按分辨率 × 比例查表，见 `seedance-video.ts` L32-57 `seedancePixels`
  - 例：`720p + 16:9 → 1280x720`，`1080p + 9:16 → 1080x1920`
- 来源：`seedance-video.ts` L20-28 `seedanceRatioOptions`
- 后台控制：✅ 已接入 `ModelCapability.videoRatios`（空=走默认 `seedanceRatioOptions`）

### 秒数（videoSeconds）

- 取值：`-1`（智能）/ `4` / `5` / `6` / `8` / `10` / `12` / `15`（OptionPill）+ `-1~15` 任意整数（NumberInput 兜底）
- 默认：`5`
- 范围：`-1` 表示智能时长，`4-15` 表示具体秒数
- 来源：`seedance-video.ts` L30 `seedanceDurationOptions`，L90-94 `normalizeSeedanceDuration`
- 后台控制：✅ 范围已接入 `ModelCapability.videoSecondsMin`/`videoSecondsMax`；✅ 预设档位已接入 `videoSecondsPresets`（空=走默认 `seedanceDurationOptions`）；⚠️ `videoSecondsSmart` 字段已定义但未接入 UI（仍硬编码显示 `-1`）

### 生成音频（videoGenerateAudio）

- 取值：`true` / `false`
- 默认：`false`
- 显示条件：`resolveSupportsAudioGeneration(cap) === true`
- 来源：`video-settings-panel.tsx` L242
- 后台控制：✅ 已接入 `ModelCapability.supportsAudioGeneration`

### 水印（videoWatermark）

- 取值：`true` / `false`
- 默认：`false`
- 来源：`video-settings-panel.tsx` L241，L295
- 后台控制：✅ 已接入 `ModelCapability.supportsWatermark`

### 参考素材限制

- 图片：最多 9 张，单张 ≤30MB
- 视频：最多 3 个，单个 ≤50MB，时长 2-15 秒，宽高 300-6000px，宽高比 0.4-2.5，像素总量 640×640 ~ 2206×946
- 音频：最多 3 个，单个 ≤15MB
- 总时长：参考视频合计 ≤15 秒
- 来源：`seedance-video.ts` L5-12 `SEEDANCE_REFERENCE_LIMITS`，L146-166 `seedanceVideoReferenceError`
- 后台控制：⚠️ 待接入（仍硬编码 `SEEDANCE_REFERENCE_LIMITS`）

## 后端统一控制字段（已实施）

`ModelCapability` 已扩展以下字段（均为可选，未配置 = 走前端默认值）。完整字段说明见 [backend-database.md](./backend-database.md)。

```go
type ModelCapability struct {
    Model            string   `json:"model"`
    ImageAspects     []string `json:"imageAspects,omitempty"`
    ImageTiers       []string `json:"imageTiers,omitempty"`
    VideoResolutions []string `json:"videoResolutions,omitempty"`

    // 视频参数范围
    VideoSecondsMin      *int     `json:"videoSecondsMin,omitempty"`      // 默认 4
    VideoSecondsMax      *int     `json:"videoSecondsMax,omitempty"`      // 默认 20
    VideoSecondsPresets  []int    `json:"videoSecondsPresets,omitempty"`  // 预设档位（如 [5,10]），空=连续 Slider
    VideoSecondsSmart    bool     `json:"videoSecondsSmart,omitempty"`    // 是否支持 -1 智能时长（Seedance）⚠️ 待接入 UI

    // 视频面板类型与厂商（替代前端按模型名+渠道硬编码判断）
    VideoPanelType string `json:"videoPanelType,omitempty"` // 空=通用；kling-v26/kling-v3/seedance/grok/motion-control/agnes
    VideoProvider  string `json:"videoProvider,omitempty"`  // 空=不区分；apimart/kie

    // 视频模式（Kling std/pro/4k、Grok fun/normal/spicy）
    VideoModes []VideoModeOption `json:"videoModes,omitempty"`

    // 视频比例
    VideoRatios []string `json:"videoRatios,omitempty"` // ["16:9","9:16","1:1","adaptive"]

    // 能力开关
    SupportsNegativePrompt     bool `json:"supportsNegativePrompt,omitempty"`
    SupportsFirstLastFrame     bool `json:"supportsFirstLastFrame,omitempty"` // 兼容字段：首尾帧都支持
    SupportsFirstFrame         bool `json:"supportsFirstFrame,omitempty"`     // 仅支持首帧
    SupportsMotionControl      bool `json:"supportsMotionControl,omitempty"`
    SupportsAudioGeneration    bool `json:"supportsAudioGeneration,omitempty"`
    SupportsWatermark          bool `json:"supportsWatermark,omitempty"`
    SupportsMultiShot          bool `json:"supportsMultiShot,omitempty"`
    SupportsElementList        bool `json:"supportsElementList,omitempty"`

    // 音频生成限制
    AudioRequiresMode          string `json:"audioRequiresMode,omitempty"` // 如 Kling V26 要求 mode=pro
    AudioMaxReferences         int    `json:"audioMaxReferences,omitempty"` // 如 Kling V26 要求参考图 ≤1
}

type VideoModeOption struct {
    Value string `json:"value"`       // "std" / "pro" / "4k" / "fun" / "normal" / "spicy"
    Label string `json:"label"`       // "标准模式" / "专业模式" / "4K" / "Fun" / "Normal" / "Spicy"
    Desc  string `json:"desc"`        // "720P 无声" / "1080P 音频" 等补充说明
}
```

## 迁移策略

1. **已完成**：`VideoPanelType` / `VideoProvider` / `VideoModes` / `VideoRatios` / `VideoSecondsMin`/`Max` / `VideoSecondsPresets` / 全部能力开关 / 音频限制字段接入，删除前端 `isSeedanceVideoConfig` / `isSeedanceVideoModel` / `supportsVideoFrameReferences` / `supportsVideoAudioGeneration` 等硬编码判断函数
2. **待办**：
   - `VideoSecondsSmart` 接入 Seedance 面板 UI（控制 `-1` 智能时长选项显隐，目前仍硬编码显示）
   - Seedance 分辨率改读 `videoResolutions`（目前仍用 `seedanceResolutionOptions` 硬编码）
   - Seedance 参考素材限制改后台配置（目前仍硬编码 `SEEDANCE_REFERENCE_LIMITS`）
   - 后端 `apimartImageConfig` / `kieModelInputConfig` 优先读配置、硬编码作 fallback 的改造
3. **最终目标**：所有视频面板参数从后台 `ModelCapability` 读取，前端不再按模型名/渠道做硬编码分支，新增模型或厂商调整参数只需后台改配置
