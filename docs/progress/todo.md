---
title: TODO
description: 当前项目后续值得处理的事项
---

# TODO

本文档用来记录当前项目后续比较值得处理的事项。

## 待办

### 视频节点参数 UI 优化

- 状态：待启动
- 说明：画布视频节点下方的参数设置面板（比例/清晰度/时长等）视觉与交互优化，与图片参数面板风格统一

### 首页布局优化

- 状态：待启动
- 说明：主页（输入框 + Banner + 模块入口区）布局视觉优化

### 上线运营：技能模块新增（需求 4，先行开发）

- 状态：方案已确认，待动工
- 方案文档：[launch-requirements.md](./launch-requirements.md)
- 目标：类 Coze 预置 AI 能力包，绑定画布节点类型一键调用，prompt 注入节点输入框（可见可改）
- 改动范围：
  - 后端：新增 `skills` 表（nodeType/name/description/prompt/coverUrl/sortOrder/enabled）+ `GET /api/skills?nodeType=` + `/api/admin/skills` CRUD
  - 前端：节点底部助手栏"技能"按钮（提示词按钮旁）→ 按节点类型过滤的技能面板 → 点击注入输入框
  - 管理后台：技能预置管理页（用户不能自建，无会员标记）
- 首批技能：文本（翻译/扩写）、图片（16 宫格分镜/电影级光影矫正）、视频（运镜轨道右移/环绕拍摄）

### 上线运营：小程序扫码登录（需求 1，收尾开发）

- 状态：待启动（项目运行验证没问题后）；前置资质待用户确认
- 方案文档：[launch-requirements.md](./launch-requirements.md)
- 方向：邮箱验证码/小程序扫码/手机号三选一，倾向小程序扫码登录（网页生成 scene 小程序码 → 小程序内确认 → 网页轮询拿 token；`User.WechatID` 字段已预留）
- 待确认：已发布的小程序、主体资质（个人/企业）、域名 ICP 备案；现有账密登录保留还是替换

### 上线运营：支付系统（需求 2，收尾开发）

- 状态：待启动（项目运行验证没问题后）；收费模式/渠道待用户确认
- 方案文档：[launch-requirements.md](./launch-requirements.md)
- 基础：算力点体系已完整（Credits + CreditLog + 预扣/返还），支付只需做充值入口对接
- 待确认：充值算力点 vs 订阅会员（会员专属提示词依赖此决策）；微信商户/支付宝/第三方个人支付（与需求 1 主体资质联动）

### KIE AI 接口代码清理

- 状态：暂不考虑删除
- 说明：`Go/handler/kie_image.go` 中的 `kieFileStreamUploadURL`（`https://kieai.redpandaai.co/api/file-stream-upload`）是第三方 AI 服务商 KIE AI 的文件上传接口
- 触发条件：仅当用户在画布图像生成中选择 KIE 作为模型渠道，并上传参考图时才会调用
- 不接 KIE 渠道时该代码不会执行，无副作用；如未来确定不使用 KIE，可删除相关适配逻辑（涉及 handler/service/router 多处）

### 提示词封面图本地化

- 状态：暂不实施，上线后视情况优化
- 背景：提示词已改为管理后台手动维护 + JSON/媒体文件批量导入，新导入的封面走存储链路上传，不存在失效问题；存量数据 `Prompt.CoverURL` 仍存原 GitHub raw / X(Twitter) 图床 URL 字符串，X 图床链接（`pbs.twimg.com`）易因防盗链、推文删除、账号封禁而失效
- 失效风险分级：
  - 低风险：GitHub raw 链接（存量数据），仓库主删除才失效
  - 高风险：X/Twitter 图床链接（xianyu latest 部分），多种原因会失效
- 备选方案（待上线后评估）：
  - 方案 A（推荐）：数据库 BYTEA 存储。`prompts` 表新增 `cover_data BYTEA` + `cover_mime TEXT` 字段，导入时下载封面图存入数据库；后端新增 `GET /api/prompts/:id/cover` 接口按需返回二进制流；前端 `<img src="/api/prompts/xxx/cover" onError={回退到原 coverUrl}>`。CoverURL 字段保留作为兜底/审计。备份迁移只靠 .sql，适合运营商场景
  - 方案 B：文件系统存储。下载到 `data/prompt-covers/` 目录，数据库只存路径。数据库保持精简但备份需同时拷贝文件
  - 方案 C：代理 + 按需缓存。后端提供 `/api/proxy-image?url=xxx` 接口，首次访问时下载并缓存。不浪费带宽但首次访问若原链接已失效则无法缓存
- 当前缓解：无（前端暂未做 onerror 降级处理）；也可在批量导入时把存量失效封面重新上传替换
- 触发条件：上线后若用户反馈封面图大量失效，或运营商出于稳定性要求主动优化时再实施

### 生图/视频模型能力配置

- 状态：已实施并验证通过（变更明细见 [pending-test.md](./pending-test.md)），仅剩收尾项暂未实施，后续按需补
- 方案文档：[model-capabilities-refactor.md](./model-capabilities-refactor.md)
- 剩余项：后端 `apimartImageConfig` / `kieModelInputConfig` 优先读配置、硬编码作 fallback 的改造

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

