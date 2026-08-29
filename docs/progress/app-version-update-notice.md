---
title: 版本管理与前端更新提示方案
description: 恢复版本管理链路，发版部署后网页端自动检测新版本并提示用户重启加载
---

# 版本管理与前端更新提示方案

## 背景

项目早期有一套版本展示能力：顶栏显示当前版本号，从 GitHub raw 拉取远端 `VERSION` 与 `CHANGELOG.md` 比对，有新版本时在版本号右上角显示绿点，点击可打开更新日志弹窗。后续这套 UI 的挂载被移除，页面上看不到任何版本入口，也没有"检测到新版本后主动提示并重新加载"的能力。

现在需要把版本管理加回来，核心诉求是：本地开发完成、推送正式版并部署后，在线用户的浏览器能收到更新提示，确认后重新加载页面加载新版本资源。

## 目标

- 发版（提升 `VERSION` + 整理 `CHANGELOG.md`）并重新部署后，站点自身对外暴露当前版本号
- 用户端浏览器自动检测版本差异，无需用户手动触发
- 检测到新版本时以非阻塞方式提示，展示新版本号与本次更新要点
- 用户确认后重新加载页面；选择"稍后"则在本次会话内不再打扰同一版本
- 顶栏恢复版本号入口，可随时手动查看完整更新日志与检查更新
- 不依赖境外网络，不改动 Go 后端，不引入 Service Worker

## 现状盘点

| 组件 | 位置 | 状态 |
|---|---|---|
| `VERSION`（当前 `v0.5.0`） | 仓库根目录 | 存在 |
| `CHANGELOG.md`（39 个版本） | 仓库根目录 | 存在 |
| 版本注入 | `next/next.config.ts` | 存在，读取 `../VERSION` 与 `../CHANGELOG.md`，注入 `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_APP_RELEASES` |
| `APP_VERSION` 常量 | `next/src/constant/env.ts` | 存在 |
| CHANGELOG 解析 | `next/src/lib/release.ts` | 存在，`parseChangelog` 解析 `## 版本 - 日期` 与 `+ [类型] 内容` |
| 版本检测 hook | `next/src/hooks/use-version-check.ts` | 存在，但数据源硬编码 GitHub raw |
| 更新日志弹窗 | `next/src/components/layout/version-release-modal.tsx` | 存在，但**全仓无任何引用** |
| 更新提示 + 重启 | — | 缺失，从未实现 |
| 后端版本接口 | `Go/` | 缺失 |
| 发版流程约定 | `AGENTS.md` | 存在（CHANGELOG 整理 → VERSION → commit → tag） |

结论：基础设施大部分完好，缺失的是**数据源改造**、**挂载点**、**主动提示与重启**三层。

## 方案设计

### 1. 版本数据源：站内接口

新增 Next 路由 `GET /api/app-version`，返回构建时注入的版本号与解析后的更新日志。

选择站内接口而非 GitHub raw 或后端 Go 接口，理由：

| 方案 | 优点 | 缺点 |
|---|---|---|
| **站内接口（选定）** | 不依赖境外网络；线上代码与实际部署严格一致；不动 Go 后端；Docker 与本地 dev 行为一致 | 感知的是"已部署版本"，push 后必须重新部署才能生效 |
| GitHub raw | push 后无需部署即可感知 | `raw.githubusercontent.com` 在大陆访问不稳定；线上部署的代码未必等于仓库 main 分支 |
| 后端 Go 接口 | 可控性最强，未来可在管理后台下发公告 | 需改后端并重启编译；版本号注入需 ldflags 或读文件，增加构建复杂度 |

路由匹配说明：Next.js App Router 中静态段优先级高于 catch-all，`app/api/app-version/route.ts` 会优先于 `app/api/[...path]/route.ts` 命中，不会被反代转发到 Go 后端。

### 2. 检测策略

| 时机 | 说明 |
|---|---|
| 页面挂载 | 进入站点后立即检查一次 |
| 定时轮询 | 每 10 分钟检查一次 |
| 切回前台 | `visibilitychange` 且 `document.visibilityState === "visible"` 时检查 |

请求 URL 附带时间戳参数 `?t=${Date.now()}` 绕过浏览器缓存，配合接口响应头 `Cache-Control: no-store` 双重保险。

版本比对沿用现有 `isNewerVersion` 逻辑，支持 `x.y.z` 与 `x.y.z.n` 两种格式，逐段比较。

### 3. 交互设计

**更新提示（新增）**：右下角浮层卡片，非模态，不阻塞操作。

- 标题：发现新版本 `v0.6.0`
- 副标题：当前 `v0.5.0` → `v0.6.0`
- 更新要点：取最新 release 的前 5 条（类型标签 + 内容）
- 操作：「立即更新」（主按钮，执行 `window.location.reload()`）、「稍后」（写入 sessionStorage）
- 提示文案附加一句"更新将刷新页面，请先保存当前编辑内容"，覆盖画布编辑场景

选择非阻塞浮层而非强制 Modal，是因为画布存在未保存状态，强制刷新会造成数据丢失。

**版本号入口（恢复）**：顶栏 `UserStatusActions` 左侧显示当前版本号，检测到新版本时右上角显示绿点，点击打开更新日志弹窗（复用现有 `version-release-modal.tsx`，内含"检查更新"按钮与 Timeline 形式的历史版本列表）。

## 改动范围

### 新增文件

**`next/src/app/api/app-version/route.ts`**

