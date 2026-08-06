---
title: 提示词批量上传功能
description: 管理后台批量上传本地提示词（含图片/视频）到指定来源
---

# 提示词批量上传功能

## 背景

当前提示词库通过 7 个 GitHub 仓库每日 0 点定时同步，存在重复、过时内容。管理员本地手动爬取了大量高质量提示词（含对应 webp 图片 / webm 视频 / json 元数据），需要批量导入到数据库。

现有 `POST /api/admin/prompts` 仅支持单条创建，无法满足批量导入需求。

## 目标

- 管理后台提示词管理页新增「批量上传」入口
- 支持选择本地文件夹，自动匹配 json 与对应媒体文件（webp/webm）
- 媒体文件上传到 S3 兼容存储，提示词写入数据库
- 上传时可选择已有来源或新建本地来源
- 按所选来源内 prompt 内容去重
- 详细进度展示 + 失败重试

## 数据流

```
本地文件夹
  ├─ *.json（提示词元数据）
  ├─ *.webp（图片）
  └─ *.webm（视频）

前端选文件夹
  → 按文件名匹配 json + 媒体
  → 并发上传媒体到 /api/v1/files 拿 URL
  → 组装 Prompt 列表
  → POST /api/admin/prompts/batch
  → 后端去重 + 批量写入
  → 返回成功/跳过/失败统计
```

## JSON 字段映射

本地 json 示例：

```json
{
  "id": 17873,
  "type": "image",
  "title": "90年代一次性相机风格居酒屋人像",
  "category": "海报平面",
  "prompt_text": "一张90年代一次性相机风格的闪光灯快照...",
  "image_filename": "17873.webp",
  "local_image_path": "images/17873.webp",
  "view_count": 75,
  "created_at": "2026-05-28 06:02:56"
}
```

映射到 `Prompt` 模型：

| JSON 字段 | → Prompt 字段 | 说明 |
|---|---|---|
| `title` | `title` | 标题 |
| `prompt_text` | `prompt` | 提示词内容（去重依据）|
| `category` | `tags` | 拆为单元素数组 `["海报平面"]` |
| `image_filename` | 匹配本地媒体文件 | 用此字段精确匹配，不靠文件名推断 |
| `type` | 决定 `preview` 格式 | `image`→`![](url)`，`video`→`<video src="url" controls/>` |
| 媒体 URL | `cover_url` + `preview` | 上传后回填 |
| `id` / `view_count` / `created_at` / `local_image_path` | 忽略 | 后端重新生成 ID 和时间 |

## 后端改动

### 1. 新增批量创建接口

**路由**：`POST /api/admin/prompts/batch`（admin 鉴权）

**请求体**：

```json
{
  "source": "my-local",
  "items": [
    { "title": "...", "prompt": "...", "tags": ["..."], "coverUrl": "...", "preview": "..." }
  ]
}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "created": 18,
    "skipped": 2,
    "failed": 0,
    "skippedTitles": ["重复标题1", "重复标题2"]
  }
}
```

### 2. 改动文件

| 文件 | 改动 |
|---|---|
| `Go/handler/admin.go` | 新增 `AdminBatchSavePrompts` handler，解析 body 调 service |
| `Go/service/prompts.go` | 新增 `BatchSavePrompts(source, items)`，复用 `SavePrompt` 的 ID 生成/时间/source 校验逻辑 |
| `Go/repository/prompt.go` | 新增 `ListPromptTextsBySource(source)` 一次性拉取该 source 下所有 prompt 文本用于去重；批量插入循环调用 `SavePrompt` |
| `Go/router/router.go` | 注册 `POST /api/admin/prompts/batch` 路由 |

### 3. 去重逻辑

- **范围**：只在所选 source 内去重（不跨 source，避免误删其他来源的同文提示词）
- **方式**：批量插入前 `SELECT prompt FROM prompts WHERE source = ?` 拉到内存 map，遍历 items 跳过已存在的
- **返回**：跳过的标题列表，前端可展示

### 4. 文件上传（复用现有接口）

- 复用 `POST /api/v1/files`（admin 角色已可调用）
- 上传到 S3 兼容存储，返回 URL
- 无需新建上传接口

## 前端改动

### 1. 新建批量上传弹窗组件

**路径**：`next/src/app/(admin)/admin/prompts/components/batch-upload-modal.tsx`

### 2. 工具栏加按钮

**路径**：`next/src/app/(admin)/admin/prompts/page.tsx`

在 `toolBarRender` 中新增「批量上传」按钮，点击打开弹窗。

### 3. API 封装

**路径**：`next/src/services/api/admin.ts`

新增 `batchCreateAdminPrompts(source, items)`。

### 4. 弹窗交互流程

```
Step 1 选来源
  ├─ Select 下拉：列出所有已有 source
  ├─ 选「+ 新建本地来源」→ 显示两个输入框（来源 code + 显示名）
  └─ 选到 remote:true 来源 → 橙色提示「该来源会在定时同步时被覆盖，建议用本地来源」

Step 2 选文件夹
  └─ <input webkitdirectory> 选择本地文件夹

Step 3 自动解析分组（前端做）
  ├─ 找出所有 .json 文件
  ├─ 读每个 json，取 image_filename 字段
  ├─ 在所选文件里找对应媒体文件（webp/webm）
  └─ 列出匹配结果：「共 20 条，匹配媒体 20，未匹配 0」

Step 4 上传媒体（并发 5 个）
  ├─ 进度条 + 「上传媒体 5/20」+ 当前文件名
  ├─ 每个 webp/webm → POST /api/v1/files → 拿 URL
  └─ 建立 {basename: url} 映射

Step 5 组装并批量创建
  ├─ 读 json 内容 → 组装 Prompt 列表（含 URL）
  ├─ POST /api/admin/prompts/batch
  └─ 显示「写入中...」

Step 6 结果展示
  ├─ 成功 18 条 / 跳过 2 条（重复）/ 失败 0 条
  ├─ 跳过项可展开看标题列表
  └─ 失败项有「重试」按钮（仅重试失败的）
```

## 关键约束

- **避免与 GitHub 同步冲突**：批量上传的提示词应归到 `remote: false` 的本地 source，否则下次该 source 被 sync 会全部清掉。选远程 source 时前端给出警告提示。
- **媒体一对一**：每个 json 只对应一个媒体文件（webp 或 webm），不会同时存在。
- **去重范围**：只在所选 source 内按 prompt 文本去重。
- **并发数**：媒体上传并发 5 个。

## 涉及文件清单

### 后端

- `Go/handler/admin.go`
- `Go/service/prompts.go`
- `Go/repository/prompt.go`
- `Go/router/router.go`

### 前端

- `next/src/app/(admin)/admin/prompts/components/batch-upload-modal.tsx`（新建）
- `next/src/app/(admin)/admin/prompts/page.tsx`
- `next/src/services/api/admin.ts`

## 待确认事项

- [ ] 视频预览格式 `<video src="url" controls/>` 在前端列表详情页是否能正常渲染（动手时先验证）
- [ ] 新建本地来源时 source code 是否需要格式校验（如仅允许小写英文+短横线）
