---
title: 个人中心实施方案
description: 用户查看个人信息、算力用量明细、生成记录与账户安全的前端页面及配套接口方案
---

# 个人中心实施方案

## 1. 背景与目标

当前用户端缺少一个集中的「个人中心」入口：用户登录后无法在一处查看自己的账号资料、算力点余额与流水、生成记录和账户安全设置。

现状缺口：

| 维度 | 现状 | 缺口 |
| --- | --- | --- |
| 入口 | 顶栏账户下拉菜单已有占位「个人中心」文字（`user-status-actions.tsx:66`，`AccountRow` 不可点击） | 未接通跳转，无对应页面 |
| 页面 | `(user)` 路由组下无 `account/profile` 页面 | 需新建 `/account` 页面 |
| 个人信息 | `/api/auth/me` 仅返回 `AuthUser`（id/username/displayName/avatarUrl/role/credits/createdAt） | 不含 email、邀请码、邀请人数、最近登录、第三方绑定状态 |
| 算力流水 | `CreditLog` 表与 `/api/admin/credit-logs` 仅服务管理后台 | 用户端无查询自己流水的接口 |
| AI 用量 | `AICallLog` 表与 `/api/admin/ai-logs` 仅服务管理后台 | 用户端无用量明细接口 |
| 生成记录 | `/api/v1/generation-logs/videos`、`/images` 已有（前端保存的成果卡片，上限 1000） | 可聚合展示，但非严格用量明细 |

目标：新建 `/account` 个人中心页面，分信息卡、算力概览与流水、生成记录入口、账户安全四个分区，并补齐用户端算力流水查询与扩展资料接口。

## 2. 页面设计

### 2.1 路由与守卫

- 新增页面：`next/src/app/(user)/account/page.tsx`
- 受登录保护：在 `(user)/layout.tsx` 的 `protectedPrefixes` 增加 `"/account"`
- 入口接通：`user-status-actions.tsx:66` 的占位 `AccountRow` 改为可点击 `Link` 跳转 `/account`（关闭下拉菜单后再跳转，沿用现有 `handleAccountOpenChange` 模式）

### 2.2 布局与分区

页面采用单列卡片堆叠，沿用 Ant Design `Card` / `Descriptions` / `Table` / `Form`，复用 `app-theme.ts` 主题变量，不写 `dark ?` 分支。

**分区 A｜个人信息卡**

| 字段 | 来源 | 可编辑 |
| --- | --- | --- |
| 头像 | 不展示 | 否 |
| 昵称 | `displayName` | 是 |
| 用户名 | `username` | 否（只读） |
| 邮箱 | `email` | 是（一期直接保存，不强制验证；验证码绑定列为后续与需求 1 联动） |
| 角色 | `role` | 否（标签展示） |
| 注册时间 | `createdAt` | 否 |
| 最近登录 | `lastLoginAt` | 否 |
| 邀请码 | `affCode` | 可复制，展示已邀请人数 `affCount`，可生成邀请链接 `${origin}/?aff=${affCode}` |
| 第三方绑定 | `githubId` / `wechatId` 是否非空 | 展示绑定状态，解绑/绑定列为二期 |

**分区 B｜算力概览与流水**

- 顶部大字展示当前 `credits` 余额
- 汇总：近 30 天消耗合计（`ai_consume` 负数绝对值）、返还合计（`ai_refund` 正数）、后台调整合计（`admin_adjust`）
- 流水表格：时间 / 类型（`admin_adjust` / `ai_consume` / `ai_refund`）/ 变动数量（正绿负红，沿用中式涨跌色约定）/ 变动后余额 / 备注 / 关联业务 ID，分页（默认 10 条/页）
- 数据源：新增 `GET /api/v1/credit-logs`（仅返回当前用户的 `CreditLog`）

**分区 C｜生成记录入口**

- 卡片式快捷入口，跳转现有页面：
  - 图片历史 → `/image`（已有页面展示历史）
  - 视频历史 → `/video`（已有页面展示历史）
  - 我的素材 → `/asset-library`
  - 我的画布 → `/canvas`
- 各入口可展示最近记录数量（调用现有 `generation-logs` 接口取 `length`，避免拉全量）

**分区 D｜账户安全与偏好**

- 修改密码：使用独立弹窗输入旧密码 + 新密码 + 确认新密码，调 `POST /api/v1/auth/change-password`
- 配置与偏好：仅保留顶栏账户菜单入口，个人中心页面不重复展示
- 云端同步状态：读取 `user-config.syncCapabilities` 展示同步开关
- 退出登录：调 `useUserStore.clearSession`

## 3. 接口设计

### 3.1 新增接口清单

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/v1/profile` | UserAuth | 返回当前用户扩展资料 |
| POST | `/api/v1/profile` | UserAuth | 更新昵称 / 邮箱 |
| POST | `/api/v1/auth/change-password` | UserAuth | 修改密码（校验旧密码） |
| GET | `/api/v1/credit-logs` | UserAuth | 当前用户算力点流水，分页 |

二期增强（非本轮必须）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/usage/summary?days=30` | 按天 / 按模型聚合 `AICallLog` 与 `CreditLog`，用于用量图表 |

### 3.2 响应结构

**`GET /api/v1/profile` → `UserProfile`**

```json
{
  "id": "user-xxx",
  "username": "yangxin",
  "email": "",
  "displayName": "杨先生",
  "avatarUrl": "https://...",
  "role": "user",
  "credits": 1200,
  "affCode": "AB3K9X",
  "affCount": 3,
  "inviterId": "",
  "githubId": "",
  "wechatId": "",
  "status": "active",
  "lastLoginAt": "2026-09-01T10:00:00Z",
  "createdAt": "2026-07-01T08:00:00Z",
  "updatedAt": "2026-09-01T10:00:00Z"
}
```

