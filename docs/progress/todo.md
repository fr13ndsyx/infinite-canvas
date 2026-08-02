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

### 管理后台渠道管理拆分

- 状态：已实施，待测试（详见 [pending-test.md](./pending-test.md)）
- 方案文档：[channels-page-split.md](./channels-page-split.md)
- 目标：把"渠道配置"从系统设置页拆出来作为独立菜单项 `/admin/channels`，为后续模型能力配置腾出空间
- 改动范围：新建 `channels/page.tsx` + 修改 `layout.tsx` + `settings/page.tsx`，后端零改动
- 关键点：
  - 沿用整体保存模式（不新增单渠道 CRUD API）
  - 沿用 Channel Drawer，不改为独立编辑页
  - 拆分后系统设置页私有 tab 仅保留同步/日志/存储三块
- 执行顺序：先于"模型能力配置"

### 生图/视频模型能力配置

- 状态：待实施
- 方案文档：[model-capabilities-refactor.md](./model-capabilities-refactor.md)
- 目标：管理后台支持勾选每个模型支持的比例和清晰度档位，前端工作台按模型能力动态渲染选项
- 改动范围：后端 4 文件（setting.go + service + 2 个 image handler）+ 前端 5 文件（admin.ts + 管理后台表格 + store + 2 个工作台 panel）
- 关键点：
  - 新增 `ModelCapability` 结构（`imageAspects` / `imageTiers` / `videoResolutions`）
  - 空字段走保守默认（生图=全比例+仅标准档，视频=480p/720p/1080p）
  - 切换模型时自动回退不支持的尺寸/档位
  - 后端 `apimartImageConfig` / `kieModelInputConfig` 优先读配置，硬编码作 fallback
- 依赖：建议在"渠道管理拆分"完成后实施，模型能力表格放在新的渠道管理页

