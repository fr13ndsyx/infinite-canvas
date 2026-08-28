---
title: 图片比例与分辨率解耦方案
description: 把图片生成的比例和分辨率档位拆成两个独立参数，让智能比例也能配 2K/4K
---

# 图片比例与分辨率解耦方案

## 背景

当前图片生成的「比例」和「分辨率档位」**编码在同一个 `config.size` 字段里**：

- `aspectOptions`（`next/src/components/image-settings-panel.tsx`）每条把比例+档位打包，例如 `{ value: "1:1-2k", size: "2048x2048", tier: "2k" }`、`{ value: "1:1", tier: "standard" }`（standard 档直接用 ratio 作 value、无 size）、`{ value: "auto", tier: "standard" }`。
- `config.size` 实际存的值是混合体：standard 档存比例（`1:1`）、2k/4k 档存像素尺寸（`2048x2048`）、智能比例存 `auto`。
- `resolutionTier` 是组件内 local state，由 `tierOfAspect(size)` 推导，但该函数只识别 `-2k`/`-4k` 后缀（针对 value），而 `config.size` 存的是 size 字符串，导致档位识别在 2k/4k 时实际是失效的。
- `changeResolutionTier` 切档位时要同步换 size 才能保留比例（否则比例丢失），逻辑绕。

这带来三个问题：

1. **「智能比例」无法配 2K/4K**：`auto` 只是 standard 档的单个选项，表达不出「智能比例 + 2K」组合。
2. **比模型能力更受限**：主流生图模型（GPT-image-1 的 `size=auto`+`quality`、Grok-imagine 的 `aspect_ratio=auto`+`resolution=1k/2k`、Seedream 官方的 `size=2K/4K`+比例由 prompt 自动）都把比例和分辨率设计成**两个独立参数**，`auto` 只是比例维度的一个取值。当前数据结构表达不出这些组合。
3. **切档位/切比例逻辑脆弱**：因为档位编码在 size 里，切档位要找「同比例新档位」的 aspect 换 size，比例和档位互相牵扯，容易出 bug（已在 2026-08-27 修过两轮：切档位重置比例、智能比例切档位无效）。

## 目标

- `config.size` 只存**比例**（`1:1` / `16:9` / `9:16` / `auto` 等），不再混入档位信息
- 新增独立字段 `config.imageTier` 存**分辨率档位**（`standard` / `2k` / `4k`），与比例解耦
- 「智能比例（auto）」也能选 2K/4K，对齐主流模型能力
- 比例和档位可独立切换，互不影响
- 后端按模型把 `(ratio, tier)` 映射到各家 API 的 `size`/`quality`/`aspect_ratio`/`resolution`

## 已确认决策

- **gpt-image-1 档位映射**：档位映射到 `quality` 参数（standard→`low`、2k→`medium`、4k→`high`）。注意 gpt-image 的 4K 档实际输出仍是 ~1536px 级别像素而非真 4K；是否对用户暴露 4K 按钮，由后台该模型的 `imageTiers` 配置决定
- **Seedream 比例控制**：比例写入 prompt 自然语言，接受生成比例轻微漂移，不做参数级精确控制
- **4K 降级策略**：UI 侧用现有 `imageTiers` 能力控制（档位不在能力内不显示按钮），后端仅做兜底截断，不新增智能降级逻辑
- **后端映射承载方式**：`(ratio,tier)→API` 映射不写代码，作为 `ModelCapability` 适配层配置数据。前置依赖「渠道适配层全配置化」（删除 `apimartImageConfig` 按模型名硬编码 switch、通用默认值兜底，见 todo.md 生图/视频模型能力配置收尾项）
- **实施顺序**：① 适配层全配置化（后端 + 后台配置项，前端零改动）→ ② 前端拆分 `size`+`imageTier` + 存量迁移（根治切档位 bug，standard 档行为不变）→ ③ 后端映射作为配置数据填入（「智能比例 + 2K/4K」上线）

## 数据模型变更

### 前端 `AiConfig`（`next/src/stores/use-config-store.ts`）

- `size: string` — **语义改为纯比例**，取值 `1:1` / `3:2` / `2:3` / `4:3` / `3:4` / `16:9` / `9:16` / `21:9` / `auto`（智能比例）。默认 `1:1`。不再出现 `2048x2048` 这类像素尺寸、也不带 `-2k`/`-4k` 后缀。
- 新增 `imageTier: string` — 分辨率档位，取值 `standard` / `2k` / `4k`。默认 `standard`。
- `quality: string` — 保留，仅用于全景模式（low/medium/high）和部分模型直传 quality 的场景；非全景图片生成不再用 quality 表达档位。
- `count: string` — 不变。

### 后端模型能力（`Go/model/setting.go` 的 `ModelCapability`）

