# 管理后台导航重组改造方案

## 背景

当前管理后台「系统设置」页（`next/src/app/(admin)/admin/settings/page.tsx`）按"公开配置 / 私有配置"两个 tab 组织，每个 tab 内再分"可视化编辑 / 手动编辑 JSON"两种模式，形成 2×2 四个象限。

问题在于：

1. **"公开/私有"是实现视角，不是管理员的工作视角**。管理员想的是"加模型、定价格、定开关"，而不是"这个字段属于 public 还是 private"。公开/私有只是数据库 `settings` 表两行 JSON 的存储细节，不应暴露为 UI 结构。
2. **同一件事散在多处**：渠道在「模型管理」页，开放哪些模型在公开配置可视化，模型单价又在公开配置另一区块，API Key 还会出现在私有配置 JSON 里。
3. **关联配置被人为拆开**：提示词定时同步（`promptSync`）和提示词来源是两处；AI 日志清理策略（`aiLog`）和 AI 调用日志列表也是两处。
4. **双模式叠加**：每个 tab 都有可视化 + JSON，管理员不清楚该用哪个。

## 目标

1. 按管理员工作流重组左侧导航：用户与资费 → 模型服务 → 内容库 → 系统
2. "公开/私有"概念从 UI 彻底隐藏，退化为纯存储细节
3. 关联配置聚合：同步策略进提示词来源页、日志策略进 AI 日志页
4. 新模型并入 availableModels 后给出"未定价"醒目警告，避免商用漏定价
5. 后端零改动，沿用 `/api/admin/settings` 全量读写模式

## 不动的页面

用户管理 `/admin/users`、提示词来源 `/admin/prompt-sources`、提示词管理 `/admin/prompts`、素材库 `/admin/assets`、模型管理 `/admin/channels` 五个页面功能不变（提示词来源和 AI 日志页仅顶部各新增一个设置卡片，见下文）。

## 新导航结构

```
用户与资费
├─ 用户管理        /admin/users           【不动】
└─ 算力点日志      /admin/credit-logs     【不动，仅挪分组】
模型服务
├─ 模型管理        /admin/channels        【不动】
└─ 开放与定价      /admin/model-pricing   【新】
内容库
├─ 提示词来源      /admin/prompt-sources  【不动 + 顶部新增「定时同步」卡片】
├─ 提示词管理      /admin/prompts         【不动】
└─ 素材库          /admin/assets          【不动】
系统
├─ 存储设置        /admin/storage         【新】
├─ 系统偏好        /admin/preferences     【新】
├─ AI 调用日志     /admin/ai-logs         【不动 + 顶部新增「日志设置」卡片】
└─ 高级配置        /admin/advanced        【新，纯 JSON 编辑】
```

- `/admin/settings` 改为重定向到 `/admin/model-pricing`，兼容旧链接。
- 菜单用 antd Menu 的 `group` 类型分组（用户与资费 / 模型服务 / 内容库 / 系统），不引入二级子菜单。

## 字段归属映射

| 原位置 | 字段 | 新位置 |
|---|---|---|
| 公开·模型 | `availableModels`、默认模型×4、`modelCosts` | 开放与定价 |
| 公开·开关 | `allowCustomChannel`、`allowUserRemoteChannel` | 开放与定价（渠道策略区） |
| 公开·开关 | `allowGuestConfig`、`auth.allowRegister` | 系统偏好（访问控制区） |
| 公开·提示词 | `systemPrompts`×5 + `systemPrompt` | 系统偏好（内置提示词区） |
| 公开·存储 | `storage.mode`、`storage.allowUserProvider` | 存储设置 |
| 私有·同步 | `promptSync.enabled` / `cron` | 提示词来源页顶部卡片 |
| 私有·日志 | `aiLog.localDirectReportEnabled` / `cleanup.*` | AI 调用日志页顶部卡片 |
| 私有·存储 | `storage.providers`、`capacityCheck`、`capacityLimitBytes`、`allowUserGlobalProvider` | 存储设置 |
| 私有·渠道 | `channels` | 模型管理（已在，不动） |
| 全部 | 完整公开/私有 JSON | 高级配置 |

## 各新页面构成

### 开放与定价 `/admin/model-pricing`

- **系统可用模型**：多选 Select，options 来自已启用渠道模型，每个选项标注来源渠道名（如 `agnes-2.5-pro · Agnes`）；无可用渠道时显示引导文案"请先在模型管理添加并启用渠道"和跳转链接
- **未定价警告**：availableModels 中不在 modelCosts 里的模型数量 > 0 时，顶部 Alert 提示"⚠️ N 个模型未定价，当前 0 算力点，用户可免费使用"
- **模型定价表**：每个已开放模型一行（模型名 / 来源渠道 / 算力点单价输入框）
- **默认模型**：默认/图片/视频/文本 4 个 Select（options = availableModels）
- **渠道策略**：`allowCustomChannel`、`allowUserRemoteChannel` 两个开关 + 一行当前模式说明文案（如"当前：用户可自带 API，也可使用平台渠道"）

