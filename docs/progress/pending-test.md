---
title: 待测试
description: 当前版本已实现但仍需人工验证的变更项
---

# 待测试

## 提示词分类管理后台化

把原硬编码的 `promptCategories` 迁移到数据库 `prompt_categories` 表，支持管理后台可视化增删改查。详细方案见 [prompt-category-refactor.md](./prompt-category-refactor.md)。

### 可测试变更

- 后端首次启动时自动创建 `prompt_categories` 表并写入 8 条种子数据（1 个 system 本地分类 + 7 个 GitHub 远程同步源）
- 新增管理后台页面 `/admin/prompt-categories`，支持：
  - 查看全部分类列表（分类 ID、显示名称、类型、GitHub 地址、启用状态、排序、最后同步时间）
  - 新增分类（填写分类 ID、名称、描述、GitHub 地址、远程/本地、启用、排序）
  - 编辑分类（分类 ID 不可改，仅可改名称、描述、启用、排序）
  - 删除分类（二次确认，提示词数据保留不级联删除）
  - 启用/禁用分类（Switch 直接切换）
  - 同步单个远程分类、同步所有启用的远程分类
- 管理后台侧边栏新增「提示词分类」入口（位于「AI 日志」和「提示词管理」之间）
- 定时同步任务改为从数据库读取启用的远程分类，同步完成后更新 `last_synced_at`
- 原 `/admin/prompts` 页面不受影响（接口契约不变）

### 涉及文件

后端：
- `Go/model/prompt.go`：`PromptCategory` 新增 `enabled`、`sort_order`、`last_synced_at`、`created_at` 字段
- `Go/repository/db.go`：注册 AutoMigrate + `seedPromptCategoriesIfEmpty` 种子迁移
- `Go/repository/prompt.go`：分类查询改为读数据库，新增 `SavePromptCategory`、`DeletePromptCategory`、`ListEnabledRemotePromptCategories`、`UpdatePromptCategorySyncedAt`
- `Go/service/prompts.go`：新增 `CreatePromptCategory`、`UpdatePromptCategory`、`DeletePromptCategory`
- `Go/service/prompt_sync_scheduler.go`：定时同步改为读 `ListEnabledRemotePromptCategories`
- `Go/service/prompt_fetch.go`：`SyncPromptCategory` 改用 `PromptCategoryByCode`，同步后更新 `last_synced_at`
- `Go/handler/admin.go`：新增 `AdminCreatePromptCategory`、`AdminUpdatePromptCategory`、`AdminDeletePromptCategory`
- `Go/router/router.go`：注册 `POST/PUT/DELETE /api/admin/prompt-categories` 路由

前端：
- `next/src/services/api/request.ts`：补充 `apiPut`
- `next/src/services/api/admin-prompt-categories.ts`：新增，封装分类 CRUD API
- `next/src/services/api/admin.ts`：移除已迁移到新文件的类型和函数
- `next/src/app/(admin)/admin/prompt-categories/page.tsx`：新增管理页面
- `next/src/app/(admin)/admin/prompt-categories/use-admin-prompt-categories.ts`：新增页面 hook
- `next/src/app/(admin)/admin/layout.tsx`：侧边栏新增入口
- `next/src/app/(admin)/admin/prompts/use-admin-prompts.ts`：改从新文件导入分类 API

### 验证步骤

1. 启动后端，确认 `prompt_categories` 表自动创建且 8 条种子数据写入
2. 启动前端，访问 `/admin/prompt-categories`，确认默认展示 8 个分类
3. 测试新增分类（远程和本地各一个）
4. 测试编辑分类（修改名称、描述、排序、启用状态）
5. 测试删除分类（确认提示词数据保留）
6. 测试启用/禁用 Switch 切换
7. 测试「同步」单个远程分类和「同步所有」按钮
8. 确认原 `/admin/prompts` 页面分类筛选和同步功能不受影响

## 删除 Linux.do 登录功能

移除项目中的 Linux.do OAuth 登录能力，仅保留账号密码登录与注册。

### 可测试变更

