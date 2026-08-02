# 模型能力配置改造方案

## 背景

当前生图 / 视频工作台的"比例"和"清晰度"选项对所有模型统一展示，无法按模型实际支持的能力差异化呈现：

- **生图工作台**：`aspectOptions` 24 个比例 + auto + 标准/2K/4K 三档，所有模型都展示
- **视频工作台**：通用面板只支持 720p/480p；Kling V3 在"模式"里塞 720P/1080P/4K；Seedance 在"分辨率"里塞 720p/1080p
- **后端已有能力数据**：`Go/handler/apimart_image.go` 和 `Go/handler/kie_image.go` 里按模型硬编码了 `maxResolution`/`hasQuality`/`hasCount` 等能力，但前端完全读不到，配置硬编码在 Go 源码里
- **后果**：用户选了模型不支持的组合（如 seedream-5-0-pro 选 4K），后端静默钳制为 2K，用户无感知

## 目标

1. 管理后台新增"模型能力"编辑表格，每个模型可勾选：
   - 生图：支持的比例（1:1/3:2/16:9...） + 支持的清晰度档位（标准/2K/4K）
   - 视频：支持的清晰度（480p/720p/1080p/2K/4K）
2. 前端工作台根据当前所选模型的能力，动态渲染选项按钮
3. 后端 `apimartImageConfig`/`kieModelInputConfig` 优先读后端配置，硬编码作 fallback（向后兼容）
4. 切换模型时若当前选项不在新模型支持范围，自动回退到第一个支持的档位/比例

## 数据结构设计

### 后端 `ModelCapability` 结构（`Go/model/setting.go`）

```go
type ModelCapability struct {
    Model            string   `json:"model"`
    ImageAspects     []string `json:"imageAspects,omitempty"`     // ["1:1","3:2","16:9",...]，空=支持全部
    ImageTiers       []string `json:"imageTiers,omitempty"`        // ["standard","2k","4k"]，空=仅标准
    VideoResolutions []string `json:"videoResolutions,omitempty"` // ["480p","720p","1080p","2k","4k"]，空=480p/720p/1080p
}
```

### 挂载位置

挂在 `PublicModelChannelSetting.ModelCapabilities`（与 `ModelCosts` 同级，参考 [setting.go:33-46](../Go/model/setting.go)）：

```go
type PublicModelChannelSetting struct {
    AvailableModels     []string             `json:"availableModels"`
    ModelCosts          []ModelCost          `json:"modelCosts"`
    ModelCapabilities   []ModelCapability    `json:"modelCapabilities"`   // 新增
    Channels            []PublicModelChannelInfo `json:"channels"`
    DefaultModel        string               `json:"defaultModel"`
    DefaultImageModel   string               `json:"defaultImageModel"`
    // ... 其他字段不变
}
```

### 默认值策略

为避免后台未配置时全部模型空配置导致前端 UI 异常：

| 字段 | 空值含义 |
|------|----------|
| `imageAspects` | 视为支持全部 8 个标准比例（1:1/3:2/2:3/4:3/3:4/16:9/9:16/21:9） |
| `imageTiers` | 视为只支持「标准」一档（保守，避免误显示 4K） |
| `videoResolutions` | 视为支持 480p / 720p / 1080p（保守三档） |

管理员需要显式勾选 2K/4K 才会显示给用户。

### 前端类型（`next/src/services/api/admin.ts`）

```ts
export type ModelCapability = {
    model: string;
    imageAspects?: string[];
    imageTiers?: ("standard" | "2k" | "4k")[];
    videoResolutions?: string[];
};
```

## 改动清单

### 后端（4 文件）

| 文件 | 改动内容 |
|------|----------|
| [Go/model/setting.go](../Go/model/setting.go) | 新增 `ModelCapability` 结构体；在 `PublicModelChannelSetting` 添加 `ModelCapabilities` 字段 |
| [Go/service/settings.go](../Go/service/settings.go) | `normalize` 阶段处理新字段：去重、按 `AvailableModels` 过滤、字段缺失补默认值 |
| [Go/handler/apimart_image.go](../Go/handler/apimart_image.go) | `apimartImageConfig`（[L60-135](../Go/handler/apimart_image.go)）改为读后端配置优先，硬编码作 fallback |
| [Go/handler/kie_image.go](../Go/handler/kie_image.go) | 同上，`kieModelInputConfig` 改为读后端配置 |

