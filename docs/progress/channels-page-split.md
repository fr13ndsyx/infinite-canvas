# 管理后台渠道管理拆分改造方案

## 背景

当前管理后台的"渠道配置"嵌在 [系统设置页](../next/src/app/(admin)/admin/settings/page.tsx) 的"私有配置" tab 内，与提示词同步、AI 调用日志、数据存储等系统行为配置混在一起。

随着后续要新增"模型能力"配置（每个模型支持的比例/清晰度档位，详见 [model-capabilities-refactor.md](./model-capabilities-refactor.md)），渠道相关配置会进一步膨胀。继续堆在系统设置页会让页面臃肿、职责不清。

## 目标

1. 在管理后台左侧菜单新增独立"渠道管理"项（`/admin/channels`）
2. 把渠道 Table + Channel Drawer + 模型选择 Modal + 测试 Modal 从系统设置页整体迁移到新页面
3. 后端零改动，沿用现有 settings 整体保存模式
4. 系统设置页的"私有配置" tab 仅保留系统行为配置（同步、日志、存储），职责清晰

## 改动清单

### 新建 1 文件

**[next/src/app/(admin)/admin/channels/page.tsx](../next/src/app/(admin)/admin/channels/page.tsx)**

从 [settings/page.tsx](../next/src/app/(admin)/admin/settings/page.tsx) 迁移渠道相关全部逻辑（约 400-500 行）：

**迁移的 UI**：
- 渠道区块：[L725-774](../next/src/app/(admin)/admin/settings/page.tsx)（新增渠道按钮 + 渠道 Table）
- Channel Drawer：[L791-865](../next/src/app/(admin)/admin/settings/page.tsx)（含 name/protocol/baseUrl/apiKey/models/weight/timeout/enabled/remark 字段）
- 选择渠道模型 Modal：[L866-936](../next/src/app/(admin)/admin/settings/page.tsx)（双 tab：新获取/已有，Checkbox 网格）
- 模型测试 Modal：[L937-1002](../next/src/app/(admin)/admin/settings/page.tsx)（单测/批测）

**迁移的 state**：
- `channels` / `channelForm` / `editingChannelIndex` / `isChannelDrawerOpen`
- `testChannelIndex` / `testKeyword` / `selectedTestModels` / `testingModels` / `testResults`
- `isModelSelectorOpen` / `modelSelect*` / `isFetchingChannelModels` / `knownModels`

**迁移的函数**：
- `openChannelDrawer` / `closeChannelDrawer` / `saveChannel`
- `fetchChannelModelList` / `openChannelModelSelector` / `closeChannelModelSelector` / `confirmChannelModelSelector`
- `toggleSelectedModel` / `selectActiveModels` / `clearActiveModels` / `addModelInSelector` / `rememberModels`
- `openTestDialog` / `closeTestDialog` / `testModelOnline` / `batchTestModels`
- `persistChannels` / `mergeChannelApiKeys` / `collectChannelModels` / `modelSummary`
- `normalizeChannel` / `emptyChannel` / `uniqueModels` / `filterModels`

**迁移的辅助常量/类型**：
- `emptyChannel` 常量
- `ModelSelectTabKey` 类型
- `normalizeSettings` / `normalizePrivateSetting` / `normalizePublicSetting`（channels 页保存时也需要 normalize）

**页面结构**：
```
channels/page.tsx
├── 顶部 Card
│   ├── 标题 + 刷新 + 新增渠道按钮
│   └── 渠道 Table（名称/协议/状态/模型/权重/超时/操作）
├── Channel Drawer（编辑/新增）
├── 选择渠道模型 Modal
└── 模型测试 Modal
```

### 修改 2 文件

**[next/src/app/(admin)/admin/layout.tsx](../next/src/app/(admin)/admin/layout.tsx)**