- 已有 `ImageAspects []string`、`ImageTiers []string` 字段，正好对应解耦后的两个维度，**无需新增字段**。语义不变：`imageAspects` 空=全部标准比例；`imageTiers` 空=仅 standard。

### 节点元数据（`CanvasNodeData.metadata`）

- `metadata.size` 改存纯比例；新增 `metadata.imageTier`。画布节点保存/恢复走 `metadata`，迁移见下文。

## 改动范围

### 前端

**`next/src/components/image-settings-panel.tsx`（核心重构）**

- `aspectOptions` 拆分：去掉每条的 `tier` 和 `size`（像素尺寸），只保留 `value`（比例）+ `label` + `width`/`height`（用于图标预览）+ `icon`。`auto` 仍是其中一条。
  - 不再有 `1:1-2k` / `1:1-4k` 这种组合项；同一比例只有一条，档位由独立 `imageTier` 控制。
- 删除 `tierOfAspect`、`resolutionTier` local state、`changeResolutionTier` 里「找同 label 新 tier aspect 换 size」的绕路逻辑。
- `selectAspect(value)` → `onConfigChange("size", value)`（只设比例，不动档位）。
- 新增 `changeImageTier(tier)` → `onConfigChange("imageTier", tier)`（只设档位，不动比例）。
- 「选择分辨率」段的按钮 onClick 调 `changeImageTier`；当前高亮按 `config.imageTier` 判断。
- 「选择比例」段的 `visibleAspects` 过滤只看 `imageAspects` 能力，不再按 tier 切换可见集合（同比例始终一条）。
- 按钮标签（`canvas-image-settings-popover.tsx`）：`档位·比例`（如 `2K·1:1`），auto 比例时显示 `2K·智能比例`。
- 导出函数 `imageResolutionTierLabel` 改为读 `config.imageTier`（而非从 size 推导）；`imageSizeLabel` 语义不变（auto→智能比例）。

**`next/src/stores/use-config-store.ts`**

- `AiConfig` 类型加 `imageTier: string`。
- `defaultConfig` 加 `imageTier: "standard"`。
- `resolveEffectiveImageSize` 简化：只校验比例是否在 `imageAspects` 内，不再处理 `-2k`/`-4k` 后缀。
- 新增 `resolveEffectiveImageTier(tier, cap)`：校验 tier 是否在 `imageTiers` 内，不在回退 `standard`（参照 `resolveEffectiveVideoQuality` 模式）。
- `useEffectiveConfig` 切模型时同时 resolve size 和 imageTier。

**`next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`**

- 按钮标签和 panel 调用适配新字段（传 `imageTier`、用新标签函数）。

**消费 `config.size` 的下游**（需排查像素尺寸依赖）

- 画布节点保存/恢复（`canvas-client-page.tsx` 的 project 序列化）、图片生成请求构造、工作流（`creative-workflow-workspace.tsx`）、图片页（`image/page.tsx`）、配置弹窗（`app-config-modal.tsx`）、模型定价页（`model-pricing/page.tsx`）等所有读写 `config.size` 的地方，都要确认对 `2048x2048` 这类值的依赖并迁移到 `imageTier`。

### 后端（重点，按模型映射 `(ratio, tier)` → API 参数）

当前图片生成请求在 `Go/handler/ai.go` 走 OpenAI 协议直传，`Go/handler/apimart_image.go` 走 APIMart 适配。解耦后 `config.size`（比例）和 `config.imageTier`（档位）需要按目标模型映射成各家 API 的参数：

| 模型/协议 | 比例 → | 档位 → | 说明 |
|---|---|---|---|
| OpenAI 协议（gpt-image-1 等） | `size`：`auto` 直传；`1:1`→`1024x1024`、`16:9`→`1536x1024`、`9:16`→`1024x1536` 等 | `quality`：standard→`low`、2k→`medium`、4k→`high`（或按模型支持） | gpt-image-1 的 size 不按 2k/4k，档位映射到 quality |
| Grok-imagine（aspect_ratio+resolution 协议） | `aspect_ratio`：`auto`/`1:1`/`16:9` 直传 | `resolution`：standard→`1k`、2k→`2k`、4k→`2k`（grok 仅 1k/2k，4k 截断到 2k） | 比例和档位两个独立参数，正好对齐 |
| Seedream 官方（size=2K/4K + prompt 描述比例） | 比例写入 prompt 自然语言（或用 width/height） | `size`：standard→`2K`（或最小档）、2k→`2K`、4k→`4K` | 智能比例+档位 = size=2K + prompt 不指定具体比例 |
| APIMart / 其他聚合 | 走各自适配层 `apimart_image.go`，按渠道模型能力映射 | 同上，按模型分流 | 复用现有 `apimartInputConfig` 机制扩展 |

需要：

