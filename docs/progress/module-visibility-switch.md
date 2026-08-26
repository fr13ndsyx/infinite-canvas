---
title: 功能模块可见性开关方案
description: 管理后台控制生图工作台、视频创作台、工作流页面对用户端的显隐
---

# 功能模块可见性开关方案

## 背景

生图工作台（`/image`）、视频创作台（`/video`）、工作流（`/workflows`）三个页面目前对所有用户固定可见，导航 tab 也固定展示。运营商在未配置对应模型渠道、或只想开放部分创作入口时，无法隐藏这些模块。

需要在管理后台「偏好设置 → 访问控制」增加三个开关，控制这三个模块在用户端的可见性：打开时页面和顶部导航 tab 可见，关闭时同时隐藏页面入口和页面本身。

## 目标

- 管理后台可分别控制生图工作台、视频创作台、工作流三个模块的显隐
- 关闭后：顶部导航 tab（桌面端 + 移动端抽屉）隐藏对应入口；直接输入 URL 访问时重定向回首页
- 所有用户（含管理员）受开关一致限制；管理后台页面不受影响，可随时改回
- 默认全部开启，不改变现有用户体验；无需数据迁移

## 字段定义

`public.value` 新增 `modules` 配置组，与 `auth`、`storage` 平级：

| 字段 | 类型 | 说明 |
|---|---|---|
| `modules.imageWorkbench` | boolean | 生图工作台（`/image`）是否可见，默认 `true` |
| `modules.videoWorkbench` | boolean | 视频创作台（`/video`）是否可见，默认 `true` |
| `modules.workflows` | boolean | 工作流（`/workflows`）是否可见，默认 `true` |

后端使用 `*bool` 指针 + normalize 兜底（沿用 `allowRegister` 模式）：未配置时默认 `true`。

## 改动范围

### 后端（2 文件 + 1 文档）

**`Go/model/setting.go`**
- `PublicSetting` 新增字段 `Modules PublicModuleSetting`，JSON tag `modules`
- 新增结构体：

```go
// PublicModuleSetting 功能模块可见性配置。nil 默认开启。
type PublicModuleSetting struct {
	ImageWorkbench *bool `json:"imageWorkbench"`
	VideoWorkbench *bool `json:"videoWorkbench"`
	Workflows      *bool `json:"workflows"`
}
```

**`Go/service/settings.go`**
- `normalizePublicSettingWithChannels` 中新增归一化：三个字段为 nil 时置为 `true`（与 `Auth.AllowRegister` 相同写法）

**`docs/backend/system-settings.md`**
- `public.value` 结构示例和字段表补充 `modules` 配置组说明

### 前端（5 文件 + 1 新 hook）

**`next/src/services/api/admin.ts`**
- `AdminPublicSettings` 类型新增：

```ts
modules: {
    imageWorkbench: boolean;
    videoWorkbench: boolean;
    workflows: boolean;
};
```

**`next/src/app/(admin)/admin/settings-shared.ts`**
- `emptySettings.public` 新增 `modules` 默认值（三项均为 `true`）
- `normalizePublicSetting` 归一化 `modules`：字段缺失时兜底 `true`
- `syncPublicSettingsFromSaved` 同步 `modules` 到全局 `publicSettings`（当前只同步 `modelChannel`/`auth`/`storage`）

**`next/src/app/(admin)/admin/preferences/page.tsx`**
- 「功能模块」卡片新增三个 Switch（`public.modules.imageWorkbench` / `videoWorkbench` / `workflows`），extra 说明"关闭后所有用户都看不到对应页面和导航入口，直接访问会被跳回首页"
- 保存成功后调用 `syncPublicSettingsFromSaved(saved)`，让开关保存后无需刷新即时生效

**`next/src/constant/navigation-tools.ts`**
- 导出 slug → 模块 key 映射，供导航组件过滤：

