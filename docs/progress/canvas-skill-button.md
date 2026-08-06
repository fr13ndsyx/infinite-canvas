---
title: 画布技能选择按钮
description: 画布节点底部助手栏新增技能图标按钮，一键应用预设技能（prompt + 参数）
---

# 画布技能选择按钮

## 背景

画布节点底部助手栏现有"提示词库"图标按钮（`CanvasPromptLibrary`），用户需手动写提示词。对于"运镜变焦""16宫格分镜""翻译"等高频预设操作，用户每次都要手写复杂提示词，体验不佳。

新增并列的"技能"图标按钮，点击展开轻量弹窗选择预设技能，选中后一键应用 prompt + 节点参数。

## 目标

- 图片/视频/文本节点的底部助手栏新增技能图标按钮（与提示词图标并列）
- 点击弹出轻量小弹窗（与模型选择器大小一致，非大 Modal）
- 按节点类型筛选显示对应技能（Image/Video/Text）
- 选中后：技能 prompt 覆盖回填输入框 + option 应用到节点参数 + toast 提示
- 后台新建 `skills` 表 + 管理后台 CRUD 维护

## 技能数据结构

```json
{
  "id": "c96df80e-9ace-48a8-a213-623a60e5ba9c",
  "title": "运镜 - 变焦拉广",
  "summary": "机位固定不动，镜头光学缓慢变焦拉远扩大全景视野",
  "types": ["Video"],
  "prompt": "镜头固定机位不动，缓慢光学变焦拉远，逐渐扩大全景视野，画面稳定流畅",
  "option": { "aspectRatio": "16:9", "resolution": "4K" }
}
```

字段说明：
- `id`：UUID
- `title`：技能名称
- `summary`：给用户看的说明文字（不是发给模型的）
- `types`：适用节点类型数组，值为 `Image` / `Video` / `Text`
- `prompt`：发给模型的提示词（技能核心，选中后回填输入框）
- `option`：节点参数预设，可空

## 字段映射

技能 `option` 字段与节点 `CanvasNodeMetadata` 字段名不一致，需要映射：

| 技能 option 字段 | → 节点 metadata 字段 | 说明 |
|---|---|---|
| `aspectRatio` | `size` | 比例，如 `"16:9"`、`"auto"` |
| `resolution` | `quality`（图片节点）/ `vquality`（视频节点） | 清晰度，如 `"4K"` |

注意：
- `model` 字段已删除，技能不指定模型，使用节点当前已选模型
- `resolution` 应用时需根据节点类型判断写入 `quality` 还是 `vquality`
- 全景节点强制 `size = "2:1"`（`PANORAMA_IMAGE_SIZE`），`applyNodeConfigPatch` 已处理

## 节点类型匹配

| 画布节点类型 | 显示的技能 types |
|---|---|
| Image（图片节点） | `Image` |
| Panorama（全景节点） | `Image` |
| Video（视频节点） | `Video` |
| Text（文本节点） | `Text` |
| Audio（音频节点） | 不显示技能按钮 |
| Config / Director / Group | 无底部助手栏，不涉及 |

判断工具复用 `isCanvasImageNodeType()`（Image + Panorama）。

## 后端改动

### 1. 数据模型

新建 `Go/model/skill.go`：

```go
type Skill struct {
    ID        string      `json:"id" gorm:"primaryKey"`
    Title     string      `json:"title"`
    Summary   string      `json:"summary"`
    Types     []string    `json:"types" gorm:"serializer:json"`
    Prompt    string      `json:"prompt"`
    Option    *SkillOption `json:"option" gorm:"serializer:json"`
    SortOrder int         `json:"sortOrder" gorm:"default:0"`
    Enabled   *bool       `json:"enabled" gorm:"default:true"`
    CreatedAt string      `json:"createdAt"`
    UpdatedAt string      `json:"updatedAt"`
}

type SkillOption struct {
    AspectRatio string `json:"aspectRatio,omitempty"`
    Resolution  string `json:"resolution,omitempty"`
}
```

### 2. Repository 层

新建 `Go/repository/skill.go`：
- `ListSkills(type string)` — 公开查询，按 type 筛选 enabled 的技能，按 sortOrder 排序
- `ListAllSkills()` — 管理后台查询全部
- `SaveSkill(item)` — upsert
- `DeleteSkill(id)`

### 3. Service 层

新建 `Go/service/skill.go`：
- `ListSkills(type)` — 调 repository
- `SaveSkill(item)` — 生成 ID/时间，调 repository
- `DeleteSkill(id)`

### 4. Handler 层

新建 `Go/handler/skill.go`：
- `Skills` — `GET /api/skills?type=image` 公开接口（用户侧）
- `AdminSkills` — `GET /api/admin/skills` 列表
- `AdminSaveSkill` — `POST /api/admin/skills` 创建/更新
- `AdminDeleteSkill` — `DELETE /api/admin/skills/:id`

### 5. 路由注册

修改 `Go/router/router.go`：
- 公开路由：`GET /api/skills`（无需鉴权）
- Admin 路由：`/api/admin/skills` 系列（AdminAuth 下）