- 在图片请求归一化阶段（`ai.go` 的 image 分支 / `apimart_image.go`）拿到 `(size, imageTier)`，按 `channel` + `model` 查模型能力，映射出对应 API 的 `size`/`quality`/`aspect_ratio`/`resolution` 等字段。
- **映射规则不写代码，全部进 `ModelCapability` 适配层配置数据**（见「已确认决策」）。适配层全配置化先行实施：删除 `apimartImageConfig` 按模型名硬编码的 switch，通用默认值兜底；本方案的 `(ratio,tier)` 映射作为配置数据填入同一套配置体系。
- 后端只保留一个 `resolveImageRequestParams(channel, model, ratio, tier)` 类的 helper，从配置读规则做翻译；配置缺失时按通用默认（OpenAI images 标准协议）兜底。

## 数据迁移

存量 `config.size` 可能是 `2048x2048`（2k 像素）、`4096x4096`（4k 像素）、`1:1`（standard 比例）、`auto` 等。迁移规则：

| 旧 `config.size` | 新 `config.size`（比例） | 新 `config.imageTier` |
|---|---|---|
| `2048x2048` / `2048x1152` / ...（2k 像素尺寸） | 反查 `aspectOptions` 得比例（如 `1:1`） | `2k` |
| `4096x4096` / `3840x2160` / ...（4k 像素尺寸） | 反查比例 | `4k` |
| `1:1` / `16:9` / ...（standard 比例） | 原值 | `standard` |
| `auto` | `auto` | `standard`（旧 auto 都是 standard 档） |
| `1:1-2k` / `16:9-4k`（带后缀的旧 value，若历史残留） | 去后缀得比例 | 对应档位 |

迁移位置：

- **前端**：`use-effective-config` 或 store 加载时做一次就地迁移（识别旧 size 格式 → 拆成 size+imageTier），存量项目打开画布即自动转换。
- **后端**：`PublicModelChannelSetting`/用户配置加载时同样兜底迁移（识别 `config.size` 是像素尺寸或带后缀 → 写入 imageTier）。
- 不做数据库 schema 强迁移，靠加载时 normalize（参照 `normalizePublicSettingWithChannels` 模式）。

## 兼容性

- 旧前端配置无 `imageTier` 字段时，默认 `standard`，与旧 `1:1`/`auto` 行为一致。
- 旧 `config.size` 是像素尺寸/带后缀时，迁移逻辑反查出比例+档位，行为等价。
- 后端对未迁移的旧请求（仍传像素尺寸 size）保持兼容读取（迁移期内双轨）。
- 全景模式（`panorama`）仍用 `quality`（low/medium/high），不受影响。

## 验证清单

1. 默认配置：`size=1:1`、`imageTier=standard`，按钮显示 `标准·1:1`
2. 选 `16:9` → 切 `2K` → `size=16:9`、`imageTier=2k`，按钮 `2K·16:9`，比例不变 ✓
3. 选 `智能比例(auto)` → 切 `2K` → `size=auto`、`imageTier=2k`，按钮 `2K·智能比例`（**解耦后新增能力**）✓
4. 切档位不重置比例、切比例不重置档位（两个独立维度）
5. 切模型（能力不同）：比例/档位不在新模型能力内时各自回退，不互相牵连
6. 存量项目打开：旧 `size=2048x2048` 自动迁移为 `size=1:1`+`imageTier=2k`，按钮显示一致
7. 后端按模型映射：gpt-image-1 收到 `(16:9, 2k)` → `size=1536x1024`+`quality=medium`；grok-imagine 收到 `(auto, 2k)` → `aspect_ratio=auto`+`resolution=2k`；seedream 收到 `(auto, 2k)` → `size=2K`+比例不指定
8. 全景模式行为不变（仍走 quality）

## 风险与未决

- **映射配置化后，配错由管理员承担**：映射规则进 `ModelCapability` 配置数据后，需按各模型接口文档逐项确认；配错会导致该模型请求报错，用 AI 日志（`saveAIProxyLog`）排查上游报错。存量模型行为靠实施时一次性把现有硬编码规则 seed 成配置数据保证不变。
- **`config.size` 下游依赖排查**：前端多处读写 size，需逐个确认没有依赖像素尺寸的逻辑（如节点预览尺寸、导出尺寸等），迁移可能遗漏。
- **4K 截断**：UI 侧用 `imageTiers` 能力控制显隐（已确认）；后端仍保留兜底截断，防止绕过 UI 的请求。
- 前端下游排查清单在实施时补。

## 待办状态

- 状态：方案已确认，待实施
- 优先级：中（对齐模型能力 + 修复切档位脆弱性，非阻塞但体验提升明显）
- 实施顺序：① 适配层全配置化（见 todo.md 生图/视频模型能力配置收尾项）→ ② 前端拆分与存量迁移 → ③ 后端映射配置数据填入
- 触发条件：已确认需要「智能比例 + 2K/4K」；适配层全配置化完成后即可启动前端拆分
