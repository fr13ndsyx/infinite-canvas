---
title: 顶栏账户区整合方案
description: 将算力点余额、浅色/深色主题切换、账户头像合并为一个名字触发器，点击名字弹出含算力点余额与主题切换的下拉面板
---

# 顶栏账户区整合方案

## 背景

当前顶栏右上角的账户相关控件是三个**相互独立**的元素（`next/src/components/layout/user-status-actions.tsx`）：

| 元素 | 位置 | 说明 |
|---|---|---|
| 主题切换按钮 | `:61` | `AnimatedThemeToggler`，始终常驻显示 |
| 算力点余额 | `:62-77` | 行内常驻显示（`variant="canvas"` 与默认各一份），悬停有 Tooltip |
| 账户头像下拉 | `:88-104` | antd `Dropdown`，头像展示名字首字母（如 `admin` → `A`），点击弹出菜单（管理后台 / 快捷键 / 退出登录） |

问题：

1. 头像展示首字母（如 `A`）观感不佳，用户要求改为显示**名字**。
2. 算力点、主题切换、头像三者分散在顶栏，用户希望**绑定到同一位置**：显示名字，点击名字出现算力点余额与主题色切换。

画布页（`canvas-client-page.tsx:4385`）走 `variant="canvas"`，结构相同；画布工具栏（`canvas-toolbar.tsx:268`）另有一组**画布画面自身的浅色/深色**切换（控制画布表面，与全局主题是两回事），不在本次合并范围。

## 目标

- 登录用户的算力点、主题切换、账户入口统一收进一个**名字触发器**
- 触发器只显示名字（不显示头像图、不显示首字母）
- 点击名字弹出下拉面板，内含：算力点余额、主题切换、原有菜单项
- 未登录访客保留独立的主题切换按钮与「登录」链接，功能不退化
- 画布工具栏的画面深浅切换保持独立
- 主题切换保留全屏视图过渡动画（`AnimatedThemeToggler`）
- 不改动 `user-status-actions.tsx` 以外的文件

## 改动范围

仅修改 `next/src/components/layout/user-status-actions.tsx`，不新增文件。

### 设计结构

```
登录用户：
┌───────────────────────────┐
│  [名字]  (触发器)           │   ← 只显示名字文本，无头像
└───────────────┬───────────┘
                │ 点击展开
┌───────────────▼───────────┐
│  admin           管理员     │   ← 头部：名字 + 角色（无头像）
├────────────────────────────┤
│  算力点余额      ⚡ 1,280   │   ← 由行内常驻移入此处
│  主题            [☀/🌙]    │   ← 由独立按钮移入此处（保留过渡）
├────────────────────────────┤
│  管理后台（仅 admin）        │
│  快捷键                     │
│  ──────────────────────    │
│  退出登录                   │
└────────────────────────────┘

未登录访客：
  [配置?] [主题切换按钮] [登录]
```

### 关键实现点

1. **触发器**：改为一个显示 `userName` 文本的圆角 ghost 按钮，去掉 `Avatar` 首字母逻辑；`avatarUrl` 也不再使用（按需求不显示头像）。`variant="canvas"` 用 `canvasTheme` 内联色，`default` 用 Tailwind `dark:` 变体。

2. **下拉内容用 `dropdownRender` 渲染**：这样算力点行与主题行是自定义内容而非 menu item，点击主题切换**不会关闭**下拉。结构为「头部（名字+角色）→ 算力点行 → 主题行 → 分割线 → 原 menu（管理后台/快捷键/退出登录）」。

3. **移除行内独立元素**：
   - 删除 `:61` 的常驻 `AnimatedThemeToggler`（登录用户由下拉内含替代）
   - 删除 `:62-77` 的行内算力点两块（canvas / default 各一），余额移入下拉面板

4. **访客分支保留**：`!user` 时仍渲染独立主题切换按钮（`:61` 仅对访客生效）+「登录」链接，保证未登录也能切主题。同时保留访客的快捷键按钮（若 `onOpenShortcuts`）。

5. **主题切换在面板内**：复用 `AnimatedThemeToggler`，`theme={theme}`、`onThemeChange={setTheme}`；放在主题行右侧，点击触发全屏视图过渡且下拉不收起。

6. **原有 menu items 收敛**：头部名字改为放在 `dropdownRender` 的自定义头部，menu 内只保留「管理后台（admin）/ 快捷键 / 退出登录」；`accountOpen` / `onAccountOpenChange` / `getPopupContainer` 受控逻辑不变。

### 伪代码骨架（登录用户分支）

```tsx
{user ? (
  <div ref={accountRef}>
    <Dropdown
      open={accountOpen}
      onOpenChange={onAccountOpenChange}
      trigger={["click"]}
      placement="bottomRight"
      getPopupContainer={getPopupContainer}
      menu={{ items: menuItems, onClick: handleMenuClick }}
      dropdownRender={(menu) => (
        <div className="...panel">
          {/* 头部：名字 + 角色（无头像） */}
          <div className="header">
            <span className="name">{userName}</span>
            <span className="role">{roleLabel}</span>
          </div>
          {/* 算力点余额 */}
          <div className="row">
            <span className="label">算力点余额</span>
            <span className="value"><CreditSymbol /> {credits.toLocaleString()}</span>
          </div>
          {/* 主题切换 */}
          <div className="row">
            <span className="label">主题</span>
            <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className="..." />
          </div>
          <div className="divider" />
          {menu}
        </div>
      )}
    >
      <button type="button" className="trigger" style={triggerStyle}>
        <span>{userName}</span>
      </button>
    </Dropdown>
  </div>
) : null}
```

## 边界与取舍

- **算力点不再常驻**：合并后余额需点击名字才可见。这是「点击名字出现算力点余额」的直接结果。若希望余额仍一眼可见，则需保留行内算力点、仅收起主题切换——本方案按需求将两者都收起。
- **头像不再展示**：按用户要求，触发器与下拉头部都不显示头像图（即便用户有 `avatarUrl`），只显示名字。
- **画布工具栏画面深浅切换不动**：`canvas-toolbar.tsx` 的浅色/深色控制的是画布画面表面，与全局主题无关，保留独立。
- **访客主题切换保留**：把主题切换收进登录用户的名字下拉后，访客（无名字/头像）需保留独立的主题按钮，否则未登录无法切主题。
- **`CreditSymbol` / `AnimatedThemeToggler` 复用现有组件**，不新增依赖。

## 验证步骤

1. 登录 admin 账号，首页右上角应只显示名字 `admin`，不显示头像圆圈/首字母
2. 点击名字，下拉面板显示：名字+角色、算力点余额（含数值）、主题切换、管理后台、退出登录
3. 点击主题切换行，全屏视图过渡执行，下拉保持打开，再次点击可切回
4. 点击「退出登录」，下拉关闭并执行退出
5. 退出到未登录状态，确认顶栏仍有独立主题切换按钮与「登录」链接
6. 进入画布页，点击名字下拉内可切换全局主题；画布工具栏的画面深浅切换仍可独立工作
7. 深色模式下确认下拉面板文字清晰（依赖已修的 Tooltip 气泡配色 `app-theme.ts`）
8. 管理后台（`/admin`）顶栏同样显示名字下拉（`showConfig={false}`），配置按钮不再出现