- 用户登录页 `/login` 移除「使用 Linux.do 登录」按钮，副标题文案改为「使用账号密码登录或注册。」
- 管理后台设置页 `/admin/settings` 移除「Linux.do 登录」配置卡片（含开启开关、Client ID、Client Secret）
- 管理后台用户列表 `/admin/users` 移除「Linux.do」列
- 后端移除 `/api/auth/linux-do/authorize`、`/api/auth/linux-do/callback` 路由及对应处理器与 service 函数
- 后端 `model.User` 移除 `LinuxDoID` 字段，`config` 移除 Linux.do URL 配置项，`repository` 移除 `GetUserByLinuxDoID`
- 系统配置模型 `PrivateAuthSetting` 清空，`PublicAuthSetting` 仅保留 `AllowRegister`
- 删除静态资源 `next/public/icons/linuxdo.svg`
- README 移除 Linux.do 社区推广链接

### 涉及文件

后端：
- `Go/config/config.go`：删除 3 个 LinuxDo URL 配置项
- `Go/model/user.go`：删除 `LinuxDoID` 字段
- `Go/model/setting.go`：`PublicAuthSetting` 删除 `LinuxDo` 字段，删除 `PublicLinuxDoAuthSetting`、`PrivateLinuxDoAuthSetting`，清空 `PrivateAuthSetting`
- `Go/repository/user.go`：删除 `GetUserByLinuxDoID`
- `Go/service/auth.go`：删除 `LinuxDoAuthorizeURL`、`LoginWithLinuxDo` 等函数及相关结构体
- `Go/service/settings.go`：删除 `keepPrivateAuthSecrets` 及 `hidePrivateAPIKeys` 中 LinuxDo 处理
- `Go/handler/auth.go`：删除 `LinuxDoAuthorize`、`LinuxDoCallback`
- `Go/router/router.go`：删除 Linux.do 登录路由

前端：
- `next/src/app/(user)/login/page.tsx`：移除 Linux.do 登录按钮、`linuxDoEnabled` 状态、副标题文案
- `next/src/app/(admin)/admin/users/page.tsx`：移除用户表格「Linux.do」列
- `next/src/app/(admin)/admin/settings/page.tsx`：移除 LinuxDo 默认配置、配置卡片、normalize 函数中 linuxDo 处理
- `next/src/services/api/admin.ts`：移除 `AdminUser.linuxDoId`、`AdminPublicSettings.auth.linuxDo`、`AdminPrivateSettings.auth`
- `next/public/icons/linuxdo.svg`：删除

### 验证步骤

1. 启动后端，确认编译通过，无 LinuxDo 相关报错
2. 访问 `/login`，确认只显示账号密码登录/注册，无 Linux.do 登录按钮
3. 访问 `/admin/settings` 可视化编辑页，确认不再显示「Linux.do 登录」配置卡片
4. 访问 `/admin/users`，确认用户表格不再显示「Linux.do」列
5. 保存系统配置，确认不报错

## 首页 Banner 资源本地化

将首页 banner 从 jsdelivr CDN 远程加载改为本地 `next/public/banners/` 资源。

### 可测试变更

- `HOME_BANNERS` 配置中 3 个 banner 的 `imageUrl` 和 `videoUrl` 从 `https://gcore.jsdelivr.net/gh/tigerowo/infinite-canvas@v0.5.0/...` 改为本地路径 `/banners/xxx.webp`、`/banners/agent.webm`
- 本地资源（agent.webp、agent.webm、panorama.webp、3ddirector.webp）已存在于 `next/public/banners/`，与远程文件一一对应

### 涉及文件

- `next/src/app/(user)/page.tsx`：`HOME_BANNERS` 数组改用本地路径

### 验证步骤

1. 启动前端，访问首页 `/`
2. 确认 3 个 banner 正常显示（agent 动态封面 + panorama 静图 + 3ddirector 静图）
3. 点击激活的 agent banner，确认弹窗中 webm 视频可正常播放
4. 打开浏览器网络面板，确认 banner 资源从本地 `/banners/...` 加载，不再请求 `gcore.jsdelivr.net`