说明：`password` 字段不暴露。第三方绑定状态前端根据 `githubId` / `wechatId` 是否非空判断。

**`GET /api/v1/credit-logs?page=1&pageSize=10` → `CreditLogList`**

复用现有 `model.CreditLog` 与 `CreditLogList{Items,Total}` 结构，仅按 `userId = 当前用户` 过滤，沿用 `model.Query` 的 `Normalize` 与分页。

**`POST /api/v1/profile` 请求体**

```json
{ "displayName": "杨先生", "email": "x@x.com" }
```

**`POST /api/v1/auth/change-password` 请求体**

```json
{ "oldPassword": "...", "newPassword": "..." }
```

后端校验旧密码（`service.hashPassword` 比对），新密码哈希后写入 `User.Password`。

## 4. 后端改动清单

遵循 `handler → service → repository` 分层与 `{code,data,msg}` 响应结构。

| 层 | 文件 | 内容 |
| --- | --- | --- |
| model | `Go/model/user.go` | 新增 `UserProfile` 响应结构（不修改 `AuthUser`，避免登录响应变大） |
| repository | `Go/repository/user.go` | 新增 `ListCreditLogsByUser(userID, query)`；新增 `FindUserByID`（如未有） |
| service | `Go/service/user_profile.go`（新） | `CurrentUserProfile(ctx)`、`SaveCurrentUserProfile(ctx, patch)`、`ChangeCurrentUserPassword(ctx, old, new)`、`ListCurrentUserCreditLogs(ctx, query)` |
| handler | `Go/handler/user_profile.go`（新） | `UserProfile`、`SaveUserProfile`、`ChangePassword`、`UserCreditLogs` |
| router | `Go/router/router.go` | v1 组注册 4 个接口 |

安全要点：
- 所有用户态接口走 `middleware.UserAuth`，`UserFromContext` 取当前用户
- `credit-logs` 查询强制 `userId = 当前用户`，不接受前端传 `userId`
- 修改密码需校验旧密码；邮箱一期不强制验证（项目未上线，无邮件服务）

## 5. 前端改动清单

| 文件 | 内容 |
| --- | --- |
| `next/src/services/api/account.ts`（新） | `fetchProfile` / `saveProfile` / `changePassword` / `fetchCreditLogs` |
| `next/src/app/(user)/account/page.tsx`（新） | 个人中心页面，四分区 |
| `next/src/app/(user)/account/use-account.ts`（新） | 页面私有 hook，封装 profile 与 credit-logs 查询（react-query） |
| `next/src/app/(user)/layout.tsx` | `protectedPrefixes` 增加 `"/account"` |
| `next/src/components/layout/user-status-actions.tsx` | 占位「个人中心」改为 `Link href="/account"`，点击关闭下拉菜单 |

页面私有组件与 hook 放在 `account/` 目录下（遵循「页面私有 hook 放对应页面目录」约定）。

## 6. 实施步骤

按阶段推进，每阶段完成后更新 `docs/progress/todo.md` 与 `pending-test.md`。

1. **后端接口**：新增 `UserProfile` 模型、`user_profile.go` service/handler、`ListCreditLogsByUser` repository、注册路由；更新 `docs/backend/api-response.md`
2. **前端 API 层**：新增 `services/api/account.ts`
3. **个人中心页面**：`account/page.tsx` + `use-account.ts`，先实现信息卡 + 算力流水
4. **入口接通**：改 `user-status-actions.tsx` 占位为可点击跳转，`layout.tsx` 加入受保护前缀
5. **账户安全**：修改密码弹窗、退出登录
6. **生成记录入口与偏好**：快捷跳转卡片、配置与偏好入口、云端同步状态展示
7. （二期）用量明细图表：`GET /api/v1/usage/summary` + 前端图表

## 7. 待确认问题

| # | 问题 | 说明 |
| --- | --- | --- |
| 1 | 邮箱是否需要验证码绑定 | 一期直接保存无验证；验证码需邮件服务，建议与需求 1（小程序扫码登录）一并规划 |
| 2 | 头像展示与上传 | 本期不展示头像，也不提供头像上传入口 |
| 3 | 第三方绑定（GitHub / 微信）解绑/绑定入口 | `githubId` / `wechatId` 字段已预留，但绑定流程依赖 OAuth 回调，建议列为二期，与需求 1 联动 |
| 4 | 邀请奖励机制 | 当前仅记录 `affCount` 邀请人数，无奖励逻辑；是否在个人中心展示邀请奖励规则待定 |
| 5 | 用量明细颗粒度 | 一期仅算力流水表格；是否需要按模型 / 按天的用量图表（二期 `usage/summary`）待用户确认 |

## 8. 关联文档与约定

- 接口响应规则：`docs/backend/api-response.md`
- 数据库结构：`docs/backend/backend-database.md`（`users` / `credit_logs` 表已存在，无需新增表）
- 上线运营需求：`docs/progress/launch-requirements.md`（需求 1 登录优化、需求 2 支付与本方案邮箱验证 / 邀请奖励联动）
- 前端规范：API 放 `services/api/`，页面私有 hook 放页面目录，受保护页加入 `protectedPrefixes`，主题复用 `app-theme.ts`
- 安全：`password` 字段不暴露；用户态接口强制按当前用户过滤数据
