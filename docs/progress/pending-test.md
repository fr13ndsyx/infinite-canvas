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

## 未登录用户配置入口开关

新增 `allowGuestConfig` 公开配置字段，用于控制未登录用户是否能看到顶栏配置按钮及触发配置弹窗，便于引流期到变现期的切换。

### 可测试变更

- 后端 `PublicModelChannelSetting` 新增 `AllowGuestConfig *bool` 字段，`service/settings.go` 在字段为 nil 时默认置为 true（兼容旧配置）
- 前端 `AdminPublicModelChannelSettings` 类型同步新增 `allowGuestConfig: boolean`
- 管理后台 `/admin/settings` 公开配置卡片新增「是否允许未登录用户使用配置功能」开关，默认开启；关闭后未登录用户看不到顶栏配置入口，也无法通过模型选择器等入口触发配置弹窗
- 顶栏 `UserStatusActions` 在未登录用户且 `allowGuestConfig === false` 时隐藏配置按钮；已登录用户不受影响
- `AppConfigModal` 新增拦截 useEffect：未登录用户且开关关闭时，无论从哪个入口（模型选择器、画布、视频/生图工作台等）触发 `openConfigDialog`，都会立即关闭弹窗并提示「请登录后使用配置功能」

### 涉及文件

后端：
- `Go/model/setting.go`：`PublicModelChannelSetting` 新增 `AllowGuestConfig` 字段
- `Go/service/settings.go`：新增 `AllowGuestConfig` 默认值处理（nil 时设为 true）

前端：
- `next/src/services/api/admin.ts`：`AdminPublicModelChannelSettings` 新增 `allowGuestConfig` 字段
- `next/src/app/(admin)/admin/settings/page.tsx`：`emptySettings` 默认值、开关 Form.Item、`normalizePublicSetting` 中 `allowGuestConfig` 处理
- `next/src/components/layout/user-status-actions.tsx`：根据 `allowGuestConfig` 和登录状态控制顶栏配置按钮显示
- `next/src/components/layout/app-config-modal.tsx`：新增 useEffect 拦截未登录且开关关闭时的弹窗打开

文档：
- `docs/backend/backend-database.md`：新增 `allowGuestConfig` 字段说明

### 验证步骤

1. 启动后端，访问 `GET /api/settings`，确认返回的 `modelChannel.allowGuestConfig` 为 `true`
2. 登录管理后台 `/admin/settings`，确认公开配置卡片显示「是否允许未登录用户使用配置功能」开关且默认开启
3. 关闭开关并保存，刷新页面确认开关仍为关闭状态
4. 退出登录（或打开无痕窗口），确认顶栏不显示配置按钮（齿轮图标）
5. 在未登录状态下，进入生图/视频工作台，点击模型选择器中可能触发配置弹窗的入口，确认弹窗不打开并提示「请登录后使用配置功能」
6. 重新登录普通账号，确认顶栏配置按钮恢复显示，配置弹窗可正常打开
7. 登录管理后台重新开启开关并保存，退出登录，确认未登录用户顶栏配置按钮恢复显示且弹窗可正常打开

## 配置弹窗三 Tab 布局

把原「配置与用户偏好」弹窗从「渠道模式 + 通用偏好项」两层结构改为顶部 Segmented 三 Tab 切换：本地渠道 / 平台渠道 / 偏好设置。

### 可测试变更

- 顶部用 Segmented 替换原「渠道模式」Form.Item，三个选项：本地渠道 / 平台渠道 / 偏好设置
- 名称调整：原「本地直连」→「本地渠道」，原「云端渠道」→「平台渠道」（Tab 与平台渠道说明文案同步改名）
- Tab 可见性按权限控制：
  - admin 且同时开启 `allowCustomChannel` 和 `allowUserRemoteChannel`：三个 Tab 全可见，切换本地/平台 Tab 时同步 `channelMode`
  - 普通用户仅本地：显示「本地渠道」+「偏好设置」
  - 普通用户仅云端：显示「平台渠道」+「偏好设置」
  - 「偏好设置」Tab 始终可见