## 工作流模块独立化

把生图工作台内嵌的「创作工作流」抽离为导航下拉模块，与生图工作台彻底解耦。原「创作工作流」改名为「生图工作流」。详细方案见 [workflow-module-refactor.md](./workflow-module-refactor.md)。

### 可测试变更

- 顶部导航在「视频创作台」之后新增「工作流」项；当前只有一个子项「生图工作流」，导航项本身渲染为可点击 Link，直接跳转 `/workflows`
- 后续若新增子项（如提示词生成、AI 换装），`children.length ≥ 2` 后会自动切换为 antd Dropdown 下拉菜单（hover 触发）
- 移动端导航抽屉同步适配：单子项时为单行 Link；多子项时平铺渲染，子项缩进一级
- 生图工作台 `/image` 移除右下角悬浮「工作流」按钮、右侧抽屉、3 个工作流回调（`handleWorkflowTaskStarted/Success/Failure`）、按钮拖拽逻辑、`WORKFLOW_BUTTON_POSITION_KEY` 持久化
- 生图工作台后端任务轮询 `listCanvasImageTasks` 的标签数组从 `["image-workbench", "workflow"]` 改为 `["image-workbench"]`，不再拉取工作流任务
- 生图工作台与工作流彻底解耦：工作流产出不再写入生图历史，只在 `/workflows` 页面内查看
- 工作流组件 `CreativeWorkflowWorkspace` 移除 `embedded` 和 `hideTaskList` 参数及所有相关分支，统一为独立页样式
- 原「创作工作流」改名「生图工作流」（页面标题与副标题）
- 历史日志中的工作流字段（`workflowId` / `workflowName` / `workflowInputs` / `workflowTaskId`）及「工作流 xxx」青色 Tag 展示**保留不动**，避免破坏历史数据

### 涉及文件

前端：
- `next/src/constant/navigation-tools.ts`：改造为 `NavLink | NavDropdown` 联合类型，新增 workflows 下拉分组；导出 `navigationSlugs` 用于 active 判断
- `next/src/components/layout/app-top-nav.tsx`：渲染逻辑适配（link / 单子项直跳 / 多子项 Dropdown）；`activeToolSlug` 改用 `navigationSlugs`
- `next/src/components/layout/mobile-nav-drawer.tsx`：移动端渲染适配（link / 单子项直跳 / 多子项平铺缩进）
- `next/src/app/(user)/image/page.tsx`：移除悬浮按钮、抽屉、3 个回调、拖拽逻辑、相关 ref/state/常量；后端任务轮询去掉 "workflow" 标签；移除未使用的 `WandSparkles`、`Drawer`、`ReactPointerEvent`、`CreativeWorkflowWorkspace`、`WorkflowExternalTask*` 导入
- `next/src/components/workflows/creative-workflow-workspace.tsx`：移除 `embedded` / `hideTaskList` 参数及所有相关分支；副标题统一为「把固定提示词和参数沉淀成模板，每次只填写变量即可批量复用。」；「创作工作流」改名「生图工作流」

### 验证步骤

1. 启动前端，确认顶部导航在「视频创作台」后出现「工作流」项，点击直接跳转 `/workflows`（无下拉菜单）
2. 确认 `/workflows` 页面标题为「生图工作流」，副标题为「把固定提示词和参数沉淀成模板，每次只填写变量即可批量复用。」
3. 在 `/workflows` 页面测试创建、运行、查看结果等核心功能
4. 访问 `/image` 生图工作台，确认悬浮按钮和抽屉已消失
5. 在生图工作台执行单次生图，确认功能正常，结果区正常显示
6. 查看生图历史，确认历史中已有的工作流产出仍能正常显示「工作流 xxx」青色标签
7. 切换到移动端视图，打开导航抽屉，确认「工作流」项显示为单行 Link，可点击跳转
8. 临时在 `navigation-tools.ts` 的 `workflows.children` 数组追加一个测试子项，确认导航自动切换为 Dropdown 下拉菜单（hover 弹出子菜单），验证完成后删除测试子项


