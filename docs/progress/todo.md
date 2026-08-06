---
title: TODO
description: 当前项目后续值得处理的事项
---

# TODO

本文档用来记录当前项目后续比较值得处理的事项。

## 待办

### KIE AI 接口代码清理

- 状态：暂不考虑删除
- 说明：`Go/handler/kie_image.go` 中的 `kieFileStreamUploadURL`（`https://kieai.redpandaai.co/api/file-stream-upload`）是第三方 AI 服务商 KIE AI 的文件上传接口
- 触发条件：仅当用户在画布图像生成中选择 KIE 作为模型渠道，并上传参考图时才会调用
- 不接 KIE 渠道时该代码不会执行，无副作用；如未来确定不使用 KIE，可删除相关适配逻辑（涉及 handler/service/router 多处）

### 提示词批量上传

- 状态：待实施
- 方案文档：[prompt-batch-upload.md](./prompt-batch-upload.md)
- 目标：管理后台提示词管理页新增「批量上传」入口，支持选择本地文件夹批量导入提示词（含 webp 图片 / webm 视频 / json 元数据）
- 改动范围：后端 4 文件（admin handler + service + repository + router）+ 前端 3 文件（弹窗组件 + page + api）
- 关键点：
  - 新增 `POST /api/admin/prompts/batch` 批量创建接口
  - 复用 `POST /api/v1/files` 上传媒体到 S3 兼容存储
  - 按所选 source 内 prompt 文本去重
  - 上传时选择已有来源或新建本地来源（remote:false 避免被同步覆盖）
  - 详细进度展示 + 失败重试，媒体上传并发 5 个
- 触发条件：管理员本地手动爬取高质量提示词后批量导入

### 提示词封面图本地化

- 状态：暂不实施，上线后视情况优化
- 问题：提示词来源从 7 个 GitHub 仓库同步，`Prompt.CoverURL` 直接存原 URL 字符串，不下载图片。其中 xianyu-awesome-gptimage2 来源的 latest-prompts 部分使用 X/Twitter 图床链接（`pbs.twimg.com`），易因 X 防盗链、推文删除、账号封禁而失效
- 失效风险分级：
  - 低风险：GitHub raw 链接（6 个来源），仓库主删除才失效
  - 高风险：X/Twitter 图床链接（xianyu latest 部分），多种原因会失效
- 备选方案（待上线后评估）：
  - 方案 A（推荐）：数据库 BYTEA 存储。`prompts` 表新增 `cover_data BYTEA` + `cover_mime TEXT` 字段，同步时下载封面图存入数据库；后端新增 `GET /api/prompts/:id/cover` 接口按需返回二进制流；前端 `<img src="/api/prompts/xxx/cover" onError={回退到原 coverUrl}>`。CoverURL 字段保留作为兜底/审计。备份迁移只靠 .sql，适合运营商场景。数据量约 140-420MB，PostgreSQL 可接受
  - 方案 B：文件系统存储。下载到 `data/prompt-covers/` 目录，数据库只存路径。数据库保持精简但备份需同时拷贝文件
  - 方案 C：代理 + 按需缓存。后端提供 `/api/proxy-image?url=xxx` 接口，首次访问时下载并缓存。不浪费带宽但首次访问若原链接已失效则无法缓存
- 当前缓解：无（前端暂未做 onerror 降级处理）
- 触发条件：上线后若用户反馈封面图大量失效，或运营商出于稳定性要求主动优化时再实施

### 画布技能选择按钮

- 状态：待实施
- 方案文档：[canvas-skill-button.md](./canvas-skill-button.md)
- 目标：画布节点底部助手栏新增技能图标按钮（与提示词图标并列），一键应用预设技能（prompt 覆盖回填 + 节点参数应用）
- 改动范围：后端新建 4 文件（model/repository/service/handler）+ 修改 3 文件（router/db.go/文档）；前端新建 3 文件（api/技能按钮组件/管理后台页）+ 修改 2 文件（助手栏/菜单）
- 关键点：
  - 新建 `skills` 表（id/title/summary/types/prompt/option/sortOrder/enabled）
  - 技能按节点类型筛选显示（Image→图片+全景节点，Video→视频节点，Text→文本节点，音频节点不显示）
  - 选中后 prompt 覆盖回填输入框 + option 映射到节点 metadata（aspectRatio→size，resolution→quality/vquality）
  - 技能不指定 model，用节点当前模型
  - 轻量小弹窗（与模型选择器大小一致）
  - 管理后台 CRUD 维护
- 待用户补充：35 个技能的 prompt 字段内容

### 画布 Agent 行为风格可配置

- 状态：暂未实施
- 方案文档：[canvas-agent-behavior-config.md](./canvas-agent-behavior-config.md)
- 目标：让管理员可在后台切换画布创作 Agent 的内容落地策略（保守对话 / 积极落地画布），引导用户更深入使用无限画布
- 改动范围：后端 2 文件（setting.go + service）+ 前端 4 文件（admin.ts + settings-shared + model-pricing + canvas-agent-skills）
- 关键点：
  - 新增 `canvasAgentBehavior` 字段（`conservative` 默认 / `eager`）
  - `eager` 模式下 Agent 收到"生成 prompt / 文案 / 脚本"类指令时自动调用 `create_text_node` 在画布创建节点，而非只在对话框返回文字
  - 默认 `conservative` 保持现状，不影响已有用户体验
- 触发条件：管理员希望引导用户更深入使用画布时启用