- 「本地渠道」Tab 内容：原「本地模型渠道」新增/列表块 + 「模型列表」块（自动同步开关、拉取全部渠道按钮）
- 「平台渠道」Tab 内容：平台渠道说明文案 + 默认生图/视频/文本/音频模型 ModelPicker（从偏好设置移入）
- 「偏好设置」Tab 内容：画布默认生图张数、音频声音/格式/语速、流式/Base64/Codex 三个开关、用户 S3/R2 存储配置、默认音频指令、系统提示词（仅本地渠道模式下显示）；不再包含默认模型选择
- 本地渠道 Tab 不单独放默认模型选择：本地渠道拉取模型列表后自动选第一个可用模型作为默认
- ModelPicker 选择框全局由胶囊形（rounded-full）改为矩形圆角（rounded-md），影响配置弹窗、画布、生图/视频工作台
- 弹窗打开时默认激活当前 `effectiveMode` 对应的渠道 Tab（local→本地渠道，remote→平台渠道）
- 未登录用户拦截逻辑保留：未登录且 `allowGuestConfig=false` 时弹窗仍被拦截，不影响

### 涉及文件

- `next/src/components/layout/app-config-modal.tsx`：
  - 新增 `activeTab` state（`"local" | "remote" | "preferences"`）
  - 新增 `visibleTabs` 计算逻辑（按权限决定可见 Tab）
  - 新增弹窗打开时根据 `effectiveMode` 重置默认 Tab 的 useEffect
  - 替换 Form 内容为 Tabs 结构：本地渠道/平台渠道/偏好设置
  - 默认模型选择 ModelPicker 从偏好设置移入「平台渠道」Tab
- `next/src/components/model-picker.tsx`：SelectTrigger 圆角由 `rounded-full` 改为 `rounded-md`（全局矩形化）

### 验证步骤

1. 登录管理后台（admin），同时开启 `allowCustomChannel` 和 `allowUserRemoteChannel`，打开配置弹窗，确认顶部显示三个 Tab：本地渠道 / 平台渠道 / 偏好设置
2. 默认激活 Tab 与当前渠道模式一致（本地模式→本地渠道，云端模式→平台渠道）
3. 切换到「本地渠道」Tab，确认显示本地模型渠道新增/列表块 + 模型列表块，可正常新增/删除/拉取渠道
4. 切换到「平台渠道」Tab，确认显示平台渠道说明文案 + 默认生图/视频/文本/音频模型选择（ModelPicker 选择框为矩形圆角，非胶囊形）
5. 切换到「偏好设置」Tab，确认不再显示默认模型选择，显示画布默认生图张数、音频设置、流式/Base64/Codex 开关、S3 存储、默认音频指令、系统提示词（仅本地模式时显示系统提示词）
6. 在「平台渠道」Tab 修改默认生图模型，点击「完成」保存，重新打开弹窗确认修改生效
7. 切换 admin 的 `allowCustomChannel` 关闭（仅保留 `allowUserRemoteChannel`），重新打开弹窗，确认只显示「平台渠道」+「偏好设置」两个 Tab
8. 登录普通用户 tester（仅本地渠道），打开配置弹窗，确认显示「本地渠道」+「偏好设置」两个 Tab，本地渠道 Tab 拉取模型后自动选第一个作为默认
9. 退出登录（未登录状态且 `allowGuestConfig` 开启），打开配置弹窗，确认显示「本地渠道」+「偏好设置」两个 Tab，拦截逻辑不受影响
10. 关闭 `allowGuestConfig` 开关，未登录状态下点击配置入口，确认弹窗被拦截并提示「请登录后使用配置功能」
11. 打开画布、生图工作台、视频创作台，确认 ModelPicker 选择框均为矩形圆角（非胶囊形）

## 空画布引导浮层

在新建空画布或从首页 agent 会话框进入新空画布时，画布视口中心显示引导浮层，帮助用户快速了解使用方式。

### 可测试变更

- 空画布（`nodes.length === 0`）时在画布视口中心显示两层引导浮层：
  - 上层：黑色圆角提示按钮（鼠标右键 SVG + "鼠标右键"文案），纯提示无功能
  - 下层：4 个快捷按钮（上传素材/生成图片/生成视频/让 Agent 创建），有实际功能
- 浮层固定在视口中心，不随画布平移/缩放移动（`absolute inset-0 flex items-center justify-center`）
- 浮层容器 `pointer-events-none`，按钮 `pointer-events-auto`，不阻挡画布右键/拖拽操作
- 快捷按钮功能：
  - 上传素材 → 触发 `handleUploadRequest()`
  - 生成图片 → `createNode(CanvasNodeType.Image)`
  - 生成视频 → `createNode(CanvasNodeType.Video)`
  - 让 Agent 创建 → 展开右侧助手面板（`setAssistantMounted(true)` + `setAgentPanel open:true`）