- 在 `adminMenus` 数组（[L14-22](../next/src/app/(admin)/admin/layout.tsx#L14-22)）新增一项，插在"系统设置"前：
  ```tsx
  { key: "/admin/channels", icon: <ApiOutlined />, label: "渠道管理" }
  ```
- 在 `routeMeta` 数组（[L32-40](../next/src/app/(admin)/admin/layout.tsx#L32-40)）新增：
  ```tsx
  { prefix: "/admin/channels", key: "/admin/channels", title: "渠道管理" }
  ```
- import 追加 `ApiOutlined` from `@ant-design/icons`（沿用项目历史图标库，不改用 lucide-react）

**[next/src/app/(admin)/admin/settings/page.tsx](../next/src/app/(admin)/admin/settings/page.tsx)**

- 删除渠道相关 UI（约 400 行）：
  - [L725-774](../next/src/app/(admin)/admin/settings/page.tsx#L725-774) 渠道区块
  - [L791-865](../next/src/app/(admin)/admin/settings/page.tsx#L791-865) Channel Drawer
  - [L866-936](../next/src/app/(admin)/admin/settings/page.tsx#L866-936) 选择渠道模型 Modal
  - [L937-1002](../next/src/app/(admin)/admin/settings/page.tsx#L937-1002) 模型测试 Modal
- 删除渠道相关 state 和函数（见上文列表）
- 删除 `emptyChannel` 常量（保留 `emptyStorageProvider`，数据存储 Card 仍用）
- **修正公开 tab 的耦合点**：[L85 `channelModels`](../next/src/app/(admin)/admin/settings/page.tsx#L85) 改为从 `form.getFieldValue(["public", "modelChannel", "channels"])` 派生（用 `Form.useWatch` 或 `useMemo`），不再依赖 `channels` state
- `saveSettings`（[L125-149](../next/src/app/(admin)/admin/settings/page.tsx#L125-149)）中 `mergeChannelApiKeys`、`setChannels` 等渠道相关逻辑移除；但需保留对 `settings.private.channels` 的读取（loadSettings 仍要拿到全量 settings 才能整体保存）
- `collectSettings`（[L1192-1213](../next/src/app/(admin)/admin/settings/page.tsx#L1192-1213)）中 `filterModels(values.public.modelChannel.availableModels, collectChannelModels(values.private.channels))` 逻辑保留（仍按已保存的 private.channels 过滤），无需改

### 文档

- [docs/progress/pending-test.md](./pending-test.md) — 记录本次拆分变更的验证步骤
- [docs/progress/todo.md](./todo.md) — 如有相关 todo 同步
- [docs/overview/features.md](./../overview/features.md) — 用户确认测试通过后再更新
- [docs/backend/system-settings.md](./../backend/system-settings.md) — 先读确认是否需要同步

## 拆分后私有配置 tab 剩余内容

仅 3 块独立 Card，与渠道无耦合：

| Card | 位置 | 配置项 |
|------|------|--------|
| 提示词定时同步 | [L561-574](../next/src/app/(admin)/admin/settings/page.tsx#L561-574) | `private.promptSync.enabled` / `cron` |
| AI 调用日志 | [L575-598](../next/src/app/(admin)/admin/settings/page.tsx#L575-598) | `private.aiLog.localDirectReportEnabled` / `cleanup.*` |
| 数据存储 | [L599-724](../next/src/app/(admin)/admin/settings/page.tsx#L599-724) | 存储模式 / `allowUserProvider` / 容量检查 / S3 providers 列表 |

## 关键决策

### 1. 沿用整体保存模式，不新增单渠道 CRUD API

**当前模式**：渠道数据嵌在 `settings.private.channels` 里，通过 `POST /api/admin/settings` 整体保存。拆分后仍沿用。

**理由**：
- 后端 [service/settings.go](../Go/service/settings.go) `normalizePublicSettingWithChannels`（[L187-191](../Go/service/settings.go)）保存时会用 channels 重新过滤 availableModels、修复 defaultModel。若改单渠道 CRUD，需重新实现这套派生逻辑，违反 AGENTS.md "最少行数"原则
- 现有 `persistChannels`（[L345-365](../next/src/app/(admin)/admin/settings/page.tsx)）已是"读全量 → 替换 channels → 整体保存"模式，直接迁移复用
- 渠道数据量很小（通常几个到十几个），整体保存性能无忧
- 后端 4 个 API（settings 读写 + channel-models + channel-test）完全够用，零改动

### 2. 沿用 Channel Drawer，不改为独立编辑页

**理由**：
- Drawer 已实现且功能完整（含模型选择 Modal、测试 Modal 联动），零重写成本
- 与 [admin/assets/page.tsx](../next/src/app/(admin)/admin/assets/page.tsx)、[admin/prompts/page.tsx](../next/src/app/(admin)/admin/prompts/page.tsx) 等"Table + 弹窗编辑"模式一致
- 改独立编辑页需要新增路由 `/admin/channels/[id]` + 处理新建/编辑两种模式 + 返回跳转，引入不必要复杂度

### 3. normalize 函数的处理

`normalizeSettings` / `normalizePrivateSetting` / `normalizePublicSetting`（[L1008-1081](../next/src/app/(admin)/admin/settings/page.tsx)）是 settings 页的全量归一化函数，channels 页保存时也需要。

**方案**：在 channels 页内联一份 normalize 逻辑（仅 normalize channels + 整体 settings 透传），避免跨页面耦合，符合 AGENTS.md "不要新增只做简单转发的组件"原则。

## 数据一致性风险

### 风险描述

拆分后 settings 页和 channels 页都会持有 settings 副本。若用户在两个 tab 间切换保存，可能互相覆盖。

### 缓解

- 两页面保存后都会重新 `loadSettings` 同步状态，与现有单页面行为一致
- 保存后 `message.success` 提示，引导用户感知
- 这是整体保存模式的固有特性，当前单页面内"切 tab 后保存"也有同样问题，不算回归

## 与模型能力改造的关系

之前讨论的"模型能力"编辑表格（每个模型勾选支持的比例/清晰度，详见 [model-capabilities-refactor.md](./model-capabilities-refactor.md)），建议放在新的渠道管理页而不是系统设置页：

| 页面 | 职责 |
|------|------|
| 渠道管理 | 模型供给侧配置（渠道 + 模型能力 + 算力点可选） |
| 系统设置 | 系统行为侧配置（默认模型 + 系统提示词 + 算力点 + 同步 + 日志 + 存储） |

**注**：当前"模型算力点"表格在系统设置页公开 tab（[L519-542](../next/src/app/(admin)/admin/settings/page.tsx#L519-542)），后续是否也迁到渠道管理页，待本次拆分完成后视情况决定。本次不涉及算力点迁移。

## 执行步骤

1. 新建 `channels/page.tsx`，从 settings 页迁移渠道相关全部逻辑
2. 修改 `layout.tsx`，新增菜单项和路由
3. 修改 `settings/page.tsx`，删除渠道相关代码，修正 `channelModels` 计算来源
4. 测试验证：
   - 新渠道管理页功能完整（新增/编辑/删除/测试/拉取模型）
   - 系统设置页公开 tab 的"系统可用模型"options 仍正常
   - 系统设置页私有 tab 剩余三块 Card 正常
5. 更新文档（pending-test.md / system-settings.md）

## 不在本次范围

- 模型能力配置表格（后续在 [model-capabilities-refactor.md](./model-capabilities-refactor.md) 中处理）
- 模型算力点表格迁移（本次不动）
- 后端 API 拆分（零改动）
- 渠道数据独立存储（仍嵌在 settings JSON 内）