### 存储设置 `/admin/storage`

- 存储模式、`allowUserProvider`、`allowUserGlobalProvider`
- 容量上限、定时测量开关与 cron
- providers 列表（沿用现设置页数据存储 Card 的表格 + 测量操作）

### 系统偏好 `/admin/preferences`

- 访问控制：`auth.allowRegister`、`allowGuestConfig`
- 内置提示词：image / video / text / workflow / workflowAgent 5 个 TextArea

### 高级配置 `/admin/advanced`

- 页头 Alert："仅供排障与迁移使用，常规配置请使用前面页面"
- 左右两栏 JSON 编辑器：公开配置 / 私有配置，带格式化和 JSON 校验
- 保存时仍走全量 `POST /api/admin/settings`

## 改动清单

### 新建 4 个页面

- `next/src/app/(admin)/admin/model-pricing/page.tsx` — 开放与定价
- `next/src/app/(admin)/admin/storage/page.tsx` — 存储设置
- `next/src/app/(admin)/admin/preferences/page.tsx` — 系统偏好
- `next/src/app/(admin)/admin/advanced/page.tsx` — 高级配置（JSON 编辑器沿用 `@uiw/react-codemirror` 或现设置页 JSON TextArea 模式）

各页面统一模式：加载全量 settings → 渲染自己负责的片段 → 保存时整体 `POST /api/admin/settings`（与模型管理页 `persistChannels` 相同模式）。

### 修改 4 文件

- `next/src/app/(admin)/admin/layout.tsx` — `adminMenus` 改为 4 分组结构，新增 4 个菜单项与 `routeMeta`；移除原"系统设置"项
- `next/src/app/(admin)/admin/settings/page.tsx` — 删除全部内容，改为 `redirect("/admin/model-pricing")`
- `next/src/app/(admin)/admin/prompt-sources/page.tsx` — 顶部新增「定时同步」卡片（`promptSync.enabled` / `cron`，从 settings 页迁移对应 Form.Item）
- `next/src/app/(admin)/admin/ai-logs/page.tsx` — 顶部新增「日志设置」卡片（`aiLog.localDirectReportEnabled` / `cleanup.*`）

### 共享逻辑

- settings 页的 `normalizeSettings` / `normalizePublicSetting` / `normalizePrivateSetting` / `filterModels` / `collectChannelModels` 等归一化函数，抽到 `next/src/app/(admin)/admin/settings-shared.ts`，各新页面与模型管理页按需引用（模型管理页内联的那份可后续再收敛，本次不动它）

### 文档

- `docs/progress/pending-test.md` — 记录本次重组的验证步骤
- `docs/progress/todo.md` — 本条目状态更新
- `docs/backend/system-settings.md` — 补充新导航与字段归属说明
- `docs/overview/features.md` — 用户确认测试通过后再更新

## 关键决策

### 1. 后端零改动，各页面沿用全量保存模式

每个新页面仍是"读全量 → 改自己片段 → 整体保存"，与模型管理页拆分时的决策一致（详见 [channels-page-split.md](./channels-page-split.md)）。后端 `SaveSettings` 的归一化、availableModels 合并、密钥保留等逻辑不变，不引入分域接口。

### 2. promptSync / aiLog 放进功能页而非系统偏好

同步策略管的就是提示词来源，日志清理管的就是 AI 日志，放在同一页符合"做这件事时顺便配这件事"的直觉。系统偏好只留真正无归属的全局项（注册开关、访客配置、内置提示词）。

### 3. 未定价警告放在开放与定价页顶部

新模型经后端 `mergeNewEnabledChannelModels` 自动并入 availableModels 后默认 0 算力点（免费）。在定价页顶部用 Alert 提示未定价模型数量，是商用防漏定价的关键兜底，成本极低。

### 4. 高级配置保留完整 JSON 编辑

排障和迁移场景需要看到/修改原始 JSON（本次 availableModels bug 就是靠 JSON 视图发现的）。但把它从日常路径里拿走，加警示文案，避免管理员困惑"两个入口该用哪个"。

## 数据一致性风险

与模型管理页拆分时相同：多个页面各持 settings 副本，并发/跨页保存可能互相覆盖。缓解方式相同（保存后重新加载、单人管理后台场景风险可接受），不算回归。

## 执行步骤

1. 抽共享归一化函数到 `settings-shared.ts`
2. 新建「开放与定价」页（含未定价警告、定价表、渠道策略）
3. 新建「存储设置」「系统偏好」「高级配置」三个页面
4. 提示词来源页、AI 日志页各加设置卡片
5. `layout.tsx` 菜单分组重组；`settings/page.tsx` 改重定向
6. 自测验证（见 pending-test.md 验证步骤）
7. 更新文档

## 不在本次范围

- 后端 `/api/admin/settings` 分域接口拆分（远期多人协作时再做）
- 模型能力配置（已在 [model-capabilities-refactor.md](./model-capabilities-refactor.md) 单独跟踪）
- 模型管理页内联 normalize 逻辑收敛到共享文件（可后续顺手做）
- 五个保留页面的功能改动