- 画布创建任意节点后（`nodes.length > 0`）浮层自动隐藏
- 快捷按钮颜色使用 `theme.node.text` / `theme.node.muted`，适配浅色/深色主题

### 涉及文件

- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：在 `</InfiniteCanvas>` 后新增空状态引导浮层 JSX

### 验证步骤

1. 新建空白画布，确认视口中心显示黑色"鼠标右键"提示按钮 + 下方 4 个快捷按钮
2. 确认黑色提示按钮点击无响应（纯提示）
3. 点击「上传素材」按钮，确认触发文件上传流程
4. 点击「生成图片」按钮，确认画布创建图片节点，浮层消失
5. 删除节点使画布再次为空，确认浮层重新出现
6. 点击「生成视频」按钮，确认创建视频节点，浮层消失
7. 点击「让 Agent 创建」按钮，确认右侧助手面板展开
8. 从首页 agent 会话框输入内容进入新画布，确认浮层显示（pendingAgentRequest 消费前画布为空）
9. 在画布空白处右键，确认右键菜单正常弹出（浮层不阻挡右键操作）
10. 拖拽/缩放画布，确认浮层始终固定在视口中心不移动
11. 切换浅色/深色主题，确认浮层文字和图标颜色适配主题

## 生图/视频工作台按钮与输入框圆角统一

把生图/视频工作台里的质量、尺寸、张数、清晰度、秒数、任务数量等按钮和输入框统一改成方框带圆角（`rounded-md`），替换原胶囊形（`rounded-full`）和较大圆角（`rounded-xl`/`rounded-lg`）。

### 可测试变更

- 生图工作台 `ImageSettingsPanel`：
  - 质量按钮（自动/高/中/低）和生成张数按钮（1-10 张）的 `OptionPill` 圆角 `rounded-full` → `rounded-md`
  - W/H 尺寸输入框 `DimensionInput` 容器圆角 `rounded-xl` → `rounded-md`
  - 自定义张数输入框 `CountInput` 圆角 `rounded-full` → `rounded-md`
- 视频工作台 `VideoSettingsPanel`（side 布局实际使用的面板）：
  - 清晰度按钮、秒数按钮、Seedance 分辨率按钮的 `OptionPill` 圆角 `rounded-full` → `rounded-md`
  - 自定义清晰度输入框 `ResolutionInput` 圆角 `rounded-full` → `rounded-md`
  - W/H 尺寸输入框 `DimensionInput` 圆角 `rounded-xl` → `rounded-md`
  - 秒数自定义输入框 `NumberInput` 圆角 `rounded-full` → `rounded-md`
  - Kling 模式选择按钮（720P/1080P/4K/标准/专业）圆角 `rounded-full` → `rounded-md`
  - Kling/通用/Seedance 比例按钮圆角 `rounded-xl` → `rounded-md`
- 视频工作台 `KlingV26WorkbenchPanel`（Kling 专用紧凑面板）：
  - 模式/尺寸/秒数等可选按钮 `optionClass` 圆角 `rounded-full` → `rounded-md`
  - 秒数自定义输入框、分镜时长输入框 `KlingNumberInput` 圆角 `rounded-full` → `rounded-md`
  - 任务数量输入框 `KlingTaskCount` 外层 `rounded-xl` 与内层 input `rounded-lg` 统一改为 `rounded-md`
- 通用底部 compact 布局（生图 page 和视频 page）：
  - 生图 `QuickSelect`、`QuickNumber` 圆角 `rounded-xl` → `rounded-md`
  - 视频 `QuickSelect`、`QuickNumber`、`TaskCountControl`、`optionPillClass` 圆角统一为 `rounded-md`
- 视频工作台 `VideoSettingsPanel` 秒数自定义输入框：在输入框右侧追加 "s" 单位后缀（与清晰度输入框的 "p" 后缀对齐）
- 视频工作台 `VideoSettingsPanel` 通用面板：把比例选择按钮从「尺寸」组拆出，单独成「比例」SettingGroup，避免与 W/H 尺寸输入框挤在一起
- 生图工作台 `ImageSettingsPanel`：「宽高比」标题改为「比例」
- 生图/视频工作台比例按钮统一调整尺寸，避免拥挤：
  - 生图 `aspectOptions` 按钮：`h-[60px]` → `h-[72px]`，`gap-2` → `gap-1.5`
  - 视频通用 `sizeOptions` 按钮：`h-[60px]` → `h-[72px]`，`gap-2` → `gap-1.5`
  - Kling/Seedance 比例按钮：`h-[68px]` → `h-[76px]`，`gap-1` → `gap-1.5`