**保持不动**：
- [Go/handler/ai.go](../Go/handler/ai.go) — `proxyAIRequest` 透传 body，不做适配
- [Go/handler/apimart_video.go](../Go/handler/apimart_video.go) — 视频侧适配逻辑暂不改（视频档位较少，前端动态过滤足够）
- [Go/repository/db.go](../Go/repository/db.go) — 新字段在 JSON 内，无需 AutoMigrate

### 前端（5 文件）

| 文件 | 改动内容 |
|------|----------|
| [next/src/services/api/admin.ts](../next/src/services/api/admin.ts) | 新增 `ModelCapability` 类型；扩展 `AdminPublicModelChannelSettings` |
| [next/src/app/(admin)/admin/settings/page.tsx](../next/src/app/(admin)/admin/settings/page.tsx) | 新增"模型能力"编辑表格（参考 [modelCosts 表格 L519-542](../next/src/app/(admin)/admin/settings/page.tsx)）；更新 `emptySettings`/`normalizePublicSetting`/`collectSettings` |
| [next/src/stores/use-config-store.ts](../next/src/stores/use-config-store.ts) | `AiConfig` 透传 `modelCapabilities`；`useEffectiveConfig` 返回当前模型能力；切换模型时若当前 `size`/`vquality` 不被支持，回退到默认 |
| [next/src/components/image-settings-panel.tsx](../next/src/components/image-settings-panel.tsx) | 新增 `capabilities` prop；`resolutionTierOptions` 按能力过滤；`visibleAspects` 按能力过滤；Segmented 只在 ≥2 档时显示 |
| [next/src/components/video-settings-panel.tsx](../next/src/components/video-settings-panel.tsx) | 新增 `capabilities` prop；`resolutionOptions` 按能力动态生成；Kling V3 模式选项按能力生成；Seedance 分辨率按能力过滤 |

**可选改动**（不在本次范围）：
- [next/src/app/(user)/image/page.tsx](../next/src/app/(user)/image/page.tsx) — 调用方传入 `capabilities` prop
- [next/src/app/(user)/video/page.tsx](../next/src/app/(user)/video/page.tsx) — 同上
- 画布生图浮层、工作流配置（`canvas-image-settings-popover.tsx`、`creative-workflow-workspace.tsx`）— 同上
- [next/src/services/api/image.ts](../next/src/services/api/image.ts) — `createImageRequestParams` 可选：当前 `config.size` 不在能力白名单时回退 `auto`

### 文档（1 文件）

| 文件 | 改动内容 |
|------|----------|
| [docs/backend/backend-database.md](./backend-database.md) | 在 `modelChannel` 字段表追加 `modelCapabilities` 字段说明 |

## UI 设计

### 管理后台"模型能力"表格

位置：在"模型算力点"表格下方，复用相同 Card 样式。

列设计：

| 列 | 类型 | 说明 |
|----|------|------|
| 模型名 | 文本 | 从 `availableModels` 中识别为生图或视频的模型 |
| 图片比例 | Checkbox Group | 8 个选项：1:1/3:2/2:3/4:3/3:4/16:9/9:16/21:9；空=支持全部 |
| 图片档位 | Checkbox Group | 3 个选项：标准/2K/4K；空=仅标准 |
| 视频清晰度 | Checkbox Group | 5 个选项：480p/720p/1080p/2K/4K；空=480p/720p/1080p |

操作：
- "批量填充"按钮：一键把所有模型设为默认值
- 行内编辑，失去焦点即保存（与 `modelCosts` 表格一致）

### 生图工作台动态渲染

