---
title: 画布 Agent 行为风格可配置方案
description: 让管理员可在后台切换画布创作 Agent 的内容落地策略
---

# 画布 Agent 行为风格可配置方案

## 背景

当前画布创作 Agent（前端的 `runCanvasAgent`）的系统提示词硬编码在 `next/src/app/(user)/canvas/agent/skills/core.ts` 的 `CORE_SKILL` 中，行为风格固定。其中第 8 条「沟通、选择与授权」写明"用户只要求讨论、建议、总结或文案时，不擅自操作画布"，导致用户说"给我生成一个 prompt""写一段文案"时，Agent 倾向于在对话框返回文字，而不是在画布上创建文本节点。

本产品核心卖点是无限画布，期望用户尽量把内容以节点形式落在画布上。因此需要让管理员可以选择 Agent 的内容落地策略，在「保守对话」与「积极落地画布」之间切换。

## 目标

- 新增一个后台可配置的 Agent 行为风格字段，控制 Agent 在收到"生成 prompt / 文案 / 脚本"类指令时是直接对话回复还是在画布创建节点
- 不破坏现有 Skill 路由与工具调用机制，只在 `CORE_SKILL` 之外注入一段风格引导
- 默认值保持现有行为（保守），避免上线后改变已有用户体验

## 行为风格定义

新增枚举字段 `canvasAgentBehavior`，取值：

| 值 | 名称 | 行为 |
|---|---|---|
| `conservative` | 保守对话（默认） | 用户只说"给我一个 prompt / 写一段文案 / 讨论一下"时，Agent 在对话框返回文字，不操作画布。用户明确说"在画布创建 / 新建节点"时才创建。即现状 |
| `eager` | 积极落地 | 用户说"生成 prompt / 写一段文案 / 给我一个脚本"等明确要"生成内容"的指令时，Agent 自动调用 `create_text_node` 在画布创建文本节点，除非用户明确说"只讨论不改画布" |

## 改动范围

### 后端（2 文件）

**`Go/model/setting.go`**
- `PublicModelChannelSetting` 新增字段 `CanvasAgentBehavior string`，JSON tag `canvasAgentBehavior`

**`Go/service/settings.go`**
- `normalizePublicSettingWithChannels` 中新增 `canvasAgentBehavior` 归一化：空值或非 `conservative`/`eager` 时设为 `conservative`

### 前端（4 文件）

**`next/src/services/api/admin.ts`**
- `AdminPublicModelChannelSettings` 类型新增 `canvasAgentBehavior: string`

**`next/src/app/(admin)/admin/settings-shared.ts`**
- `emptySettings` 新增 `canvasAgentBehavior: "conservative"`
- `normalizePublicSetting` 透传 `canvasAgentBehavior`

**`next/src/app/(admin)/admin/model-pricing/page.tsx`**
- 「开放与定价」页新增一个 Agent 行为风格 Select（保守对话 / 积极落地），放在渠道策略开关附近

**`next/src/app/(user)/canvas/agent/canvas-agent-skills.ts`**
- `buildCanvasAgentSkillPrompt` 接收 `behavior` 参数（从 `useConfigStore` 的 `publicSettings.modelChannel.canvasAgentBehavior` 读取，经 `canvas-agent-context` 传入）
- 当 `behavior === "eager"` 时，在 `CORE_SKILL` 之后追加一段风格引导片段：

```
【当前 Agent 行为风格：积极落地】
本产品核心是无限画布。当用户要求"生成 prompt / 写文案 / 给我一段脚本 / 写一个提示词"等明确要"生成内容"的指令时，优先使用 create_text_node 工具在画布创建文本节点，把生成的内容写入节点 content，而不是只在对话框返回文字。
只有用户明确说"只讨论 / 不改画布 / 先聊聊"时，才停留在对话回复。
生成节点后用一句话告知用户已创建，并给出下一步建议。
```

- `conservative` 时不追加任何片段，保持现状

### 上下文传递链路

`canvasAgentBehavior` 需要从 store 传到 `buildCanvasAgentSkillPrompt`。链路：

1. `use-config-store.ts` 的 `publicSettings.modelChannel.canvasAgentBehavior` 已随 `publicSettings` 加载
2. `canvas-client-page.tsx` 在调用 `runCanvasAgent` 时，把 `behavior` 传入 `CanvasAgentRuntimeInput`
3. `canvas-agent-runtime.ts` 的 `runCanvasAgent` 把 `behavior` 传给 `buildCanvasAgentSkillPrompt(state.phase, input.userText, context, input.behavior)`

## 数据库字段

`public_settings.canvas_agent_behavior TEXT DEFAULT 'conservative'`

详见 `docs/backend/backend-database.md` 同步更新。

## 兼容性

- 旧配置无 `canvasAgentBehavior` 字段时，后端 normalize 默认置为 `conservative`，与现状行为一致
- 前端 store 读取时若字段缺失，兜底为 `conservative`
- 不需要数据迁移，不写旧字段兼容逻辑

## 验证清单

1. 后端启动后，`GET /api/settings` 返回 `modelChannel.canvasAgentBehavior` 为 `conservative`
2. 管理后台「开放与定价」页显示 Agent 行为风格 Select，默认「保守对话」
3. 切换为「积极落地」并保存，刷新确认持久化
4. 画布中打开 Agent 面板，发送"给我写一个赛博朋克城市的图片 prompt"
   - 保守对话模式：Agent 在对话框返回 prompt 文字，不创建节点
   - 积极落地模式：Agent 调用 `create_text_node` 在画布创建文本节点，内容为生成的 prompt
5. 积极落地模式下发送"我们讨论一下剧情方向"，确认 Agent 不会强行创建节点（讨论类指令不触发落地）
6. 积极落地模式下发送"只讨论，先不改画布"，确认 Agent 尊重指令，停留在对话
7. 切回保守对话模式，发送"在画布创建一个文本节点，内容是 xxx"，确认 Agent 正常调用 `create_text_node`（明确指令不受风格影响）

## 待办状态

- 状态：暂未实施，加入 `todo.md` 待办列表
- 优先级：中（产品卖点增强，非阻塞 bug）
- 触发条件：管理员希望引导用户更深入使用画布时启用