- 生图工作台 `ImageSettingsPanel` 比例按钮按分辨率档位切换显示：
  - `aspectOptions` 新增 `tier` 字段（standard/2k/4k）
  - 「比例」标题右侧新增 Segmented 切换器（标准 / 2K / 4K），切换后只显示对应档位的比例按钮，`auto` 选项始终保留
  - 2K/4K 按钮的 label 去掉 `(2k)`/`(4k)` 后缀（档位已由 Segmented 表达，避免重复）
  - 切换档位时若当前选中的比例不在新档位，自动重置为 `auto`
  - 弹窗打开时根据 `config.size` 自动定位到对应档位（如 `16:9-2k` → 默认 2K）
  - 补全 2K/4K 档位的全部比例（按 16 倍数对齐）：
    - 2K 新增：3:2（2048×1360）、2:3（1360×2048）、4:3（2048×1536）、3:4（1536×2048）
    - 4K 新增：1:1（4096×4096）、3:2（4096×2720）、2:3（2720×4096）、4:3（4096×3072）、3:4（3072×4096）
    - 三档位比例数量一致（8 个 + auto），云端模型不支持时靠报错兜底

### 涉及文件

- `next/src/components/image-settings-panel.tsx`：`OptionPill`、`DimensionInput`、`CountInput` 三个组件 className 圆角统一；「宽高比」改名「比例」；比例按钮高度和 gap 调整；新增 `tier` 字段和 Segmented 档位切换（标准/2K/4K）
- `next/src/components/video-settings-panel.tsx`：`OptionPill`、`ResolutionInput`、`DimensionInput`、`NumberInput`、Kling 模式按钮、Kling/通用/Seedance 比例按钮圆角统一；`NumberInput` 追加 "s" 后缀；通用面板拆分「尺寸」和「比例」两个 SettingGroup；比例按钮高度和 gap 调整
- `next/src/app/(user)/image/page.tsx`：底部 compact 布局用的 `QuickSelect`、`QuickNumber` 圆角统一
- `next/src/app/(user)/video/components/kling-v26-workbench-panel.tsx`：`optionClass`、`KlingNumberInput`、`KlingTaskCount` 三个组件 className 圆角统一
- `next/src/app/(user)/video/page.tsx`：Seedance/通用视频工作台用的 `QuickSelect`、`QuickNumber`、`TaskCountControl`、`optionPillClass` 圆角统一

### 验证步骤

1. 启动前端，进入生图工作台 `/image`，展开「图像设置」面板
2. 确认质量按钮（自动/高/中/低）为方框带轻微圆角（非胶囊形）
3. 确认 W/H 尺寸输入框为方框带轻微圆角（非大圆角）
4. 确认生成张数按钮（1-10 张）和右侧自定义张数输入框均为方框带轻微圆角
5. 确认生图「宽高比」标题已改为「比例」，比例按钮高度增加、内容不拥挤
6. 确认生图「比例」标题右侧有 Segmented 档位切换器（标准 / 2K / 4K），默认根据当前 `config.size` 自动定位（例如 1:1 在「标准」，1:1(2k) 在「2K」，16:9(4k) 在「4K」）
7. 切换 Segmented 到「2K」，确认只显示 1:1 / 16:9 / 9:16 / 21:9 四个比例按钮 + auto，按钮无 `(2k)` 后缀
8. 切换 Segmented 到「4K」，确认只显示 16:9 / 9:16 / 21:9 三个比例按钮 + auto
9. 切换到「2K」选中 16:9，再切换到「4K」，确认 16:9 选项不在 4K 中时自动重置为 auto
10. 进入视频创作台 `/video`，展开各设置区
11. 确认模式（720P/1080P/4K）、尺寸（16:9/9:16/1:1）、秒数（3s/15s 或 5s/10s）等按钮为方框带轻微圆角
12. 确认秒数自定义输入框、分镜时长输入框为方框带轻微圆角，且秒数自定义输入框右侧带 "s" 单位
13. 确认任务数量输入框（外层容器和内层 input）均为方框带轻微圆角
14. 切换到 Seedance / 通用视频工作台（非 Kling 模型），确认底部 compact 布局中的清晰度、尺寸、秒数、任务数量等 select/input 均为方框带轻微圆角
15. 进入视频工作台 side 布局的「视频设置」面板（通用模型），确认「尺寸」组只有 W/H 输入框，下方有独立的「比例」组放比例选择按钮，比例按钮不拥挤
16. 切换到 Kling / Seedance 视频设置面板，确认比例按钮（带像素说明的三行内容）高度增加、gap 适中不拥挤
17. 切换浅色/深色主题，确认方框边框和颜色正常显示