```
当前模型 = gpt-image-2
能力 = { imageAspects: ["1:1","3:2","2:3","4:3","3:4","16:9","9:16","21:9"], imageTiers: ["standard","2k","4k"] }

Segmented 显示：[标准][2K][4K]   ← 全部 3 档
比例网格显示：8 个比例按钮（当前档位下）

---

当前模型 = seedream-5-0-pro
能力 = { imageAspects: ["1:1","16:9","9:16"], imageTiers: ["standard","2k"] }

Segmented 显示：[标准][2K]      ← 2 档，4K 隐藏
比例网格显示：1:1 / 16:9 / 9:16（3 个按钮）
4:3 / 3:4 / 21:9 等不显示

---

当前模型 = 某 4K 不支持的模型
能力 = { imageTiers: ["standard"] }

Segmented 隐藏（只支持 1 档，无意义）
比例网格直接显示标准档位比例
```

### 视频工作台动态渲染

```
当前模型 = sora-2
能力 = { videoResolutions: ["1080p"] }

清晰度按钮：只显示 [1080p]
自定义输入框：隐藏（避免用户输入模型不支持的值）

---

当前模型 = seedance-1.5
能力 = { videoResolutions: ["720p","1080p"] }

清晰度按钮：[720p][1080p]
自定义输入框：隐藏
```

## 关键交互逻辑

### 1. 切换模型时的尺寸回退

`useEffectiveConfig` 中：当 `imageModel` 变化时，检查当前 `config.size`：

```ts
// 当前选中 16:9-4k，新模型不支持 4k
// → 自动改为 16:9（标准档位）
// 当前选中 21:9，新模型不支持 21:9
// → 自动改为 auto
```

### 2. 切换档位时的比例回退

`image-settings-panel.tsx` 的 `changeResolutionTier`：

```ts
// 当前选中 16:9，切换到 4K 档位
// 4K 档位下 16:9 可用 → 保持选中
// 4K 档位下 21:9 不可用 → 自动改为第一个可用比例或 auto
```

### 3. 后端 fallback 机制

`apimartImageConfig` 改造（伪代码）：

```go
func resolveImageCapability(model string, setting *model.PublicModelChannelSetting) apimartInputConfig {
    // 1. 先查后端配置
    for _, cap := range setting.ModelCapabilities {
        if cap.Model == model {
            return apimartInputConfig{
                maxResolution: maxTier(cap.ImageTiers),  // ["standard","2k","4k"] → "4K"
                // ...
            }
        }
    }
    // 2. fallback 到原硬编码 switch case
    return legacyApimartImageConfig(model)
}
```

## 兼容性

### 向后兼容

- 老配置（无 `modelCapabilities` 字段）：JSON 反序列化时为空数组，前端走默认值策略（生图全比例+仅标准档，视频三档），后端走原硬编码 fallback
- 不需要数据迁移（字段在 JSON 内，GORM 不感知）
- 不影响 `video_tasks` / `canvas_image_tasks` 等任务表

### 不在本次范围

- 视频侧比例按模型过滤（视频档位较少，当前通用面板 5 个比例足够，暂不做 per-model 过滤）
- Kling V3 / Seedance 的"模式"选择按钮按模型动态生成（这两套面板已有专门处理）
- API 请求时的前端校验（靠后端钳制兜底）
- 画布生图浮层 / 工作流配置的 `capabilities` 透传（后续按需补）

## 执行步骤

1. **后端**：新增 `ModelCapability` 结构 + 默认值 + 归一化
2. **前端管理后台**：模型能力编辑表格 + 类型扩展
3. **前端 store**：透传能力数据 + 切换模型时的回退逻辑
4. **前端工作台**：`image-settings-panel.tsx` + `video-settings-panel.tsx` 按能力动态渲染
5. **文档**：更新 `backend-database.md` 和 `pending-test.md`

## 风险与注意事项

1. **`availableModels` 与 `modelCapabilities` 不同步**：管理员添加新模型但忘记配置能力时，走默认值策略，不会崩溃
2. **`imageAspects` 为空=全部**的语义可能让管理员困惑，UI 上需要明确提示"留空=支持全部"
3. **后端 `apimartImageConfig` 改造**需保证硬编码 fallback 与新配置语义一致，避免出现"前端显示 4K 可选但后端钳制为 2K"的不一致
4. **管理后台表格性能**：模型数量较多时，表格行数可能 30+，需要考虑虚拟滚动或分组（暂不处理，先看实际数据量）
