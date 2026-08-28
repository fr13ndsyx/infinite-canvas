---
title: TODO
description: 当前项目后续值得处理的事项
---

# TODO

本文档用来记录当前项目后续比较值得处理的事项。

## 待办

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

### 媒体生成适配层：供应商无关重构（Agnes 接入，先行开发）

- 状态：方案已确认，待动工
- 方案文档：[agnes-media-adapter-design.md](./agnes-media-adapter-design.md)
- 目标：在 Go 后端（:8080）新增一层供应商无关的媒体生成适配层——前端永远只认统一的 OpenAI 形态调用，生图/生视频的供应商差异（非标准路径、异步轮询、参数方言）全部由适配器在内部消化
- 关键设计：
  - 统一内部契约 + `MediaGenerator` 接口 + 注册表/配置（`name → 适配器 + 凭据 + model 映射`），加供应商 = 注册一条 + 加一个文件
  - 异步归一化：同步/异步供应商统一成「提交 → 查询 → 出结果」任务模型，前端只见统一异步流（同步供应商在适配器内包成一步完成的任务）
  - 能力声明（capability）驱动 UI：不是所有供应商都有视频/参考/首尾帧，前端按能力展示，不能假设
  - API Key 只留在 Go 后端，不进前端
  - OpenAI 兼容型聚合商（硅基流动/百炼/火山方舟等）零代码接入（`openai_compat` 通用适配器 + 配置）；非标准型（如 Agnes 视频：`POST /v1/videos` 建任务 + `GET /agnesapi` 轮询）写独立适配器
- 改动范围（落地步骤）：
  - 后端：`media/core`（types/generator/registry）→ `openai_compat` 通用适配器 → `agnes` 适配器（image 同步包任务 / video 建任务+轮询，注意 `extra_body` 嵌套、`seconds` 字符串）→ `providers.yaml` 配置加载（key 走 env 注入）→ 4 个路由（`/v1/images/generations`、`/v1/videos/generations`、`/v1/videos/{id}`、`/v1/providers`）→ httptest 单测
  - 前端：生图零改动；视频加「提交 → 轮询 `GET /v1/videos/{id}`」轻量封装；接 `GET /v1/providers` 做能力展示
  - 韧性：429/超时指数退避、单请求超时 30–60s、轮询总上限 ~3 分钟、统一 `Task.Error` 错误返回
- 与既有 todo 的关系：与已完成的「生图渠道适配层全配置化」（现有代理链路参数归一化配置化，见 pending-test）互补——那条解决现有代理链路的参数方言配置化，本条新增供应商无关适配层抽象，两者共同构成"供应商差异全部配置化/适配器化"的完整版图

### Agnes 模型能力后台配置

- 状态：待实施（依赖媒体适配层/渠道接入就绪后，按清单逐项配置）
- 参考文档：[agnes-model-capability-config.md](./agnes-model-capability-config.md)（已按 Agnes 官方文档逐字段核对，可同时作为适配层配置化实施的字段参考）
- 内容：在后台配置 `agnes-image-2.1-flash`（生图）与 `agnes-video-2.5`（生视频）的 capabilities / options / pricing
- 关键差异（后台配置与前端校验要拦）：
  - 生图：同步返回；能力仅文生图 + 图生图（`extra_body.image`）+ 多图合成；`size` 用 1K–4K 档位、`ratio` 8 种；无首尾帧/参考/seed；`response_format` 必须嵌套 `extra_body`、不能放顶层
  - 视频：异步建任务 + 轮询；`mode`（text/keyframe/reference）决定媒体字段联动；`seconds` 必须字符串 4–12；`size` 档位 720P/960P/2K、`aspect_ratio` 6 种且不支持 auto；`n` 恒 1；禁止像素尺寸、width/height/fps/quality 等字段（会 400）
  - 计费：生图当前免费；视频按档位 + 时长计价（720P ¥0.15/秒、960P ¥0.25/秒、2K ¥0.35/秒），输入视频时长计入总计费，输入图片前 5 张免费、第 6 张起 ¥0.03/张

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

### 图片比例与分辨率解耦

- 状态：②前端拆分+存量迁移已实施（见 [pending-test.md](./pending-test.md)），③后端映射配置数据待实施
- 方案文档：[image-ratio-resolution-decouple.md](./image-ratio-resolution-decouple.md)
- 目标：把图片生成的「比例」和「分辨率档位」从同一个 `config.size` 字段拆成两个独立参数（`size` 存比例、新增 `imageTier` 存档位），让「智能比例(auto)」也能配 2K/4K，对齐 GPT-image-1 / Grok-imagine / Seedream 等主流模型的能力
- 已确认决策：gpt-image-1 档位映射 quality（low/medium/high）；Seedream 比例走 prompt（接受轻微漂移）；4K 降级用 `imageTiers` 能力做 UI 显隐控制
- 改动范围：
  - 前端：✅ 已实施（`image-settings-panel.tsx` 重构、`use-config-store.ts` 加 `imageTier` + 迁移、请求折算与下游消费点适配，见 pending-test）
  - 后端：`(ratio, tier)` 映射不写代码，作为 `ModelCapability` 适配层配置数据填入（gpt-image-1 → size+quality、grok-imagine → aspect_ratio+resolution、seedream → size=2K/4K+prompt 比例）——待实施，需按各模型接口文档逐项配置，配错用 AI 日志排查
  - 说明：**非阻塞优化**。②完成后前端已把 `(比例, 档位)` 折算成像素 size 发后端、链路可用；③是让后端按各模型原生协议翻译（如 gpt-image 走 quality 而非像素、seedream 走 size 档位），避免像素被上游再 normalize。接入新模型时顺手配即可，不急
- 关键点：
  - `config.imageTier`（standard/2k/4k）与 `config.size`（纯比例）正交，切档位不重置比例、切比例不动档位
  - 智能比例（auto）+ 2K/4K 成为合法组合
  - 存量像素/带档位后缀的 size 加载时自动迁移

### 视频侧适配层配置化

- 状态：暂未实施，需单独设计
- 背景：视频侧 `apimartVideoConfig`（`Go/handler/apimart_video.go`）同样有按模型名硬编码的 switch，与图片侧本轮删掉的是同类问题；但视频的 `imageRefKind`（roles / first_last / skyreels / happyhorse 等）是**行为枚举**——每个 kind 对应一段专门处理"参考图如何组装进请求体"的代码，无法像图片参数那样纯配置化
- 待定方向：
  - 方案 A：把 kind 也配置化（配置只选 kind，每个 kind 的处理代码仍留在后端）——比图片侧轻，但仍需逐 kind 设计配置项
  - 方案 B：维持现状（视频模型清单相对稳定时成本可接受）
- 触发条件：视频模型频繁新增 / 运营商要求视频侧也零代码接入时优先

