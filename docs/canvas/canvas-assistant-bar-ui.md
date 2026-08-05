# 画布底部助手栏 & 视频设置弹窗 — 样式与 UI 布局说明

本文档定义画布底部助手输入条与视频设置弹窗的样式、布局与交互规范，供后续 UI 调整与重构参考。

## 一、底部助手栏（单行紧凑布局）

### 1.1 整体容器

```
[模型选择] [参数项1·参数项2·参数项3·参数项4] [提示词库] [摄像机] [提交]
```

- 布局：单行 flex，左对齐，右侧提交按钮
- 外层 `span`：
  - `inline-flex min-w-0 max-w-full items-center gap-1.5`
  - `text-[10.8px]`
  - `color: theme.node.text`（强色黑/白）
  - 字体栈：`"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`

### 1.2 各元素规格

| 元素 | 字号 | 图标 | 颜色 | 间距 |
|---|---|---|---|---|
| 模型选择 | 10.8px | `size-3.5` (14px) 模型图标 + `size-2.5` ChevronDown | `theme.node.text` | `px-1.5 py-0.5 gap-1` |
| 参数项按钮 | 10.8px | `size-3.5` (14px) | `theme.node.text` | `px-1.5 py-0.5 gap-1` |
| 参数分隔符 `·` | 10.8px | — | `opacity-30` | `shrink-0` |
| 提示词库 svg | — | `size-4` (16px) | `theme.node.text` | — |
| 摄像机 | 10.8px | `size-3` (12px) | `theme.node.text`（开启态 `theme.toolbar.activeText`） | `gap-1` |
| 提交按钮 | `text-xs` (12px) | `size-3.5` (14px) Zap/ArrowUp | `theme.toolbar.activeText` | `px-3 py-1.5` |

### 1.3 参数项内容（按顺序）

1. 首尾帧 / 全能参考（根据 `klingActiveTab` 切换显示）
2. 视频模式（如存在）
3. 比例（智能比例 / 1:1 / 4:3 / 16:9 等）
4. 分辨率（480p / 720p / 1080p / 2k / 4k）
5. 时长（如 5s）
6. 音频（Volume2 开启 / VolumeX 关闭图标）

参数项之间用 `·` 分隔，分隔符 `opacity-30`。

### 1.4 交互

- 鼠标悬停：`hover:opacity-70`
- 点击参数按钮：打开视频设置弹窗
- 点击模型按钮：展开模型下拉菜单
- 鼠标按下事件：`stopPropagation`（防止触发画布拖拽）

---

## 二、视频设置弹窗

### 2.1 弹窗容器

- 尺寸：`width: 356px`
- 圆角：`borderRadius: 18`
- 阴影：`0 18px 54px rgba(28, 25, 23, 0.16)`
- 背景：`theme.toolbar.panel`
- 内边距：`padding: 18`
- 最大高度：自适应视口，`overflowY: auto`
- 定位：`position: fixed`，根据 placement 参数决定上方/下方弹出

### 2.2 弹窗内容顺序

```
1. [首尾帧 / 全能参考] 切换按钮（仅模型支持时显示）
2. 选择比例
3. 选择分辨率
4. 生成时长
5. 生成音频（仅模型支持时显示）
6. 首尾帧上传框 / 元素列表（根据 tab 切换）
```

### 2.3 区块通用样式（CanvasSection）

```tsx
<div className="space-y-1.5">
  <div className="text-[10.8px] font-medium opacity-55">{title}</div>
  {children}
</div>
```

- 区块标题：10.8px，`font-medium`，`opacity-55`（灰色弱化）
- 区块间距：`space-y-1.5`

### 2.4 各区块规格

#### 首尾帧 / 全能参考切换

- 容器：`flex w-full items-stretch gap-0.5 rounded-lg p-0.5`，背景 `theme.node.fill`
- 按钮：`flex-1 rounded-md py-1 text-[10.8px]`
- 选中态：背景 `theme.toolbar.panel`，文字 `theme.toolbar.activeText`
- 未选中态：背景透明，文字 `theme.node.muted`

#### 选择比例

- 容器：`flex w-full items-stretch gap-0.5 rounded-lg p-0.5`，背景 `theme.node.fill`
- 比例按钮：`flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 text-[10.8px] leading-3`
- 图标在上、文字在下（两行布局）
- 图标容器：`h-4`
- 智能比例用 `SmartRatioIcon`，其他用 `SizePreview`（按宽高比绘制方框）
- 选中态：背景 `theme.toolbar.panel`，文字 `theme.toolbar.activeText`
- 未选中态：背景透明，文字 `theme.node.muted`

#### 选择分辨率

- 容器：同上
- 按钮：`flex-1 rounded-md py-1 text-center text-[10.8px]`
- 选项：480p / 720p / 1080p / 2k / 4k（根据模型能力配置）
- 选中/未选中态同上

#### 生成时长