```ts
export const navigationModuleKeys: Record<string, "imageWorkbench" | "videoWorkbench" | "workflows" | undefined> = {
    image: "imageWorkbench",
    video: "videoWorkbench",
    workflows: "workflows",
};
```

（工作流 dropdown 的 `tool.slug` 与子项 slug 同为 `workflows`，按 `tool.slug` 过滤即可同时隐藏入口。）

**`next/src/components/layout/app-top-nav.tsx` + `next/src/components/layout/mobile-nav-drawer.tsx`**
- 从 `useConfigStore` 读取 `publicSettings?.modules`
- 过滤规则：`publicSettings` 未加载完成时不过滤（避免整条导航闪烁）；`modules[key] === false` 时隐藏对应导航项（所有用户包括管理员）

**`next/src/hooks/use-module-guard.ts`（新增，三个页面复用）**
- 读取 `publicSettings`
- `publicSettings` 未加载完成时返回 `false`（页面渲染 `null`，避免已关闭模块的内容闪现）
- 模块关闭时 `router.replace("/")` 重定向回首页（所有用户包括管理员）

```ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useConfigStore } from "@/stores/use-config-store";

export type ModuleKey = "imageWorkbench" | "videoWorkbench" | "workflows";

export function useModuleGuard(moduleKey: ModuleKey) {
    const router = useRouter();
    const publicSettings = useConfigStore((state) => state.publicSettings);
    const enabled = publicSettings ? (publicSettings.modules?.[moduleKey] !== false) : false;
    useEffect(() => {
        if (publicSettings && !enabled) router.replace("/");
    }, [enabled, publicSettings, router]);
    return enabled;
}
```

**页面接入（3 文件）**
- `next/src/app/(user)/image/page.tsx`：组件顶部 `const moduleEnabled = useModuleGuard("imageWorkbench");`，`if (!moduleEnabled) return null;`
- `next/src/app/(user)/video/page.tsx`：同上，key 为 `videoWorkbench`
- `next/src/app/(user)/workflows/page.tsx`：同上，key 为 `workflows`

## 行为说明

| 场景 | 行为 |
|---|---|
| 开关开启（默认） | 导航 tab 显示，页面正常访问，与现状一致 |
| 开关关闭 | 所有用户的导航 tab 隐藏；直接访问 URL 重定向回首页 |
| `publicSettings` 加载中 | 导航暂不过滤（先显示后过滤）；页面渲染 `null` 等待判断 |
| 未登录用户 | 与登录用户一致，受开关限制 |

后端 API 不做拦截：本开关只控制前端页面可见性，不涉及接口安全（与 `allowRegister` 拒绝注册的场景不同）；工作流相关接口仍可被画布等其他功能调用。

## 兼容性

- 存量 `settings` 数据无 `modules` 字段时，后端 normalize 默认全部 `true`，与现状一致
- 前端读取时 `modules?.[key] !== false` 兜底，字段缺失视为开启
- 不需要数据迁移，不写旧字段兼容逻辑

## 验证清单

1. 后端启动后，`GET /api/settings` 返回 `modules` 三项均为 `true`
2. 管理后台「偏好设置 → 访问控制」显示三个开关，默认开启；保存后刷新确认持久化
3. 关闭「生图工作台」并保存：所有用户（含管理员和未登录）顶部导航和移动端抽屉不再显示"生图工作台"，直接访问 `/image` 被重定向回首页
4. 同样验证「视频创作台」（`/video`）和「工作流」（`/workflows`）
5. 开关保存后不刷新页面，导航 tab 即时消失（`syncPublicSettingsFromSaved` 生效）
6. 重新打开开关后，导航 tab 恢复，页面可正常访问
7. 「我的画布」「提示词库」「我的素材」等其他导航项不受影响

## 待办状态

- 状态：已实施，待用户测试确认（变更明细与验证步骤见 [pending-test.md](./pending-test.md)）
- 触发条件：运营商需要隐藏未开通或不想开放的功能模块时使用
