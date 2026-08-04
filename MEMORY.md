# 项目长期记忆 — infinite-canvas

## 架构速览
- 前端：Next.js 16.2（`next/`，:3000），经 `src/app/api/[...path]/route.ts` 反代 `/api/*` 到后端
- 后端：Go 1.25 + Gin + GORM（`Go/`，:8080）；自研画布引擎（DOM+SVG）；3D 导演台为预构建 three.js iframe+postMessage
- 设置体系：`settings` 表仅 public/private 两行 JSON；`availableModels` 语义"空=全部开放"；公开接口 `/api/settings` 从私有渠道派生并脱敏
- 计费：平台渠道（后端预扣算力点→转发→失败返还）vs 用户自定义渠道（浏览器直连，不收费）

## 本机环境坑（重要）
- 无系统 Go/bun；Go SDK 在 `C:\Users\Administrator\go-sdk\`，前端用 managed node 22.22.2 + npm
- `NODE_OPTIONS` 被全局注入 genie-safe-delete shim，会导致 Next dev 崩溃 → 启动时须 `NODE_OPTIONS=""`
- Next 对 `.next/` 新文件在后台/提权执行时必现 EPERM → `next build` 须前台 PowerShell 执行；`next start` 可后台
- Bash 工具每条命令 cwd 重置为仓库根目录 → 命令内必须显式 `cd`
- Git Bash 下 curl `-o` 须用 Windows 路径（`C:\...`），POSIX 路径会 error 23
- git push/pull 走 https 时 schannel 报 CRYPT_E_REVOCATION_OFFLINE（吊销服务器不可达，schannelCheckRevoke=false 也无效）→ 用 `git -c http.sslBackend=openssl push` 绕过

## AGENTS.md 关键约束
- 改任何文件前必须先询问用户
- 任务完成前检查更新 `docs/progress/todo.md` 与 `docs/progress/pending-test.md`
- 最少行数原则；不写旧数据兼容；不执行构建/语法检查（用户自己做）
- 工作区已有用户改动时不要回滚、不要覆盖

## 2026-08-03 教训
- 工作区曾被整体回退（git checkout + 删未跟踪文件）导致未提交修复全部丢失；以后有修复应尽快提交或备份

## 2026-08-03 合并 feat/model-capabilities → main（commit e9cbfbb）

### 完成的工作
- 后端：`Go/model/setting.go` 新增 `ModelCapability` 结构（`Model` / `ImageAspects` / `ImageTiers` / `VideoResolutions`）；`PublicModelChannelSetting` 添加 `ModelCapabilities` 字段
- 后端：`Go/service/settings.go` 新增 `normalizeModelCapabilities`（按 `AvailableModels` 过滤、同模型去重、字段去空格），在 `normalizePublicSettingWithChannels` 中调用
- 前端管理后台：`next/src/app/(admin)/admin/model-pricing/page.tsx` 新增「模型能力」编辑卡片，仅展示生图或视频模型，每模型可勾选图片比例（8 选项）、图片档位（标准/2K/4K）、视频清晰度（480p/720p/1080p/2K/4K）
- 前端 store：`next/src/stores/use-config-store.ts` 扩展 `AiConfig.modelCapabilities`；新增 `resolveEffectiveImageSize` / `resolveEffectiveVideoQuality`，切换模型时若当前 `size`/`vquality` 不在新模型能力内自动回退
- 前端工作台：`image-settings-panel.tsx` / `video-settings-panel.tsx` 新增 `capabilities` prop，按能力动态过滤档位、比例和清晰度按钮
- 类型与归一化：`next/src/services/api/admin.ts` 新增 `AdminModelCapability` 类型；`next/src/app/(admin)/admin/settings-shared.ts` 新增 `normalizeModelCapabilities`

### 空字段默认值策略（前端处理）
- `imageAspects` 空=支持全部标准比例
- `imageTiers` 空=仅标准档
- `videoResolutions` 空=480p/720p/1080p 三档

### 涉及文档
- `docs/backend/backend-database.md`：`modelChannel.modelCapabilities` 字段及每项字段说明
- `docs/progress/pending-test.md`：新增「生图/视频模型能力配置」章节，14 项验证步骤
- `docs/progress/todo.md`：状态改为「已实施，待测试」

### 修复记录
- `a918d5c` 修正 `model-pricing/page.tsx` 中 `modelMatchesCapability` 导入路径（实际在 `use-config-store.ts` 而非 `use-user-store.ts`，导致页面运行时报错 `is not a function`）

### 待验证（pending-test.md）
- 管理后台「模型能力」卡片勾选并保存持久化
- 生图/视频工作台按模型能力动态渲染选项
- 切换模型时 `size`/`vquality` 自动回退
- 未配置能力的模型走默认值策略

### 待办（todo.md）
- 后端 `apimartImageConfig` / `kieModelInputConfig` 优先读配置、硬编码作 fallback 的改造暂未实施，后续按需补

## 2026-08-03 合并 fix/bugfixes → main

### 完成的工作

**1. 渠道模型选择隔离与定价表布局优化**
- `next/src/app/(admin)/admin/channels/page.tsx`：删除 `knownModels` state 及 `rememberModels` / `rememberKnownModels` / `collectKnownModels` 三个辅助函数；"可用模型" Select 下拉候选改为 `modelSelectOptions`（本渠道已选 + 本次拉取）；切换/新建渠道时自动清空上一次的拉取候选，避免跨渠道污染；`openChannelModelSelector` 不再混入 knownModels
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增 `pricingTableData`（按渠道分组扁平化 + rowSpan 标记），用 antd Table 替换原 grid 卡片；列：渠道（rowSpan 合并 + 全选 Checkbox + 计数）/ 模型名（ellipsis + tooltip）/ 开放（Switch）/ 单价（InputNumber + "点"后缀）

**2. 默认模型字段重构**
- 后端 `Go/model/setting.go`：删除 `DefaultModel` 字段，新增 `DefaultAudioModel` 字段
- 后端 `Go/service/settings.go`：新增 `isAudioModelName`（与前端关键词一致），更新 `isTextModelName` 排除音频；normalize 新增 `defaultAudioModel` 修复，删除 `defaultModel` 修复
- 后端 `Go/service/workflow_agent.go`：删除 `defaultModel` fallback 分支（`defaultTextModel` 已覆盖）
- 前端 `next/src/services/api/admin.ts`：删除 `defaultModel`，新增 `defaultAudioModel`
- 前端 `next/src/app/(admin)/admin/settings-shared.ts` / `channels/page.tsx`：emptySettings 调整
- 前端 `next/src/app/(admin)/admin/model-pricing/page.tsx`：「默认模型」卡片 4 个 Select 改为文本/图片/视频/音频顺序，options 按模型能力过滤（`textModelOptions` / `imageModelOptions` / `videoModelOptions` / `audioModelOptions`）
- 前端 `next/src/stores/use-config-store.ts`：`fallbackModel` 删除，`model` 和 `textModel` 兜底都走 `fallbackTextModel`；`fallbackAudioModel` 改为 `validDefault(defaultAudioModel, audioModels) || preferredModel(audioModels, isAudioModelName)`

**3. 模型选择器渠道名隐藏与渠道字段改名**
- `next/src/components/model-picker.tsx`：`ModelLabel` 移除 channelName 显示，下拉项只显示模型名 + 图标
- `next/src/app/(admin)/admin/channels/page.tsx`：列表表头"名称"→"渠道"，空值"未命名模型"→"未命名渠道"；Drawer Form.Item label "名称"→"渠道"；顶部按钮"新增模型"→"新增渠道"；Drawer title "新增模型/编辑模型"→"新增渠道/编辑渠道"

**4. 文本节点自动弹出 AI 输入框**
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：两处 `setDialogNodeId` 判断去掉 `CanvasNodeType.Text`（`createNode` 函数 + 连线拖到空白处新建节点）；点击节点逻辑删除文本节点特殊分支，让它和图片/视频节点一样走 `setDialogNodeId(clickedNodeId)`
- `next/src/app/(user)/canvas/components/canvas-node-prompt-panel.tsx`：`promptPlaceholder` 文本节点空内容分支提示语改为"请输入你想要生成的文本内容或在上方输入你的提示词"

### 新增待办（todo.md）
- 画布 Agent 行为风格可配置（`canvasAgentBehavior`：`conservative` 默认 / `eager`），方案文档 `docs/progress/canvas-agent-behavior-config.md`，暂未实施

### 涉及文档
- `docs/backend/backend-database.md` / `docs/backend/system-settings.md`：字段说明同步（删除 `defaultModel`，新增 `defaultAudioModel`）
- `docs/progress/pending-test.md`：新增 4 个验证章节（渠道模型隔离与定价表 / 默认模型字段重构 / 渠道名隐藏与改名 / 文本节点 AI 输入框）
- `docs/progress/todo.md`：新增"画布 Agent 行为风格可配置"待办
- `docs/progress/canvas-agent-behavior-config.md`：新增方案文档

### 待验证（pending-test.md）
- 渠道 A 模型不污染渠道 B 的 Select 下拉和选择弹窗
- 定价表表格布局、rowSpan 合并、模型名截断 tooltip、全选 Checkbox、单价 disabled 联动
- 默认模型 4 个 Select 顺序（文本/图片/视频/音频）和 options 按能力过滤
- 模型选择下拉不显示渠道名小字
- 渠道管理页文案统一为"渠道"
- 右键新建文本节点自动弹 AI 输入框，移开后点回来能重新弹出

## 2026-08-04 提交到 main（commit ffc9c74）

### 完成的工作

**1. 生图接口模式（apiMode）改为后台渠道控制**
- 后端 `Go/model/setting.go`：`ModelChannel` 和 `PublicModelChannelInfo` 新增 `ApiMode` 字段（`images` 默认 / `responses`）
- 后端 `Go/service/settings.go`：`normalizeModelChannel` 归一化 `ApiMode`（非 `responses` 一律视为 `images`）；`publicChannelInfos` 透传 `ApiMode`
- 前端 `next/src/services/api/admin.ts`：`AdminModelChannel` 和 `AdminPublicModelChannelInfo` 新增 `apiMode` 字段
- 前端 `next/src/app/(admin)/admin/channels/page.tsx`：渠道编辑抽屉新增「生图接口」Select，默认 Images API
- 前端 `next/src/stores/use-config-store.ts`：`resolveEffectiveConfig` 按当前生图模型所属渠道解析 `apiMode`，本地模式固定 `images`
- 前端 `next/src/app/(user)/image/page.tsx`：删除主面板和快速配置弹窗的「接口模式」Segmented
- 前端 `next/src/components/workflows/creative-workflow-workspace.tsx`：删除 apiMode Select
- 画布生图/视频浮层 `canvas-image-settings-popover.tsx` / `canvas-video-settings-popover.tsx`：传入 `capabilities` 的小修正

**2. 视频创作台底部设置栏按模型能力动态显示清晰度**
- `next/src/app/(user)/video/page.tsx`：底部 compact 布局的清晰度下拉从 `config.modelCapabilities` 按当前 `model` 查找 `videoResolutions`；有值按配置生成选项，空数组不显示清晰度选择，未配置走默认三档 480p/720p/1080p。与画布节点设置面板行为一致，新模型不支持分辨率调节时管理员后台不勾选即可，无需硬编码

**3. 深色模式 Checkbox/Switch 样式修复**
- `next/src/app/globals.css`：新增 `.dark .ant-checkbox-checked::after` 强制对勾黑色（v6 移除了 `.ant-checkbox-inner`，对勾 `::after` 直接在 `.ant-checkbox` 上）；新增 `.dark .ant-switch-checked .ant-switch-handle::before` 强制圆点深色（track 背景为 colorPrimary=白，圆点默认白色看不清）。样式放在 `@layer` 外部并使用 `!important` 解决 antd v6 CSS-in-JS 优先级问题

**4. 参考图/视频/音频删除按钮图标颜色统一**
- `next/src/app/(user)/image/page.tsx`：参考图删除按钮 `Trash2` 图标添加 `style={{ color: "#ffffff" }} strokeWidth={2.5}`
- `next/src/app/(user)/video/page.tsx`：参考图、参考视频、参考音频三处删除按钮 `Trash2` 图标统一添加 `style={{ color: "#ffffff" }} strokeWidth={2.5}`
- 原因：浅色模式下 `currentColor` 未正确继承 `text-white`，导致图标显示为黑色看不清

**5. 模型能力配置页面文案与布局优化**
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：删除「（空=全部）」「（空=仅标准）」「（空=480p/720p/1080p）」冗余文案；图片比例、图片档位、视频清晰度标题文字添加 `display: "block", marginBottom: 8` 样式，增加与勾选按钮的间距

### 涉及文件（15 个）
- 后端：`Go/model/setting.go`、`Go/service/settings.go`
- 前端：`next/src/services/api/admin.ts`、`next/src/stores/use-config-store.ts`、`next/src/app/(admin)/admin/channels/page.tsx`、`next/src/app/(admin)/admin/model-pricing/page.tsx`、`next/src/app/(user)/image/page.tsx`、`next/src/app/(user)/video/page.tsx`、`next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`、`next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`、`next/src/components/image-settings-panel.tsx`、`next/src/components/video-settings-panel.tsx`、`next/src/components/workflows/creative-workflow-workspace.tsx`、`next/src/app/globals.css`
- 文档：`docs/progress/pending-test.md`

### 待验证（pending-test.md）
- apiMode 后台渠道控制：前端不再有切换 UI，按渠道配置自动走 Images/Responses API
- 视频底部设置栏：按模型能力动态显示清晰度，空数组不显示，未配置走默认三档
- 深色模式 Checkbox 对勾为黑色、Switch 圆点为深色
- 浅色模式参考文件删除按钮图标为白色
- 模型能力页面文案和间距优化

### 待办（todo.md）
- 无新增待办

## 2026-08-04 合并 fix/canvas-image-tiers → main（commit 05d6edc + merge）

### 完成的工作

**1. 画布图片节点分辨率档位显示修复（最终版）**
- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：能力查找从 `config.imageModel || config.model` 改为 `config.model`，画布节点用用户实际选中的模型查能力（原 `config.imageModel` 是全局默认图片模型，非节点选中模型）
- `next/src/components/image-settings-panel.tsx`：Segmented 渲染条件从 `tierOptions.length >= 2` 改为 `>= 1`，保证模型只配 1 档时也渲染

**2. 顶栏算力图标补全**
- `next/src/components/layout/user-status-actions.tsx`：default variant 新增算力余额显示，使用 `CreditSymbol` + stone 配色，一处改动覆盖全站顶栏 + 管理后台顶栏（原来仅画布顶栏有算力显示）

**3. 视频首尾帧能力拆分**
- 后端 `Go/model/setting.go`：`ModelCapability` 新增 `SupportsFirstFrame` 字段，保留 `SupportsFirstLastFrame` 作为兼容字段（勾选首尾帧=首帧+尾帧都支持，勾选首帧=仅首帧）
- 前端类型 `next/src/services/api/admin.ts` + normalize `settings-shared.ts`：透传 `supportsFirstFrame`
- 前端 store `next/src/stores/use-config-store.ts`：新增 `resolveSupportsFirstFrame`（`supportsFirstFrame || supportsFirstLastFrame`）+ `resolveSupportsLastFrame`（仅 `supportsFirstLastFrame`），未配置时向后兼容
- 后台配置 UI `model-pricing/page.tsx`：原「首尾帧」Checkbox 拆为「首尾帧」+「首帧」两项
- 画布视频设置 `canvas-video-settings-popover.tsx`：通用面板和 Kling V3 面板的「首尾帧」分组都拆为「首帧」「尾帧」两个独立分组，按能力开关分别显隐
- 视频工作台 `video/page.tsx`：侧栏「首尾帧」Section 拆为「首帧」「尾帧」两个 Section；`FrameReferenceStrip` 新增 `showFirst`/`showLast` 参数；去掉 `!kling` 守卫
- `video.ts`：去掉首尾帧 `!kling` 守卫，统一按能力开关决定是否传参
- `canvas-client-page.tsx`：两处 `frameReferencesEnabled` 拆为 `firstFrameEnabled`/`lastFrameEnabled`，不支持侧图片合并进普通参考图

**4. 画布生图节点去掉数量选择**
- `canvas-image-settings-popover.tsx`：`showCount` 默认改为 `false`
- `canvas-client-page.tsx`：图片生成 / 全景图生成 `count` 固定为 1
- `canvas-config-node-panel.tsx` / `canvas-node-prompt-panel.tsx`：credits 计算固定 count=1

**5. 生图并发保护与数量 UI 滑块化**
- `next/src/services/api/image.ts`：`requestImages` 去掉 `useConcurrentSingleRequests` 条件，所有 `n > 1` 统一走 `Promise.allSettled` 并发多次单张请求（count=1），不再依赖上游是否支持 `n` 参数；`n` 上限从 15 调整为 10（对齐 gpt-image-1 行业天花板）
- `next/src/components/image-settings-panel.tsx`：生成数量 UI 从「快捷选项网格 + 数字输入框」改为 antd `Slider` 滑块，右侧显示当前数值；`maxCount` 默认值从 15 改为 10；删除 `quickCount` 参数和未使用的 `OptionPill` / `CountInput` 组件
- 深色模式下「生成数量」标题颜色从 `theme.node.muted`（浅灰）改为 `theme.node.text`（白色）；Slider tooltip 加 `color: theme.node.text`

### 显隐逻辑总结

| 后台勾选 | 首帧上传 | 尾帧上传 |
|---------|---------|---------|
| 首尾帧 | 显示 | 显示 |
| 首帧 | 显示 | 不显示 |
| 都不勾 | 不显示 | 不显示 |

### 涉及文件（18 个）
- 后端：`Go/model/setting.go`
- 前端类型/store：`next/src/services/api/admin.ts`、`next/src/app/(admin)/admin/settings-shared.ts`、`next/src/stores/use-config-store.ts`
- 后台配置 UI：`next/src/app/(admin)/admin/model-pricing/page.tsx`
- 画布：`next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`、`canvas-config-node-panel.tsx`、`canvas-image-settings-popover.tsx`、`canvas-node-prompt-panel.tsx`、`canvas-video-settings-popover.tsx`
- 工作台：`next/src/app/(user)/video/page.tsx`、`next/src/components/image-settings-panel.tsx`、`next/src/components/layout/user-status-actions.tsx`
- API：`next/src/services/api/image.ts`、`next/src/services/api/video.ts`
- 文档：`docs/backend/backend-database.md`、`docs/backend/video-exclusive-panels-params.md`、`docs/progress/pending-test.md`

### 待验证（pending-test.md）
- 画布图片节点档位 Segmented 正常显示并跟随模型切换
- 非画布页面顶栏算力图标显示
- 后台「首帧」「首尾帧」两个独立 Checkbox 正常
- 仅首帧模型只显示首帧 Section、不显示尾帧 Section
- 旧模型（supportsFirstLastFrame=true）首尾帧都显示（向后兼容）
- 画布图片节点设置弹窗不显示数量滑块
- 生图工作台数量滑块 1-10 范围
- Grok Imagine 选 3 张能正常生成（并发 3 次单张请求）

### 待办（todo.md）
- 无新增待办（原有「生图/视频模型能力配置」剩余项不变：Seedance 分辨率/参考素材限制后台化、后端 apimartImageConfig/kieModelInputConfig 配置优先改造）