## 管理后台模型管理拆分（原"渠道管理"）

把渠道配置从 `/admin/settings` 拆出来作为独立菜单项 `/admin/channels`（UI 文案显示为"模型管理"），系统设置页私有 tab 仅保留同步/日志/存储三块。详细方案见 [channels-page-split.md](./channels-page-split.md)。

### 可测试变更

- 新增管理后台页面 `/admin/channels`，承载原嵌在系统设置页私有 tab 的全部渠道逻辑（页面 UI 文案统一为"模型管理"）：
  - 渠道 Table（名称/协议/状态/模型/权重/超时/操作）
  - Channel Drawer（新增/编辑，标题为"新增模型"/"编辑模型"，含 name/protocol/baseUrl/apiKey/models/weight/timeout/enabled/remark）
  - 选择模型 Modal（双 tab：新获取/已有，Checkbox 网格、搜索、增加模型、拉取模型列表）
  - 模型测试 Modal（单测/批测）
- 管理后台侧边栏在「素材库」和「系统设置」之间新增「模型管理」菜单项，使用 `ApiOutlined` 图标
- 顶部 Header 标题在 `/admin/channels` 路径下显示「模型管理」
- 系统设置页私有 tab 移除：渠道 Table、Channel Drawer、选择渠道模型 Modal、模型测试 Modal
- 系统设置页公开 tab「系统可用模型」Select 的 options 改为从 `Form.useWatch(["private", "channels"], form)` 派生（不再依赖独立 `channels` state），extra 文案改为"可选项来自「模型管理」中各启用模型配置的模型"
- 系统设置页 `saveSettings` 移除 `mergeChannelApiKeys` / `setChannels` / `setKnownModels` 等渠道相关逻辑；`loadSettings` 移除 `setChannels` / `setKnownModels`
- 沿用整体保存模式：模型管理页保存时读取 form 中的全量 settings，仅替换 `private.channels` 后整体 `POST /api/admin/settings`，后端零改动
- 模型管理页内联一份 normalize 逻辑（`normalizeSettings` / `normalizePublicSetting` / `normalizePrivateSetting` / `normalizeChannel` 等），与 settings 页解耦
- 修复新增/编辑模型时浏览器自动填充账号密码问题：Drawer 内 Form 加 `autoComplete="off"`，baseUrl 用 `autoComplete="off"`，apiKey 用 `autoComplete="new-password"`，并在 Form 顶部加两个隐藏的假用户名/密码 input 引导浏览器填充到那里

### 涉及文件

- `next/src/app/(admin)/admin/channels/page.tsx`：新增，从 settings/page.tsx 迁移渠道相关全部逻辑
- `next/src/app/(admin)/admin/layout.tsx`：新增「模型管理」菜单项（路由 key 仍为 `/admin/channels`）和路由元数据，import `ApiOutlined`
- `next/src/app/(admin)/admin/settings/page.tsx`：删除渠道相关 UI/state/函数（约 400 行），`channelModels` 改为 Form.useWatch 派生

### 验证步骤

1. 启动前端，登录管理后台 admin/admin123
2. 确认侧边栏在「素材库」和「系统设置」之间出现「模型管理」菜单项（图标为 ApiOutlined）
3. 点击「模型管理」，确认 URL 为 `/admin/channels`（路由不变），顶部 Header 标题显示「模型管理」
4. 确认 Table 正常展示原有渠道数据（名称/协议/状态/模型/权重/超时/操作列）
5. 点击「新增模型」，确认 Drawer 弹出，标题为"新增模型"；**确认接口地址、API Key 输入框不会被浏览器自动填充账号密码**（这是本次修复重点）
6. 填写 baseUrl + apiKey + 名称后保存，确认新渠道出现在 Table 中
7. 点击某行的「编辑」，Drawer 标题为"编辑模型"，修改名称后保存，确认 Table 中名称已更新；确认编辑时 apiKey 输入框 placeholder 为"留空则沿用已保存的 API Key"
8. 点击某行的「测试」，确认测试 Modal 标题为"{名称} 模型测试"，选择模型后点击「测试」或「批量测试」，确认状态显示正常（成功/失败/请求时长）
9. 在编辑 Drawer 中点击「选择模型」，确认选择模型 Modal 标题为"选择模型"，点击「拉取模型列表」可拉取上游模型，勾选后确认返回 Drawer
10. 点击某行的删除按钮，确认渠道从 Table 中移除
11. 切换到「系统设置」页面，确认私有 tab 仅剩 3 块 Card：提示词定时同步、AI 调用日志、数据存储；不再显示渠道 Table / Drawer / Modal
12. 切换到公开 tab，确认「系统可用模型」Select 的下拉 options 仍正常显示已启用模型配置的模型；extra 文案为"可选项来自「模型管理」中各启用模型配置的模型"
13. 在公开 tab 修改默认模型或系统提示词，点击「保存设置」，确认保存成功且无报错
14. 在公开 tab 切到「手动编辑 JSON」模式，确认 JSON 内容正常显示且可编辑/格式化
15. 在私有 tab 切到「手动编辑 JSON」模式，确认 JSON 内容包含 `private.channels` 字段（保存全量 settings 仍包含渠道数据）
16. 在模型管理页保存渠道后切到系统设置页，确认系统设置页公开 tab 的「系统可用模型」options 已按最新渠道模型更新

