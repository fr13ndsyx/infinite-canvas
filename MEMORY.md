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
