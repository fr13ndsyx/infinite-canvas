---
title: 工作流模块独立化改造方案
description: 把生图工作台内嵌的「创作工作流」抽离为导航下拉模块，与生图工作台彻底解耦
---

# 工作流模块独立化改造方案

## 一、背景与现状

### 1.1 现有架构

「创作工作流」当前以**悬浮按钮 + 右侧抽屉**的形式寄生在生图工作台内：

- 入口：生图工作台右下角悬浮按钮（青色光晕、毛玻璃、可拖拽），位于 [next/src/app/(user)/image/page.tsx#L1184-L1207](../../next/src/app/(user)/image/page.tsx)
- 主体：抽屉内挂载 `CreativeWorkflowWorkspace` 组件，传 `embedded` + `hideTaskList` 裁剪样式与「最近运行结果」墙，位于 [next/src/app/(user)/image/page.tsx#L1208-L1225](../../next/src/app/(user)/image/page.tsx)
- 组件：[next/src/components/workflows/creative-workflow-workspace.tsx](../../next/src/components/workflows/creative-workflow-workspace.tsx) 支持独立页与内嵌抽屉两种模式
- 独立页：[next/src/app/(user)/workflows/page.tsx](../../next/src/app/(user)/workflows/page.tsx) 已存在但**未挂入导航**

### 1.2 存在的问题

| 问题 | 影响 |
|---|---|
| 悬浮按钮视觉突兀 | 青色光晕 + 大阴影 + 毛玻璃 + 拖拽逻辑，与生图工作台扁平工具栏语言完全不一致 |
| 职责边界模糊 | 工作流本质是独立模块，被塞进生图工作台当抽屉，用户难以理解二者关系 |
| 联动代码渗透深 | `image/page.tsx` 里约 90 行工作流相关代码（悬浮按钮拖拽、3 个回调、临时占位 ID 生成、后端任务轮询标签等），主工作台被严重污染 |
| 独立页面缺入口 | `/workflows` 页面已存在但导航里没有，用户无法发现 |
| 后续扩展无位置 | 提示词生成、AI 换装等小功能若新增，主导航会被占满 |

### 1.3 现有相关代码位置

| 文件 | 作用 |
|---|---|
| [next/src/app/(user)/image/page.tsx](../../next/src/app/(user)/image/page.tsx) | 生图工作台，寄生悬浮按钮 + 抽屉 + 工作流回调 |
| [next/src/app/(user)/workflows/page.tsx](../../next/src/app/(user)/workflows/page.tsx) | 工作流独立页面（已存在，未挂导航） |
| [next/src/components/workflows/creative-workflow-workspace.tsx](../../next/src/components/workflows/creative-workflow-workspace.tsx) | 工作流主组件，含 `embedded` / `hideTaskList` 分支 |
| [next/src/components/layout/app-top-nav.tsx](../../next/src/components/layout/app-top-nav.tsx) | 顶部导航，扁平 Link 数组 |
| [next/src/components/layout/mobile-nav-drawer.tsx](../../next/src/components/layout/mobile-nav-drawer.tsx) | 移动端导航抽屉，扁平 Link 列表 |
| [next/src/constant/navigation-tools.ts](../../next/src/constant/navigation-tools.ts) | 导航项常量定义 |

---

## 二、改造目标

1. **工作流模块独立**：从生图工作台移除悬浮按钮和抽屉，作为独立导航模块暴露。
2. **导航支持下拉分组**：导航数据结构支持 `link` 与 `dropdown` 两种 kind，为后续小功能扩展预留位置。
3. **单子项直跳优化**：当下拉分组只有 1 个子项时，导航项本身渲染为可点击 Link，直接跳转；子项 ≥2 时才渲染为下拉菜单。
4. **彻底解耦联动**：生图工作台不再接收工作流产出，工作流产出只在 `/workflows` 页面内查看，不写入生图历史。
5. **命名规范化**：原「创作工作流」改名为「生图工作流」。
6. **清理冗余分支**：移除 `CreativeWorkflowWorkspace` 的 `embedded` / `hideTaskList` 参数及所有相关分支（唯一使用方已不存在，按 AGENTS.md「不要为了兼容更多场景写大量分支」清理）。

---

## 三、导航数据结构设计

### 3.1 类型定义

修改 [next/src/constant/navigation-tools.ts](../../next/src/constant/navigation-tools.ts)：

```typescript
import { FileText, ImagePlus, Images, Maximize2, Video, Workflow, WandSparkles, type LucideIcon } from "lucide-react";

type NavLink = {
    kind: "link";
    slug: string;
    label: string;
    icon: LucideIcon;
};

type NavDropdown = {
    kind: "dropdown";
    slug: string;          // 分组标识，用于 active 判断（pathname 以 /slug 开头即激活）
    label: string;
    icon: LucideIcon;
    children: NavLink[];   // 子项只能是 link（不支持嵌套下拉）
};

type NavigationTool = NavLink | NavDropdown;
```

### 3.2 导航项列表

```typescript
export const navigationTools: NavigationTool[] = [
    { kind: "link", slug: "canvas", label: "我的画布", icon: Maximize2 },
    { kind: "link", slug: "image", label: "生图工作台", icon: ImagePlus },
    { kind: "link", slug: "video", label: "视频创作台", icon: Video },
    { kind: "link", slug: "prompts", label: "提示词库", icon: FileText },
    { kind: "link", slug: "assets", label: "我的素材", icon: Images },
    {
        kind: "dropdown",
        slug: "workflows",
        label: "工作流",
        icon: Workflow,
        children: [
            { kind: "link", slug: "workflows", label: "生图工作流", icon: WandSparkles },
        ],
    },
];
```

> **注**：子项的 `slug: "workflows"` 与分组 `slug` 相同。当下拉只有 1 个子项时，整个分组渲染为 Link 跳转到该唯一子项；后续新增「提示词生成」「AI 换装」等子项时，自动切换为下拉菜单渲染，无需改代码。位置在「视频创作台」之后、「提示词库」之前。

### 3.3 渲染逻辑

#### 桌面端 [app-top-nav.tsx](../../next/src/components/layout/app-top-nav.tsx)

```tsx
{navigationTools.map((tool) => {
    if (tool.kind === "link") {
        // 直接渲染 Link（现状逻辑不变）
        return <Link key={tool.slug} href={`/${tool.slug}`} ... />;
    }

    // dropdown：children 只有 1 项 → 渲染为 Link 直跳
    if (tool.children.length === 1) {
        const only = tool.children[0];
        const Icon = only.icon;
        const active = only.slug === activeToolSlug;
        return <Link key={tool.slug} href={`/${only.slug}`} ... />;
    }

    // dropdown：children ≥2 项 → 渲染为 antd Dropdown
    const Icon = tool.icon;
    const active = pathname.startsWith(`/${tool.slug}`);
    return (
        <Dropdown
            key={tool.slug}
            menu={{
                items: tool.children.map((child) => ({
                    key: child.slug,
                    label: <Link href={`/${child.slug}`}>{child.label}</Link>,
                })),
            }}
            trigger={["hover"]}
        >
            <span className={cn("...", active && "...")}>
                <Icon className="size-4" />
                <span>{tool.label}</span>
                <ChevronDown className="size-3 opacity-60" />
            </span>
        </Dropdown>
    );
})}
```

#### 移动端 [mobile-nav-drawer.tsx](../../next/src/components/layout/mobile-nav-drawer.tsx)

```tsx
{navigationTools.map((tool) => {
    if (tool.kind === "link" || tool.children.length === 1) {
        const target = tool.kind === "link" ? tool : tool.children[0];
        // 渲染为单行 Link
        return <Link ... />;
    }

    // dropdown 多子项：平铺渲染，子项缩进一级
    return (
        <div key={tool.slug} className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-stone-400">
                {tool.label}
            </div>
            {tool.children.map((child) => (
                <Link key={child.slug} href={`/${child.slug}`} className="pl-6 ..." >
                    <child.icon className="size-5" />
                    <span>{child.label}</span>
                </Link>
            ))}
        </div>
    );
})}
```

### 3.4 active 判断

- `link` 项：`tool.slug === activeToolSlug`（现状逻辑）
- `dropdown` 单子项：用唯一子项的 `slug` 判断
- `dropdown` 多子项：`pathname.startsWith("/" + tool.slug)`

`activeToolSlug` 当前定义在 [app-top-nav.tsx#L19](../../next/src/components/layout/app-top-nav.tsx) 的 `navigationTools.some(tool => tool.slug === slug)` 也需调整，遍历所有 link 项与 dropdown 子项的 slug。

---

## 四、生图工作台清理

### 4.1 移除清单（[image/page.tsx](../../next/src/app/(user)/image/page.tsx)）

**导入清理**：
- 移除 `CreativeWorkflowWorkspace`、`WorkflowExternalTaskStart`、`WorkflowExternalTaskSuccess`、`WorkflowExternalTaskFailure` 的导入

**状态与 ref**：
- `workflowDrawerOpen` / `setWorkflowDrawerOpen`
- `workflowButtonPosition` / `setWorkflowButtonPosition`
- `workflowButtonRef` / `workflowButtonDragRef`
- 常量 `WORKFLOW_BUTTON_POSITION_KEY`

**useEffect 清理**：
- L196-L206 按钮位置初始化 + resize 监听

**函数清理**：
- `persistWorkflowButtonPosition`
- `handleWorkflowButtonPointerDown` / `Move` / `Up`
- `defaultWorkflowButtonPosition` / `clampWorkflowButtonPosition`
- `createWorkflowResultId`
- `handleWorkflowTaskStarted` / `Success` / `Failure`

**UI 清理**：
- L1184-L1207 悬浮 button
- L1208-L1225 Drawer + 内嵌 CreativeWorkflowWorkspace

**后端任务轮询清理**：
- L787 `listCanvasImageTasks(currentConfig, ["image-workbench", "workflow"])` → `["image-workbench"]`

### 4.2 保留清单（兼容历史日志数据）

下列内容**保留不动**，避免破坏已有的工作流产出日志展示：

| 位置 | 保留内容 |
|---|---|
| `GenerationResult` / `GenerationLog` 类型字段 | `workflowId` / `workflowName` / `workflowInputs` / `workflowTaskId` |
| L1957-L1960 / L2094-L2097 | 历史日志与结果区「工作流 xxx」青色 Tag 显示 |
| `withWorkflowLogCategories` (L2496) | 给历史工作流日志建虚拟分类 |
| `logToResult` / `buildGenerationLog` | workflow 字段映射 |

> **理由**：这些字段会被历史日志数据持有，删除会导致历史记录显示异常。本次只断「新产出回流」，不动历史展示。

### 4.3 `GenerationResult.workflowTaskId` 临时占位逻辑

`handleWorkflowTaskSuccess` 中 L1043 的 `setResults((value) => value.filter((item) => item.workflowTaskId !== task.taskId))` 会移除临时占位。清理回调后，由于不再有新占位加入，这段代码随回调一并移除；历史 `results` 状态里若残留旧占位（页面刷新即清空），无需额外处理。

---

## 五、工作流组件简化与改名

### 5.1 命名调整

修改 [next/src/components/workflows/creative-workflow-workspace.tsx#L946](../../next/src/components/workflows/creative-workflow-workspace.tsx)：

- 副标题文案 `创作工作流` → `生图工作流`

### 5.2 移除 embedded / hideTaskList 参数

| 位置 | 清理内容 |
|---|---|
| Props 定义 L205-L213 | 移除 `embedded?: boolean` 和 `hideTaskList?: boolean` |
| main 容器 L938 | 移除 `embedded ? "h-full" : "h-full overflow-y-auto bg-stone-50 p-4 dark:bg-stone-950"` 分支，统一用独立页样式 |
| 内层容器 L939 | 移除 `embedded ? "h-full overflow-y-auto p-4" : "mx-auto max-w-7xl"` 分支 |
| 顶部 header L941 | 移除 `embedded` 分支，统一用独立页卡片样式 |
| 副标题 L948 | 移除 `embedded ?` 文案分支，统一用「把固定提示词和参数沉淀成模板，每次只填写变量即可批量复用。」 |
| 任务网格 L970 | 移除 `embedded ?` 列数分支 |
| 任务列表 section L981 | 移除 `!hideTaskList &&` 判断 |
| 最近运行结果 section L1006 | 移除 `!hideTaskList &&` 判断 |

### 5.3 调用方更新

[next/src/app/(user)/workflows/page.tsx](../../next/src/app/(user)/workflows/page.tsx) 现状已经是无参渲染 `<CreativeWorkflowWorkspace />`，无需改动。

[next/src/app/(user)/image/page.tsx](../../next/src/app/(user)/image/page.tsx) 清理抽屉后不再调用此组件。

---

## 六、涉及文件清单

### 前端（next/）

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/constant/navigation-tools.ts` | 修改 | 改造为联合类型 `NavLink \| NavDropdown`，新增 workflows 下拉分组 |
| `src/components/layout/app-top-nav.tsx` | 修改 | 渲染逻辑适配：link / 单子项直跳 / 多子项 Dropdown；active 判断调整 |
| `src/components/layout/mobile-nav-drawer.tsx` | 修改 | 移动端：link / 单子项直跳 / 多子项平铺缩进 |
| `src/app/(user)/image/page.tsx` | 修改 | 移除悬浮按钮、抽屉、3 个回调、拖拽逻辑、相关 ref/state/常量；后端任务轮询去掉 "workflow" 标签 |
| `src/components/workflows/creative-workflow-workspace.tsx` | 修改 | 移除 `embedded` / `hideTaskList` 参数及分支；「创作工作流」改名「生图工作流」 |

### 文档

| 文件 | 操作 | 说明 |
|---|---|---|
| `docs/progress/pending-test.md` | 修改 | 记录本次变更待测试 |

---

## 七、实施步骤

### 步骤 1：改造导航数据结构与渲染

- [ ] 修改 [next/src/constant/navigation-tools.ts](../../next/src/constant/navigation-tools.ts) 引入 `NavLink` / `NavDropdown` 联合类型，新增 workflows 下拉
- [ ] 修改 [next/src/components/layout/app-top-nav.tsx](../../next/src/components/layout/app-top-nav.tsx) 适配渲染逻辑（单子项直跳，多子项 Dropdown）
- [ ] 修改 [next/src/components/layout/mobile-nav-drawer.tsx](../../next/src/components/layout/mobile-nav-drawer.tsx) 适配移动端渲染
- [ ] 调整 `activeToolSlug` 判断逻辑，覆盖 dropdown 子项

### 步骤 2：清理生图工作台工作流联动

- [ ] 移除 [next/src/app/(user)/image/page.tsx](../../next/src/app/(user)/image/page.tsx) 的导入、状态、ref、useEffect、回调函数
- [ ] 移除悬浮 button 和 Drawer UI
- [ ] 后端任务轮询去掉 `"workflow"` 标签
- [ ] 保留历史日志的 workflow 字段映射与展示

### 步骤 3：简化工作流组件

- [ ] 移除 [next/src/components/workflows/creative-workflow-workspace.tsx](../../next/src/components/workflows/creative-workflow-workspace.tsx) 的 `embedded` / `hideTaskList` 参数及所有相关分支
- [ ] 「创作工作流」改名「生图工作流」

### 步骤 4：验证与文档

- [ ] 启动前端，确认导航在「我的素材」后出现「工作流」项，点击直接跳转 `/workflows`
- [ ] 确认生图工作台悬浮按钮和抽屉已消失，生图功能正常
- [ ] 确认 `/workflows` 页面工作流功能正常，可创建/运行/查看结果
- [ ] 确认历史日志中工作流产出仍能正常显示「工作流 xxx」标签
- [ ] 模拟多子项场景（临时加一个测试子项）验证下拉菜单渲染正常
- [ ] 更新 [docs/progress/pending-test.md](pending-test.md) 记录本次变更

---

## 八、已确认决策

| 问题 | 决策 | 说明 |
|---|---|---|
| 下拉入口名称 | **工作流** | 放在「视频创作台」之后、「提示词库」之前，作为小功能集合入口 |
| 单子项交互 | **直跳** | children 只有 1 项时，导航项本身渲染为 Link 跳转到该唯一子项，不显示下拉 |
| 多子项交互 | **下拉菜单** | children ≥2 项时，渲染为 antd Dropdown，hover 弹出子菜单 |
| 原「创作工作流」改名 | **生图工作流** | 作为「工作流」下拉的第一个子项 |
| 生图工作台与工作流联动 | **彻底解耦** | 工作流产出只在 `/workflows` 页面内查看，不写入生图历史；不再通过回调回流主工作台 |
| 历史日志中的工作流字段 | **保留** | `workflowId` / `workflowName` 等字段在类型、展示、分类逻辑中保留，避免破坏历史数据 |
| 后端任务轮询标签 | **移除 "workflow"** | `listCanvasImageTasks` 的标签数组从 `["image-workbench", "workflow"]` 改为 `["image-workbench"]` |
| `embedded` / `hideTaskList` 参数 | **移除** | 唯一使用方已不存在，按 AGENTS.md 规范清理冗余分支 |
| 提示词生成子功能 | **本次不做** | 暂为设想，后续可能开发，下拉结构预留扩展性 |
| AI 换装子功能 | **本次不做** | 暂不加入下拉，等真正开发后再加 |

---

## 九、后续扩展点

当下拉需要新增子项时，只需在 [navigation-tools.ts](../../next/src/constant/navigation-tools.ts) 的 `workflows.children` 数组中追加：

```typescript
{
    kind: "dropdown",
    slug: "workflows",
    label: "工作流",
    icon: Workflow,
    children: [
        { kind: "link", slug: "workflows", label: "生图工作流", icon: WandSparkles },
        { kind: "link", slug: "prompt-generator", label: "提示词生成", icon: Sparkles },  // 后续扩展
        { kind: "link", slug: "ai-outfit", label: "AI 换装", icon: Shirt },                // 后续扩展
    ],
}
```

`children.length` 从 1 变为 ≥2 后，导航渲染自动从 Link 切换为 Dropdown，无需改任何渲染层代码。每个新子项需对应新建 `next/src/app/(user)/<slug>/page.tsx` 路由页面。

### 候选扩展子项

| 子项 | 说明 | 现状 |
|---|---|---|
| 生图工作流 | 当前工作流模块改名 | 已存在，本次改造 |
| 提示词生成 | AI 生成生图提示词，供复制到生图工作台 | 设想中，未开发 |
| AI 换装 | 上传人物 + 服装，AI 合成试穿效果 | 未开发 |
| 批量下载 | 历史图片批量打包下载 | 未开发 |