## 修复公开配置可用模型不随渠道同步

修复 bug.md 反馈的问题：管理后台模型管理添加渠道后，公开配置 `availableModels` 一直为空，普通用户看不到/用不了管理员配置的付费模型。根因是保存设置时只对 `availableModels` 做交集过滤（`filterEnabledModels`），从不把新渠道的模型合并进来，与 `docs/backend/system-settings.md` 描述的"自动合并"设计意图不符。

### 可测试变更

- 保存设置时自动合并新增渠道模型：`SaveSettings` 在过滤之外调用 `mergeNewEnabledChannelModels`，把本次新增启用渠道的模型并入公开配置 `availableModels`
- 空值兜底：`normalizePublicSettingWithChannels` 中过滤后若 `availableModels` 为空，则直接用当前启用渠道模型填充（首次配置/全部失效时不再出现空列表）
- 管理员手动移除的既有模型不会被加回：只合并"上次不存在、这次新出现"的启用模型，已存在但被手动取消勾选的模型保持移除状态
- 默认模型自动修复逻辑不变：默认文/图/视频模型不在可用列表时仍按原规则修复

### 涉及文件

- `Go/service/settings.go`：`SaveSettings` 增加合并调用；`normalizePublicSettingWithChannels` 增加空值填充；新增 `mergeNewEnabledChannelModels` 函数

### 验证步骤

1. 管理后台「模型管理」新增一个启用渠道（含若干模型），保存后打开系统设置页公开 tab，确认「系统可用模型」中已自动出现该渠道的模型（修复前为空）
2. 若此前 `availableModels` 为空，确认保存后默认文/图/视频模型被自动修复为列表中的有效模型
3. 在系统设置页公开 tab 手动取消勾选某个既有模型并保存，再次保存渠道配置，确认该模型不会被自动加回
4. 普通用户登录后打开生图/视频工作台或聊天，确认模型下拉中能看到并正常使用管理员配置的付费模型

## 管理后台导航重组

按管理员工作流重组后台导航为四组（用户与资费 / 模型服务 / 内容库 / 系统），隐藏"公开/私有配置"实现概念；原系统设置页拆分为「开放与定价」「存储设置」「系统偏好」「高级配置」四个新页面，并把 `promptSync` 迁进提示词来源页、`aiLog` 迁进 AI 调用日志页。详细方案见 [admin-nav-restructure.md](./admin-nav-restructure.md)。

### 可测试变更