```ts
export const dynamic = "force-dynamic";

function readReleases() {
    try {
        return JSON.parse(process.env.NEXT_PUBLIC_APP_RELEASES || "[]");
    } catch {
        return [];
    }
}

export function GET() {
    return Response.json(
        {
            version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
            releases: readReleases().slice(0, 8),
        },
        { headers: { "Cache-Control": "no-store" } },
    );
}
```

要点：
- `dynamic = "force-dynamic"` 防止 Next 在构建期静态化该路由，否则部署后永远返回构建时的版本
- `releases` 截取前 8 个版本，CHANGELOG 现有 39 个版本，全量返回无必要
- 版本号与更新日志均来自 `next.config.ts` 构建期注入的环境变量，standalone 产物内已内联，无需运行时读文件

**`next/src/components/layout/app-update-notice.tsx`**

右下角更新提示卡片（客户端组件）。样式沿用 `version-release-modal.tsx` 的 stone 配色体系并带 `dark:` 变体，与全站其他组件保持一致。

Props 无，内部直接调用 `useVersionCheck()`：

```tsx
const { updateVisible, latestVersion, latestRelease, applyUpdate, dismissUpdate } = useVersionCheck();
if (!updateVisible) return null;
```

### 改造文件

**`next/src/hooks/use-version-check.ts`**

1. 移除 GitHub raw 常量与依赖，`checkLatestRelease` 改为请求 `/api/app-version?t=${Date.now()}`
2. 新增常量：

```ts
const POLL_INTERVAL = 10 * 60 * 1000;
const DISMISS_KEY = "infinite-canvas:dismissed-version";
```

3. 新增轮询副作用（挂载检查 + 定时 + 切回前台，卸载时清理监听）
4. 新增状态与导出：

| 导出 | 说明 |
|---|---|
| `updateVisible` | `hasNewVersion && dismissedVersion !== latestVersion`，控制提示卡片显隐 |
| `latestRelease` | 最新版本的 release 对象，供提示卡片取更新要点 |
| `applyUpdate()` | `window.location.reload()` |
| `dismissUpdate()` | 把 `latestVersion` 写入 sessionStorage，本次会话不再提示该版本 |

**`next/src/components/layout/app-top-nav.tsx`**

在 `<UserStatusActions />` 左侧插入 `<VersionReleaseModal />`，恢复顶栏版本号入口。

**`next/src/app/(user)/layout.tsx`**

在 `AppTopNav` 之后挂载 `<AppUpdateNotice />`。画布页 `/canvas/[id]` 虽然通过 `hideHeader` 隐藏了顶栏，但仍在该 layout 内，提示卡片可正常弹出。

**`next/src/app/(admin)/admin/layout.tsx`**

在 Header 右侧 `Flex` 容器内同样挂载 `<AppUpdateNotice />`，管理后台也能收到更新提示。

**`AGENTS.md`**

「发版流程」章节补充一条：前端版本号来自构建产物，发版后必须重新构建部署，`/api/app-version` 才会返回新版本号，网页端才能收到更新提示。

### 文档

- `docs/progress/todo.md`：登记本项为「方案已确认，待实施」
- `docs/progress/pending-test.md`：实施后补验证章节

## 发版与部署流程

```
1. 整理 CHANGELOG.md 的 Unreleased 内容为新的版本章节（含日期）
2. 提升根目录 VERSION（如 v0.5.0 → v0.6.0）
3. 提交代码并打对应 tag（v0.6.0）
4. 重新构建并部署（Docker build / Render 手动触发）
5. 部署完成后，在线用户浏览器在 10 分钟内或切回前台时收到更新提示
```

注意 `render.yaml` 中 `autoDeployTrigger: off`，push 后不会自动部署，需手动触发第 4 步。

## 边界与已知限制

1. **感知的是已部署版本，不是仓库版本**。push 但未部署时，网页端不会提示。这是站内接口方案的固有前提，换来的是线上代码与版本号严格一致。
2. **不引入 Service Worker**。用户不点击"立即更新"就一直运行旧代码，不存在后台静默更新与离线可用能力。如需这些能力需另立方案处理 SW 注册、旧 SW 注销与缓存清理。
3. **不强制刷新**。用户在画布编辑时可选择"稍后"，避免未保存内容丢失。
4. **sessionStorage 作用域**。"稍后"仅在当前标签页会话内有效，新开标签页或清除会话后会重新提示。
5. **`Unreleased` 章节不会出现在提示中**。`parseChangelog` 只保留有条目的版本，`Unreleased` 由 `getReleaseTitle` 映射为「未发布」，仅作为历史列表项展示。
6. **dev 模式不会误报**。`next dev` 同样读取根目录 `VERSION` 注入，接口返回与前端 `APP_VERSION` 一致。

## 验证清单

实施后按以下顺序验证：

1. `GET /api/app-version` 返回 `{ version, releases }`，`releases` 最多 8 项，响应头含 `no-store`
2. 该接口不被反代到 Go 后端（对比：断开 Go 后端时接口仍正常返回）
3. 顶栏显示当前版本号，点击打开更新日志弹窗，Timeline 正常渲染历史版本
4. 手动修改 `VERSION` 提升版本号并重启前端，页面在 10 分钟内或切回前台后弹出更新提示卡片
5. 提示卡片展示新版本号与更新要点，内容取自 CHANGELOG 最新版本
6. 点击「立即更新」页面重新加载，加载后版本号变为新版本且提示消失
7. 点击「稍后」卡片关闭，且本次会话内不再弹出；新开标签页后重新提示
8. 画布页（顶栏隐藏）也能正常弹出更新提示
9. 管理后台同样能收到更新提示
10. 浅色/深色两种主题下提示卡片与弹窗文字均清晰可读
