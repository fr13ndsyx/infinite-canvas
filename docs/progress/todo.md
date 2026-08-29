---
title: TODO
description: 当前项目后续值得处理的事项
---

# TODO

本文档用来记录当前项目后续比较值得处理的事项。

## 待办

### 版本管理与前端更新提示

- 状态：方案已确认，待实施
- 方案文档：[app-version-update-notice.md](./app-version-update-notice.md)
- 目标：发版并重新部署后，网页端自动检测新版本 → 非阻塞提示（新版本号 + 更新要点）→ 用户确认后 reload 加载新资源
- 背景：版本基础设施多半还在（`next.config.ts` 已注入 `NEXT_PUBLIC_APP_VERSION`，`version-release-modal.tsx` / `use-version-check.ts` 完整可用），缺的是数据源改造、UI 挂载、主动提示与重启三层
- 改动范围：
  - 新增：`next/src/app/api/app-version/route.ts`（站内版本接口；须 `dynamic = "force-dynamic"` + `Cache-Control: no-store`，否则构建期被静态化导致检测失效）、`next/src/components/layout/app-update-notice.tsx`（右下角更新提示卡片）
  - 改造：`use-version-check.ts`（数据源由 GitHub raw 改为站内接口，加 10 分钟轮询 + 切回前台检查 + `applyUpdate`/`dismissUpdate`）、`app-top-nav.tsx`（挂回 `VersionReleaseModal`，恢复顶栏版本号入口）、`(user)/layout.tsx` 与 `(admin)/admin/layout.tsx`（挂载 `AppUpdateNotice`）
  - 文档：`AGENTS.md` 发版流程补充「发版后必须重新构建部署，网页端才能感知新版本」
- 前提与限制：
  - 感知的是已部署版本而非仓库版本，`render.yaml` 为 `autoDeployTrigger: off`，push 后须手动触发部署网页端才会提示
  - 不引入 Service Worker，用户不点「立即更新」就一直运行旧代码，无后台静默更新与离线可用
  - 不强制刷新，画布存在未保存状态，「稍后」在本次标签页会话内不再打扰同一版本

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

### Agnes 模型能力后台配置

- 状态：待实施（渠道已接入可用，按清单逐项配置即可）
- 参考文档：[agnes-model-capability-config.md](./agnes-model-capability-config.md)（已按 Agnes 官方文档逐字段核对，可同时作为适配层配置化实施的字段参考）
- 内容：在后台配置 `agnes-image-2.1-flash`（生图）与 `agnes-video-2.5`（生视频）的 capabilities / options / pricing
- 关键差异（后台配置与前端校验要拦）：
  - 生图：同步返回；能力仅文生图 + 图生图（`extra_body.image`）+ 多图合成；`size` 用 1K–4K 档位、`ratio` 8 种；无首尾帧/参考/seed；`response_format` 必须嵌套 `extra_body`、不能放顶层
  - 视频：异步建任务 + 轮询；`mode`（text/keyframe/reference）决定媒体字段联动；`seconds` 必须字符串 4–12；`size` 档位 720P/960P/2K、`aspect_ratio` 6 种且不支持 auto；`n` 恒 1；禁止像素尺寸、width/height/fps/quality 等字段（会 400）
  - 计费：生图当前免费；视频按档位 + 时长计价（720P ¥0.15/秒、960P ¥0.25/秒、2K ¥0.35/秒），输入视频时长计入总计费，输入图片前 5 张免费、第 6 张起 ¥0.03/张

