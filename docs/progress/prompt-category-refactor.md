---
title: 提示词分类管理后台化改造方案
description: 把硬编码的 promptCategories 迁移到数据库与管理后台，支持可视化增删改查
---

# 提示词分类管理后台化改造方案

## 一、背景与现状

### 1.1 现有架构

提示词分类当前**完全硬编码**在后端代码中：

- 定义位置：[Go/repository/db.go#L23-32](../../Go/repository/db.go) 的 `promptCategories` 变量
- 共 8 个分类（1 个 system 内置 + 7 个 GitHub 远程同步源）
- 数据库只存提示词条目（`prompts` 表），不存分类定义

### 1.2 存在的问题

| 问题 | 影响 |
|---|---|
| 想新增/删除提示词来源 | 必须改 Go 源码并重启后端，运营无法自助 |
| 想暂时禁用某分类 | 无法做到，只能删除代码行 |
| 想调整同步频率 | 当前是全局统一 cron，无法按分类单独设置 |
| 前端用户端显示分类 ID | 用户看到 `gpt-image-2-prompts` 看不懂（API 只返回 ID 数组） |
| 标签乱 | 各 GitHub 仓库解析方式不同，无标准化（待后续优化） |

### 1.3 现有相关代码位置

| 文件 | 作用 |
|---|---|
| [Go/repository/db.go](../../Go/repository/db.go) | 硬编码 `promptCategories` 变量 |
| [Go/repository/prompt.go](../../Go/repository/prompt.go) | `PromptCategories()`、`ListPromptCategories()`、`PromptCategoryByCode()` |
| [Go/service/prompts.go](../../Go/service/prompts.go) | `ListPromptCategories()`、`SavePrompt()` 中使用硬编码分类 |
| [Go/service/prompt_sync_scheduler.go](../../Go/service/prompt_sync_scheduler.go) | 定时同步任务，遍历硬编码分类 |
| [Go/service/prompt_fetch.go](../../Go/service/prompt_fetch.go) | 按分类 ID 从 GitHub 拉取并解析提示词 |
| [Go/handler/admin.go](../../Go/handler/admin.go) | `AdminPromptCategories`、`AdminSyncPromptCategories` 等 |
| [Go/router/router.go](../../Go/router/router.go) | `/api/admin/prompt-categories/*` 路由 |
| [Go/model/prompt.go](../../Go/model/prompt.go) | `PromptCategory` 结构体（已存在，需扩展字段） |
| [next/src/app/(admin)/admin/prompts/](../../next/src/app/(admin)/admin/prompts/) | 现有提示词管理页面（只管理提示词条目，不管理分类） |

---

## 二、改造目标

1. **分类管理后台化**：把 8 个硬编码分类迁移到数据库 `prompt_categories` 表，管理员可在后台增删改查。
2. **同步逻辑改造**：定时同步任务从数据库读取分类，不再读硬编码。
3. **保留现有 API 兼容**：`/api/admin/prompt-categories` 等接口行为不变，前端调用层无需改动。
4. **数据平滑迁移**：后端首次启动时自动把硬编码分类写入数据库，存量用户无感升级。
5. **暂不优化前端用户端展示**：分类和标签的前端展示优化留到后续阶段（用户明确要求先做管理后台）。

---

## 三、数据库设计

### 3.1 新增 `prompt_categories` 表

| 字段 | 类型 | 说明 |
|---|---|---|
| `category` | string (PK) | 分类 ID，如 `gpt-image-2-prompts`（创建后不可修改） |
| `name` | string | 显示名称，如 `GPT Image 2 Prompts` |
| `description` | string | 分类描述 |
| `github_url` | string | GitHub 仓库地址（远程分类必填） |
| `remote` | bool | 是否远程同步分类 |
| `enabled` | bool | 是否启用（禁用后不同步、不在用户端展示，但提示词数据保留） |
| `sort_order` | int | 排序权重（越小越靠前） |
| `last_synced_at` | string | 最后同步时间 |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 更新时间 |

> 说明：不支持分类独立 cron，所有分类共用全局 `PROMPT_SYNC_CRON`（在 [Go/.env](../../Go/.env) 配置）。理由：运营场景下每天同步一次成本很低，无需精细化调度。

### 3.2 GORM 模型

修改 [Go/model/prompt.go](../../Go/model/prompt.go) 中的 `PromptCategory`：

```go
type PromptCategory struct {
    Category      string `json:"category" gorm:"primaryKey"`
    Name          string `json:"name"`
    Description   string `json:"description"`
    GithubURL     string `json:"githubUrl"`
    Remote        bool   `json:"remote"`
    Enabled       *bool  `json:"enabled" gorm:"default:true"`     // 新增
    SortOrder     int    `json:"sortOrder" gorm:"default:0"`      // 新增
    LastSyncedAt  string `json:"lastSyncedAt"`                     // 新增
    CreatedAt     string `json:"createdAt"`                        // 新增
    UpdatedAt     string `json:"updatedAt"`                        // 新增
}
```

### 3.3 AutoMigrate 注册

修改 [Go/repository/db.go](../../Go/repository/db.go) 的 `AutoMigrate` 调用，加入 `&model.PromptCategory{}`：

```go
dbErr = db.AutoMigrate(
    &model.User{},
    &model.Prompt{},          // 已存在
    &model.PromptCategory{},  // 新增
    &model.Asset{},
    // ...
)
```

---

## 四、后端 API 设计

### 4.1 路由规划

在 [Go/router/router.go](../../Go/router/router.go) 的 `admin` 组下新增：

| 方法 | 路径 | 说明 | 现状 |
|---|---|---|---|
| GET | `/api/admin/prompt-categories` | 列出全部分类 | 已有，改为读数据库 |
| POST | `/api/admin/prompt-categories` | 新增分类 | **新增** |
| PUT | `/api/admin/prompt-categories/:category` | 更新分类 | **新增** |
| DELETE | `/api/admin/prompt-categories/:category` | 删除分类 | **新增** |
| POST | `/api/admin/prompt-categories/sync` | 同步单个分类 | 已有，改为读数据库 |
| POST | `/api/admin/prompt-categories/sync-all` | 同步全部分类 | 已有，改为读数据库 |

> **默认仓库源说明**：原硬编码 `promptCategories` 的 8 个仓库源作为种子数据，首次启动时自动写入 `prompt_categories` 表。管理员打开后台即可看到这 8 个分类，点击"同步"即可拉取提示词，无需任何配置。

### 4.2 请求/响应结构

#### 新增分类

`POST /api/admin/prompt-categories`

```json
{
  "category": "my-custom-prompts",
  "name": "我的自定义提示词",
  "description": "运营团队维护的分类",
  "githubUrl": "",
  "remote": false,
  "enabled": true,
  "sortOrder": 100
}
```

#### 更新分类

`PUT /api/admin/prompt-categories/:category`

```json
{
  "name": "新名称",
  "description": "新描述",
  "enabled": false,
  "sortOrder": 50
}
```

#### 列表响应

`GET /api/admin/prompt-categories`

```json
{
  "code": 0,
  "data": [
    {
      "category": "system",
      "name": "系统",
      "description": "系统提示词分类",
      "githubUrl": "",
      "remote": false,
      "enabled": true,
      "sortOrder": 0,
      "lastSyncedAt": "",
      "createdAt": "2026-08-01T00:00:00Z",
      "updatedAt": "2026-08-01T00:00:00Z"
    }
  ],
  "msg": "ok"
}
```

### 4.3 Service 层改造

修改 [Go/service/prompts.go](../../Go/service/prompts.go)：

```go
// 新增 CRUD 函数
func CreatePromptCategory(item model.PromptCategory) (model.PromptCategory, error)
func UpdatePromptCategory(category string, item model.PromptCategory) (model.PromptCategory, error)
func DeletePromptCategory(category string) error

// 修改现有函数：从数据库读取
func ListPromptCategories() []model.PromptCategory
```

修改 [Go/service/prompt_sync_scheduler.go](../../Go/service/prompt_sync_scheduler.go)：

```go
// SyncRemotePromptCategories 改为从数据库读取启用的远程分类
func SyncRemotePromptCategories() {
    categories := repository.ListEnabledRemotePromptCategories()
    for _, category := range categories {
        // 同步逻辑不变，统一使用全局 PROMPT_SYNC_CRON 调度
    }
}
```

### 4.4 Repository 层改造

修改 [Go/repository/prompt.go](../../Go/repository/prompt.go)：

```go
// 原有函数改为读数据库
func PromptCategories() []model.PromptCategory {
    db, _ := DB()
    var items []model.PromptCategory
    db.Order("sort_order asc, created_at asc").Find(&items)
    return items
}

func ListPromptCategories() ([]model.PromptCategory, error) {
    db, _ := DB()
    var items []model.PromptCategory
    err := db.Order("sort_order asc, created_at asc").Find(&items).Error
    return items, err
}

// 新增 CRUD
func SavePromptCategory(item model.PromptCategory) (model.PromptCategory, error)
func DeletePromptCategory(category string) error

// 新增：查询启用的远程分类（供定时任务用）
func ListEnabledRemotePromptCategories() []model.PromptCategory

// 新增：查询启用的分类（供用户端展示用）
func ListEnabledPromptCategories() []model.PromptCategory

// 新增：更新最后同步时间
func UpdatePromptCategorySyncedAt(category string) error
```

---

## 五、前端页面设计

### 5.1 新增管理页面位置

参考 AGENTS.md 前端规范：

> 管理后台页面私有组件放到各自页面目录的 `components/` 下

新建目录：

```
next/src/app/(admin)/admin/prompt-categories/
├── page.tsx              # 主页面
└── use-admin-prompt-categories.ts  # 页面私有 hook
```

### 5.2 页面功能

参考现有 [next/src/app/(admin)/admin/prompts/page.tsx](../../next/src/app/(admin)/admin/prompts/page.tsx) 的 ProTable 风格：

| 列 | 说明 |
|---|---|
| 分类 ID | `category` |
| 显示名称 | `name` |
| 类型 | 远程/本地（Tag）|
| GitHub 地址 | `githubUrl`（远程分类显示链接）|
| 状态 | 启用/禁用（Switch）|
| 排序 | `sortOrder` |
| 最后同步 | `lastSyncedAt` |
| 操作 | 编辑 / 同步 / 删除 |

操作按钮：
- **新增分类**：弹窗表单（用户自定义添加新分类，默认的 8 个仓库源已自动入库，无需手动添加）
- **编辑分类**：弹窗表单（分类 ID 不可改）
- **同步**：触发该分类同步（每个远程分类行都有同步按钮）
- **同步所有**：页面顶部按钮，一键同步所有启用的远程分类
- **删除分类**：二次确认（提示该分类下提示词会保留但不再展示）
- **状态切换**：Switch 直接切换 enabled

#### 默认展示 8 个预设仓库源

首次启动后端时，种子数据自动写入数据库。管理员打开 `/admin/prompt-categories` 页面，默认就能看到这 8 个分类：

```
┌─ 提示词分类 ────────────────────────────────────────────────┐
│ [+ 新增分类]  [⟳ 同步所有]                                  │
├──────────┬────────────────┬──────┬──────────┬──────┬───────┤
│ 分类 ID   │ 显示名称        │ 类型 │ GitHub   │ 状态 │ 操作  │
├──────────┼────────────────┼──────┼──────────┼──────┼───────┤
│ system   │ 系统           │ 本地 │ -        │ 启用 │ 编辑  │
│ gpt-img..│ GPT Image 2..  │ 远程 │ tigerowo │ 启用 │同步编辑删除│
│ awesome..│ Awesome GPT..  │ 远程 │ ZeroLu   │ 启用 │同步编辑删除│
│ ...      │ ...            │ ...  │ ...      │ ...  │ ...   │
└──────────┴────────────────┴──────┴──────────┴──────┴───────┘
```

管理员只需点击某个分类的"同步"按钮即可拉取该分类的提示词，或点页面顶部的"同步所有"按钮一键同步全部。

### 5.3 管理后台侧边栏入口

修改 [next/src/app/(admin)/admin/layout.tsx](../../next/src/app/(admin)/admin/layout.tsx) 的 `adminMenus`：

```tsx
const adminMenus = [
    { key: "/admin/users", icon: <UserOutlined />, label: "用户管理" },
    { key: "/admin/credit-logs", icon: <TransactionOutlined />, label: "算力点日志" },
    { key: "/admin/ai-logs", icon: <AuditOutlined />, label: "AI 日志" },
    { key: "/admin/prompt-categories", icon: <FolderOutlined />, label: "提示词分类" },  // 新增
    { key: "/admin/prompts", icon: <FileTextOutlined />, label: "提示词管理" },
    { key: "/admin/assets", icon: <PictureOutlined />, label: "素材库" },
    { key: "/admin/settings", icon: <SettingOutlined />, label: "系统设置" },
];
```

同时更新 `activeKey` 和 `pageTitle` 的路径判断逻辑。

### 5.4 API 请求层

新增 [next/src/services/api/admin-prompt-categories.ts](../../next/src/services/api/)：

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from "./request";

export type PromptCategory = {
    category: string;
    name: string;
    description: string;
    githubUrl: string;
    remote: boolean;
    enabled: boolean;
    sortOrder: number;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
};

export const fetchAdminPromptCategories = () => apiGet<PromptCategory[]>("/api/admin/prompt-categories");
export const createAdminPromptCategory = (data: Omit<PromptCategory, "lastSyncedAt" | "createdAt" | "updatedAt">) =>
    apiPost<PromptCategory>("/api/admin/prompt-categories", data);
export const updateAdminPromptCategory = (category: string, data: Partial<PromptCategory>) =>
    apiPut<PromptCategory>(`/api/admin/prompt-categories/${category}`, data);
export const deleteAdminPromptCategory = (category: string) =>
    apiDelete<boolean>(`/api/admin/prompt-categories/${category}`);
export const syncAdminPromptCategory = (category: string) =>
    apiPost<PromptCategory[]>(`/api/admin/prompt-categories/sync`, { category });
export const syncAllAdminPromptCategories = () =>
    apiPost<PromptCategory[]>(`/api/admin/prompt-categories/sync-all`, {});
```

### 5.5 现有提示词管理页面兼容

现有 [next/src/app/(admin)/admin/prompts/use-admin-prompts.ts](../../next/src/app/(admin)/admin/prompts/use-admin-prompts.ts) 已经在调用 `/api/admin/prompt-categories`，**接口契约不变**，无需改动。

---

## 六、迁移策略（关键）

### 6.1 自动迁移逻辑

修改 [Go/repository/db.go](../../Go/repository/db.go)：

```go
// 在 AutoMigrate 之后调用
func seedPromptCategoriesIfEmpty() error {
    db, err := DB()
    if err != nil {
        return err
    }
    var count int64
    db.Model(&model.PromptCategory{}).Count(&count)
    if count > 0 {
        return nil  // 已有数据，不迁移
    }
    // 把原硬编码的 promptCategories 写入数据库
    now := time.Now().Format(time.RFC3339)
    seeded := make([]model.PromptCategory, 0, len(promptCategories))
    for i, item := range promptCategories {
        enabled := true
        seeded = append(seeded, model.PromptCategory{
            Category:    item.Category,
            Name:        item.Name,
            Description: item.Description,
            GithubURL:   item.GithubURL,
            Remote:      item.Remote,
            Enabled:     &enabled,
            SortOrder:   i,
            SyncCron:    "",
            CreatedAt:   now,
            UpdatedAt:   now,
        })
    }
    return db.Create(&seeded).Error
}
```

在 `DB()` 初始化函数末尾（AutoMigrate 之后）调用 `seedPromptCategoriesIfEmpty()`。

### 6.2 保留硬编码作为兜底

**保留** [Go/repository/db.go](../../Go/repository/db.go) 的 `promptCategories` 变量不删除，仅作为：
- 首次启动时的种子数据源
- 数据库读取失败时的兜底（可选，增加健壮性）

### 6.3 删除分类时的提示词处理

**确认策略：保留提示词数据，不级联删除。**

删除分类时：
- `prompt_categories` 表中该分类记录被删除
- `prompts` 表中该分类下的所有提示词条目**保留不动**（`category` 字段仍为原值）
- 用户端不再展示该分类及其提示词（因为分类记录已不存在，用户端查询时会过滤掉）
- 管理后台"提示词管理"页面仍能看到这些"孤儿"提示词（用分类 ID 显示）

**适用场景**：某个 GitHub 仓库永久关闭了，你删除分类来源，但已同步到数据库的提示词仍保留，不会丢失。

前端删除按钮的确认弹窗提示：

> 删除分类 "GPT Image 2 Prompts" 后，该分类下的 156 条提示词将保留在数据库中，但用户端不再展示。确定继续吗？

### 6.4 禁用分类与删除分类的区别

| 操作 | 分类记录 | 提示词数据 | 用户端展示 | 可恢复性 |
|---|---|---|---|---|
| **删除分类** | 从 `prompt_categories` 表删除 | 保留在 `prompts` 表 | 不展示 | 不可恢复，需重新添加分类 |
| **禁用分类**（enabled: false）| 保留，标记为禁用 | 保留在 `prompts` 表 | 不展示 | 一键切回 `enabled: true` 即恢复展示 |

**禁用分类适用场景**：某个仓库暂时维护、或内容暂时下架，过几天恢复，不用每次都删除再重新添加。

---

## 七、实施步骤

### 步骤 1：后端模型与数据库

- [ ] 修改 [Go/model/prompt.go](../../Go/model/prompt.go) 扩展 `PromptCategory` 字段
- [ ] 修改 [Go/repository/db.go](../../Go/repository/db.go) 注册 AutoMigrate
- [ ] 新增 `seedPromptCategoriesIfEmpty()` 自动迁移函数

### 步骤 2：后端 Repository 层

- [ ] 修改 [Go/repository/prompt.go](../../Go/repository/prompt.go) 的 `PromptCategories()` 改为读数据库
- [ ] 新增 `SavePromptCategory`、`DeletePromptCategory`
- [ ] 新增 `ListEnabledRemotePromptCategories`
- [ ] 新增 `UpdatePromptCategorySyncedAt`

### 步骤 3：后端 Service 层

- [ ] 修改 [Go/service/prompts.go](../../Go/service/prompts.go) 的 `ListPromptCategories` 改为读数据库
- [ ] 新增 `CreatePromptCategory`、`UpdatePromptCategory`、`DeletePromptCategory`
- [ ] 修改 `SavePrompt` 中分类校验逻辑

### 步骤 4：后端同步任务

- [ ] 修改 [Go/service/prompt_sync_scheduler.go](../../Go/service/prompt_sync_scheduler.go) 从数据库读取分类
- [ ] 同步完成后更新 `lastSyncedAt`
- [ ] 全局 cron 调度（不支持分类独立 cron）

### 步骤 5：后端 Handler 与路由

- [ ] 修改 [Go/handler/admin.go](../../Go/handler/admin.go) 新增 CRUD handler
- [ ] 修改 [Go/router/router.go](../../Go/router/router.go) 注册新路由

### 步骤 6：前端 API 层

- [ ] 新增 [next/src/services/api/admin-prompt-categories.ts](../../next/src/services/api/)
- [ ] 检查 `request.ts` 是否已有 `apiPut`、`apiDelete`，没有则补充

### 步骤 7：前端管理页面

- [ ] 新增 [next/src/app/(admin)/admin/prompt-categories/page.tsx](../../next/src/app/(admin)/admin/)
- [ ] 新增 [next/src/app/(admin)/admin/prompt-categories/use-admin-prompt-categories.ts](../../next/src/app/(admin)/admin/)
- [ ] 修改 [next/src/app/(admin)/admin/layout.tsx](../../next/src/app/(admin)/admin/layout.tsx) 加侧边栏入口

### 步骤 8：验证与文档

- [ ] 启动后端，确认 `prompt_categories` 表自动创建且 8 条种子数据写入
- [ ] 启动前端，访问 `/admin/prompt-categories` 验证默认展示 8 个仓库源
- [ ] 测试新增、编辑、删除、启用/禁用、同步功能
- [ ] 测试"同步"和"同步所有"按钮
- [ ] 测试原 `/admin/prompts` 页面不受影响
- [ ] 更新 [docs/backend/backend-database.md](../backend/backend-database.md) 增加 `prompt_categories` 表说明
- [ ] 更新 [docs/progress/pending-test.md](pending-test.md) 记录本次变更

---

## 八、涉及文件清单

### 后端（Go/）

| 文件 | 操作 | 说明 |
|---|---|---|
| `model/prompt.go` | 修改 | 扩展 `PromptCategory` 字段 |
| `repository/db.go` | 修改 | 注册 AutoMigrate + 种子迁移函数 |
| `repository/prompt.go` | 修改 | 改为读数据库 + 新增 CRUD |
| `service/prompts.go` | 修改 | 改为读数据库 + 新增 CRUD |
| `service/prompt_sync_scheduler.go` | 修改 | 改为读数据库 + 按分类 cron |
| `handler/admin.go` | 修改 | 新增 CRUD handler |
| `router/router.go` | 修改 | 注册新路由 |

### 前端（next/）

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/services/api/admin-prompt-categories.ts` | 新增 | API 请求封装 |
| `src/services/api/request.ts` | 可能修改 | 补充 `apiPut`、`apiDelete`（如缺失）|
| `src/app/(admin)/admin/prompt-categories/page.tsx` | 新增 | 管理页面 |
| `src/app/(admin)/admin/prompt-categories/use-admin-prompt-categories.ts` | 新增 | 页面 hook |
| `src/app/(admin)/admin/layout.tsx` | 修改 | 侧边栏入口 |

### 文档

| 文件 | 操作 | 说明 |
|---|---|---|
| `docs/backend/backend-database.md` | 修改 | 增加 `prompt_categories` 表说明 |
| `docs/progress/pending-test.md` | 修改 | 记录本次变更待测试 |

---

## 九、已确认决策

| 问题 | 决策 | 说明 |
|---|---|---|
| 删除分类是否级联删除提示词 | **否** | 保留提示词数据，仅删除分类记录。适用场景：仓库关闭后删除分类，已同步的提示词不丢失 |
| 分类 ID 是否允许修改 | **否** | 作为主键不可改，仅允许修改 `name`、`description`、`enabled`、`sortOrder` |
| `enabled: false` 的分类是否在用户端隐藏 | **是** | 禁用后不同步、不在用户端展示，但提示词数据保留。可一键切回 true 恢复 |
| 分类独立 cron 与全局 cron 的关系 | **只用全局 cron** | 所有分类共用 `PROMPT_SYNC_CRON`，不支持分类独立 cron。理由：每天同步成本很低，无需精细化调度 |
| 前端用户端分类显示优化 | **本次不做** | 本次只做管理后台化，用户端展示优化留到后续阶段 |
| 自定义分类（非远程）的提示词如何补充 | **管理员手动添加** | `remote: false` 的分类（如 system）由管理员在"提示词管理"页面手动添加提示词 |

---

## 十、后续阶段（本次不做）

### 阶段 2：前端用户端展示优化

- 后端 `/api/prompts` 响应增加 `categoryItems`（ID + Name 完整对象）
- 前端 [next/src/app/(user)/prompts/page.tsx](../../next/src/app/(user)/prompts/page.tsx) 用 `name` 替代 `category` 显示
- 优化分类筛选 UI（下拉/分组，而非平铺 Tag）

### 阶段 3：标签标准化

- 在 [Go/service/prompt_fetch.go](../../Go/service/prompt_fetch.go) 同步逻辑里加标签清洗
- 统一标签格式（中英文归一、过滤无意义标签）
- 在 `prompt_categories` 表增加 `tag_rules` 字段（JSON，定义该分类的标签处理规则）