- 使用 antd `Slider`
- 滑块容器：`rounded-lg p-0.5`，背景 `theme.node.fill`

#### 生成音频

- 容器：同比例选择
- 按钮：`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[10.8px]`
- 图标：`size-3.5` (14px) Volume2 / VolumeX
- 两个按钮：[关闭 VolumeX] [开启 Volume2]
- 选中态同上
- 下方提示行：`text-[10.8px] leading-4`，图标 `size-3`，颜色 `theme.node.muted`

### 2.5 首尾帧上传框

- 布局：`grid grid-cols-2 gap-2.5`
- 单个上传框：`grid gap-1 rounded-xl border p-2.5`，边框 `theme.node.stroke`
- 鼠标悬停提示：首帧 / 尾帧
- 仅首帧支持时：显示一个上传框
- 首帧 + 尾帧支持时：显示两个上传框（一行）

### 2.6 元素列表（全能参考模式）

- 容器：`grid gap-2 rounded-xl border p-2.5`，边框 `theme.node.stroke`
- 标题行：`text-sm font-medium`（14px）"元素列表 N"，N 为徽章 `text-xs` `theme.node.fill` 背景
- 新增/删除按钮：`size-8` 图标按钮，`text-xs`
- 最多 3 个元素，最少 1 个

---

## 三、颜色 Token 速查（来自 canvas-theme.ts）

| Token | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `theme.node.text` | `#292524` | `#f5f5f4` | 主文字（强色） |
| `theme.node.muted` | 弱化文字 | 弱化文字 | 弹窗未选中选项 |
| `theme.node.fill` | 填充背景 | 填充背景 | 选项组容器背景 |
| `theme.node.stroke` | 边框 | 边框 | 上传框/卡片边框 |
| `theme.node.panel` | 面板背景 | 面板背景 | Tooltip 背景 |
| `theme.toolbar.panel` | `rgba(251,250,247,.96)` | `rgba(31,29,26,.96)` | 弹窗/选中项背景 |
| `theme.toolbar.border` | 边框 | 边框 | 弹窗边框 |
| `theme.toolbar.activeText` | 激活文字 | 激活文字 | 选中项文字 |
| `theme.toolbar.activeBg` | 激活背景 | 激活背景 | 下拉菜单选中项 |

---

## 四、字号速查

| 场景 | 字号 |
|---|---|
| 底部助手栏所有文字 | `10.8px` |
| 弹窗区块标题 | `10.8px` |
| 弹窗选项按钮文字 | `10.8px` |
| 弹窗音频提示行 | `10.8px` |
| 弹窗标题"视频设置" | `text-lg` (18px) |
| 元素列表标题 | `text-sm` (14px) |
| 元素列表徽章/下拉项 | `text-xs` (12px) |
| 提交按钮 | `text-xs` (12px) |

---

## 五、图标尺寸速查

| 场景 | 尺寸 |
|---|---|
| 底部助手栏模型图标 | `size-3.5` (14px) |
| 底部助手栏参数项图标 | `size-3.5` (14px) |
| 底部助手栏摄像机图标 | `size-3` (12px) |
| 底部助手栏提交按钮图标 | `size-3.5` (14px) |
| 底部助手栏提示词库 svg | `size-4` (16px) |
| 弹窗音频按钮图标 | `size-3.5` (14px) |
| 弹窗音频提示行图标 | `size-3` (12px) |
| 弹窗 ChevronDown | `size-2.5` (10px) |

---

## 六、字体栈

```
"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
```

目前仅在底部助手栏外层 `span` 显式声明，子元素继承。

---

## 七、关键交互规则

1. **主题一致性**：所有颜色必须使用 `canvasThemes` token，禁止硬编码 `#xxxxxx`
2. **状态区分**：
   - 底部助手栏：全部 `theme.node.text`（强色）
   - 弹窗选中项：`theme.toolbar.activeText` + `theme.toolbar.panel` 背景
   - 弹窗未选中项：`theme.node.muted` + 透明背景
3. **事件隔离**：所有按钮 `onMouseDown` 调用 `stopPropagation`，防止触发画布拖拽
4. **状态持久化**：首尾帧/全能参考切换状态存储在 `CanvasNodeMetadata.klingActiveTab`
5. **默认值**：新建视频节点 `videoSize = "adaptive"`（智能比例），`vquality` 为第一个可选分辨率，`klingActiveTab` 默认全能参考

---

## 八、涉及文件

- `next/src/app/(user)/canvas/components/canvas-assistant-composer.tsx` — 底部助手栏容器
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx` — 视频参数按钮 + 弹窗
- `next/src/components/video-settings-panel.tsx` — 弹窗内设置面板
- `next/src/app/(user)/canvas/components/canvas-camera-control.tsx` — 摄像机按钮
- `next/src/lib/canvas-theme.ts` — 主题 token 定义
- `next/src/app/(user)/canvas/types.ts` — `CanvasNodeMetadata` 类型定义
