# 创作Agent参数chips跟随模型能力展示（方案文档）

> 状态：已实施（2026-08-30）| 创建：2026-08-30 | 关联：`canvas-assistant-composer.tsx`

## 一、背景与现状

创作Agent输入框底部的「图片参数」「视频参数」chips，其选项来自**前端硬编码常量**（`canvas-assistant-composer.tsx` 顶部）：

| 组 | 常量 | 值 |
|---|---|---|
| 图片比例 | `imageRatioOptions` | 1:1 ~ 21:9 + 智能（auto） |
| 图片分辨率 | `imageQualityOptions` | standard / 2k / 4k |
| 视频比例 | `videoRatioOptions` | 1280x720 / 720x1280 / 1024x1024 / 1024x768 / 768x1024 |
| 视频分辨率 | `videoQualityOptions` | 480 / 720 / 1080 |

问题：**后台「模型能力」里配置的 `imageAspects`（比例）、`imageTiers`（档位）、`videoRatios`（比例）、`videoResolutions`（分辨率）不约束这四组选项**——Agent弹窗里可以选到当前模型不支持的能力，提交后要么被后端拒绝、要么静默降级。节点设置弹窗（图片/视频）已经按能力过滤了，Agent侧没有跟进。

补充事实（决定方案边界）：
- Agent生成时**不用chips选模型**：图片/视频模型取全局配置默认项（`imageModel`/`videoModel`，回落`model`），见 `buildGenerationConfig`（`canvas-client-page.tsx:4897`）。chips跟随的"模型能力"即这两个默认模型的能力。
- `CanvasAgentConfig` 无 imageModel/videoModel 字段，chips无从知道"用户会选哪个模型"，因此**以全局默认模型的能力为准**是当前架构下的正确解。

## 二、目标

1. 四组选项按「生效的图片/视频默认模型」的模型能力过滤展示；
2. 当前选中值不在能力范围内时自动回落到合法值（chip标签同步刷新）；
3. 后台未配置能力（`modelCapabilities` 缺失/无该模型条目）时，保持现状全量选项（向后兼容，与节点弹窗的兜底策略一致）；
4. 主页与画布两处Agent输入框行为一致（两者共用 `CanvasAssistantComposer`，单点修改天然覆盖）。

## 三、能力数据来源与值格式

| 能力字段 | 格式 | 约束的chips组 |
|---|---|---|
| `cap.imageAspects` | `"1:1"`、`"16:9"`…（w:h 比例串） | 图片比例 |
| `cap.imageTiers` | `"standard" | "2k" | "4k"` | 图片分辨率 |
| `cap.videoRatios` | `"16:9"` 等比例串（`resolveVideoRatios` 直出） | 视频比例 |
| `cap.videoResolutions` | `"480p"` / `"720p"` / `"1080p"`（见 `normalizeVideoResolution`） | 视频分辨率 |

能力获取：
```ts
const imageModel = config.imageModel || config.model;
const videoModel = config.videoModel || config.model;
const imageCap = findModelCapability(config, imageModel);   // use-config-store.ts:290
const videoCap = findModelCapability(config, videoModel);
```

## 四、方案设计

改动集中在 `canvas-assistant-composer.tsx`，把四个模块级常量数组改为**组件内 useMemo 派生**（配置变化、模型切换时自动重算）：

### 4.1 图片比例
- 基础集合沿用现有 `imageRatioOptions`（值含 `auto`）；
- `imageCap?.imageAspects` 非空时：过滤出 `imageAspects` 包含的项；`auto`（智能）保留与否建议跟随图片节点弹窗的同款判定（节点弹窗未配置 aspects 时展示全部，此处从简：**auto 始终保留**，作为"交给模型自适应"的兜底）；
- label 直接复用常量中的映射，新增比例值（后台新配了但常量没有的）追加进集合，label 用值本身。

### 4.2 图片分辨率
- `imageCap?.imageTiers` 非空时：仅展示 `imageTiers` 包含的档位（standard/2k/4k）；
- 当前 `agentConfig.imageQuality` 不在集合内 → `onAgentConfigChange` 回落：优先 `resolveEffectiveImageTier(current, cap)`（use-config-store.ts:349 已有该clamp函数，直接复用）。

### 4.3 视频比例
- `videoCap?.videoRatios` 非空时：过滤 `videoRatioOptions`；
- **注意值域差异**：chips 的 value 是像素尺寸（`"1280x720"`），能力是比例串（`"16:9"`）。过滤时经 `normalizeSeedanceRatio` / `normalizeVideoSizeValue` 归一到比例后比对（`videoSizeRatioLabel` 内已有同样的归一逻辑可参考）；
- `adaptive`（自适应）始终保留；
- 落选回落：当前 `videoSize` 不在集合内 → 取集合第一项（或 adaptive）。

### 4.4 视频分辨率
- `videoCap?.videoResolutions` 非空时：过滤 480/720/1080（比对时归一 `p` 后缀，参考 `normalizeVideoResolution`）；
- 落选回落：优先 `720`，其次集合第一项。

### 4.5 失效值回落机制（公共）
- useEffect 监听派生选项 + 当前值：当前值不在集合内时自动 `onAgentConfigChange` 写入回落值（模式与节点弹窗 `image-settings-panel.tsx:60` 的"activeTier不在effectiveTier时自动纠正"一致）；
- chip 的 label 文案由 `imageSizeLabel` / `imageQualityTierLabel` / `videoSizeRatioLabel` / `videoResolutionLabel` 生成，回落刷新后自然更新，无需额外处理。

### 4.6 兜底
- `cap` 为 undefined（后台未给该模型配能力）→ 该组使用现有全量常量，行为与今天完全一致；
- 后台新配了常量中没有的值 → 追加展示（label 用原始值），不阻塞。

## 五、不做的事（边界）

- 不给 `CanvasAgentConfig` 增加 imageModel/videoModel（chips 不选模型，仍用全局默认；"Agent按任务自选模型"是另一独立需求）；
- 不改 `CanvasAgentConfig` 的存储结构与已保存画布的兼容性；
- 不改节点弹窗的能力过滤逻辑（已存在）。

## 六、涉及文件

| 文件 | 改动 |
|---|---|
| `next/src/app/(user)/canvas/components/canvas-assistant-composer.tsx` | 主要改动：常量→useMemo派生 + 失效回落 |
| `next/src/stores/use-config-store.ts` | `resolveEffectiveImageTier` / `resolveEffectiveVideoQuality` 加 export（原为模块私有，逻辑未动） |

实施备注：四组派生选项命名 `xxxOptionsForRender`；能力值兼容处理——图片比例 `imageAspects` 直配 w:h 串、视频比例经 `normalizeSeedanceRatio` 归一比对、视频分辨率经 `normalizeVideoResolutionValue` 归一（480p/480 均可）；能力中存在而基础常量没有的值追加展示（label 用原值）；失效回落 useEffect 挂在 composer 内，主页与画布共用同一组件天然覆盖。

## 七、验收标准

1. 后台给默认图片模型配置 `imageTiers: [standard, 2k]`：Agent图片参数弹窗只出现 标准/2K，无 4K；已选 4K 的旧会话打开后自动回落为 2K；
2. 默认视频模型配置 `videoResolutions: [720p, 1080p]`：视频参数弹窗无 480p；
3. 配置 `videoRatios: [16:9, 9:16]`：比例仅剩 16:9 / 9:16 / 自适应；
4. 删除该模型的能力配置：四组选项恢复全量（现状行为）；
5. 主页与画布创作Agent行为一致；
6. 回落发生时 chip 标签文字同步更新，无报错。
