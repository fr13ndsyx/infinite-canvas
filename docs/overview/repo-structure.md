# 仓库目录结构

```text
infinite-canvas/
├── .agents/                        # AI 技能包，供 Trae Agent 调用，与业务无关
│   └── skills/
│       ├── frontend-design/       # 前端设计技能
│       └── vercel-react-best-practices/  # React/Next.js 最佳实践规则集
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI 流水线
│       └── docker-image.yml        # 构建并发布 Docker 镜像到 GHCR
├── Go/                             # 后端代码（Go + Gin + GORM）
│   ├── config/                     # 配置加载层
│   │   ├── config.go               # 读取 Go/.env 或环境变量，含 Docker SQLite 路径自动重映射
│   │   └── config_test.go
│   ├── handler/                    # HTTP 入参处理层，只解析请求→调用 service→返回 OK/Fail
│   │   ├── admin.go                # 管理后台接口（用户/提示词分类/渠道）
│   │   ├── auth.go                 # 登录注册
│   │   ├── settings.go             # 系统设置读写
│   │   ├── canvas_project.go       # 画布项目接口
│   │   ├── canvas_task.go          # 画布节点任务接口
│   │   ├── apimart_image.go        # Agnes 渠道生图
│   │   ├── apimart_video.go        # Agnes 渠道视频
│   │   ├── kie_image.go             # KIE 渠道生图（可选渠道，未接入时不执行）
│   │   ├── kie_video.go             # KIE 渠道视频
│   │   ├── video_task.go           # 视频任务轮询
│   │   ├── assets.go               # 素材接口
│   │   ├── media_reference.go      # 媒体引用接口
│   │   ├── prompts.go              # 提示词接口
│   │   ├── workflow.go              # 工作流接口
│   │   ├── storage.go               # 文件存储接口
│   │   ├── user_data.go            # 用户数据接口
│   │   ├── generation_log.go       # 生成日志接口
│   │   ├── ai.go                   # AI 调用接口
│   │   └── response.go             # 统一响应封装 OK/Fail
│   ├── service/                    # 业务逻辑层（默认值/校验/时间/ID/鉴权）
│   │   ├── settings.go             # 设置归一化与 availableModels 自动并入
│   │   ├── auth.go                 # 登录注册逻辑
│   │   ├── prompts.go              # 提示词 CRUD
│   │   ├── prompt_fetch.go         # 远程提示词拉取
│   │   ├── prompt_sync_scheduler.go # 提示词定时同步调度器
│   │   ├── canvas_project.go       # 画布项目业务
│   │   ├── canvas_project_deletion_scheduler.go # 软删除清理调度
│   │   ├── canvas_image_task.go    # 画布图片生成任务
│   │   ├── canvas_audio_task.go    # 画布音频生成任务
│   │   ├── video_task.go           # 视频任务轮询业务
│   │   ├── workflow.go             # 工作流业务
│   │   ├── workflow_agent.go       # 工作流 Agent
│   │   ├── assets.go               # 素材业务
│   │   ├── storage.go              # 存储业务
│   │   ├── user_data.go            # 用户数据业务
│   │   ├── ai_log.go               # AI 调用日志
│   │   ├── generation_log.go       # 生成日志
│   │   ├── ssrf.go                 # SSRF 防护
│   │   ├── context.go              # 上下文工具
│   │   ├── settings_test.go
│   │   ├── auth_redirect_test.go
│   │   └── ssrf_test.go
│   ├── repository/                # 数据库访问层，纯 GORM 查询（每文件对应一个 model）
│   │   ├── db.go                   # 全局连接初始化 + AutoMigrate + 种子数据
│   │   ├── user.go / asset.go / prompt.go / setting.go ...
│   │   └── ...
│   ├── model/                      # 数据结构与枚举（与数据库表一一对应）
│   │   ├── user.go                 # users 表
│   │   ├── prompt.go               # prompts + prompt_categories 表
│   │   ├── setting.go              # settings 表（public/private 两行）
│   │   ├── canvas_project.go / canvas_image_task.go / canvas_audio_task.go
│   │   ├── video_task.go / video_generation_log.go / image_generation_log.go
│   │   ├── ai_log.go / asset.go / storage.go / user_config.go / workflow.go
│   │   └── query.go                # 通用列表查询参数（分页/标签筛选）
│   ├── middleware/
│   │   └── admin.go                # 管理员鉴权中间件
│   ├── router/
│   │   └── router.go               # 路由注册，绑定 URL 到 handler
│   ├── main.go                     # 程序入口：加载配置→建 admin→起调度器→起 HTTP
│   ├── go.mod / go.sum             # Go 依赖管理
│   └── data/                       # 数据库文件目录（git 忽略，SQLite 时代用，postgres 后空）
├── next/                           # 前端代码（Next.js App Router + React + TS + antd + Tailwind + Zustand）
│   ├── public/                     # 静态资源
│   │   ├── banners/                # 首页 banner 图/视频（agent/panorama/3ddirector）
│   │   ├── director/               # 3D Director 模块（模型 + 资源）
│   │   ├── icons/                  # AI 厂商 svg 图标（claude/deepseek/gemini/glm/grok/openai）
│   │   └── logo.svg
│   ├── src/
│   │   ├── app/                    # Next.js App Router 页面
│   │   │   ├── (admin)/admin/      # 管理后台（左侧菜单 4 分组）
│   │   │   │   ├── users/          # 用户管理
│   │   │   │   ├── credit-logs/    # 算力点日志
│   │   │   │   ├── channels/       # 模型管理（原渠道配置）
│   │   │   │   ├── model-pricing/  # 开放与定价
│   │   │   │   ├── ai-logs/        # AI 调用日志（顶部含日志设置卡片）
│   │   │   │   ├── prompt-sources/ # 提示词来源（顶部含定时同步卡片）
│   │   │   │   ├── prompts/        # 提示词管理
│   │   │   │   ├── assets/         # 素材库
│   │   │   │   ├── storage/        # 存储设置
│   │   │   │   ├── preferences/    # 系统偏好
│   │   │   │   ├── advanced/       # 高级配置（JSON 编辑器）
│   │   │   │   ├── settings/       # 已废弃，重定向到 /admin/model-pricing
│   │   │   │   ├── layout.tsx      # 管理后台布局（侧边栏 + Header）
│   │   │   │   └── settings-shared.ts # 共享的 normalize 归一化函数
│   │   │   ├── (user)/             # 用户端
│   │   │   │   ├── page.tsx        # 首页（含 banner 轮播）
│   │   │   │   ├── canvas/[id]/    # 无限画布（核心交互）
│   │   │   │   │   ├── canvas-client-page.tsx # 画布客户端入口
│   │   │   │   │   ├── page.tsx    # 服务端入口
│   │   │   │   │   ├── types.ts / constants.ts / export-types.ts
│   │   │   │   │   ├── agent/      # 画布 Agent 运行时 + 13 个技能（image/video/audio/organize/workflow）
│   │   │   │   │   ├── components/ # 30+ 画布组件（节点/工具栏/面板/对话框/迷你地图/右键菜单）
│   │   │   │   │   ├── stores/     # use-canvas-store（数据）+ use-canvas-ui-store（UI 状态）
│   │   │   │   │   └── utils/      # 相机/导出/分组/图片数据/节点尺寸/全景图
│   │   │   │   ├── image/          # 生图工作台
│   │   │   │   ├── video/          # 视频创作台（含 Kling 专用面板）
│   │   │   │   ├── workflows/      # 生图工作流
│   │   │   │   ├── prompts/        # 提示词浏览
│   │   │   │   ├── assets/         # 素材浏览
│   │   │   │   ├── asset-library/  # 素材库
│   │   │   │   ├── login/          # 登录页
│   │   │   │   ├── home-banner-carousel.tsx
│   │   │   │   └── layout.tsx      # 用户端布局
│   │   │   ├── api/[...path]/route.ts # Next.js API 代理，转发到后端 8080
│   │   │   ├── layout.tsx         # 全局根布局
│   │   │   ├── globals.css        # 全局样式（仅放基础变量/重置/跨页通用）
│   │   │   └── not-found.tsx      # 404 页
│   │   ├── components/            # 跨页面共享组件
│   │   │   ├── layout/            # 全局布局（顶栏/配置弹窗/移动端抽屉/版本弹窗/Providers）
│   │   │   ├── prompts/           # 提示词卡片/详情/选择对话框 + use-prompt-list
│   │   │   ├── assets/            # 素材表单弹窗
│   │   │   ├── workflows/         # 工作流工作区
│   │   │   ├── ui/                # 通用 UI（主题切换/动画文本/Select）
│   │   │   ├── image-settings-panel.tsx  # 生图设置面板
│   │   │   ├── video-settings-panel.tsx  # 视频设置面板
│   │   │   ├── audio-settings-panel.tsx  # 音频设置面板
│   │   │   ├── model-picker.tsx          # 模型选择器
│   │   │   └── image-generation-pending.tsx
│   │   ├── constant/              # 全局常量
│   │   │   ├── navigation-tools.ts # 顶栏导航配置
│   │   │   ├── credits.tsx         # 算力点常量
│   │   │   └── env.ts              # 环境变量读取
│   │   ├── hooks/                  # 跨页面复用 hook
│   │   │   ├── use-copy-text.ts    # 复制并提示
│   │   │   └── use-version-check.ts # 版本检查
│   │   ├── lib/                    # 工具函数库
│   │   │   ├── app-theme.ts        # 全局主题
│   │   │   ├── canvas-theme.ts     # 画布主题
│   │   │   ├── localforage-storage.ts # 浏览器本地存储
│   │   │   ├── image-utils.ts / image-reference-prompt.ts # 图片处理
│   │   │   ├── audio-generation.ts / seedance-video.ts    # 音频/视频生成
│   │   │   ├── video-model-capabilities.ts # 视频模型能力
│   │   │   ├── zip.ts / release.ts / utils.ts
│   │   ├── services/               # API 与存储服务
│   │   │   ├── api/                # API 请求封装（按域分文件）
│   │   │   │   ├── request.ts      # axios 实例与拦截器
│   │   │   │   ├── auth.ts / admin.ts / canvas-tasks.ts / image.ts / video.ts
│   │   │   │   ├── prompts.ts / assets.ts / audio.ts / user-config.ts
│   │   │   │   ├── generation-logs.ts / admin-prompt-sources.ts
│   │   │   │   └── canvas-agent.ts
│   │   │   ├── file-storage.ts     # 文件存储
│   │   │   ├── image-storage.ts    # 图片存储
│   │   │   └── storage-migration.ts # 存储迁移
│   │   ├── stores/                 # Zustand 全局状态
│   │   │   ├── use-user-store.ts   # 登录态
│   │   │   ├── use-config-store.ts # 配置弹窗
│   │   │   ├── use-theme-store.ts  # 主题
│   │   │   └── use-asset-store.ts  # 素材
│   │   └── types/                  # 类型定义
│   │       ├── image.ts
│   │       └── media.ts
│   ├── .editorconfig / .prettierrc.json / .prettierignore
│   ├── bun.lock                    # 锁文件（与 Docker 一致）
│   ├── package-lock.json           # npm 自动生成，建议删除
│   ├── components.json             # shadcn/ui 配置
│   ├── next-env.d.ts               # Next.js 类型声明（自动生成）
│   ├── next.config.ts / tsconfig.json / postcss.config.mjs
│   └── package.json
├── docs/                           # 文档目录
│   ├── index.md                    # 给 AI 使用的文档索引
│   ├── overview/                   # 项目概览
│   │   ├── quick-start.md          # 快速开始
│   │   ├── features.md             # 功能介绍
│   │   ├── docker.md               # Docker 部署
│   │   ├── deployment.md           # 部署汇总（Docker + 本地 + PostgreSQL）
│   │   └── third-party-prompt-repositories.md
│   ├── backend/                    # 后端文档
│   │   ├── backend-database.md     # 数据库表结构
│   │   ├── api-response.md         # 接口响应规则
│   │   ├── system-settings.md      # 系统设置字段说明
│   │   ├── local-development.md    # 本地开发
│   │   └── canvas-data-structure.md # 画布数据结构
│   ├── canvas/                     # 画布使用手册
│   │   ├── canvas-node-manual.md
│   │   └── canvas-shortcuts.md
│   ├── business/                  # 商业相关
│   │   ├── business.md
│   │   └── license.md
│   ├── progress/                   # 进度跟踪
│   │   ├── todo.md                 # 待办事项
│   │   ├── pending-test.md         # 待测试事项
│   │   ├── admin-nav-restructure.md        # 管理后台导航重组方案
│   │   ├── channels-page-split.md          # 渠道管理拆分方案
│   │   ├── model-capabilities-refactor.md  # 模型能力配置方案
│   │   ├── prompt-category-refactor.md     # 提示词分类重构方案
│   │   └── workflow-module-refactor.md     # 工作流模块独立化方案
│   └── support/
│       └── donate.md
├── .agents/ / .github/             # 已在上方说明
├── .dockerignore                   # docker build 忽略文件
├── .env.example                    # 环境变量模板（复制为 Go/.env 使用）
├── .gitignore                      # git 忽略规则（.env*、data/、*.exe、node_modules 等）
├── AGENTS.md                       # AI/自动化开发行为规范，开发时优先遵循
├── Dockerfile                      # 多阶段构建：bun 编译前端 + go 编译后端 + node 运行
├── docker-entrypoint.sh            # 容器启动脚本：先起 Go 再起 Next.js
├── docker-compose.yml              # 用已发布镜像部署
├── docker-compose.local.yml        # 用本地源码构建镜像部署
├── render.yaml                     # Render 平台部署配置
├── skills-lock.json                # AI skills 锁定版本
├── LICENSE                         # 开源协议
├── MEMORY.md                       # 手动记忆文件（未跟踪）
├── README.md                       # 项目介绍
└── VERSION                         # 当前版本号（v0.5.0），发版时更新
```

## 说明

- 树中标注「已废弃」「自动生成」「建议删除」的项可按需清理。
- `Go/data/` 切换 PostgreSQL 后不再使用，可保留空目录或删除。
- `next/package-lock.json` 是用 npm 装依赖时生成的，团队约定用 bun，建议删除并避免再次生成。
- `.next/`、`node_modules/`、`Go/*.exe` 等编译产物未在树中展示，均已在 `.gitignore` 中忽略。