- `admin/layout.tsx` 菜单改为 4 分组结构：用户与资费（用户管理 / 算力点日志）/ 模型服务（模型管理 / 开放与定价 / AI 调用日志）/ 内容库（提示词来源 / 提示词管理 / 素材库）/ 系统（存储设置 / 系统偏好 / 高级配置），移除原「系统设置」菜单项
- `admin/settings/page.tsx` 删除全部内容，改为 `redirect("/admin/model-pricing")`，兼容旧链接
- 新增 `admin/model-pricing/page.tsx`「开放与定价」页：系统可用模型多选（options 来自已启用渠道模型并标注来源渠道名）、未定价模型顶部 Alert 警告、模型定价表（每行算力点单价输入框）、默认文/图/视频模型 4 个 Select、`allowCustomChannel` / `allowUserRemoteChannel` 两个渠道策略开关
- 新增 `admin/storage/page.tsx`「存储设置」页：存储模式、`allowUserProvider` / `allowUserGlobalProvider` 开关、容量上限与定时测量 cron、providers 列表
- 新增 `admin/preferences/page.tsx`「系统偏好」页：访问控制（`auth.allowRegister` / `allowGuestConfig`）+ 5 个内置系统提示词 TextArea
- 新增 `admin/advanced/page.tsx`「高级配置」页：左右两栏 JSON 编辑器（公开 / 私有），页头警示"仅供排障与迁移使用"
- 新增 `admin/settings-shared.ts` 抽取共享的 `normalizeSettings` / `normalizePublicSetting` / `normalizePrivateSetting` / `filterModels` / `collectChannelModels` 等归一化函数
- `admin/prompt-sources/page.tsx` 顶部新增「定时同步」卡片：`promptSync.enabled` 开关 + Cron 表达式
- `admin/ai-logs/page.tsx` 顶部新增「日志设置」卡片：`aiLog.localDirectReportEnabled` 开关 + 自动清理开关 + 保留天数 + Cron
- 后端零改动，各新页面沿用全量 settings 读写模式（读全量 → 渲染自己负责片段 → 整体 `POST /api/admin/settings`）

### 涉及文件

前端：
- `next/src/app/(admin)/admin/layout.tsx`：菜单改为 4 分组结构，新增 4 个菜单项与 `routeMeta`，移除原「系统设置」项
- `next/src/app/(admin)/admin/settings/page.tsx`：清空原内容，改为 `redirect("/admin/model-pricing")`
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「开放与定价」页
- `next/src/app/(admin)/admin/storage/page.tsx`：新增「存储设置」页
- `next/src/app/(admin)/admin/preferences/page.tsx`：新增「系统偏好」页
- `next/src/app/(admin)/admin/advanced/page.tsx`：新增「高级配置」页
- `next/src/app/(admin)/admin/settings-shared.ts`：新增共享归一化函数
- `next/src/app/(admin)/admin/prompt-sources/page.tsx`：顶部新增「定时同步」卡片
- `next/src/app/(admin)/admin/ai-logs/page.tsx`：顶部新增「日志设置」卡片

### 验证步骤

1. 登录管理后台，确认左侧菜单显示 4 个分组：用户与资费 / 模型服务 / 内容库 / 系统
2. 确认「系统设置」菜单项已消失，原 `/admin/settings` 路径访问时自动跳转到 `/admin/model-pricing`
3. 点击「开放与定价」菜单，确认页面显示：系统可用模型多选、未定价模型 Alert（若有）、模型定价表、默认模型 Select×4、渠道策略开关×2
4. 在「模型管理」新增一个启用渠道并保存后，回到「开放与定价」页确认该渠道的模型已自动出现在「系统可用模型」中
5. 在「开放与定价」页修改某个模型的算力点单价并保存，刷新确认价格持久化
6. 切换 `allowCustomChannel` / `allowUserRemoteChannel` 两个开关，确认下方"当前：xxx"模式说明文案同步更新
7. 点击「存储设置」菜单，确认页面显示存储模式、`allowUserProvider` / `allowUserGlobalProvider` 开关、容量上限、定时测量 cron、providers 列表
8. 点击「系统偏好」菜单，确认页面显示 `auth.allowRegister` / `allowGuestConfig` 两个开关 + 5 个内置系统提示词 TextArea（image / video / text / workflow / workflowAgent）
9. 点击「高级配置」菜单，确认页面顶部有警示文案，左右两栏分别显示公开 / 私有 JSON，可格式化、可编辑、可保存
10. 点击「提示词来源」菜单，确认页面顶部新增「定时同步」卡片（开启开关 + Cron 表达式），修改 Cron 保存后刷新确认持久化
11. 点击「AI 调用日志」菜单，确认页面顶部新增「日志设置」卡片（本地直连上报开关 + 自动清理开关 + 保留天数 + Cron），修改后保存刷新确认持久化
12. 旧链接兼容：浏览器直接访问 `/admin/settings`，确认自动重定向到 `/admin/model-pricing`

## 生图/视频模型能力配置

管理后台支持按模型勾选支持的图片比例、图片档位和视频清晰度，前端生图/视频工作台根据当前所选模型的能力动态渲染选项按钮，切换模型时若当前选项不在新模型支持范围内则自动回退。详细方案见 [model-capabilities-refactor.md](./model-capabilities-refactor.md)。

### 可测试变更