### 6. AutoMigrate

修改 `Go/repository/db.go`：`AutoMigrate` 注册 `&model.Skill{}`

### 7. 文档更新

更新 `docs/backend/backend-database.md` 新增 skills 表说明

## 前端改动

### 1. API 封装

新建 `next/src/services/api/skills.ts`：
- `fetchSkills(type?)` — 公开查询
- `fetchAdminSkills()` — 管理后台列表
- `saveAdminSkill(item)` — 创建/更新
- `deleteAdminSkill(id)` — 删除

### 2. 技能图标按钮组件

新建 `next/src/app/(user)/canvas/components/canvas-skill-library.tsx`：

参考 `canvas-prompt-library.tsx`（30 行）的实现模式：
- Ant Design `Button` + `Tooltip` + `lucide-react` 图标（如 `Sparkles` 或 `Wand2`）
- 点击弹出轻量小弹窗（Popover 或小尺寸 Modal，与模型选择器大小一致）
- 弹窗内列出当前节点类型对应的技能（title + summary）
- 选中后回调 `onSelect(skill)`

组件签名：
```tsx
function CanvasSkillLibrary({
    nodeType: CanvasNodeType,
    onSelect: (skill: Skill) => void
})
```

### 3. 接入助手栏

修改 `next/src/app/(user)/canvas/components/canvas-node-prompt-panel.tsx`：

在第 91 行 `<CanvasPromptLibrary onSelect={updatePrompt} />` 旁边并列新增：
```tsx
{mode !== "audio" && (
    <CanvasSkillLibrary
        nodeType={node.type}
        onSelect={(skill) => handleSkillSelect(skill)}
    />
)}
```

`handleSkillSelect` 逻辑：
1. `skill.prompt` 回填输入框（覆盖）→ 调 `updatePrompt(skill.prompt)`
2. `skill.option` 应用到节点参数 → 调 `onConfigChange(node.id, mappedOption)`
3. toast 提示「已应用技能：{title}」

option 映射逻辑：
```ts
function mapSkillOption(option: SkillOption | null, nodeType: CanvasNodeType): Partial<CanvasNodeMetadata> {
    if (!option) return {};
    const patch: Partial<CanvasNodeMetadata> = {};
    if (option.aspectRatio) patch.size = option.aspectRatio;
    if (option.resolution) {
        patch.quality = option.resolution;   // 图片节点
        if (nodeType === CanvasNodeType.Video) {
            patch.vquality = option.resolution; // 视频节点
        }
    }
    return patch;
}
```

### 4. 管理后台页面

新建 `next/src/app/(admin)/admin/skills/page.tsx`：
- ProTable 列表（标题、摘要、类型、排序、启用状态）
- 新增/编辑 Modal（标题、摘要、类型多选、prompt textarea、option 配置）
- 单条删除
- 参考 `admin/prompts/page.tsx` 的实现模式

### 5. 管理后台菜单

修改 `next/src/app/(admin)/admin/layout.tsx`：新增「技能管理」菜单项

## 交互细节

### 技能按钮位置
```
底部助手栏：[提示词图标] [技能图标] [模型选择] [参数选择] ...
```

### 弹窗形式
- 轻量小弹窗（Popover 或小 Modal），与模型选择器大小一致
- 列表项：技能标题（主）+ 摘要（副，灰色小字）
- 点击列表项即选中并关闭弹窗

### 选中行为
1. `prompt` **覆盖**回填输入框（技能是完整指令，追加会语义冲突）
2. `option` 应用到节点参数（size / quality / vquality）
3. toast 提示「已应用技能：{title}，原提示词已替换」

### 不显示技能按钮的节点
- 音频节点（无对应技能）
- Config / Director / Group 节点（无底部助手栏）

## 涉及文件清单

### 后端（新建）
- `Go/model/skill.go`
- `Go/repository/skill.go`
- `Go/service/skill.go`
- `Go/handler/skill.go`

### 后端（修改）
- `Go/router/router.go` — 注册路由
- `Go/repository/db.go` — AutoMigrate
- `docs/backend/backend-database.md` — 表结构文档

### 前端（新建）
- `next/src/services/api/skills.ts`
- `next/src/app/(user)/canvas/components/canvas-skill-library.tsx`
- `next/src/app/(admin)/admin/skills/page.tsx`

### 前端（修改）
- `next/src/app/(user)/canvas/components/canvas-node-prompt-panel.tsx` — 接入技能按钮
- `next/src/app/(admin)/admin/layout.tsx` — 新增菜单项

## 关键约束

- 技能不指定 model，使用节点当前已选模型，避免渠道不匹配问题
- prompt 回填采用覆盖方式（技能是完整指令）
- 全景节点应用 aspectRatio 时会被强制改为 `2:1`（现有 `applyNodeConfigPatch` 逻辑）
- 技能数据由管理员后台维护，用户侧只读启用状态的技能

## 待用户补充

- [ ] 35 个技能的 `prompt` 字段内容（用户自行编写）