- 后端 `PublicModelChannelSetting` 新增 `ModelCapabilities` 字段（`[]ModelCapability`），每项含 `model`/`imageAspects`/`imageTiers`/`videoResolutions`
- 后端 `normalizeModelCapabilities` 按 `AvailableModels` 过滤冗余项、同模型去重保留首个、字段去空格
- 空字段语义（由前端处理默认值）：`imageAspects` 空=支持全部标准比例；`imageTiers` 空=仅标准档；`videoResolutions` 空=480p/720p/1080p
- 管理后台「开放与定价」页新增「模型能力」卡片：仅展示生图或视频模型，每个模型可勾选图片比例（8 选项）、图片档位（标准/2K/4K）、视频清晰度（480p/720p/1080p/2K/4K）
- 前端 store `resolveEffectiveConfig` 返回当前模型的 `modelCapabilities`，切换模型时若当前 `size` 比例不在新模型能力内回退到 `auto`，若当前 `vquality` 不在新模型能力内回退到第一个支持的档位
- 生图工作台 `ImageSettingsPanel` 新增 `capabilities` prop：按 `imageTiers` 过滤 Segmented 档位（仅 1 档时隐藏 Segmented），按 `imageAspects` 过滤比例按钮（空=全部）
- 视频工作台 `VideoSettingsPanel` 新增 `capabilities` prop：按 `videoResolutions` 动态生成清晰度按钮并隐藏自定义输入框（空=默认 480p/720p + 自定义输入）

### 涉及文件

后端：
- `Go/model/setting.go`：新增 `ModelCapability` 结构体；`PublicModelChannelSetting` 添加 `ModelCapabilities` 字段
- `Go/service/settings.go`：新增 `normalizeModelCapabilities` 函数；`normalizePublicSettingWithChannels` 中调用

前端：
- `next/src/services/api/admin.ts`：新增 `AdminModelCapability` 类型；`AdminPublicModelChannelSettings` 添加 `modelCapabilities` 字段
- `next/src/app/(admin)/admin/settings-shared.ts`：新增 `normalizeModelCapabilities` 归一化函数
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「模型能力」编辑卡片（Checkbox.Group 勾选配置）
- `next/src/stores/use-config-store.ts`：`AiConfig` 扩展 `modelCapabilities` 字段；新增 `resolveEffectiveImageSize` / `resolveEffectiveVideoQuality` 回退函数
- `next/src/components/image-settings-panel.tsx`：新增 `capabilities` prop；按能力过滤档位和比例
- `next/src/components/video-settings-panel.tsx`：新增 `capabilities` prop；按能力动态生成清晰度选项

文档：
- `docs/backend/backend-database.md`：新增 `modelCapabilities` 字段及每项字段说明

### 验证步骤

1. 启动后端和前端，登录管理后台访问 `/admin/model-pricing`
2. 确认页面底部显示「模型能力」卡片，仅列出生图或视频模型（非文本/音频模型）
3. 为某个生图模型勾选部分图片比例（如仅 1:1 / 16:9 / 9:16）和图片档位（如标准 / 2K），保存后刷新确认持久化
4. 为某个视频模型勾选部分视频清晰度（如仅 720p / 1080p），保存后刷新确认持久化
5. 退出登录或用普通账号，进入生图工作台 `/image`
6. 选择刚才配置了能力的生图模型，确认：
   - Segmented 档位切换器只显示已勾选的档位（如标准 / 2K，无 4K）
   - 比例按钮只显示已勾选的比例（如 1:1 / 16:9 / 9:16，无其他）
7. 选择一个未配置能力的生图模型，确认走默认值：Segmented 显示全部三档，比例显示全部（空=全部）
8. 选择一个仅支持标准档的生图模型（`imageTiers` 只有 `standard`），确认 Segmented 切换器隐藏（只支持 1 档无意义）
9. 当前选中 16:9-4k 后切换到不支持 4K 的模型，确认 `size` 自动回退到 16:9（标准档位）或 auto
10. 进入视频创作台 `/video`，选择刚才配置了能力的视频模型
11. 确认清晰度按钮只显示已勾选的选项（如 720p / 1080p），自定义清晰度输入框隐藏
12. 选择未配置能力的视频模型，确认走默认值：显示 480p / 720p + 自定义输入框
13. 当前选中 1080p 后切换到不支持 1080p 的视频模型，确认 `vquality` 自动回退到第一个支持的档位
14. 在管理后台清空某模型的全部能力勾选并保存，确认前端该模型走默认值策略（生图全比例+仅标准档，视频三档）


