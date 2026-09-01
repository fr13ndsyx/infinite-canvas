---
title: 待测试
description: 当前版本已实现但仍需人工验证的变更项
---

# 待测试

## 画布文本生图节点命名

### 可测试变更

- 文本节点连接或触发图片生成时，新建图片节点遵循画布统一的类型序号命名规则（“图片1、图片2……”），不再直接使用上游文本正文作为图片节点标题。
- 复用已有空图片节点生成时，继续保留该节点原有标题。

### 验证步骤

1. 新建文本节点并输入较长内容，触发“用文本生图”，确认新图片节点标题为下一个“图片N”，而不是文本正文。
2. 将文本节点连接到空图片节点后生成，确认空图片节点仍保留原来的“图片N”标题。

## 管理后台渠道与开放定价视觉优化

### 可测试变更

- “模型管理”渠道表格改为带边框的中等密度布局，渠道列同时展示名称和接口地址，支持横向滚动避免窄屏挤压。
- 新增/编辑渠道抽屉加宽并采用主题背景和基础信息卡片，表单字段在窄屏自动单列排列；模型选择弹窗改为自适应多列模型列表，避免固定两列造成内容拥挤。
- “模型开放与定价”移除顶部统计卡片，定价表使用更清晰的边界和滚动布局，浅色/深色主题均复用 Ant Design 主题变量。
- 模型能力配置中的“高级协议适配”折叠符号调整到标题文字后方，减少视觉跳跃；渠道编辑中的生图接口模式明确展示对应端点。

### 验证步骤

1. 分别进入“模型管理”和“开放与定价”，确认页面信息层级简洁，渠道列表和定价表内容清晰。
2. 新增、编辑渠道，检查抽屉在桌面和窄屏下的字段排列、接口地址/API Key/模型选择和保存行为。
3. 打开“选择模型”弹窗，搜索、拉取、添加模型并确认多列列表在不同窗口宽度下不溢出。
4. 切换浅色/深色主题，确认表格、抽屉和弹窗文字与边框对比度正常。

## 管理后台模型能力工作台

### 可测试变更

- 图片模型能力与视频模型能力统一为“左侧模型列表 + 右侧详情面板”，按类型切换并仅展示当前选中的模型，新增模型后列表可纵向滚动，避免多个模型纵向堆叠占满页面。
- 渠道适配参数（高级）改为可展开折叠面板，基础能力与高级请求映射分层展示；布局使用 Ant Design 主题变量，兼容浅色和深色主题，并在窄屏下自动上下排列。
- 左侧当前选中模型使用低强度主题混合底色、边框与阴影，浅色模式下不会压住黑色文字，同时保留清晰选中态。
- 视频“模式选项”单独收进按需展开区域，并补充值/标签配置说明；能力开关增加前端行为提示，降低误配置风险。
- 视频“模式选项”调整到“高级协议适配”正上方，和基础分辨率/比例配置分层显示。
- 视频创作台（包括 Kling 专属面板）统一读取后台配置的模式选项；后台关闭多镜头后，专属面板不再显示分镜控件，请求也不会发送残留的多镜头字段。
- 运动控制能力开关作为请求约束：仅在模型配置支持时发送角色朝向字段；勾选后直接使用已有的角色朝向参考控件，无需额外修改提示词或前端代码。

### 验证步骤

1. 在管理后台开放多个图片/视频模型，进入“模型能力”，确认左侧可切换模型类型和具体模型，右侧只显示当前模型详情。
2. 修改比例、档位、视频能力及渠道适配参数，保存后重新进入，确认配置仍按选中模型保留。
3. 分别切换浅色、深色主题并缩放到窄窗口，确认列表、详情卡片、折叠面板的文字和边框对比度正常、内容不溢出。
4. 为 Kling 模型填写自定义模式值/标签，进入视频创作台确认模式选项与后台一致；关闭多镜头后确认创作台不显示分镜设置，提交请求时不带多镜头字段。
5. 为支持运动控制的模型勾选“运动控制”，确认视频创作台出现“角色朝向参考”；取消勾选后控件消失且请求不再发送 `character_orientation`。

## 配置弹窗布局与个人中心入口

### 可测试变更

- 配置弹窗内容区改为更高的可滚动工作区，标题增加层级分隔，底部增加保存提示并将按钮文案统一为“完成并保存”；主题切换使用现有 SVG 图标组件。
- 本地渠道、模型列表、平台模型和偏好设置改用统一的圆角边框卡片布局，偏好设置在中等屏幕改为两列、宽屏最多四列，减少内容挤压。
- 登录后的个人中心弹窗新增“配置与偏好”入口，和未登录时一样在顶栏保留主题切换按钮；配置入口和弹窗内容不使用 SVG 图标。
- 个人中心弹窗改用底部居中定位：空间足够时居中显示在用户名下方，靠近视口边缘时自动向内调整，保证完整可见。
- 管理后台个人中心保留右对齐定位，避免右上角账号菜单居中后溢出视口。

### 验证步骤

1. 在桌面端和窄窗口打开配置弹窗，确认内容区可滚动、标题和底部操作区不会被内容挤压。
2. 切换本地渠道、平台渠道、偏好设置三个 Tab，确认卡片边界、间距和深浅色主题下的对比度正常。
3. 登录前后确认顶栏主题切换按钮都在同一位置；登录后打开右上角个人中心，点击“配置与偏好”，确认能打开配置弹窗并正常保存。

## 公共模块开关刷新时导航闪现

### 可测试变更

- 公共设置加载完成前暂不渲染受模块开关控制的导航项，避免被后台关闭的生图工作台、视频创作台和工作流在刷新时先出现再消失。
- 公共设置请求失败时，加载结束后恢复显示原有导航，不会因设置接口异常导致导航永久空白。

### 验证步骤

1. 在后台关闭生图工作台、视频创作台或工作流，刷新主页多次，确认这些导航项不再闪现。
2. 重新开启模块并刷新，确认设置加载后导航项正常出现。

## JWT 密钥跨重启失效导致全站 401

### 可测试变更

- 修复重启后端后所有登录令牌失效（画布保存、图片任务、反推提示词等全部 401/请求失败）：`.env` 显式配置的 `JWT_SECRET` 此前会被强制替换为每次启动随机生成的密钥，重启即令牌全废；现改为只有 `JWT_SECRET` 未设置时才随机生成，显式配置值一律生效。

### 验证步骤

1. 重启后端 Go 服务，刷新页面重新登录一次（旧令牌由随机密钥签发，需换发）。
2. 再次重启后端、刷新页面：确认登录态保持，不再需要重新登录。
3. 反推提示词、画布自动保存、图片生成恢复正常，后端日志不再出现 `/api/v1/...` 401 刷屏。

---

## 视频节点提示词保留与轮询日志降噪

### 可测试变更

- 视频节点下方输入框点击发送后不再清空文字（此前清空后又不回显 metadata.prompt，看起来像文字丢失），内容保留便于查看和失败后修改；全景图节点行为不变。
- 后端 `GetUserVideoTask` 改用 `Find` 查询：任务记录尚未落库（建任务请求在 Agnes 处理期间）时前端轮询查不到，GORM 会按 ERROR 级别把整条 SQL 刷到控制台，看起来像报错；改为 Find 后未命中不再输出 SQL 错误日志。

### 验证步骤

1. 视频节点连接图片、输入提示词、发送：输入框文字应保留在框内。
2. Agnes 视频生成期间观察后端控制台：不应再出现 `SELECT * FROM "video_tasks" ...` 的红色 SQL 日志。
3. 若视频节点本身显示失败，把节点错误文字或后台"AI 日志"里该次请求的报错内容发我，继续排查上游错误。

---

## 反推提示词模型回退与文本子节点命名

### 可测试变更

- 修复"反推提示词"生成报 401（`api.agnes-ai.cn/v1/chat/completions` Unauthorized）：配置节点模型回退顺序由 `textModel || model || 默认文本模型` 改为 `textModel || 默认文本模型 || model`，避免画布全局模型是图片/视频模型（如 Agnes，无 chat 端点）时被拿去做文本对话。
- 补充根治：`buildGenerationConfig` 在文本模式下会校验节点固化的模型是否具备文本能力（依据后台能力配置的 textModels），不具备（如旧反推配置节点在修复前已存入 Agnes 图片模型）时忽略并回落文本模型；此前的回退链最终仍会落到画布全局 `model`，且已固化的旧节点模型优先级最高，两处都可能导致继续打 Agnes chat 端点 401。
- 最终根因（本地渠道模式）：`resolveEffectiveConfig` 的本地渠道分支此前不计算 `textModel/textModels` 等字段（仅云端渠道分支计算），导致文本生成的模型白名单校验失效、`textModel` 保持旧值（Agnes 模型），反推提示词始终拿 Agnes 模型调 chat 接口 401；现本地分支同样按能力分类模型并解析各类型默认文本/图片/视频/音频模型。
- 配置节点生成的文本子节点改用默认"文本N"命名（多张时编号递增）：此前标题取 composer 拼接提示词前 32 字，反推场景会出现"参考图片：图片1任务说明：【文本1】..."这类难看标题。

### 验证步骤

1. 对图片节点执行"反推提示词"，生成：确认文本模型走文本渠道、不再报 Agnes 401（需画布全局模型为 Agnes 图片模型、未单独设置文本模型时验证）。
2. 反推生成出的文本子节点标题确认是"文本N"格式。
3. 配置节点正常多张文本生成（数量>1）：确认子节点编号连续不重复。
4. 画布内单独设置过文本模型时确认仍优先使用该模型。

---

## Agnes 参考图 base64 与首尾帧模式

### 可测试变更

- 修复 Agnes 视频模型带参考图生成报错 `media must be a public http(s) URL or valid base64 data`：Agnes 的 `images`/`first_frame`/`last_frame` 字段仅接受公开 http(s) URL 或纯 base64 字符串，此前发送的是 Data URI（`data:image/png;base64,...`）导致两项校验都不通过；现发送前剥掉 Data URI 前缀只传纯 base64（可解析为公开 URL 时仍优先传 URL）。
- Agnes 视频补充首尾帧支持：配置了首帧/尾帧时改用 `mode=keyframe` 并发送 `first_frame`/`last_frame` 字段（此前首尾帧被静默丢弃）；无首尾帧但有参考图时仍为 `mode=reference` + `images`，纯文生视频为 `mode=text`。

### 验证步骤

1. 本地图片（Data URI）连接 Agnes 视频节点生成：确认不再报 media 相关 400 错误。
2. 图片节点直接连接 Agnes 视频节点（普通参考）：确认 `mode=reference` + `images` 生成成功。
3. 视频设置中选择首帧/尾帧图片后生成：确认 `mode=keyframe` + `first_frame`/`last_frame` 生效、成片以首帧开场。
4. 纯文生视频确认 `mode=text` 路径不受影响。

---

## 节点加载态与生成节点命名统一

### 可测试变更

- 图片/视频/音频节点生成中的加载态移除秒数计时显示（已有 spinner 与进度条，去掉冗余时长胶囊）；同步清理不再使用的每秒 tick 定时器与 formatDuration 引用。
- 所有"空生成节点复用"路径统一保留节点原默认命名：视频节点（原会被覆盖为提示词前 32 字）、音频节点、Agent 创建的图片/视频/音频节点（原会被覆盖为提示词前 32 字或"视频/音频/图片"）、文本回答落回源节点路径（原会覆盖标题），均改为保留"图片1/视频1/音频1"等默认命名；图片节点、全景图节点此前已保留。非空节点派生新节点时仍按提示词前 32 字命名，Agent 明确指定 title 时仍生效。

### 验证步骤

1. 文本节点连接空图片/视频/音频节点，直接生成：确认节点标题保持"图片1/视频1/音频1"，不再变成文本内容。
2. 生成过程中确认节点内只有 spinner、百分比与进度条，无"xx 秒"时长显示。
3. 非空图片节点再次生成：确认新派生节点仍按提示词前 32 字命名。
4. 画布 Agent 对话触发生图/生视频：确认新节点用默认命名；Agent 参数里显式传 title 时确认标题生效。
5. 文本问答（如文本节点直接生成回答落回自身）：确认节点标题不被覆盖。

---

## 空图片节点生成时的输入框回显与命名

### 可测试变更

- 修复空图片节点（已连接文本节点）直接生成后，节点输入框回显上游文本拼接内容的问题：图片/视频/音频节点的输入框不再回显 `metadata.prompt`（该字段保留作为生成记录），仅全景图回显源提示词、文本节点回显节点提示词。
- 修复空图片节点生成后标题被改为提示词前 32 字的问题：空图片节点复用为生成节点时保留原命名（如"图片1"），非空节点派生新节点时仍用提示词命名。

### 验证步骤

1. 文本节点输入内容，连接到空图片节点（"图片1"），不输入文字直接点生成：确认输入框保持为空、不回显文本内容；生成完成后节点标题仍为"图片1"。
2. 非空图片节点再生成：确认派生的新图片节点仍按提示词前 32 字命名，输入框同样不回显历史提示词。
3. 文本节点、全景图节点的输入框回显行为确认不变。

---

## Agnes 视频请求体改为官方字段

### 可测试变更

- 修复 Agnes 视频模型生成报错 `frame_rate is not an allowed request field`：请求体由 `num_frames`/`frame_rate`/`width`/`height` 像素协议改为 Agnes 官方字段——`seconds`（字符串，钳制 4–12）、`size` 档位（480p→720P、720p→720P、960p→960P、1080p/2k/4k→2K）、`aspect_ratio`（像素比例归一为 16:9 等 6 种，auto 回落 16:9）、`mode`（无参考图 `text`，有参考图 `reference` + `images` 数组）。删除不再使用的 `agnesFrameRate`/`agnesNumFrames`/`parseVideoDimensions` 辅助函数。

### 验证步骤

1. 画布或视频创作台选 Agnes 视频模型（如 agnes-video-2.5），输入提示词生成，确认不再报 frame_rate 相关 400 错误。
2. 纯文生视频确认任务创建成功并轮询出结果。
3. 挂 1 张参考图生成，确认参考图以 `images` 数组 + `mode=reference` 发送且生成成功。
4. 调整分辨率（480p/720p/960p/1080p/2k）与时长（4–12 秒外的值会被钳制）确认映射正确。

---

## 画布输入框占位符与空提示词生成

### 可测试变更

- 画布节点输入框（CanvasPromptChipInput）在拼音组词期间占位符立即消失：新增输入法组合状态，不再等待组词结束 value 更新后才隐藏；取消组词（未上屏任何文字）时占位符恢复。
- 图片/视频/音频节点连接了带内容的文本节点时，无需再输入文字即可直接点击生成：生成按钮在"有上游文本"时点亮（排除节点勾选"排除上游文本"的情况），生成时上游文本自动作为提示词；本地提示词与上游文本拼接逻辑微调，本地为空时不再产生开头空行。

### 验证步骤

1. 打开任意画布节点输入框，切换中文输入法敲拼音，确认占位符在敲第一个字母时立即消失；按 Esc 取消组词确认占位符恢复。
2. 新建文本节点输入提示词，连接到图片节点，图片节点不输入任何文字，确认生成按钮可点击且生成结果使用文本节点内容作为提示词。
3. 图片节点本地再输入文字并生成，确认本地文字与上游文本拼接正常、无多余空行。
4. 勾选节点"排除上游文本"（如该设置存在）后确认生成按钮恢复为需输入文字。

---

## 模型选择弹窗选中项高度统一

### 可测试变更

- 修复模型选择弹窗中选中项的介绍文案换行把选项撑高的问题：选中项由"自动换行布局"改为与普通项一致的固定 36px 高布局，副标题单行截断（truncate），模型名同样单行截断；选中项标题停在展开位（top-0）并常显副标题，普通项 hover 展开行为不变。

### 验证步骤

1. 打开模型选择弹窗，给选中模型配置接近 30 字的描述，确认选中项高度与其他选项一致、介绍只显示一行（超出省略号截断）。
2. 悬停未选中项确认标题上移、副标题淡入的动画正常。
3. 超长模型名的选项确认单行截断、行高不跳变。

---

## 后台管理个人中心弹窗右溢出修复

### 可测试变更

- 账户弹窗下拉位置由 `bottom`（左对齐触发按钮）改为 `bottomRight`（右对齐触发按钮）：后台管理通栏顶栏下触发按钮位于视口右上角，原左对齐会使 292px 宽的弹窗向右溢出视口约一半；右对齐后弹窗完整显示在按钮下方。

### 验证步骤

1. 后台管理任意页面点击右上角用户名，确认弹窗完整显示、右侧不被视口裁切。
2. 用户侧页面（首页等）和画布页打开账户弹窗，确认弹窗位置正常、不遮挡按钮。
3. 弹窗内各项（主题切换、算力余额、管理后台、退出登录）点击正常。

---

## 模型描述按字符数截断

### 可测试变更

- 修复后端保存设置时模型描述按字节截断导致中文被切到 10 个字的问题（[settings.go](file:///c:/Users/Administrator/Desktop/infinite-canvas/Go/service/settings.go)）：改为 `utf8.RuneCountInString` 按字符数截断，与前端 30 字上限对齐，中文描述可存满 30 字。

### 验证步骤

1. 在"模型开放与定价"页给某模型填写超过 30 字的中文描述并保存，确认保留前 30 个汉字、无乱码。
2. 填写少于 30 字的中文描述（如之前被截断的"高信息密度图像、复杂构图和细节丰富的视觉场景"），确认完整保存、完整显示。
3. 前端模型下拉副标题（悬停显示）确认描述完整。

---

## 创作 Agent 底部图片/视频 chip 浅色文字加深

### 可测试变更

- 创作 Agent 输入框底部"图片/视频"参数 chip 的文字颜色由 `node.muted` 改为 `toolbar.item`，浅色模式下更清晰（`#78716c` → `#57534e`），深色模式颜色不变。

### 验证步骤

1. 浅色主题下打开画布创作 Agent，确认底部"图片/视频"chip 文字比之前清晰。
2. 深色主题下确认 chip 文字颜色与之前一致。
3. 点击 chip 确认参数弹窗正常弹出、选择正常。

---

## 账户弹窗去重主题项并加边框

### 可测试变更

- 登录后的账户下拉弹窗（顶部用户名处）删除画布模式下重复的"画布主题"行，仅保留顶部一处"主题"（浅色/深色切换），画布内外的行为不变。
- 账户弹窗容器增加细边框（浅色 stone-200/80、深色 stone-700/60），配合原有阴影与毛玻璃背景，弹窗边界更清晰。

### 验证步骤

1. 登录后点击顶部用户名打开账户弹窗，确认只有一行"主题"，不再出现"画布主题"。
2. 在画布页面打开同一弹窗，确认同样只有一行"主题"，且浅色/深色切换生效。
3. 浅色/深色主题下确认弹窗外边框清晰可见、无错位。

---

## 拖动节点后不再出现顶部工具栏

### 可测试变更

- 画布中拖动节点（图片/视频/音频/文本等）松手后，节点顶部信息工具栏不再自动出现；拖动过程中工具栏维持隐藏。
- 工具栏仅在点击节点（选中单个节点）时出现，与底部聊天框同时弹出，行为不变。

### 验证步骤

1. 按住画布中任意节点拖动一段距离后松手，确认顶部工具栏不再出现。
2. 单击节点（不拖动），确认顶部工具栏与底部聊天框同时出现，工具栏按钮功能正常。
3. 多选节点拖动后松手，确认无工具栏残留；点击空白处取消选中后无工具栏残留。

---

## 配置弹窗默认模型选项整体加边框卡片

### 可测试变更

- 配置弹窗"平台渠道"标签页的四个选项（默认生图/视频/文本/音频模型）改为把"标签 + 模型选择器"整体包裹在一个带边框的圆角卡片内（浅色 stone-200、深色 stone-800，与弹窗内其他卡片边框一致），卡片间距由外层 grid 统一控制。
- 模型选择器按钮本身保持原有无边框样式，之前的按钮级边框已移除。

### 验证步骤

1. 打开配置弹窗切到"平台渠道"标签页，确认四个选项各自是一个完整边框卡片，标签与选择器都在边框内。
2. 浅色/深色主题下边框颜色均正常显示。
3. 点击选择器确认模型下拉弹层正常弹出与选择。

---

## 删除配置弹窗"平台渠道"说明卡片

### 可测试变更

- 配置弹窗"平台渠道"标签页顶部的说明卡片（标题"平台渠道" + 描述"平台统一提供模型能力……当前可用 N 个模型"）整块删除。
- 删除后该标签页直接从各场景默认模型选择器开始，布局与间距保持正常。

### 验证步骤

1. 打开配置弹窗，切到"平台渠道"标签页，确认顶部不再显示说明卡片，各场景模型选择器排版正常。

---

## 画布顶栏返回主页按钮直显

### 可测试变更

- 画布顶栏左侧在"侧栏切换"与"画布菜单"之间新增直接显示的"返回主页"图标按钮（Home 图标，极简扁平风格），不再需要打开下拉菜单才能返回主页。
- 下拉菜单中的"主页"项移除，其余菜单项（我的画布、新建画布、删除当前画布、导入素材、撤销、重做）不变。

### 验证步骤

1. 进入任意画布，确认顶栏左侧可见返回主页图标按钮，点击后跳转主页。
2. 打开画布菜单，确认菜单中不再有"主页"项，其余项功能正常。

---

## 删除视频/文本节点悬浮工具栏的"AI生成"按钮

### 可测试变更

- 节点悬浮工具栏的"AI生成"按钮（`onToggleDialog`）仅对图片节点保留；视频节点与文本节点不再显示该按钮。
- 文本节点工具栏其余按钮（存素材、编辑文字、生图、字号缩放）与视频节点工具栏其余按钮（存素材、上传至云存储、下载、上传/替换视频）保持不变；配置节点的"生成配置"按钮不受影响。

### 验证步骤

1. 悬停画布中的视频节点，确认工具栏不再出现"AI生成"，其余按钮齐全。
2. 悬停文本节点，确认不再出现"AI生成"，编辑文字/生图等按钮正常。
3. 悬停图片节点，确认"AI生成"按钮仍存在且可正常打开助手对话。

---

## 创作Agent发送按钮内展示算力点消耗

### 可测试变更

- 创作Agent输入框（画布助手面板与主页悬浮输入框共用组件）的算力点消耗从发送按钮左侧的独立灰色文字移入发送按钮内部，展示结构与画布节点发送按钮一致（⚡数字 + 箭头图标，运行中为停止图标）。
- 原按钮外仅云端渠道（remote）显示的算力点 span 删除；现在按钮内始终显示，本地直连渠道与节点按钮一致显示 ⚡0。
- 发送按钮原 ⚡ 图标由算力点符号（CreditSymbol）替代，删除随之无用的 Zap 图标导入。

### 验证步骤

1. 打开画布助手面板和主页创作Agent输入框，确认发送按钮内显示 ⚡数字，样式与图片/视频节点发送按钮一致。
2. 切换云端渠道并更换不同定价的模型，确认按钮内数字跟随变化；本地直连渠道显示 ⚡0。
3. 输入内容发送，运行中按钮切换为停止图标且算力点数字保留；清空输入后按钮禁用。

---

## 画布视频节点首尾帧输入交互

### 可测试变更

- 视频节点新建后默认使用“全能参考”能力。
- 视频设置弹窗改为“全能参考 / 首帧或首尾帧”分段选择，不再在弹窗内展示首尾帧资源选择器。
- 选择首尾帧能力后，输入框左侧按模型能力显示独立的首帧、尾帧上传槽位；每个槽位支持本地上传、选择已连接图片节点及移除。
- 首尾帧槽位复用普通上传堆叠卡片样式，悬停时恢复放大与阴影查看动效；图片底部显示文件名，悬停时另显示“首帧/尾帧”提示气泡。
- 切换首尾帧模式时，已连接图片按连线顺序自动分配到首帧和尾帧；进入模式后新增图片连接会继续填充空槽位，不会把同一张图片重复分配到两个槽位，可通过两帧之间的左右切换按钮交换顺序。
- 移除首帧或尾帧时，会清除该槽位并同步断开对应图片连线；其余图片连接不会被重新自动填入已移除的槽位。
- 仅连接一张图片时，首尾帧中间显示“同图”按钮，可将同一图片节点同时设置为首帧和尾帧；连接两张及以上图片时隐藏该按钮，避免与自动分配产生歧义。
- 首尾帧操作按钮上下排列，采用统一尺寸与主题色，透明、无边框、无阴影样式；上传框和图片保持原有矩形样式，仅通过固定倾斜角度形成上宽下窄的不规则排列，并预留按钮间距避免遮挡图片，浅色/深色模式均自动适配。
- 同一图片被两帧引用时，移除其中一个槽位不会误断开另一槽位仍在使用的图片。
- 已连接图片作为首尾帧引用时点击只查看，不会再次打开上传框；本地上传到槽位的图片仍可点击替换。
- 首尾帧引用会写入节点元数据并参与视频生成请求，普通参考图不会重复携带已选中的首尾帧。

### 验证步骤

1. 新建视频节点，确认能力按钮显示“全能参考”。
2. 选择支持首尾帧的模型，在设置弹窗切换到“首尾帧”，确认输入框出现首帧/尾帧两个上传框，弹窗内不再出现资源下拉选择。
3. 分别上传或选择已连接图片，确认槽位预览、替换和移除正常，生成请求携带对应首帧与尾帧。
4. 切换到仅支持首帧或不支持首尾帧的模型，确认只显示受支持的槽位或自动隐藏首尾帧输入区。

---

## 删除视频模型能力：负面提示词、智能时长、元素列表

### 可测试变更

- 后端 `Go/model/setting.go`：`ModelCapability` 删除 `SupportsNegativePrompt` / `SupportsElementList` / `VideoSecondsSmart` 三个字段
- 后端 `Go/handler/apimart_video.go`：删除 `normalizeAPIMartKlingV3ElementList` 及元素列表请求体组装逻辑
- 前端 `use-config-store.ts`：删除 `videoNegativePrompt` / `videoElementList` 状态与 `resolveSupportsNegativePrompt` / `resolveVideoSecondsSmart` / `resolveSupportsElementList` resolver，删除 `VideoElementReference` / `VideoElementItem` 类型
- 管理后台「模型开放与定价」能力开关复选框删除「负面提示词」「元素列表」「智能时长(-1)」三项
- 视频工作台 `/video`：`VideoSettingsPanel` 与 Kling 工作台面板删除负面提示词输入框、元素列表区块
- 画布视频节点：`canvas-video-settings-popover.tsx` 删除 `KlingElementListSection` / `MultiResourcePicker`；`canvas-node-generation.ts` 删除元素列表上下文构建（`inputToElementReference` 等）；`canvas-client-page.tsx` 节点元数据不再写 `negativePrompt` / `klingElementList`；`types.ts` 删除对应元数据字段
- `services/api/video.ts`：请求体不再组装 `negative_prompt` / `element_list`
- 保留：水印、多镜头、运动控制、音频生成能力开关；Seedance 面板 `-1` 智能时长选项（固定行为，不再配置化）
- 文档同步：`backend-database.md` / `video-exclusive-panels-params.md` 删除对应字段说明

### 验证步骤

1. 管理后台「模型开放与定价」视频模型能力开关区：确认只剩首尾帧/首帧/运动控制/音频生成/水印/多镜头等，无「负面提示词」「元素列表」「智能时长」
2. 视频工作台选 Kling V3 模型：工作台与底部栏无负面提示词输入框、无元素列表区块；多镜头分镜功能正常
3. 视频工作台选 Seedance 模型：秒数仍保留 `-1` 智能选项
4. 画布视频节点设置弹窗：无元素列表区块；多镜头/运动控制/首尾帧按能力开关正常显示
5. 用 Kling V3 生成视频：AI 日志中上游请求体不再包含 `negative_prompt` / `element_list`
6. 画布已有旧项目（含 `klingElementList` 元数据）：正常打开，生成请求不再读取元素列表

## 生图渠道适配层全配置化（删除按模型硬编码）

### 可测试变更

- `Go/model/setting.go`：`ModelCapability` 新增 `imageAdapter`（`ImageAdapterConfig`：比例字段名、分辨率参数与大小写、min/max 分辨率、数量 n、quality、output_format、参考图支持/字段名/上限、必须参考图）。未配置 = 走通用默认（OpenAI images 标准协议：size=比例、resolution 大写、支持 n、无 quality/output_format、参考图字段 image_urls）
- `Go/service/image_adapter.go`（新增）：`ImageAdapterFor` 按模型名读取适配配置；`SeedImageAdapterConfigs` 启动时一次性把旧版 `apimartImageConfig` 按模型名硬编码规则翻译成 `imageAdapter` 配置写入后台——只填充尚无配置的模型，已有配置一律不动，保证存量模型行为不变；幂等，重复启动不再写入
- `Go/handler/apimart_image.go`：删除按模型名硬编码的 switch 与 `apimartImageReferenceExcluded`，归一化配置改为「后台 `imageAdapter` 优先 + 通用默认兜底」；不支持参考图的模型统一走 `clearAPIMartImageReferenceFields` 清理；`validateAPIMartImageRequiredInputs` 改由 `requireRefs` 配置驱动。视频侧按模型 switch 本轮不动（`imageRefKind` 是行为枚举，无法纯配置化，另行安排）
- `Go/main.go`：启动时调用 `service.SeedImageAdapterConfigs()`
- 管理后台「开放与定价」页图片模型能力卡片新增「渠道适配参数（高级）」表单：比例字段名、分辨率参数、分辨率大小写、分辨率上/下限、数量 n、quality、output_format、参考图支持、参考图字段名、参考图上限、必须参考图；布尔项三态（默认/支持/不支持），全部留空 = 移除 `imageAdapter` 走通用默认
- `next/src/services/api/admin.ts`：新增 `AdminImageAdapterConfig` 类型，`AdminModelCapability` 加 `imageAdapter` 字段；`settings-shared.ts` 的 `normalizeModelCapabilities` 透传 `imageAdapter`

### 验证步骤

1. 渠道中存在 gpt-image-1 / seedream / grok-imagine 等模型时重启后端：启动日志出现 `seed image adapter config: <model>`，后台「开放与定价」对应模型自动带上与旧硬编码规则一致的适配参数
2. 再次重启：不再出现 seed 日志（幂等）
3. 用已 seed 的模型生成图片：请求行为与改造前一致（对比 AI 日志中的上游请求体：gpt-image-1 无 resolution 有 quality；seedream-5 分辨率最小 2K；imagen/z-image 参考图字段被清理）
4. 后台把某模型「分辨率参数」改为「不支持」并保存：该模型生图请求体不再携带 resolution
5. 后台清空某模型全部适配参数并保存：该模型 `imageAdapter` 字段消失，请求走 OpenAI 标准协议归一化
6. 新接入一个未配置适配参数的模型：生图请求直接按通用默认协议归一化，代码无需改动

## 画布创作 Agent 支持指定模型 + 修复"指定模型渠道不可用"

### 可测试变更

- `next/src/app/(user)/canvas/types.ts`：`CanvasAgentConfig` 新增可选字段 `textModel`/`textChannelId`（随画布项目持久化）
- `next/src/app/(user)/canvas/components/canvas-assistant-composer.tsx`：输入框底部操作行新增 `ModelPicker`（capability="text"），模型选项来自后台配置的渠道与模型；主页输入框和画布助手面板均显示
- `next/src/app/(user)/page.tsx`：主页输入框传入 `config`，选择的模型随 `agentConfig` 传入新建画布
- `next/src/app/(user)/canvas/components/canvas-assistant-panel.tsx`：Agent 发送请求时优先使用画布级 `agentConfig.textModel`/`textChannelId`，未选择时回退全局默认文本模型
- `next/src/stores/use-config-store.ts`：修复 `channelIdForActiveModel`——远程模式下校验渠道确实包含当前模型，不包含时回退到包含该模型的渠道（都没有则不发渠道头，由后端按权重选择），解决后台改渠道后旧渠道 ID 残留导致的"指定模型渠道不可用"
- 计费不变：Agent 文本请求按后台配置的模型价格扣算力点
- `canvas-assistant-composer.tsx`：发送按钮左侧显示当前模型单次对话的算力点价格（远程模式，本地直连不显示）
- `model-picker.tsx`：模型下拉弹层自动判断下方空间，不足 300px 时改为向上弹出，解决输入框位于页面底部时选不到模型的问题
- 画布"添加节点"弹窗、"引用该节点生成"弹窗与 @引用节点弹窗精简：删除各选项下方的提示小字（"脚本、广告词、品牌文案"等 description、引用菜单里的节点内容预览行），只保留图标 + 标题/节点名（`canvas-client-page.tsx` 两处弹窗、`canvas-prompt-chip-input.tsx`、`canvas-resource-mention-textarea.tsx`）
- 修复创作 Agent 对话内容无法选中复制的问题（两层原因）：① 画布容器的 `select-none` 阻止文本选择——Agent 面板根节点加 `select-text`/`userSelect: text` 恢复；② 画布全局 keydown 把 Ctrl+C 拦截为"复制选中节点"并 preventDefault，选中文字后复制进剪贴板的是节点数据——keydown 增加 `window.getSelection()` 非空时放行 c/x/a 快捷键的豁免逻辑（`canvas-client-page.tsx`），画布原有快捷键行为不变
- `canvas-assistant-composer.tsx`：修复参数栏弹窗（比例/清晰度 chip）两个问题——① 点击选项无效：弹窗 portal 挂在 body 上但"外部点击关闭"未把弹窗内部排除，pointerdown 先关闭弹窗导致选项 onClick 丢失，现已用 popoverRef 纳入判断；② 选项挤压：9 个图片比例选项挤一行，现改为每行 4 个自动换行
- `canvas-assistant-composer.tsx`：参数栏从 4 个 chip 合并为 2 个分组 chip——"图片 {比例} · {质量}"和"视频 {比例} · {清晰度}"，各弹一个分组弹窗（图片弹窗含比例+质量两组，视频弹窗含比例+清晰度两组），chip 文案实时反映当前选择；图片质量（标准/2K/4K）档位补齐暴露；弹窗内选完不自动关闭，可连续调整多组参数，点击外部关闭；修复 4 chip 挤出发送按钮的问题
- `canvas-assistant-composer.tsx`：图片比例选项值从像素格式（1920x1080）改为项目标准的比例格式（16:9），与 image-settings-panel 的 aspectOptions 一致——此前 chip 显示"1920X1080"而非"16:9"，且像素值无法被生成请求层的比例折算逻辑解析；视频比例保持像素格式（视频模块的项目标准即像素值，label 正确折算显示）；图片弹窗中"智能比例"文案改为"智能"并移到选项列表末尾；弹窗选项去掉 flex-1，每行固定 4 格从左至右排列，不满一行时不再拉伸平分导致"单独一个居中"；输入框底部操作行加 flex-wrap，窄面板（默认 390px）下图片/视频 chip 自动换行到第二行，发送按钮不再被挤出面板；模型选择器从输入框操作行移到面板顶部标题栏（"创作 Agent"文字旁），历史记录视图不显示；主页输入框（showOptions=false）的模型选择器保留在原位

### 验证步骤

1. 主页输入框左下角出现模型选择器，默认显示全局文本模型；点开可选后台配置的所有文本模型
2. 画布助手面板输入框同样出现模型选择器，选择后随画布保存，重新打开画布仍保留
3. 选择指定模型后发送消息，Agent 使用该模型回复（可从回复风格或后端 AI 日志确认）
4. 后台调整渠道/模型后，不重新选择模型直接发消息，不再出现"指定模型渠道不可用"
5. 生图/生视频/生音频仍走各自场景的默认模型与渠道，不受文本模型选择影响
6. 发送按钮左侧显示 ⚡ 价格数字，切换模型后价格跟随变化；本地直连模式不显示
7. 画布助手面板触底时点开模型下拉，弹层向上弹出且完整可见可选
8. 参数栏只有"图片"/"视频"两个 chip，发送按钮、价格均完整可见不被挤出
9. 图片 chip 弹窗含"比例 + 质量"两组、视频 chip 弹窗含"比例 + 清晰度"两组；选选项后 chip 文案立即更新；弹窗不自动关闭可连续调整；点击外部关闭
10. 图片质量选"4K"后让 Agent 生成图片，生成图片为高清档；视频清晰度选 1080p 生成的视频为 1080p

## 功能模块可见性开关（生图工作台 / 视频创作台 / 工作流）

### 可测试变更

- 后端 `Go/model/setting.go`：`PublicSetting` 新增 `modules` 配置组（`PublicModuleSetting`：`imageWorkbench`/`videoWorkbench`/`workflows` 三个 `*bool`）；`Go/service/settings.go`：normalize 时 nil 默认开启，无需数据迁移
- 前端 `next/src/services/api/admin.ts`：`AdminPublicSettings` 补 `modules` 类型；`settings-shared.ts`：默认值、归一化、`syncPublicSettingsFromSaved` 同步 `modules`
- 管理后台「偏好设置」新增「功能模块」卡片，三个开关；保存后通过 `syncPublicSettingsFromSaved` 即时同步全局 `publicSettings`（当前浏览器无需刷新生效）
- 导航过滤：`navigation-tools.ts` 新增 `navigationModuleKeys` 映射和 `filterNavigationTools` 过滤函数；`app-top-nav.tsx`（桌面端）和 `mobile-nav-drawer.tsx`（移动端抽屉）按开关隐藏对应 tab；`publicSettings` 未加载完成时暂不过滤
- 页面守卫：新增 `next/src/hooks/use-module-guard.ts`，`/image`、`/video`、`/workflows` 三个页面接入；模块关闭时 `router.replace("/")` 重定向回首页（所有用户包括管理员），加载期间渲染 `null` 防止内容闪现

### 验证步骤

1. 重启后端后 `GET /api/settings` 返回 `modules` 三项均为 `true`
2. 管理后台「偏好设置 → 功能模块」三个开关默认开启，保存后刷新确认持久化
3. 关闭「生图工作台」并保存：普通用户（或未登录）和管理员顶部导航、移动端抽屉均不再显示"生图工作台"，直接访问 `/image` 都被重定向回首页
4. 同样验证「视频创作台」（`/video`）和「工作流」（`/workflows`）
5. 管理后台保存开关后不刷新页面，导航 tab 即时消失（需 `publicSettings` 已加载）
6. 重新打开开关后导航 tab 恢复、页面可正常访问
7. 「我的画布」「提示词库」「我的素材」等其他导航项不受影响；管理后台页面不受开关影响，可随时改回

## 修复管理后台保存设置后模型选择器显示"暂无可用模型"的问题

### 可测试变更

- 后端 `Go/service/settings.go` 的 `SaveSettings`：持久化前重算 `public.modelChannel.channels = publicChannelInfos(private.channels)`，与 `PublicSettings()` 动态返回保持一致
- 根因：存储快照里的 `channels` 一直是渠道页首次保存时的空数组；`PublicSettings()` 每次动态重算所以用户端正常，但偏好设置页保存后 `syncPublicSettingsFromSaved` 把保存响应里的空 `channels` 同步进全局 `publicSettings`，模型选择器立即变空，刷新后恢复
- 影响范围：管理后台任一设置页（偏好设置、定价、渠道等）保存后模型选择器不再丢失模型列表

### 验证步骤

1. 在管理后台「偏好设置」点保存，确认模型选择器仍正常显示模型列表（不出现"暂无可用模型"）
2. 「渠道管理」页新增/编辑渠道并保存后，同样确认模型选择器正常
3. 刷新页面后模型列表保持正常

## 修复素材图片拖入画布后输入框误显示图片芯片的问题

### 可测试变更

- `types.ts`：`CanvasAssistantImage` 新增可选 `title` 字段
- `canvas-client-page.tsx`：`insertAssistantImage` 节点标题优先取 `image.title`；`insertAssetAt` 图片分支改为传 `prompt: ""` + `title: payload.title`（素材插入不再预填标题到输入框）
- 根因：素材拖入时把素材标题预填为图片节点 `metadata.prompt`，输入框自动弹出且正文=标题；无上游连线的图片节点会把自身作为 @ 引用资源（标签=节点标题），芯片输入框的正则把正文里命中的引用标签渲染为图片芯片——预填标题完全命中自身标签，整段标题变成一张图片芯片
- 节点标题仍显示素材名（不变）；与视频/音频节点插入行为一致（均不预填 prompt）

### 验证步骤

1. 从侧栏"我的素材"拖一张图片素材到画布，确认节点标题为素材名、节点下方输入框为空（无预填文本、无图片芯片）
2. 素材选择器（AssetPickerModal）插入图片素材，同样确认输入框为空
3. 图片节点手动 @ 引用、输入框输入标题文本等原有芯片功能不受影响
4. 画布图片生成/上传路径的节点标题显示正常

## 修复画布图片加入"我的素材"后拖回画布变成空图片节点的问题

### 可测试变更

- `canvas-client-page.tsx` 的 `insertAssetAt`：图片分支插入前先 `resolveImageUrl(payload.storageKey, payload.dataUrl)` 解析真实地址，`insertAssetAt` 改为 async（4 处调用点均已 void/await 兼容）
- 根因：画布图片节点保存到"我的素材"时，带 `storageKey` 的图片 `dataUrl` 存为空字符串（依赖下次刷新时解析），同一会话内拖回画布时 `metadata.content` 为空 → 显示"空图片节点"；侧栏卡片缩略图用 `coverUrl`（有值）所以显示正常
- 覆盖路径：侧栏拖拽插入、素材选择器插入、Agent 请求插入全部修复

### 验证步骤

1. 画布中生成或上传一张图片（走服务器/S3 存储的），右键/悬停工具栏"加入我的素材"
2. 不刷新页面，从左侧"我的素材"把该图片拖回画布，确认显示正常图片节点而非"空图片节点"
3. 刷新页面后再次拖入，确认仍正常
4. 同样测试生图工作台保存的图片素材拖入画布

## 画布侧栏"我的素材 / 素材库"卡片改为单列横向布局

### 可测试变更

- `canvas-side-panel.tsx` 的 `DraggableAssetCard`：由两列正方形小卡改为单列横向卡片——左侧 56px 圆角缩略图（图片/视频封面、文本封面，无封面时按类型显示文档/音符图标），右侧标题（单行截断）+ 内容摘要（两行截断，图片/视频/音频显示类型占位文案）
- "我的素材"和"素材库"两个标签页的卡片列表容器从 `grid grid-cols-2` 改为 `flex flex-col`，卡片占满侧栏宽度
- 拖拽入画布的交互不变；颜色取自 `canvasThemes`（node.stroke/panel、toolbar.panel），浅色/深色主题均适配

### 验证步骤

1. 打开画布左侧面板"我的素材"，确认卡片为单列横向布局，标题与摘要完整可读
2. 切换浅色/深色主题，确认卡片边框、背景、文字颜色正常
3. 拖拽文本/图片/视频素材到画布，确认仍能正常生成对应节点
4. 切到"素材库"标签页，确认同样为横向卡片且分页正常

## 修复登录后"加入我的素材"失效及素材被清空的问题

### 可测试变更

- `use-asset-store.ts` 的 `hydrateAccountAssets`：同步可用时从"云端数据直接覆盖本地"改为 `mergeAssets` 合并（按 id 去重、updatedAt 取较新）；合并结果比云端多时（本地有云端没有的素材）自动回推云端
- `canvas-side-panel.tsx` 的 `CanvasPromptsTab`：提示词详情弹窗补传 `onSaveAsset`，画布侧栏提示词库详情里的"加入我的素材"按钮生效（此前未传回调，点击无反应）；保存逻辑与提示词中心页一致
- 根因：后端 `userData` 同步能力恒为 true，登录后每次页面加载 hydrate 都会用云端旧数据整体覆盖本地——登录前本地保存的素材被清空；页面加载期间（hydrate 返回前）点击"加入我的素材"新增的素材也会被随后返回的云端数据覆盖丢失
- 素材清单存储链路说明：元数据存 PostgreSQL `user_configs` 表 `assetData` 字段（TEXT，整包 JSON），媒体文件存 S3/MinIO，文本素材仅存数据库

### 验证步骤

1. 登录状态下打开提示词库，点击"加入我的素材"，确认右上角弹出成功提示
2. 立即跳转"我的素材"页面，确认新素材已存在；刷新页面后素材仍在（不再被云端旧数据覆盖）
3. 未登录时加入的素材，登录后打开"我的素材"确认仍在，且约 1 秒后同步到云端（数据库 `user_configs.assetData` 可查到）
4. 多设备/多标签页场景：A 设备新增素材，B 设备刷新页面后能拉到合并结果，双方素材都不丢失
5. 画布左侧面板"提示词库"中打开任意提示词详情，点击"加入我的素材"，确认弹出成功提示且素材页可见

## 全景图节点新增分辨率档位设置

### 可测试变更

- `image-settings-panel.tsx`：新增 `panorama` 模式，仅显示"分辨率"档位（标准 / 2K / 4K，按模型能力 imageTiers 过滤），选中写入 `quality`（标准=low / 2K=medium / 4K=high）；隐藏"选择比例"；`onConfigChange` 的 key 类型扩展支持 `quality`；导出 `panoramaTierOfQuality`、`imageQualityTierLabel`
- `canvas-image-settings-popover.tsx`：新增并透传 `panorama` 属性，全景图节点设置按钮显示当前档位（auto 显示 2K，与生成时 auto 折算 medium 一致）
- `canvas-node-prompt-panel.tsx`：全景图节点启用 `panorama` 设置模式（`showSize={!isPanorama}` 保持不变）
- 生成链路无改动：比例仍固定 2:1（`PANORAMA_IMAGE_SIZE`），quality 沿用节点 metadata → 全局 → 默认，auto 折算 medium；档位实际请求约 1440x720 / 2912x1456 / 4064x2032
- 测试通过后需更新 `docs/overview/features.md` 全景图章节（现有"固定请求 2048x1024；生成设置仅显示质量和生成张数"描述与实际不符）

### 验证步骤

1. 画布新建全景图节点，节点下方设置按钮显示"2K"（默认 auto 折算）
2. 点开设置面板：仅显示"分辨率"档位（标准 / 2K / 4K），无"选择比例"和生成数量；档位按所选模型能力过滤
3. 切换档位后按钮标签同步变化，刷新画布后仍保留（写入节点 metadata）
4. 各档位生成后确认实际分辨率：标准≈1440x720、2K≈2912x1456、4K≈4064x2032
5. 普通图片节点、生图工作台、工作流等入口的图像设置面板不受影响

## 提示词模块改造：废弃 GitHub 同步 + 三分类 + 批量导入

### 可测试变更

- 后端删除 GitHub 同步链路：`prompt_fetch.go`、`prompt_sync_scheduler.go`、`main.go` 中的调度启动、`/api/admin/prompt-sources` 全部接口及 `PromptSource` 模型；`Prompt.source` 保留为普通来源标签
- `Prompt` 模型新增 `category` 字段（`image` / `video` / `cinematic`，带索引），保存/导入时校验分类合法性；启动迁移自动把存量提示词填充为 `image` 并删除废弃的 `prompt_sources` 表
- 后端新增 `POST /api/admin/prompts/import` 批量导入接口：JSON 描述文件 + 媒体文件，媒体文件名与 `coverUrl` 一致时自动上传替换为存储地址
- 前端提示词中心页（`prompts/page.tsx`）：顶部改为图片 / 视频 / 电影级三分类 Tab，标签作二级筛选，删除来源筛选
- 提示词选择弹窗（`prompt-select-dialog.tsx`）：来源筛选改为三分类 Tab，支持 `defaultCategory` 指定初始分类
- 画布侧栏提示词库（`canvas-side-panel.tsx`）：按来源分组改为按三分类分组，默认展开图片分类，搜索时全部分组展开
- 管理后台提示词管理页：筛选/表格列/新增编辑表单的"来源"改为"分类"；"批量导入"支持拖入或选择文件夹（提示词 .json/.txt 与同名图片/视频自动配对，文件夹名含 image/video/电影 自动分类，默认分类可手动指定），按条数和媒体体积自动分批上传并显示进度；删除"提示词来源"菜单项与页面、`admin-prompt-sources.ts` API 文件
- 文档：`backend-database.md` 更新 prompts 表结构与表清单（删除 `prompt_categories`/`promptSync` 描述）；`features.md` 更新提示词库功能说明；删除 `third-party-prompt-repositories.md`

### 验证步骤

1. 启动后端，确认存量提示词自动归入"图片"分类，`prompt_sources` 表被删除
2. 前台提示词中心页顶部出现图片 / 视频 / 电影级三个 Tab，切换后列表按分类过滤，标签筛选正常
3. 画布侧栏"提示词库"按三分类分组展示，默认展开图片分类；输入关键词时全部分组展开并本地过滤
4. 节点输入框打开提示词选择弹窗，分类 Tab 可切换，选择后正常插入
5. 管理后台菜单无"提示词来源"入口；提示词管理页按分类/标签筛选正常
6. 管理后台新增提示词时选择分类保存成功；选择非法分类（接口直调）返回错误提示
7. 管理后台"批量导入"：把含若干 .json/.txt 提示词和同名图片的文件夹（如 image/、video/）拖入弹窗，确认识别条数与配对提示正确；导入后列表新增对应条目，封面为上传后的存储地址，image/ 文件夹归图片分类、video/ 归视频分类；几百个文件时自动分批上传，进度正常显示、中途失败时提示已成功条数
8. 确认后台不再有任何提示词定时同步日志输出

## 修复 antd reset.css 压制 Tailwind 文字颜色导致的按钮主题异常

### 可测试变更

- `layout.tsx` 删除 `import "antd/dist/reset.css"`；`globals.css` 改为 `@import "antd/dist/reset.css" layer(base)`
- 根因：reset.css 是无 layer 的裸 CSS，其中 `input, button, select... { color: inherit }` 按 CSS 规范优先级高于所有 `@layer`，压制了 Tailwind utilities 中的 `text-white` / `dark:text-stone-900` 等文字颜色类，导致深色模式下选中态按钮出现"白底白字"
- 该修复影响全站所有原生 button 上的 Tailwind 颜色类，不止提示词分类按钮

### 验证步骤

1. 提示词中心页（`/prompts`）深色模式下，"图片/视频/电影级"分类按钮选中态为浅底深字、未选中态为深灰底浅字，无白底白字
2. 浅色模式下选中态为黑底白字，对比正常
3. 抽查其他页面（画布、我的素材、管理后台）的原生按钮文字颜色与背景有明显区分，两种主题下均正常

## 选中节点的连线改为流动虚线动效

### 可测试变更

- `canvas-connections.tsx`：active 连线（选中/悬停单个节点时的相连线 + 被选中的连线）从「实心蓝线 3px + 稀疏电流点（2,18）」改为「淡蓝基线（35% 透明度）+ 流动虚线 overlay」：
  - 虚线规格 `strokeDasharray="6,14"`（疏朗不密集）、圆角端点、1.2s 线性流动
  - 复用现有 `canvas-connection-flow` keyframes（dashoffset -20 与 6+14 周期 20 对齐，无缝循环）
  - 光晕降为 6px/40% 透明度，整体更轻
- `canvas-connections.tsx` 的 `ActiveConnectionPath`（从节点拖拽连线出去的预览线）：同步为同款规格——`strokeDasharray` 5,5→6,14、线宽 3→2.5、动画 0.6s→1.2s、光晕与已建成连线一致
- `globals.css`：删除不再使用的 `canvas-connection-electric` keyframes（与 flow 重复）

### 验证步骤

1. 单击选中一个有连线的节点，确认相连线变为流动虚线（疏朗、不密集），淡蓝基线 + 蓝色虚线向目标方向流动
2. 悬停节点时同样触发；多选节点时不触发（与原有行为一致）
3. 单击选中连线本身，同样有流动虚线效果
4. 从节点拖拽连线出去时，预览线与选中态的流动虚线规格一致（6,14 疏朗虚线、同样流速和光晕）
5. 深色/浅色主题下虚线和光晕都清晰可辨

## 连线拖拽更新稳定性

### 可测试变更

- 连线拖拽期间全局鼠标/指针监听只注册一次，并通过 ref 使用最新处理函数。
- 连线目标未发生变化时不重复写入状态，避免连续鼠标移动触发 React 更新深度错误。

### 验证步骤

1. 从任意节点拖拽连线到另一个节点，持续移动鼠标，确认控制台不再出现“Maximum update depth exceeded”。
2. 连线预览、目标吸附和松开后的正式连线行为保持正常。

## 图片节点默认智能比例、模型下拉项加大、上传框 60×90

### 可测试变更

- 新增图片节点默认智能比例：`canvas-client-page.tsx` 的 `createNode` 和 `createConnectedNode`（连线拖出新建）创建图片节点时写入 `metadata.size: "auto"`，不再跟随全局默认尺寸
- 模型下拉项加大（`model-picker.tsx` 的 `ModelLabel`）：图标 25px→30px，主标题 15px→16px（leading 18px），副标题 9px→12px（leading 14px），无 gap，选项内容高 34px（两行行盒 18+14=32，底部留 2px）；行高略大于字号避免 g/p/y 等下伸字母被 overflow-hidden 纵向截断；悬停上移动画偏移 8px（(34-18)/2，保持主标题默认垂直居中）；下拉弹层宽度 280→320，避免长模型名被横向截断成省略号
- 上传框比例 50×90 → 60×90（`canvas-node-image-upload.tsx` 的 BOX_WIDTH/BOX_HEIGHT，展开宽度 (n+1)×60）；输入框文字起点 100→80（普通面板 `paddingLeft: 80` + `placeholderIndent: 68`，配置面板 `paddingLeft/left: 80`）

### 验证步骤

1. 新建图片节点（菜单/双击/连线拖出），打开输入框确认参数按钮默认显示「智能比例」
2. 打开任意节点的模型下拉，确认每个选项内容高 34px（图标 30px、主标题 16px、副标题 12px），长模型名（如 gemini-3.1-flash-image-preview）完整显示不截断，含 g/p/y 的模型名（如 agnes、gpt-image）下伸字母不被纵向裁切，悬停时主标题上移 + 副标题淡入动画正常
3. 确认上传框为 60×90，多图展开每张 60px 宽；输入框提示文字和正文从 80px 位置开始，不穿过上传框

## 图片比例 auto 文案与图片信息默认开启

### 可测试变更

- `next/src/components/image-settings-panel.tsx`：`imageSizeLabel("auto")` 返回「智能比例」（原样返回 "auto"），图片节点底部助手栏参数按钮、画布助手配置 chip 等所有 `imageSizeLabel` 消费处统一生效；设置面板选项内部原本就显示「智能」，不变
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：图片信息（showImageInfo）默认改为打开——初始 state `true`，项目恢复时 `project.showImageInfo ?? true`（老项目存过 false 的尊重原设置，未存过的默认开）

### 验证步骤

1. 图片节点底部助手栏参数按钮在比例为 auto 时显示「智能比例」，不再是 "auto"
2. 画布助手输入条的图片比例 chip 同步显示「智能比例」
3. 新建画布项目，不点任何设置，确认图片节点的信息（尺寸/体积等）默认显示
4. 手动关闭图片信息后刷新，确认保持关闭（用户选择被持久化）
5. 老项目（之前关过图片信息的）打开后仍保持关闭

## 节点输入框图片上传组件

在文本/图片/全景图/视频/配置节点的输入框面板左上角新增图片上传交互组件（音频节点除外），上传后在目标节点左侧创建图片节点并自动连线作为参考图。组件同时展示连线进来的上游资源：所有连线的图片和文本节点都在堆叠区展示（@ 引用芯片功能保持不变）。

### 可测试变更

- 新增 `next/src/app/(user)/canvas/components/canvas-node-image-upload.tsx`：
  - 基础尺寸 50×90，整体 `rotate(-6deg)` 歪斜，通过 `left` + `opacity` 过渡（200ms）控制展开折叠
  - 组件定位在输入框面板内部左上角（普通节点面板 left:14/top:10，配置节点面板 left:14/top:50 避开标题栏），不溢出面板；`offset` prop 可调整
  - 空状态：实线边框上传框 + 居中「+」，悬停时 `scale(1.1)` 并填充 `toolbar.activeBg`，移出恢复透明
  - 单张图片：50×90 缩略图（object-cover 不溢出），图片右下角有圆形「+」小按钮；悬停时宽度 50→100，图片保持 left:0，右侧 left:50 淡入同款上传框
  - 多张图片：默认不规则叠加（净角度左右交替 +5/-8/+7/-6…，已补偿整体 -6deg 歪斜避免全部倒向一边）；悬停时每张图依次排开（left = index×50）且保持左右交替倾斜，最右侧上传框从最后一张图的位置滑出并淡入，总宽度 (n+1)×50；移出恢复叠加
  - 展开时整体旋转从 -6deg 平滑过渡到 0deg（每行保持水平，图片再多也不会向右翘起溢出输入框），每张图净朝向不变、过渡连续
  - 展开后单图悬停：该图回正并 scale(1.15) 放大 + 投影 + 置顶（弹性缓动 cubic-bezier(0.34,1.56,0.64,1)），图片右上角显示圆形 X 删除按钮，移走恢复；点 X 直接删除对应图片节点（复用 deleteNodes，连线/存储同步清理）
  - 上传框悬停反馈（空态和展开态一致）：scale(1.1) + 填充 `toolbar.activeBg` + 边框/图标高亮，移出恢复
  - 颜色全部走 `canvasThemes` token，适配浅色/深色主题
- 输入区域固定避让：有上传框时编辑器本体加 `paddingLeft: 100`（`px-3` 被内联样式覆盖），提示文字同步从 100px 位置开始（`canvas-prompt-chip-input.tsx` 新增 `placeholderIndent` prop，普通面板传 88，配置面板直接设 left:100），输入正文和提示文字都不再穿过上传框区域
- 融合连线资源展示（`canvas-client-page.tsx` 的 `stackItemsByNodeId`）：
  - 堆叠数据源改为 `buildNodeMentionReferences` 的全部上游图片 + 文本引用（含经配置节点间接引用、手动连线的图片），不再仅限本组件上传的图片
  - 文本引用显示为 50×90 文本卡片（FileText 图标 + 节点名）；图片卡片底部显示节点名小标签，与提示词中的 @ 标签对应
  - X 删除分两类：本组件上传的图（有 `inputUploadFor` 标记）删除整个图片节点；手动连线的图/文本只移除连线
  - X 移除引用时同步清理提示词中的悬空 @ 标签（`handleRemoveStackItem`）：普通/全景节点按标签文本剥离（正则转义 + `(?!\d)` 防误伤"图片10"，多余空格折叠），配置节点剥离 `@[node:id]` token；不会再出现芯片退化成纯文本标签的悬空引用
  - @ 引用芯片功能完全保留（输入框内芯片、图片预览、@ 菜单均不变），堆叠区是额外的展示入口
- `next/src/app/(user)/canvas/types.ts`：`CanvasNodeMetadata` 新增 `inputUploadFor` 字段，标记由该组件上传的图片节点归属于哪个目标节点
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：
  - 新增 `uploadNodeInputImage`：上传图片 → 在目标节点左侧 80px 处创建图片节点（打标 `inputUploadFor`）→ 自动连线到目标节点（不抢选中、不关输入框面板）
  - 新增 `stackItemsByNodeId`：按上游引用收集每个节点的堆叠图片/文本
- `canvas-node-prompt-panel.tsx` / `canvas-config-composer.tsx`：面板根节点改 `relative`，左上角挂载组件（音频模式不显示）

### 验证步骤

1. 分别创建文本/图片/全景图/视频/配置节点，点击节点弹出输入框，确认左上角有歪斜（-6deg）的 50×90 上传框且不溢出输入框面板，音频节点没有
2. 空状态悬停：上传框放大 1.1 并填充主题色，移出恢复透明；输入框提示文字和输入正文都从 100px 位置开始，不穿过上传框区域
3. 点击上传框选择图片：上传成功后在节点左侧出现图片节点并自动连线，组件切换为单图状态（缩略图 + 右下角圆形「+」）
4. 单图状态悬停：组件展开为 100px，右侧上传框从图片位置滑出；悬停右侧上传框有放大+填充反馈；点击圆形「+」或右侧上传框可继续上传
5. 上传 2 张以上：默认叠加态左右交替歪斜（一张向右、一张向左），悬停展开为 (n+1)×50px 平铺且每张仍保持左右交替倾斜，整行保持水平（不向右翘起、不溢出输入框），最右侧上传框滑出淡入，移出恢复叠加
6. 展开后逐个悬停图片：当前图片回正放大（scale 1.15）+ 投影 + 置顶，右上角显示 X 删除按钮；点 X 后对应图片节点和连线从画布删除，组件中该图片消失；移走鼠标恢复倾斜平铺
7. 用挂载着上传图片的节点执行生成，确认上传的图片作为参考图参与生成（连线即引用）
8. 手动把一个图片节点连线到目标节点（不通过上传框），确认连线图片也出现在堆叠区；悬停点 X 只移除连线、图片节点保留在画布上
9. 连线一个文本节点，确认堆叠区出现文本卡片（FileText 图标 + 节点名）；点 X 移除连线后卡片消失
10. 在输入框输入 @ 选择引用，确认编辑器中插入芯片保持不变（图片芯片可点击预览），堆叠区同步展示该引用
11. 删除某个上传的图片节点或连线，确认组件中对应图片消失
12. 连线图片后在输入框 @ 引用它，再在堆叠区点 X 移除，确认提示词中的"图片1"标签同步被清掉，不会留下悬空纯文本；提示词中若有"图片10"等更长标签不受影响
13. 切换浅色/深色主题，确认边框、图标、悬停填充色适配

## 视频节点底部输入条按钮分区调整

按用户要求，将视频节点底部提示词面板（`canvas-node-prompt-panel.tsx` video 模式）的底部行调整为 5 个按钮分区：提示词库、模型选择、参数选择、摄像机、提交按钮。仅调整 `CanvasVideoSettingsPopover` 的触发区结构，不改 props 与数据流。

### 可测试变更

- `next/src/components/model-picker.tsx`：导出 `resolveModelIcon` 函数，供视频设置 popover 复用模型自带图标
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：
  - 触发区由「Sparkles 图标 + 所有 segments 用 `·` 分隔平铺」改为两个独立按钮
  - **模型按钮**：带模型自带图标（`resolveModelIcon`，如 glm/gpt/claude 等）+ 模型名，图标与模型名一体，点击弹模型下拉；无模型自带图标时回退到原 `buttonIcon` 或 `Sparkles`
  - **参数按钮**：把非模型 segments（模式 · 比例 · 分辨率 · 时长 · 音频）合并成一个整体按钮，文字用 `·` 拼接，无外框（无边框无背景，仅 `theme.node.muted` 文字色），点击弹出原视频设置面板
  - 移除不再使用的 `Fragment` import
- `CanvasPromptLibrary`（提示词库）、`CanvasCameraControl`（摄像机）、提交按钮：本次未改动

### 验证步骤

1. 进入画布，创建视频节点，确认底部输入条从左到右：提示词库图标、模型按钮（带模型图标+模型名）、参数按钮（模式 · 比例 · 分辨率 · 时长...）、摄像机、提交按钮
2. 确认模型按钮的图标随模型变化（如选 GLM 显示 glm.svg，选无图标模型回退 Sparkles）
3. 点击模型按钮，确认弹出模型下拉，选择后模型名和图标更新
4. 点击参数按钮，确认弹出视频设置面板（模式/比例/分辨率/时长等），修改后参数按钮文字更新
5. 确认参数按钮无外框（无边框无背景），仅文字
6. 确认摄像机、提交按钮功能不受影响
7. 切换浅色/深色主题，确认模型按钮、参数按钮颜色适配

## 画布底部助手输入条 UI 优化（可灵风格）

参考可灵 Canvas 底部输入条样式，重做画布助手输入条为单行紧凑布局 + 可灵风格设置弹窗，仅改样式与布局，不修改 props 接口和数据流。

### 可测试变更

- 助手输入框高度从 `h-20` 缩减为 `h-16`
- 底部操作行改为可灵风格单行紧凑布局（`min-h-8`，`gap-1.5`）：
  - 左侧：`+` 添加素材按钮（图标化，去掉原 antd `Button` 圆形样式）+ 三个配置 chip
  - 三个配置 chip：图片比例（`imageSizeLabel`）/ 视频比例（`videoSizeRatioLabel`）/ 视频清晰度（`videoResolutionLabel`），点击对应 chip 弹出设置弹窗
  - 右侧：发送按钮改为可灵风格胶囊形（`rounded-full` + `px-3 py-1.5`），闪电图标 + 上箭头，主题反色（`background: theme.node.text`，`color: theme.toolbar.panel`）
- 新增 `ComposerOptionChip` + `ComposerOptionPopover` 两个内部组件实现可灵风格弹窗：
  - 弹窗浮在 chip 上方（`fixed` 定位，`createPortal` 到 body）
  - 灰底 list 容器（`theme.node.fill`，圆角）+ 选项横向排列
  - 选中项高亮：`theme.toolbar.activeText` + `theme.toolbar.panel` 背景
  - 点击外部自动关闭，滚动/resize 自动同步位置
- 所有颜色使用 `canvasThemes` token，不硬编码，适配浅色/深色主题
- 配置 chip 选项常量内联在文件中（图片比例 9 项 / 视频比例 5 项 / 视频清晰度 3 项），选中后通过现有 `onAgentConfigChange` 写入 `agentConfig`
- 移除未使用的 `useEffectiveConfig` / `useMemo` / `CanvasImageSettingsPopover` / `CanvasVideoSettingsPopover` / `Button` / `Upload` / `FolderOpen` / `Menu` 等 import 和死代码 `imageConfig` / `videoConfig`
- `CanvasAssistantComposerProps` 接口完全不变，`agentConfig` 数据结构不变，调用方无需改动

### 涉及文件

- `next/src/app/(user)/canvas/components/canvas-assistant-composer.tsx`：重写主组件 + 新增 `ComposerOptionChip` / `ComposerOptionPopover` 内部组件

### 验证步骤

1. 进入画布，展开右侧助手面板，确认底部输入条为可灵风格单行紧凑布局
2. 确认输入框高度比之前略小（`h-16`），placeholder 正常显示
3. 确认底部行从左到右：`+` 添加素材按钮、图片比例 chip、视频比例 chip、视频清晰度 chip、占位、发送按钮（胶囊形 + 闪电 + 上箭头）
4. 点击 `+` 按钮，确认弹出"上传文件 / 我的素材"菜单，功能正常
5. 点击图片比例 chip，确认上方弹出可灵风格弹窗（灰底 list + 横向选项），当前选中项高亮
6. 选择不同比例，确认弹窗关闭，chip 文字更新为所选比例
7. 点击视频比例 chip / 视频清晰度 chip，确认弹窗正常弹出和选择
8. 点击弹窗外部，确认弹窗自动关闭
9. 拖动画布或滚动，确认已打开的弹窗位置自动跟随 chip
10. 输入框为空时发送按钮 disabled（半透明），输入文字后可点击发送
11. 运行中发送按钮变为停止按钮（方块图标）
12. 切换浅色/深色主题，确认输入条、chip、弹窗、发送按钮颜色全部适配主题（无硬编码黑白）
13. 确认引用素材 chip（`AssistantReferenceChip`）仍正常显示和删除

## 文本节点自动弹出 AI 输入框

让右键新建文本节点与图片/视频节点行为一致，自动弹出下方 AI 输入框；输入框 placeholder 根据节点内是否有内容动态变化，空内容时提示用户可生成或在上方直接编辑。

### 可测试变更

- `createNode` 和连线拖到空白处新建节点的 `setDialogNodeId` 判断去掉 `CanvasNodeType.Text`，新建文本节点后自动弹出下方 `CanvasNodePromptPanel`
- `CanvasNodePromptPanel` 的 `promptPlaceholder` 在文本节点 + 节点内无内容时，提示语改为"请输入你想要生成的文本内容或在上方输入你的提示词"；有内容时保持"请输入你想要将本段文本修改成什么"

### 涉及文件

- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：两处 `setDialogNodeId` 判断去掉 `CanvasNodeType.Text`
- `next/src/app/(user)/canvas/components/canvas-node-prompt-panel.tsx`：`promptPlaceholder` 文本节点空内容分支提示语调整

### 验证步骤

1. 进入画布，右键空白处选择"文本生成"，确认新建文本节点后自动弹出下方 AI 输入框（与图片/视频节点行为一致）
2. 确认节点内无文字时，输入框 placeholder 显示"请输入你想要生成的文本内容或在上方输入你的提示词"
3. 在节点内输入任意文字后，确认 placeholder 切换为"请输入你想要将本段文本修改成什么"
4. 从已有节点拖出连线到空白处，选择新建文本节点，确认同样自动弹出 AI 输入框
5. 点击空白处取消选中后，再次单击该文本节点，确认 AI 输入框重新弹出（与图片/视频节点行为一致）
6. 双击文本节点，确认仍可进入节点内直接编辑文字（原有功能不受影响）
7. 右键新建图片/视频/音频节点，确认行为不受影响（图片/视频仍自动弹面板，音频仍不弹）

## 模型选择器渠道名隐藏与渠道字段改名

隐藏 ModelPicker 下拉项右侧的渠道名标签（普通用户不需看到管理员侧的来源命名），并把模型管理页的"名称"字段统一改为"渠道"，与"模型开放与定价"页的渠道列命名保持一致。

### 可测试变更

- `ModelPicker` 下拉项不再显示右侧渠道名小字，只显示模型名 + 模型图标
- `admin/channels` 列表表头"名称"改为"渠道"，空值显示"未命名渠道"
- `admin/channels` 渠道编辑 Drawer："名称" Form.Item label 改为"渠道"，校验提示"请输入渠道名"
- `admin/channels` 顶部按钮"新增模型"改为"新增渠道"，Drawer title "新增模型/编辑模型"改为"新增渠道/编辑渠道"

### 涉及文件

- `next/src/components/model-picker.tsx`：`ModelLabel` 移除 channelName 显示
- `next/src/app/(admin)/admin/channels/page.tsx`：列表表头、Form.Item label、按钮、Drawer title 文案统一为"渠道"

### 验证步骤

1. 进入画布或生图/视频/音频工作台，打开模型选择下拉，确认下拉项只显示模型名 + 图标，不再显示右侧的渠道名小字
2. 进入 `/admin/channels`，确认列表表头为"渠道"，空名称行显示"未命名渠道"
3. 点"新增渠道"，确认 Drawer 标题为"新增渠道"，第一个字段 label 为"渠道"，留空时提示"请输入渠道名"
4. 编辑现有渠道，确认 Drawer 标题为"编辑渠道"
5. 进入 `/admin/model-pricing`，确认"模型开放与定价"表格的"渠道"列与 channels 页命名一致

## 默认模型字段重构

合并 `defaultModel` 到 `defaultTextModel`（市面 AI 厂商共识：默认模型即默认文本模型），并新增缺失的 `defaultAudioModel` 配置项，使管理员后台与普通用户配置弹窗（已有 4 个默认模型）保持一致。

### 可测试变更

- 后端 `PublicModelChannelSetting`：删除 `DefaultModel` 字段，新增 `DefaultAudioModel` 字段
- 后端 `normalizePublicSetting`：删除 `defaultModel` 修复逻辑，新增 `defaultAudioModel` 修复逻辑
- 后端 `isAudioModelName`：新增函数，与前端 `isAudioModelName` 关键词一致（audio/tts/speech/voice/music/sound/elevenlabs/suno/lyrics/vocal/midi/wav）
- 后端 `isTextModelName`：更新为排除图片/视频/音频模型
- 后端 `workflow_agent.go`：选模型兜底逻辑删除 `defaultModel` 分支（`defaultTextModel` 已覆盖）
- 前端 `AdminPublicModelChannelSettings` 类型：删除 `defaultModel`，新增 `defaultAudioModel`
- 前端 `emptySettings`（settings-shared.ts、channels/page.tsx）：删除 `defaultModel`，新增 `defaultAudioModel: ""`
- 前端 `model-pricing` 页面"默认模型"卡片：4 个 Select 改为「默认图片/视频/文本/音频模型」
- 前端 `resolveEffectiveConfig`：`fallbackModel` 删除，`model` 兜底改用 `fallbackTextModel`；`fallbackAudioModel` 改为 `validDefault(defaultAudioModel, audioModels) || preferredModel(audioModels, isAudioModelName)`

### 涉及文件

- `Go/model/setting.go`：删除 `DefaultModel`，新增 `DefaultAudioModel`
- `Go/service/settings.go`：新增 `isAudioModelName`，更新 `isTextModelName`，调整 normalize 逻辑
- `Go/service/workflow_agent.go`：删除 `defaultModel` fallback 分支
- `next/src/services/api/admin.ts`：类型字段调整
- `next/src/app/(admin)/admin/settings-shared.ts`、`next/src/app/(admin)/admin/channels/page.tsx`：emptySettings 调整
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：默认模型卡片改 4 个 Select
- `next/src/stores/use-config-store.ts`：`resolveEffectiveConfig` 兜底逻辑调整
- `docs/backend/backend-database.md`、`docs/backend/system-settings.md`：字段说明同步

### 验证步骤

1. 进入 `/admin/model-pricing`，确认"默认模型"卡片显示 4 个 Select：默认图片/视频/文本/音频模型（不再有"默认模型"）
2. 在"默认音频模型"Select 中选择一个音频模型（如 `gpt-4o-mini-tts`），点"保存设置"，刷新确认持久化
3. 进入画布，打开配置弹窗，确认音频节点的默认模型使用了管理员设置的"默认音频模型"
4. 进入画布，确认文本节点和工作流 agent 的默认模型使用了"默认文本模型"（原 `defaultModel` 的兜底语义已合并）
5. 调用工作流 agent 草稿接口，确认文本模型选择走 `defaultTextModel` 兜底（后端 `workflow_agent.go` 已删除 `defaultModel` 分支）
6. 数据库中旧的 `defaultModel` 值不再被读取，确认无报错

## 渠道模型选择隔离与定价表布局优化

修复新建渠道时"可用模型"下拉和"选择模型"弹窗混入其他已保存渠道模型的问题，并将"开放与定价"页面从卡片网格改为表格布局。

### 可测试变更

- `admin/channels` 渠道编辑 Drawer：
  - "可用模型" Select 下拉候选只显示本渠道已选模型 + 本次拉取的模型，不再混入 `knownModels`（其他渠道/availableModels/modelCosts 的模型）
  - 切换/新建渠道时自动清空上一次的拉取候选，避免跨渠道污染
  - "选择模型"弹窗未拉取时只显示"已有的模型" Tab（本渠道已选），拉取后显示"新获取的模型" Tab
- `admin/model-pricing` "模型开放与定价"卡片：
  - 由按渠道分组的网格布局改为单个 Table
  - 列：渠道（rowSpan 合并，含全选 Checkbox + 已开放计数）/ 模型名（ellipsis 截断，悬浮 tooltip 显示完整名）/ 开放（Switch）/ 单价（InputNumber + "点"后缀）
  - 模型名超长不再换行，表格紧凑对齐

### 涉及文件

- `next/src/app/(admin)/admin/channels/page.tsx`：删除 `knownModels` state 及 `rememberModels` / `rememberKnownModels` / `collectKnownModels`；Select options 改为 `modelSelectOptions`（本渠道已选 + 本次拉取）；`openChannelModelSelector` 不再混入 knownModels
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增 `pricingTableData`（按渠道分组扁平化 + rowSpan 标记），用 antd Table 替换原 grid 卡片

### 验证步骤

1. 进入 `/admin/channels`，新增渠道 A，填写接口地址和 API Key 后点"拉取模型列表"，确认弹窗"新获取的模型"只显示本次拉取的模型
2. 在 A 中选择部分模型并保存
3. 再点"新增模型"打开渠道 B，点"可用模型" Select 下拉，确认**不显示** A 的模型（应为空）
4. 在 B 点"选择模型"按钮，确认弹窗"已有的模型"为空、"新获取的模型"为空（未拉取时）
5. 在 B 点"拉取模型列表"，确认只显示 B 本次拉取的模型，不含 A 的模型
6. 编辑 A（点"编辑"），确认 Select 下拉只显示 A 已选的模型 + 本次拉取的，不含 B 的
7. 进入 `/admin/model-pricing`，确认"模型开放与定价"显示为表格：渠道列合并、模型名单行截断、开放 Switch、单价输入框
8. 鼠标悬浮截断的模型名，确认 tooltip 显示完整名称
9. 点渠道列的全选 Checkbox，确认该渠道下所有模型开放状态同步切换
10. 切换某模型开放开关为关闭，确认单价输入框变为 disabled
11. 修改单价后点"保存设置"，刷新确认持久化

## 提示词分类管理后台化

把原硬编码的 `promptCategories` 迁移到数据库 `prompt_categories` 表，支持管理后台可视化增删改查。详细方案见 [prompt-category-refactor.md](./prompt-category-refactor.md)。

### 可测试变更

- 后端首次启动时自动创建 `prompt_categories` 表并写入 8 条种子数据（1 个 system 本地分类 + 7 个 GitHub 远程同步源）
- 新增管理后台页面 `/admin/prompt-categories`，支持：
  - 查看全部分类列表（分类 ID、显示名称、类型、GitHub 地址、启用状态、排序、最后同步时间）
  - 新增分类（填写分类 ID、名称、描述、GitHub 地址、远程/本地、启用、排序）
  - 编辑分类（分类 ID 不可改，仅可改名称、描述、启用、排序）
  - 删除分类（二次确认，提示词数据保留不级联删除）
  - 启用/禁用分类（Switch 直接切换）
  - 同步单个远程分类、同步所有启用的远程分类
- 管理后台侧边栏新增「提示词分类」入口（位于「AI 日志」和「提示词管理」之间）
- 定时同步任务改为从数据库读取启用的远程分类，同步完成后更新 `last_synced_at`
- 原 `/admin/prompts` 页面不受影响（接口契约不变）

### 涉及文件

后端：
- `Go/model/prompt.go`：`PromptCategory` 新增 `enabled`、`sort_order`、`last_synced_at`、`created_at` 字段
- `Go/repository/db.go`：注册 AutoMigrate + `seedPromptCategoriesIfEmpty` 种子迁移
- `Go/repository/prompt.go`：分类查询改为读数据库，新增 `SavePromptCategory`、`DeletePromptCategory`、`ListEnabledRemotePromptCategories`、`UpdatePromptCategorySyncedAt`
- `Go/service/prompts.go`：新增 `CreatePromptCategory`、`UpdatePromptCategory`、`DeletePromptCategory`
- `Go/service/prompt_sync_scheduler.go`：定时同步改为读 `ListEnabledRemotePromptCategories`
- `Go/service/prompt_fetch.go`：`SyncPromptCategory` 改用 `PromptCategoryByCode`，同步后更新 `last_synced_at`
- `Go/handler/admin.go`：新增 `AdminCreatePromptCategory`、`AdminUpdatePromptCategory`、`AdminDeletePromptCategory`
- `Go/router/router.go`：注册 `POST/PUT/DELETE /api/admin/prompt-categories` 路由

前端：
- `next/src/services/api/request.ts`：补充 `apiPut`
- `next/src/services/api/admin-prompt-categories.ts`：新增，封装分类 CRUD API
- `next/src/services/api/admin.ts`：移除已迁移到新文件的类型和函数
- `next/src/app/(admin)/admin/prompt-categories/page.tsx`：新增管理页面
- `next/src/app/(admin)/admin/prompt-categories/use-admin-prompt-categories.ts`：新增页面 hook
- `next/src/app/(admin)/admin/layout.tsx`：侧边栏新增入口
- `next/src/app/(admin)/admin/prompts/use-admin-prompts.ts`：改从新文件导入分类 API

### 验证步骤

1. 启动后端，确认 `prompt_categories` 表自动创建且 8 条种子数据写入
2. 启动前端，访问 `/admin/prompt-categories`，确认默认展示 8 个分类
3. 测试新增分类（远程和本地各一个）
4. 测试编辑分类（修改名称、描述、排序、启用状态）
5. 测试删除分类（确认提示词数据保留）
6. 测试启用/禁用 Switch 切换
7. 测试「同步」单个远程分类和「同步所有」按钮
8. 确认原 `/admin/prompts` 页面分类筛选和同步功能不受影响

## 删除 Linux.do 登录功能

移除项目中的 Linux.do OAuth 登录能力，仅保留账号密码登录与注册。

### 可测试变更

- 用户登录页 `/login` 移除「使用 Linux.do 登录」按钮，副标题文案改为「使用账号密码登录或注册。」
- 管理后台设置页 `/admin/settings` 移除「Linux.do 登录」配置卡片（含开启开关、Client ID、Client Secret）
- 管理后台用户列表 `/admin/users` 移除「Linux.do」列
- 后端移除 `/api/auth/linux-do/authorize`、`/api/auth/linux-do/callback` 路由及对应处理器与 service 函数
- 后端 `model.User` 移除 `LinuxDoID` 字段，`config` 移除 Linux.do URL 配置项，`repository` 移除 `GetUserByLinuxDoID`
- 系统配置模型 `PrivateAuthSetting` 清空，`PublicAuthSetting` 仅保留 `AllowRegister`
- 删除静态资源 `next/public/icons/linuxdo.svg`
- README 移除 Linux.do 社区推广链接

### 涉及文件

后端：
- `Go/config/config.go`：删除 3 个 LinuxDo URL 配置项
- `Go/model/user.go`：删除 `LinuxDoID` 字段
- `Go/model/setting.go`：`PublicAuthSetting` 删除 `LinuxDo` 字段，删除 `PublicLinuxDoAuthSetting`、`PrivateLinuxDoAuthSetting`，清空 `PrivateAuthSetting`
- `Go/repository/user.go`：删除 `GetUserByLinuxDoID`
- `Go/service/auth.go`：删除 `LinuxDoAuthorizeURL`、`LoginWithLinuxDo` 等函数及相关结构体
- `Go/service/settings.go`：删除 `keepPrivateAuthSecrets` 及 `hidePrivateAPIKeys` 中 LinuxDo 处理
- `Go/handler/auth.go`：删除 `LinuxDoAuthorize`、`LinuxDoCallback`
- `Go/router/router.go`：删除 Linux.do 登录路由

前端：
- `next/src/app/(user)/login/page.tsx`：移除 Linux.do 登录按钮、`linuxDoEnabled` 状态、副标题文案
- `next/src/app/(admin)/admin/users/page.tsx`：移除用户表格「Linux.do」列
- `next/src/app/(admin)/admin/settings/page.tsx`：移除 LinuxDo 默认配置、配置卡片、normalize 函数中 linuxDo 处理
- `next/src/services/api/admin.ts`：移除 `AdminUser.linuxDoId`、`AdminPublicSettings.auth.linuxDo`、`AdminPrivateSettings.auth`
- `next/public/icons/linuxdo.svg`：删除

### 验证步骤

1. 启动后端，确认编译通过，无 LinuxDo 相关报错
2. 访问 `/login`，确认只显示账号密码登录/注册，无 Linux.do 登录按钮
3. 访问 `/admin/settings` 可视化编辑页，确认不再显示「Linux.do 登录」配置卡片
4. 访问 `/admin/users`，确认用户表格不再显示「Linux.do」列
5. 保存系统配置，确认不报错

## 首页 Banner 资源本地化

将首页 banner 从 jsdelivr CDN 远程加载改为本地 `next/public/banners/` 资源。

### 可测试变更

- `HOME_BANNERS` 配置中 3 个 banner 的 `imageUrl` 和 `videoUrl` 从 `https://gcore.jsdelivr.net/gh/tigerowo/infinite-canvas@v0.5.0/...` 改为本地路径 `/banners/xxx.webp`、`/banners/agent.webm`
- 本地资源（agent.webp、agent.webm、panorama.webp、3ddirector.webp）已存在于 `next/public/banners/`，与远程文件一一对应

### 涉及文件

- `next/src/app/(user)/page.tsx`：`HOME_BANNERS` 数组改用本地路径

### 验证步骤

1. 启动前端，访问首页 `/`
2. 确认 3 个 banner 正常显示（agent 动态封面 + panorama 静图 + 3ddirector 静图）
3. 点击激活的 agent banner，确认弹窗中 webm 视频可正常播放
4. 打开浏览器网络面板，确认 banner 资源从本地 `/banners/...` 加载，不再请求 `gcore.jsdelivr.net`

## 工作流模块独立化

把生图工作台内嵌的「创作工作流」抽离为导航下拉模块，与生图工作台彻底解耦。原「创作工作流」改名为「生图工作流」。详细方案见 [workflow-module-refactor.md](./workflow-module-refactor.md)。

### 可测试变更

- 顶部导航在「视频创作台」之后新增「工作流」项；当前只有一个子项「生图工作流」，导航项本身渲染为可点击 Link，直接跳转 `/workflows`
- 后续若新增子项（如提示词生成、AI 换装），`children.length ≥ 2` 后会自动切换为 antd Dropdown 下拉菜单（hover 触发）
- 移动端导航抽屉同步适配：单子项时为单行 Link；多子项时平铺渲染，子项缩进一级
- 生图工作台 `/image` 移除右下角悬浮「工作流」按钮、右侧抽屉、3 个工作流回调（`handleWorkflowTaskStarted/Success/Failure`）、按钮拖拽逻辑、`WORKFLOW_BUTTON_POSITION_KEY` 持久化
- 生图工作台后端任务轮询 `listCanvasImageTasks` 的标签数组从 `["image-workbench", "workflow"]` 改为 `["image-workbench"]`，不再拉取工作流任务
- 生图工作台与工作流彻底解耦：工作流产出不再写入生图历史，只在 `/workflows` 页面内查看
- 工作流组件 `CreativeWorkflowWorkspace` 移除 `embedded` 和 `hideTaskList` 参数及所有相关分支，统一为独立页样式
- 原「创作工作流」改名「生图工作流」（页面标题与副标题）
- 历史日志中的工作流字段（`workflowId` / `workflowName` / `workflowInputs` / `workflowTaskId`）及「工作流 xxx」青色 Tag 展示**保留不动**，避免破坏历史数据

### 涉及文件

前端：
- `next/src/constant/navigation-tools.ts`：改造为 `NavLink | NavDropdown` 联合类型，新增 workflows 下拉分组；导出 `navigationSlugs` 用于 active 判断
- `next/src/components/layout/app-top-nav.tsx`：渲染逻辑适配（link / 单子项直跳 / 多子项 Dropdown）；`activeToolSlug` 改用 `navigationSlugs`
- `next/src/components/layout/mobile-nav-drawer.tsx`：移动端渲染适配（link / 单子项直跳 / 多子项平铺缩进）
- `next/src/app/(user)/image/page.tsx`：移除悬浮按钮、抽屉、3 个回调、拖拽逻辑、相关 ref/state/常量；后端任务轮询去掉 "workflow" 标签；移除未使用的 `WandSparkles`、`Drawer`、`ReactPointerEvent`、`CreativeWorkflowWorkspace`、`WorkflowExternalTask*` 导入
- `next/src/components/workflows/creative-workflow-workspace.tsx`：移除 `embedded` / `hideTaskList` 参数及所有相关分支；副标题统一为「把固定提示词和参数沉淀成模板，每次只填写变量即可批量复用。」；「创作工作流」改名「生图工作流」

### 验证步骤

1. 启动前端，确认顶部导航在「视频创作台」后出现「工作流」项，点击直接跳转 `/workflows`（无下拉菜单）
2. 确认 `/workflows` 页面标题为「生图工作流」，副标题为「把固定提示词和参数沉淀成模板，每次只填写变量即可批量复用。」
3. 在 `/workflows` 页面测试创建、运行、查看结果等核心功能
4. 访问 `/image` 生图工作台，确认悬浮按钮和抽屉已消失
5. 在生图工作台执行单次生图，确认功能正常，结果区正常显示
6. 查看生图历史，确认历史中已有的工作流产出仍能正常显示「工作流 xxx」青色标签
7. 切换到移动端视图，打开导航抽屉，确认「工作流」项显示为单行 Link，可点击跳转
8. 临时在 `navigation-tools.ts` 的 `workflows.children` 数组追加一个测试子项，确认导航自动切换为 Dropdown 下拉菜单（hover 弹出子菜单），验证完成后删除测试子项

## 未登录用户配置入口开关

新增 `allowGuestConfig` 公开配置字段，用于控制未登录用户是否能看到顶栏配置按钮及触发配置弹窗，便于引流期到变现期的切换。

### 可测试变更

- 后端 `PublicModelChannelSetting` 新增 `AllowGuestConfig *bool` 字段，`service/settings.go` 在字段为 nil 时默认置为 true（兼容旧配置）
- 前端 `AdminPublicModelChannelSettings` 类型同步新增 `allowGuestConfig: boolean`
- 管理后台 `/admin/settings` 公开配置卡片新增「是否允许未登录用户使用配置功能」开关，默认开启；关闭后未登录用户看不到顶栏配置入口，也无法通过模型选择器等入口触发配置弹窗
- 顶栏 `UserStatusActions` 在未登录用户且 `allowGuestConfig === false` 时隐藏配置按钮；已登录用户不受影响
- `AppConfigModal` 新增拦截 useEffect：未登录用户且开关关闭时，无论从哪个入口（模型选择器、画布、视频/生图工作台等）触发 `openConfigDialog`，都会立即关闭弹窗并提示「请登录后使用配置功能」

### 涉及文件

后端：
- `Go/model/setting.go`：`PublicModelChannelSetting` 新增 `AllowGuestConfig` 字段
- `Go/service/settings.go`：新增 `AllowGuestConfig` 默认值处理（nil 时设为 true）

前端：
- `next/src/services/api/admin.ts`：`AdminPublicModelChannelSettings` 新增 `allowGuestConfig` 字段
- `next/src/app/(admin)/admin/settings/page.tsx`：`emptySettings` 默认值、开关 Form.Item、`normalizePublicSetting` 中 `allowGuestConfig` 处理
- `next/src/components/layout/user-status-actions.tsx`：根据 `allowGuestConfig` 和登录状态控制顶栏配置按钮显示
- `next/src/components/layout/app-config-modal.tsx`：新增 useEffect 拦截未登录且开关关闭时的弹窗打开

文档：
- `docs/backend/backend-database.md`：新增 `allowGuestConfig` 字段说明

### 验证步骤

1. 启动后端，访问 `GET /api/settings`，确认返回的 `modelChannel.allowGuestConfig` 为 `true`
2. 登录管理后台 `/admin/settings`，确认公开配置卡片显示「是否允许未登录用户使用配置功能」开关且默认开启
3. 关闭开关并保存，刷新页面确认开关仍为关闭状态
4. 退出登录（或打开无痕窗口），确认顶栏不显示配置按钮（齿轮图标）
5. 在未登录状态下，进入生图/视频工作台，点击模型选择器中可能触发配置弹窗的入口，确认弹窗不打开并提示「请登录后使用配置功能」
6. 重新登录普通账号，确认顶栏配置按钮恢复显示，配置弹窗可正常打开
7. 登录管理后台重新开启开关并保存，退出登录，确认未登录用户顶栏配置按钮恢复显示且弹窗可正常打开

## 配置弹窗三 Tab 布局

把原「配置与用户偏好」弹窗从「渠道模式 + 通用偏好项」两层结构改为顶部 Segmented 三 Tab 切换：本地渠道 / 平台渠道 / 偏好设置。

### 可测试变更

- 顶部用 Segmented 替换原「渠道模式」Form.Item，三个选项：本地渠道 / 平台渠道 / 偏好设置
- 名称调整：原「本地直连」→「本地渠道」，原「云端渠道」→「平台渠道」（Tab 与平台渠道说明文案同步改名）
- Tab 可见性按权限控制：
  - admin 且同时开启 `allowCustomChannel` 和 `allowUserRemoteChannel`：三个 Tab 全可见，切换本地/平台 Tab 时同步 `channelMode`
  - 普通用户仅本地：显示「本地渠道」+「偏好设置」
  - 普通用户仅云端：显示「平台渠道」+「偏好设置」
  - 「偏好设置」Tab 始终可见
- 「本地渠道」Tab 内容：原「本地模型渠道」新增/列表块 + 「模型列表」块（自动同步开关、拉取全部渠道按钮）
- 「平台渠道」Tab 内容：平台渠道说明文案 + 默认生图/视频/文本/音频模型 ModelPicker（从偏好设置移入）
- 「偏好设置」Tab 内容：画布默认生图张数、音频声音/格式/语速、流式/Base64/Codex 三个开关、用户 S3/R2 存储配置、默认音频指令、系统提示词（仅本地渠道模式下显示）；不再包含默认模型选择
- 本地渠道 Tab 不单独放默认模型选择：本地渠道拉取模型列表后自动选第一个可用模型作为默认
- ModelPicker 选择框全局由胶囊形（rounded-full）改为矩形圆角（rounded-md），影响配置弹窗、画布、生图/视频工作台
- 弹窗打开时默认激活当前 `effectiveMode` 对应的渠道 Tab（local→本地渠道，remote→平台渠道）
- 未登录用户拦截逻辑保留：未登录且 `allowGuestConfig=false` 时弹窗仍被拦截，不影响

### 涉及文件

- `next/src/components/layout/app-config-modal.tsx`：
  - 新增 `activeTab` state（`"local" | "remote" | "preferences"`）
  - 新增 `visibleTabs` 计算逻辑（按权限决定可见 Tab）
  - 新增弹窗打开时根据 `effectiveMode` 重置默认 Tab 的 useEffect
  - 替换 Form 内容为 Tabs 结构：本地渠道/平台渠道/偏好设置
  - 默认模型选择 ModelPicker 从偏好设置移入「平台渠道」Tab
- `next/src/components/model-picker.tsx`：SelectTrigger 圆角由 `rounded-full` 改为 `rounded-md`（全局矩形化）

### 验证步骤

1. 登录管理后台（admin），同时开启 `allowCustomChannel` 和 `allowUserRemoteChannel`，打开配置弹窗，确认顶部显示三个 Tab：本地渠道 / 平台渠道 / 偏好设置
2. 默认激活 Tab 与当前渠道模式一致（本地模式→本地渠道，云端模式→平台渠道）
3. 切换到「本地渠道」Tab，确认显示本地模型渠道新增/列表块 + 模型列表块，可正常新增/删除/拉取渠道
4. 切换到「平台渠道」Tab，确认显示平台渠道说明文案 + 默认生图/视频/文本/音频模型选择（ModelPicker 选择框为矩形圆角，非胶囊形）
5. 切换到「偏好设置」Tab，确认不再显示默认模型选择，显示画布默认生图张数、音频设置、流式/Base64/Codex 开关、S3 存储、默认音频指令、系统提示词（仅本地模式时显示系统提示词）
6. 在「平台渠道」Tab 修改默认生图模型，点击「完成」保存，重新打开弹窗确认修改生效
7. 切换 admin 的 `allowCustomChannel` 关闭（仅保留 `allowUserRemoteChannel`），重新打开弹窗，确认只显示「平台渠道」+「偏好设置」两个 Tab
8. 登录普通用户 tester（仅本地渠道），打开配置弹窗，确认显示「本地渠道」+「偏好设置」两个 Tab，本地渠道 Tab 拉取模型后自动选第一个作为默认
9. 退出登录（未登录状态且 `allowGuestConfig` 开启），打开配置弹窗，确认显示「本地渠道」+「偏好设置」两个 Tab，拦截逻辑不受影响
10. 关闭 `allowGuestConfig` 开关，未登录状态下点击配置入口，确认弹窗被拦截并提示「请登录后使用配置功能」
11. 打开画布、生图工作台、视频创作台，确认 ModelPicker 选择框均为矩形圆角（非胶囊形）

## 空画布引导浮层

在新建空画布或从首页 agent 会话框进入新空画布时，画布视口中心显示引导浮层，帮助用户快速了解使用方式。

### 可测试变更

- 空画布（`nodes.length === 0`）时在画布视口中心显示两层引导浮层：
  - 上层：黑色圆角提示按钮（鼠标右键 SVG + "鼠标右键"文案），纯提示无功能
  - 下层：4 个快捷按钮（上传素材/生成图片/生成视频/让 Agent 创建），有实际功能
- 浮层固定在视口中心，不随画布平移/缩放移动（`absolute inset-0 flex items-center justify-center`）
- 浮层容器 `pointer-events-none`，按钮 `pointer-events-auto`，不阻挡画布右键/拖拽操作
- 快捷按钮功能：
  - 上传素材 → 触发 `handleUploadRequest()`
  - 生成图片 → `createNode(CanvasNodeType.Image)`
  - 生成视频 → `createNode(CanvasNodeType.Video)`
  - 让 Agent 创建 → 展开右侧助手面板（`setAssistantMounted(true)` + `setAgentPanel open:true`）
- 画布创建任意节点后（`nodes.length > 0`）浮层自动隐藏
- 快捷按钮颜色使用 `theme.node.text` / `theme.node.muted`，适配浅色/深色主题

### 涉及文件

- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：在 `</InfiniteCanvas>` 后新增空状态引导浮层 JSX

### 验证步骤

1. 新建空白画布，确认视口中心显示黑色"鼠标右键"提示按钮 + 下方 4 个快捷按钮
2. 确认黑色提示按钮点击无响应（纯提示）
3. 点击「上传素材」按钮，确认触发文件上传流程
4. 点击「生成图片」按钮，确认画布创建图片节点，浮层消失
5. 删除节点使画布再次为空，确认浮层重新出现
6. 点击「生成视频」按钮，确认创建视频节点，浮层消失
7. 点击「让 Agent 创建」按钮，确认右侧助手面板展开
8. 从首页 agent 会话框输入内容进入新画布，确认浮层显示（pendingAgentRequest 消费前画布为空）
9. 在画布空白处右键，确认右键菜单正常弹出（浮层不阻挡右键操作）
10. 拖拽/缩放画布，确认浮层始终固定在视口中心不移动
11. 切换浅色/深色主题，确认浮层文字和图标颜色适配主题

## 生图/视频工作台按钮与输入框圆角统一

把生图/视频工作台里的质量、尺寸、张数、清晰度、秒数、任务数量等按钮和输入框统一改成方框带圆角（`rounded-md`），替换原胶囊形（`rounded-full`）和较大圆角（`rounded-xl`/`rounded-lg`）。

### 可测试变更

- 生图工作台 `ImageSettingsPanel`：
  - 质量按钮（自动/高/中/低）和生成张数按钮（1-10 张）的 `OptionPill` 圆角 `rounded-full` → `rounded-md`
  - W/H 尺寸输入框 `DimensionInput` 容器圆角 `rounded-xl` → `rounded-md`
  - 自定义张数输入框 `CountInput` 圆角 `rounded-full` → `rounded-md`
- 视频工作台 `VideoSettingsPanel`（side 布局实际使用的面板）：
  - 清晰度按钮、秒数按钮、Seedance 分辨率按钮的 `OptionPill` 圆角 `rounded-full` → `rounded-md`
  - 自定义清晰度输入框 `ResolutionInput` 圆角 `rounded-full` → `rounded-md`
  - W/H 尺寸输入框 `DimensionInput` 圆角 `rounded-xl` → `rounded-md`
  - 秒数自定义输入框 `NumberInput` 圆角 `rounded-full` → `rounded-md`
  - Kling 模式选择按钮（720P/1080P/4K/标准/专业）圆角 `rounded-full` → `rounded-md`
  - Kling/通用/Seedance 比例按钮圆角 `rounded-xl` → `rounded-md`
- 视频工作台 `KlingV26WorkbenchPanel`（Kling 专用紧凑面板）：
  - 模式/尺寸/秒数等可选按钮 `optionClass` 圆角 `rounded-full` → `rounded-md`
  - 秒数自定义输入框、分镜时长输入框 `KlingNumberInput` 圆角 `rounded-full` → `rounded-md`
  - 任务数量输入框 `KlingTaskCount` 外层 `rounded-xl` 与内层 input `rounded-lg` 统一改为 `rounded-md`
- 通用底部 compact 布局（生图 page 和视频 page）：
  - 生图 `QuickSelect`、`QuickNumber` 圆角 `rounded-xl` → `rounded-md`
  - 视频 `QuickSelect`、`QuickNumber`、`TaskCountControl`、`optionPillClass` 圆角统一为 `rounded-md`
- 视频工作台 `VideoSettingsPanel` 秒数自定义输入框：在输入框右侧追加 "s" 单位后缀（与清晰度输入框的 "p" 后缀对齐）
- 视频工作台 `VideoSettingsPanel` 通用面板：把比例选择按钮从「尺寸」组拆出，单独成「比例」SettingGroup，避免与 W/H 尺寸输入框挤在一起
- 生图工作台 `ImageSettingsPanel`：「宽高比」标题改为「比例」
- 生图/视频工作台比例按钮统一调整尺寸，避免拥挤：
  - 生图 `aspectOptions` 按钮：`h-[60px]` → `h-[72px]`，`gap-2` → `gap-1.5`
  - 视频通用 `sizeOptions` 按钮：`h-[60px]` → `h-[72px]`，`gap-2` → `gap-1.5`
  - Kling/Seedance 比例按钮：`h-[68px]` → `h-[76px]`，`gap-1` → `gap-1.5`
- 生图工作台 `ImageSettingsPanel` 比例按钮按分辨率档位切换显示：
  - `aspectOptions` 新增 `tier` 字段（standard/2k/4k）
  - 「比例」标题右侧新增 Segmented 切换器（标准 / 2K / 4K），切换后只显示对应档位的比例按钮，`auto` 选项始终保留
  - 2K/4K 按钮的 label 去掉 `(2k)`/`(4k)` 后缀（档位已由 Segmented 表达，避免重复）
  - 切换档位时若当前选中的比例不在新档位，自动重置为 `auto`
  - 弹窗打开时根据 `config.size` 自动定位到对应档位（如 `16:9-2k` → 默认 2K）
  - 补全 2K/4K 档位的全部比例（按 16 倍数对齐）：
    - 2K 新增：3:2（2048×1360）、2:3（1360×2048）、4:3（2048×1536）、3:4（1536×2048）
    - 4K 新增：1:1（4096×4096）、3:2（4096×2720）、2:3（2720×4096）、4:3（4096×3072）、3:4（3072×4096）
    - 三档位比例数量一致（8 个 + auto），云端模型不支持时靠报错兜底

### 涉及文件

- `next/src/components/image-settings-panel.tsx`：`OptionPill`、`DimensionInput`、`CountInput` 三个组件 className 圆角统一；「宽高比」改名「比例」；比例按钮高度和 gap 调整；新增 `tier` 字段和 Segmented 档位切换（标准/2K/4K）
- `next/src/components/video-settings-panel.tsx`：`OptionPill`、`ResolutionInput`、`DimensionInput`、`NumberInput`、Kling 模式按钮、Kling/通用/Seedance 比例按钮圆角统一；`NumberInput` 追加 "s" 后缀；通用面板拆分「尺寸」和「比例」两个 SettingGroup；比例按钮高度和 gap 调整
- `next/src/app/(user)/image/page.tsx`：底部 compact 布局用的 `QuickSelect`、`QuickNumber` 圆角统一
- `next/src/app/(user)/video/components/kling-v26-workbench-panel.tsx`：`optionClass`、`KlingNumberInput`、`KlingTaskCount` 三个组件 className 圆角统一
- `next/src/app/(user)/video/page.tsx`：Seedance/通用视频工作台用的 `QuickSelect`、`QuickNumber`、`TaskCountControl`、`optionPillClass` 圆角统一

### 验证步骤

1. 启动前端，进入生图工作台 `/image`，展开「图像设置」面板
2. 确认质量按钮（自动/高/中/低）为方框带轻微圆角（非胶囊形）
3. 确认 W/H 尺寸输入框为方框带轻微圆角（非大圆角）
4. 确认生成张数按钮（1-10 张）和右侧自定义张数输入框均为方框带轻微圆角
5. 确认生图「宽高比」标题已改为「比例」，比例按钮高度增加、内容不拥挤
6. 确认生图「比例」标题右侧有 Segmented 档位切换器（标准 / 2K / 4K），默认根据当前 `config.size` 自动定位（例如 1:1 在「标准」，1:1(2k) 在「2K」，16:9(4k) 在「4K」）
7. 切换 Segmented 到「2K」，确认只显示 1:1 / 16:9 / 9:16 / 21:9 四个比例按钮 + auto，按钮无 `(2k)` 后缀
8. 切换 Segmented 到「4K」，确认只显示 16:9 / 9:16 / 21:9 三个比例按钮 + auto
9. 切换到「2K」选中 16:9，再切换到「4K」，确认 16:9 选项不在 4K 中时自动重置为 auto
10. 进入视频创作台 `/video`，展开各设置区
11. 确认模式（720P/1080P/4K）、尺寸（16:9/9:16/1:1）、秒数（3s/15s 或 5s/10s）等按钮为方框带轻微圆角
12. 确认秒数自定义输入框、分镜时长输入框为方框带轻微圆角，且秒数自定义输入框右侧带 "s" 单位
13. 确认任务数量输入框（外层容器和内层 input）均为方框带轻微圆角
14. 切换到 Seedance / 通用视频工作台（非 Kling 模型），确认底部 compact 布局中的清晰度、尺寸、秒数、任务数量等 select/input 均为方框带轻微圆角
15. 进入视频工作台 side 布局的「视频设置」面板（通用模型），确认「尺寸」组只有 W/H 输入框，下方有独立的「比例」组放比例选择按钮，比例按钮不拥挤
16. 切换到 Kling / Seedance 视频设置面板，确认比例按钮（带像素说明的三行内容）高度增加、gap 适中不拥挤
17. 切换浅色/深色主题，确认方框边框和颜色正常显示

## 管理后台模型管理拆分（原"渠道管理"）

把渠道配置从 `/admin/settings` 拆出来作为独立菜单项 `/admin/channels`（UI 文案显示为"模型管理"），系统设置页私有 tab 仅保留同步/日志/存储三块。详细方案见 [channels-page-split.md](./channels-page-split.md)。

### 可测试变更

- 新增管理后台页面 `/admin/channels`，承载原嵌在系统设置页私有 tab 的全部渠道逻辑（页面 UI 文案统一为"模型管理"）：
  - 渠道 Table（名称/协议/状态/模型/权重/超时/操作）
  - Channel Drawer（新增/编辑，标题为"新增模型"/"编辑模型"，含 name/protocol/baseUrl/apiKey/models/weight/timeout/enabled/remark）
  - 选择模型 Modal（双 tab：新获取/已有，Checkbox 网格、搜索、增加模型、拉取模型列表）
  - 模型测试 Modal（单测/批测）
- 管理后台侧边栏在「素材库」和「系统设置」之间新增「模型管理」菜单项，使用 `ApiOutlined` 图标
- 顶部 Header 标题在 `/admin/channels` 路径下显示「模型管理」
- 系统设置页私有 tab 移除：渠道 Table、Channel Drawer、选择渠道模型 Modal、模型测试 Modal
- 系统设置页公开 tab「系统可用模型」Select 的 options 改为从 `Form.useWatch(["private", "channels"], form)` 派生（不再依赖独立 `channels` state），extra 文案改为"可选项来自「模型管理」中各启用模型配置的模型"
- 系统设置页 `saveSettings` 移除 `mergeChannelApiKeys` / `setChannels` / `setKnownModels` 等渠道相关逻辑；`loadSettings` 移除 `setChannels` / `setKnownModels`
- 沿用整体保存模式：模型管理页保存时读取 form 中的全量 settings，仅替换 `private.channels` 后整体 `POST /api/admin/settings`，后端零改动
- 模型管理页内联一份 normalize 逻辑（`normalizeSettings` / `normalizePublicSetting` / `normalizePrivateSetting` / `normalizeChannel` 等），与 settings 页解耦
- 修复新增/编辑模型时浏览器自动填充账号密码问题：Drawer 内 Form 加 `autoComplete="off"`，baseUrl 用 `autoComplete="off"`，apiKey 用 `autoComplete="new-password"`，并在 Form 顶部加两个隐藏的假用户名/密码 input 引导浏览器填充到那里

### 涉及文件

- `next/src/app/(admin)/admin/channels/page.tsx`：新增，从 settings/page.tsx 迁移渠道相关全部逻辑
- `next/src/app/(admin)/admin/layout.tsx`：新增「模型管理」菜单项（路由 key 仍为 `/admin/channels`）和路由元数据，import `ApiOutlined`
- `next/src/app/(admin)/admin/settings/page.tsx`：删除渠道相关 UI/state/函数（约 400 行），`channelModels` 改为 Form.useWatch 派生

### 验证步骤

1. 启动前端，登录管理后台 admin/admin123
2. 确认侧边栏在「素材库」和「系统设置」之间出现「模型管理」菜单项（图标为 ApiOutlined）
3. 点击「模型管理」，确认 URL 为 `/admin/channels`（路由不变），顶部 Header 标题显示「模型管理」
4. 确认 Table 正常展示原有渠道数据（名称/协议/状态/模型/权重/超时/操作列）
5. 点击「新增模型」，确认 Drawer 弹出，标题为"新增模型"；**确认接口地址、API Key 输入框不会被浏览器自动填充账号密码**（这是本次修复重点）
6. 填写 baseUrl + apiKey + 名称后保存，确认新渠道出现在 Table 中
7. 点击某行的「编辑」，Drawer 标题为"编辑模型"，修改名称后保存，确认 Table 中名称已更新；确认编辑时 apiKey 输入框 placeholder 为"留空则沿用已保存的 API Key"
8. 点击某行的「测试」，确认测试 Modal 标题为"{名称} 模型测试"，选择模型后点击「测试」或「批量测试」，确认状态显示正常（成功/失败/请求时长）
9. 在编辑 Drawer 中点击「选择模型」，确认选择模型 Modal 标题为"选择模型"，点击「拉取模型列表」可拉取上游模型，勾选后确认返回 Drawer
10. 点击某行的删除按钮，确认渠道从 Table 中移除
11. 切换到「系统设置」页面，确认私有 tab 仅剩 3 块 Card：提示词定时同步、AI 调用日志、数据存储；不再显示渠道 Table / Drawer / Modal
12. 切换到公开 tab，确认「系统可用模型」Select 的下拉 options 仍正常显示已启用模型配置的模型；extra 文案为"可选项来自「模型管理」中各启用模型配置的模型"
13. 在公开 tab 修改默认模型或系统提示词，点击「保存设置」，确认保存成功且无报错
14. 在公开 tab 切到「手动编辑 JSON」模式，确认 JSON 内容正常显示且可编辑/格式化
15. 在私有 tab 切到「手动编辑 JSON」模式，确认 JSON 内容包含 `private.channels` 字段（保存全量 settings 仍包含渠道数据）
16. 在模型管理页保存渠道后切到系统设置页，确认系统设置页公开 tab 的「系统可用模型」options 已按最新渠道模型更新

## 修复公开配置可用模型不随渠道同步

修复 bug.md 反馈的问题：管理后台模型管理添加渠道后，公开配置 `availableModels` 一直为空，普通用户看不到/用不了管理员配置的付费模型。根因是保存设置时只对 `availableModels` 做交集过滤（`filterEnabledModels`），从不把新渠道的模型合并进来，与 `docs/backend/system-settings.md` 描述的"自动合并"设计意图不符。

### 可测试变更

- 保存设置时自动合并新增渠道模型：`SaveSettings` 在过滤之外调用 `mergeNewEnabledChannelModels`，把本次新增启用渠道的模型并入公开配置 `availableModels`
- 空值兜底：`normalizePublicSettingWithChannels` 中过滤后若 `availableModels` 为空，则直接用当前启用渠道模型填充（首次配置/全部失效时不再出现空列表）
- 管理员手动移除的既有模型不会被加回：只合并"上次不存在、这次新出现"的启用模型，已存在但被手动取消勾选的模型保持移除状态
- 默认模型自动修复逻辑不变：默认文/图/视频模型不在可用列表时仍按原规则修复

### 涉及文件

- `Go/service/settings.go`：`SaveSettings` 增加合并调用；`normalizePublicSettingWithChannels` 增加空值填充；新增 `mergeNewEnabledChannelModels` 函数

### 验证步骤

1. 管理后台「模型管理」新增一个启用渠道（含若干模型），保存后打开系统设置页公开 tab，确认「系统可用模型」中已自动出现该渠道的模型（修复前为空）
2. 若此前 `availableModels` 为空，确认保存后默认文/图/视频模型被自动修复为列表中的有效模型
3. 在系统设置页公开 tab 手动取消勾选某个既有模型并保存，再次保存渠道配置，确认该模型不会被自动加回
4. 普通用户登录后打开生图/视频工作台或聊天，确认模型下拉中能看到并正常使用管理员配置的付费模型

## 管理后台导航重组

按管理员工作流重组后台导航为四组（用户与资费 / 模型服务 / 内容库 / 系统），隐藏"公开/私有配置"实现概念；原系统设置页拆分为「开放与定价」「存储设置」「系统偏好」「高级配置」四个新页面，并把 `promptSync` 迁进提示词来源页、`aiLog` 迁进 AI 调用日志页。详细方案见 [admin-nav-restructure.md](./admin-nav-restructure.md)。

### 可测试变更

- `admin/layout.tsx` 菜单改为 4 分组结构：用户与资费（用户管理 / 算力点日志）/ 模型服务（模型管理 / 开放与定价 / AI 调用日志）/ 内容库（提示词来源 / 提示词管理 / 素材库）/ 系统（存储设置 / 系统偏好 / 高级配置），移除原「系统设置」菜单项
- `admin/settings/page.tsx` 删除全部内容，改为 `redirect("/admin/model-pricing")`，兼容旧链接
- 新增 `admin/model-pricing/page.tsx`「开放与定价」页：系统可用模型多选（options 来自已启用渠道模型并标注来源渠道名）、未定价模型顶部 Alert 警告、模型定价表（每行算力点单价输入框）、默认文/图/视频模型 4 个 Select、`allowCustomChannel` / `allowUserRemoteChannel` 两个渠道策略开关
- 新增 `admin/storage/page.tsx`「存储设置」页：存储模式、`allowUserProvider` / `allowUserGlobalProvider` 开关、容量上限与定时测量 cron、providers 列表
- 新增 `admin/preferences/page.tsx`「系统偏好」页：访问控制（`auth.allowRegister` / `allowGuestConfig`）+ 5 个内置系统提示词 TextArea
- 新增 `admin/advanced/page.tsx`「高级配置」页：左右两栏 JSON 编辑器（公开 / 私有），页头警示"仅供排障与迁移使用"
- 新增 `admin/settings-shared.ts` 抽取共享的 `normalizeSettings` / `normalizePublicSetting` / `normalizePrivateSetting` / `filterModels` / `collectChannelModels` 等归一化函数
- `admin/prompt-sources/page.tsx` 顶部新增「定时同步」卡片：`promptSync.enabled` 开关 + Cron 表达式
- `admin/ai-logs/page.tsx` 顶部新增「日志设置」卡片：`aiLog.localDirectReportEnabled` 开关 + 自动清理开关 + 保留天数 + Cron
- 后端零改动，各新页面沿用全量 settings 读写模式（读全量 → 渲染自己负责片段 → 整体 `POST /api/admin/settings`）

### 涉及文件

前端：
- `next/src/app/(admin)/admin/layout.tsx`：菜单改为 4 分组结构，新增 4 个菜单项与 `routeMeta`，移除原「系统设置」项
- `next/src/app/(admin)/admin/settings/page.tsx`：清空原内容，改为 `redirect("/admin/model-pricing")`
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「开放与定价」页
- `next/src/app/(admin)/admin/storage/page.tsx`：新增「存储设置」页
- `next/src/app/(admin)/admin/preferences/page.tsx`：新增「系统偏好」页
- `next/src/app/(admin)/admin/advanced/page.tsx`：新增「高级配置」页
- `next/src/app/(admin)/admin/settings-shared.ts`：新增共享归一化函数
- `next/src/app/(admin)/admin/prompt-sources/page.tsx`：顶部新增「定时同步」卡片
- `next/src/app/(admin)/admin/ai-logs/page.tsx`：顶部新增「日志设置」卡片

### 验证步骤

1. 登录管理后台，确认左侧菜单显示 4 个分组：用户与资费 / 模型服务 / 内容库 / 系统
2. 确认「系统设置」菜单项已消失，原 `/admin/settings` 路径访问时自动跳转到 `/admin/model-pricing`
3. 点击「开放与定价」菜单，确认页面显示：系统可用模型多选、未定价模型 Alert（若有）、模型定价表、默认模型 Select×4、渠道策略开关×2
4. 在「模型管理」新增一个启用渠道并保存后，回到「开放与定价」页确认该渠道的模型已自动出现在「系统可用模型」中
5. 在「开放与定价」页修改某个模型的算力点单价并保存，刷新确认价格持久化
6. 切换 `allowCustomChannel` / `allowUserRemoteChannel` 两个开关，确认下方"当前：xxx"模式说明文案同步更新
7. 点击「存储设置」菜单，确认页面显示存储模式、`allowUserProvider` / `allowUserGlobalProvider` 开关、容量上限、定时测量 cron、providers 列表
8. 点击「系统偏好」菜单，确认页面显示 `auth.allowRegister` / `allowGuestConfig` 两个开关 + 5 个内置系统提示词 TextArea（image / video / text / workflow / workflowAgent）
9. 点击「高级配置」菜单，确认页面顶部有警示文案，左右两栏分别显示公开 / 私有 JSON，可格式化、可编辑、可保存
10. 点击「提示词来源」菜单，确认页面顶部新增「定时同步」卡片（开启开关 + Cron 表达式），修改 Cron 保存后刷新确认持久化
11. 点击「AI 调用日志」菜单，确认页面顶部新增「日志设置」卡片（本地直连上报开关 + 自动清理开关 + 保留天数 + Cron），修改后保存刷新确认持久化
12. 旧链接兼容：浏览器直接访问 `/admin/settings`，确认自动重定向到 `/admin/model-pricing`

## 生图/视频模型能力配置

管理后台支持按模型勾选支持的图片比例、图片档位和视频清晰度，前端生图/视频工作台根据当前所选模型的能力动态渲染选项按钮，切换模型时若当前选项不在新模型支持范围内则自动回退。详细方案见 [model-capabilities-refactor.md](./model-capabilities-refactor.md)。

### 可测试变更

- 后端 `PublicModelChannelSetting` 新增 `ModelCapabilities` 字段（`[]ModelCapability`），每项含 `model`/`imageAspects`/`imageTiers`/`videoResolutions`
- 后端 `normalizeModelCapabilities` 按 `AvailableModels` 过滤冗余项、同模型去重保留首个、字段去空格
- 空字段语义：`imageAspects` 空=无比例可选（只剩 auto）；`imageTiers` 空=无档位可选（Segmented 隐藏，只剩 auto）；`videoResolutions` 空=无清晰度按钮（只剩自定义输入兜底）
- 管理后台「开放与定价」页新增「模型能力」卡片：仅展示生图或视频模型，每个模型可勾选图片比例（8 选项）、图片档位（标准/2K/4K）、视频清晰度（480p/720p/1080p/2K/4K）；新模型默认全选，用户取消勾选并保存后按空值处理
- 前端 store `resolveEffectiveConfig` 返回当前模型的 `modelCapabilities`，切换模型时若当前 `size` 比例不在新模型能力内回退到 `auto`，若当前 `vquality` 不在新模型能力内回退到第一个支持的档位
- 生图工作台 `ImageSettingsPanel` 新增 `capabilities` prop：按 `imageTiers` 过滤 Segmented 档位（仅 1 档时隐藏 Segmented），按 `imageAspects` 过滤比例按钮（空=无比例，只剩 auto）
- 视频工作台 `VideoSettingsPanel` 新增 `capabilities` prop：按 `videoResolutions` 动态生成清晰度按钮并隐藏自定义输入框（空=无按钮 + 自定义输入兜底）
- 修复 `resolveEffectiveVideoQuality` 把 `2k`/`4k` 拼成 `2kp`/`4kp` 匹配的 bug：改为 `[quality, quality+'p']` 双候选匹配，兼容 480p/720p/1080p（带 p）和 2k/4k（不带 p）两种格式
- 修复 5 处调用方未传 `capabilities` prop 导致前端永远走默认分支（全档位 + 全比例）的问题：
  - 生图工作台 `/image`：`GenerationSettings` 内部用 `useEffectiveConfig` 取 `modelCapabilities`，按当前 `imageModel` 查找后传入
  - 视频工作台 `/video`：从 `config.modelCapabilities`（已是 effectiveConfig 派生）按当前 `model` 查找后传入
  - 画布生图浮层 `canvas-image-settings-popover.tsx`：从 `config.modelCapabilities` 按 `config.imageModel` 查找后传入
  - 画布视频浮层 `canvas-video-settings-popover.tsx`：从 `config.modelCapabilities` 按 `config.videoModel || config.model` 查找后传入
  - 创意工作流编辑器 `creative-workflow-workspace.tsx`：从 `modelConfig.modelCapabilities`（=effectiveConfig）按 `workflow.config.imageModel || workflow.config.model` 查找后传入
- 视频创作台底部设置栏（compact 布局）按模型能力配置动态显示清晰度：从 `config.modelCapabilities` 按当前 `model` 查找 `videoResolutions`，有值按配置生成选项，空数组不显示清晰度选择，未配置走默认三档 480p/720p/1080p

### 涉及文件

后端：
- `Go/model/setting.go`：新增 `ModelCapability` 结构体；`PublicModelChannelSetting` 添加 `ModelCapabilities` 字段
- `Go/service/settings.go`：新增 `normalizeModelCapabilities` 函数；`normalizePublicSettingWithChannels` 中调用

前端：
- `next/src/services/api/admin.ts`：新增 `AdminModelCapability` 类型；`AdminPublicModelChannelSettings` 添加 `modelCapabilities` 字段
- `next/src/app/(admin)/admin/settings-shared.ts`：新增 `normalizeModelCapabilities` 归一化函数
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「模型能力」编辑卡片（Checkbox.Group 勾选配置）
- `next/src/stores/use-config-store.ts`：`AiConfig` 扩展 `modelCapabilities` 字段；新增 `resolveEffectiveImageSize` / `resolveEffectiveVideoQuality` 回退函数
- `next/src/components/image-settings-panel.tsx`：新增 `capabilities` prop；按能力过滤档位和比例
- `next/src/components/video-settings-panel.tsx`：新增 `capabilities` prop；按能力动态生成清晰度选项
- `next/src/app/(user)/image/page.tsx`：`GenerationSettings` 内部 `useEffectiveConfig` 取能力并传入 `ImageSettingsPanel`
- `next/src/app/(user)/video/page.tsx`：`VideoSettingsPanel` 调用传入 `capabilities`；底部设置栏（compact 布局）按 `config.modelCapabilities` 动态生成清晰度选项，空 `videoResolutions` 时不显示清晰度选择
- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：`ImageSettingsPanel` 调用传入 `capabilities`
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：`VideoSettingsPanel` 调用传入 `capabilities`
- `next/src/components/workflows/creative-workflow-workspace.tsx`：`ImageSettingsPanel` 调用传入 `capabilities`

文档：
- `docs/backend/backend-database.md`：新增 `modelCapabilities` 字段及每项字段说明

### 验证步骤

1. 启动后端和前端，登录管理后台访问 `/admin/model-pricing`
2. 确认页面底部显示「模型能力」卡片，仅列出生图或视频模型（非文本/音频模型）
3. 为某个生图模型勾选部分图片比例（如仅 1:1 / 16:9 / 9:16）和图片档位（如标准 / 2K），保存后刷新确认持久化
4. 为某个视频模型勾选部分视频清晰度（如仅 720p / 1080p），保存后刷新确认持久化
5. 退出登录或用普通账号，进入生图工作台 `/image`
6. 选择刚才配置了能力的生图模型，确认：
   - Segmented 档位切换器只显示已勾选的档位（如标准 / 2K，无 4K）
   - 比例按钮只显示已勾选的比例（如 1:1 / 16:9 / 9:16，无其他）
7. 在管理后台清空某生图模型的比例勾选并保存，回到生图工作台选择该模型，确认比例区只剩 auto（无其他比例按钮）
8. 在管理后台清空某生图模型的档位勾选并保存，回到生图工作台选择该模型，确认 Segmented 切换器隐藏，只剩 auto
9. 当前选中 16:9-4k 后切换到不支持 4K 的模型，确认 `size` 自动回退到 16:9（标准档位）或 auto
10. 进入视频创作台 `/video`，选择刚才配置了能力的视频模型
11. 确认清晰度按钮只显示已勾选的选项（如 720p / 1080p / 2K / 4K），自定义清晰度输入框隐藏
12. 在管理后台清空某视频模型的清晰度勾选并保存，回到视频工作台选择该模型，确认无清晰度按钮，只剩自定义输入框
13. 当前选中 1080p 后切换到不支持 1080p 的视频模型，确认 `vquality` 自动回退到第一个支持的档位
14. 切换视频工作台为底部 compact 布局（若当前为 side 布局），确认底部"清晰度"下拉同样按模型能力配置动态显示：有值显示对应选项，空数组不显示清晰度下拉，未配置走默认三档 480p/720p/1080p
15. 新增一个生图/视频模型到开放模型列表，刷新管理后台，确认该模型在「模型能力」卡片中默认全选

## 生图接口模式（apiMode）改为后台渠道控制

将生图接口模式（Images API / Responses API）从前端用户级配置改为后台渠道级配置，用户不再需要也无法手动切换。前端根据当前生图模型所属渠道的 `apiMode` 自动解析。

### 可测试变更

- 后端 `ModelChannel` 和 `PublicModelChannelInfo` 新增 `ApiMode` 字段（`images` 默认 / `responses`）
- 后端 `normalizeModelChannel` 归一化 `ApiMode`：非 `responses` 一律视为 `images`
- 后端 `publicChannelInfos` 透传 `ApiMode` 到公开配置
- 前端 `AdminModelChannel` / `AdminPublicModelChannelInfo` 类型新增 `apiMode` 字段
- 管理后台「模型管理」渠道编辑抽屉新增「生图接口」Select（Images API / Responses API），默认 Images API
- 前端 store `resolveEffectiveConfig` 根据当前生图模型所属渠道的 `apiMode` 自动解析；本地模式固定 `images`；找不到渠道默认 `images`
- 删除前端 3 处 `apiMode` 手动切换 UI：
  - 生图工作台 `/image` 主面板的「接口模式」Segmented
  - 生图工作台 `/image` 快速配置弹窗的「接口模式」Segmented
  - 创意工作流编辑器 `creative-workflow-workspace.tsx` 的 apiMode Select
- 工作流任务沿用 `effectiveConfig.apiMode`（由渠道决定），用户无法再手动覆盖

### 涉及文件

后端：
- `Go/model/setting.go`：`ModelChannel` 和 `PublicModelChannelInfo` 新增 `ApiMode` 字段
- `Go/service/settings.go`：`normalizeModelChannel` 归一化 `ApiMode`；`publicChannelInfos` 透传 `ApiMode`

前端：
- `next/src/services/api/admin.ts`：`AdminModelChannel` 和 `AdminPublicModelChannelInfo` 新增 `apiMode` 字段
- `next/src/app/(admin)/admin/channels/page.tsx`：`emptyChannel`/`normalizeChannel` 处理 `apiMode`；渠道编辑抽屉新增「生图接口」Select
- `next/src/stores/use-config-store.ts`：`resolveEffectiveConfig` 解析 `apiMode`
- `next/src/app/(user)/image/page.tsx`：删除两处 apiMode Segmented
- `next/src/components/workflows/creative-workflow-workspace.tsx`：删除 apiMode Select

### 验证步骤

1. 进入管理后台「模型管理」，编辑或新建一个渠道，确认表单出现「生图接口」Select，默认 Images API
2. 将某渠道的「生图接口」改为 Responses API 并保存，刷新确认持久化
3. 进入生图工作台 `/image`，确认主面板和快速配置弹窗都不再有「接口模式」切换
4. 选择步骤 2 配置为 Responses API 的渠道下的生图模型，发起一次生图请求，确认请求走 `/responses` 端点（看网络面板或日志 Tag 显示 Responses）
5. 选择其他仍为 Images API 的渠道下的生图模型，发起生图请求，确认走 `/images/generations` 端点
6. 进入创意工作流编辑器，确认配置区不再有 apiMode Select；运行工作流时按当前模型所属渠道的 apiMode 发起请求
7. 切换本地直连模式，确认生图请求固定走 Images API（本地模式不读渠道 apiMode）

## 生图/视频工作台参数精简与视频秒数后台控制

精简生图/视频工作台底部栏与画布节点设置面板的参数，删除生图质量选项和尺寸 W/H 输入框（保留比例），「清晰度」文案统一改为「分辨率」，视频秒数从固定档位/数值输入改为 Slider 进度条，并由后台 `ModelCapability` 的 `videoSecondsMin`/`videoSecondsMax` 统一控制范围（默认 4-20 秒）。

### 可测试变更

- 后端 `ModelCapability` 新增 `VideoSecondsMin` / `VideoSecondsMax`（指针类型，空=默认 4-20）
- 前端 `AdminModelCapability` 类型同步新增 `videoSecondsMin` / `videoSecondsMax`
- 管理后台「模型开放与定价」视频模型配置区新增「视频秒数范围（默认 4-20）」两个 InputNumber，新模型默认填 4/20
- 前端 `use-config-store` 新增 `resolveVideoSecondsRange(cap)` 工具函数（默认 4-20），`resolveEffectiveConfig` 切换模型时 clamp `videoSeconds` 到新范围（保留 -1 智能时长原值）
- 删除生图质量选项：
  - 生图工作台 `/image` 底部栏「质量」QuickSelect、`quickQualityOptions`、`settingsSummary` 的 quality 项、日志 quality Tag/字段
  - `ImageSettingsPanel` 的「质量」栏、`qualityOptions`、`imageQualityLabel`、`DimensionInput`、`readSizeDimensions`、`alignDimension`
  - `canvas-image-settings-popover.tsx` 的 `imageQualityLabel` 引用与 quality 变量
  - 创意工作流日志 quality Tag 与 `createWorkflowConfig`/`buildWorkflowImageLog` 的 quality 字段
  - `AiConfig.quality` 字段保留（兼容历史日志反序列化），不再有 UI 读写入口，API 层仍按默认值发送
- 删除生图/视频尺寸 W/H 输入框（保留比例栏）：
  - `ImageSettingsPanel` 删除「尺寸」W/H 输入栏与「16 倍数对齐」开关
  - `VideoSettingsPanel` 通用面板删除「尺寸」W/H 输入栏
  - `/video` 底部栏删除「尺寸」QuickSelect 与 `quickSizeOptions`
- 「清晰度」文案统一改为「分辨率」：
  - `/video` 底部栏、`VideoSettingsPanel` 通用面板、后台 model-pricing 视频配置区
  - 画布 Agent 工具描述与 Skill 文档（`canvas-agent-tools.ts` / `core.ts` / `video.ts`）
- 视频秒数改 Slider + 后台范围控制：
  - 新增 `QuickSlider`（`/video` 底部栏）和 `SecondsSlider`（`VideoSettingsPanel`）组件，使用 antd Slider
  - `/video` 底部栏通用分支：`QuickNumber` 秒数 → `QuickSlider`，范围 `resolveVideoSecondsRange(videoCap)`
  - `/video` 底部栏 Kling 分支 `KlingV26BottomSettings`：秒数 → Slider，范围从父级传入；「尺寸」文案改「比例」
  - `VideoSettingsPanel` 通用面板：秒数 OptionPill+NumberInput → `SecondsSlider`
  - `KlingV26VideoSettingsPanel`：秒数 OptionPill+NumberInput → `SecondsSlider`，「时长」改「秒数」
  - `kling-v26-workbench-panel.tsx`：秒数 OptionGrid+NumberInput → Slider，删除 V3 初始化 useEffect
  - `SeedanceVideoSettingsPanel`：保留 OptionPill（含 -1 智能时长）+ NumberInput，「时长」改「秒数」，NumberInput max 改用 `secondsRange.max`
  - 删除 `secondOptions` / `klingV26DurationOptions` / `klingV3DurationOptions` / `normalizeKlingV26Duration` / `normalizeKlingV3Duration` 等硬编码定义
  - 删除 `/video` 的 V3 秒数初始化 `useEffect`（统一由 `resolveEffectiveVideoSeconds` clamp）
- 新增专属面板参数梳理文档 `docs/backend/video-exclusive-panels-params.md`，记录通用/Kling V26 V3/Seedance/Grok 四套面板的硬编码参数与后端 `ModelCapability` 扩展建议字段，作为后续后端统一控制的参考

### 涉及文件

后端：
- `Go/model/setting.go`：`ModelCapability` 新增 `VideoSecondsMin` / `VideoSecondsMax`

前端：
- `next/src/services/api/admin.ts`：`AdminModelCapability` 新增 `videoSecondsMin` / `videoSecondsMax`
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增 `setModelCapabilitySeconds`、视频秒数范围配置 UI、视频清晰度→分辨率文案
- `next/src/stores/use-config-store.ts`：新增 `resolveVideoSecondsRange` 与 `resolveEffectiveVideoSeconds`
- `next/src/app/(user)/image/page.tsx`：删除质量 QuickSelect/quickQualityOptions/settingsSummary/日志 quality
- `next/src/app/(user)/video/page.tsx`：新增 QuickSlider、删除尺寸 QuickSelect/quickSizeOptions、秒数改 Slider、清晰度→分辨率、删除 V3 初始化 useEffect
- `next/src/components/image-settings-panel.tsx`：删除质量栏/尺寸W/H栏/imageQualityLabel/DimensionInput/readSizeDimensions/alignDimension
- `next/src/components/video-settings-panel.tsx`：删除尺寸W/H栏、清晰度→分辨率、秒数改 SecondsSlider、Kling 时长→秒数、Seedance 时长→秒数、删除硬编码档位
- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：删除 imageQualityLabel 引用
- `next/src/app/(user)/video/components/kling-v26-workbench-panel.tsx`：秒数改 Slider、删除 V3 初始化
- `next/src/components/workflows/creative-workflow-workspace.tsx`：删除日志 quality Tag/字段
- `next/src/app/(user)/canvas/agent/canvas-agent-tools.ts` / `skills/core.ts` / `skills/video.ts`：清晰度→分辨率文案

文档：
- `docs/backend/video-exclusive-panels-params.md`：新增（专属面板参数梳理 + 后端扩展建议）

### 验证步骤

1. 生图工作台 `/image`：确认底部栏只剩「模型 / 尺寸 / 数量」等，无「质量」选项；画布节点 ImageSettingsPanel 无「质量」栏和「尺寸」W/H 输入，只保留「比例」栏
2. 生图工作台日志区：确认历史日志和新生成日志都不再显示 quality Tag
3. 视频工作台 `/video`：确认底部栏无「尺寸」QuickSelect，「清晰度」文案变为「分辨率」
4. 视频工作台底部栏秒数：确认是 Slider 进度条（带 {N}s 数值显示），拖动范围 4-20；切换不同视频模型，Slider 范围按后台配置变化
5. 管理后台「模型开放与定价」：视频模型配置区出现「视频秒数范围（默认 4-20）」两个输入框，修改某模型为 6-12 保存，回到视频工作台选该模型，确认 Slider 范围变为 6-12
6. 视频工作台选 Kling V26/V3 模型：确认专属面板与底部栏的秒数都是 Slider，范围从后台读取，「尺寸」文案变为「比例」
7. 视频工作台选 Seedance 模型：确认秒数仍保留「智能」选项和数值输入（-1 智能时长保留），但 max 从后台读取，「时长」文案变为「秒数」
8. 画布节点视频设置面板：通用面板秒数是 Slider，Kling 面板秒数是 Slider，「清晰度」变「分辨率」
9. 创意工作流编辑器：确认工作流日志不再显示 quality Tag

## 画布视频设置弹窗改为能力开关驱动

把画布视频节点设置弹窗（`canvas-video-settings-popover.tsx`）中按 `panelType` 厂商分流 UI 的逻辑改为完全由 `ModelCapability` 能力开关驱动，使每个视频模型都能通过后台勾选能力开关来控制多镜头、元素列表、首尾帧、运动控制等功能的显隐，不再绑定厂商专属面板类型。

### 可测试变更

- 移除 `isKlingV3` / `isKlingMotionControl` / `isKIEKlingV3` 等基于 `panelType` 的 UI 分流变量
- 角色朝向参考（运动控制）：改为 `resolveSupportsMotionControl(cap) === true` 时显示，不再仅限 `motion-control` 面板类型
- 多镜头分镜 / 分镜模式 / 分镜提示词：改为 `resolveSupportsMultiShot(cap) === true` 时显示，不再仅限 `kling-v3` 面板类型
- 元素列表：改为 `resolveSupportsElementList(cap) === true` 时显示，不再仅限 `kling-v3` 面板类型
- 首尾帧：改为 `resolveSupportsFirstLastFrame(cap) === true` 时显示；`kling-v3` 请求体格式仍使用 `klingImageNodeIds` 元数据存储，其他格式使用 `firstFrameNodeId` / `lastFrameNodeId` props
- 负面提示词：移除 `hideNegativePrompt` 传参，完全由 `VideoSettingsPanel` 内部的 `resolveSupportsNegativePrompt` 能力开关控制
- `KlingV3AdvancedSettings` 组件重命名为 `AdvancedVideoSettings`，参数改为接收 `supportsMultiShot` / `supportsElementList` / `supportsFirstLastFrame` / `useKlingMultiShotBehavior` 能力开关
- `panelType` 和 `provider` 仅用于决定首尾帧存储格式和 KIE 多镜头行为差异（请求体格式层面），不再控制 UI 功能区块的显隐

### 涉及文件

- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：移除厂商分流变量，改用能力开关；重命名 `KlingV3AdvancedSettings` → `AdvancedVideoSettings`；移除 `hideNegativePrompt` 传参和重复的负面提示词区块；清理未使用的 `Input` / `CSSProperties` 导入

### 验证步骤

1. 进入管理后台「模型开放与定价」，选一个通用视频模型（非 Kling V3），勾选「多镜头」能力开关，保存
2. 进入画布，新建视频节点选择该模型，打开设置弹窗，确认出现「多镜头分镜」区块（之前仅 Kling V3 面板类型才显示）
3. 取消勾选「多镜头」，勾选「元素列表」，保存后刷新画布，确认设置弹窗出现「元素列表」区块
4. 勾选「运动控制」，确认出现「角色朝向参考」区块（之前仅 motion-control 面板类型才显示）
5. 勾选「首尾帧」，确认出现「首尾帧」区块（之前仅非 Kling V3 模型才显示通用首尾帧）
6. 勾选「负面提示词」，确认 `VideoSettingsPanel` 内出现负面提示词输入框
7. 选一个 Kling V3 模型（面板类型 = kling-v3），确认首尾帧使用 `klingImageNodeIds` 元数据存储格式，多镜头/元素列表按能力开关显示
8. 确认 `panelType` 为 `kling-v3` 且 `provider` 为 `kie` 时，多镜头行为仍保持 KIE 特有逻辑（不设置 shotType、分镜提示词直接显示）

## 视频专属面板能力后台化重构

把视频工作台和画布节点设置面板中按「模型名 + 渠道文本」硬编码判断面板类型、厂商、模式、比例、能力开关的逻辑，统一改为读后端 `ModelCapability` 配置。新增模型或厂商调整参数只需后台改配置，前端不再硬编码分支。

### 可测试变更

- 后端 `ModelCapability` 新增视频面板控制字段（替代前端按模型名 + 渠道硬编码判断面板和请求体格式）：
  - `VideoPanelType`：面板类型，空=通用面板；`kling-v26` / `kling-v3` / `seedance` / `grok` / `motion-control` / `agnes`
  - `VideoProvider`：厂商，空=不区分；`apimart` / `kie`（仅 `kling-v3` / `motion-control` 需要区分请求体格式）
  - `VideoModes`：视频模式选项数组（Kling `std`/`pro`/`4k`、Grok `fun`/`normal`/`spicy`），空=不支持模式选择；新增 `VideoModeOption` 结构体（`value`/`label`/`desc`）
  - `VideoRatios`：视频比例选项（如 `16:9`/`9:16`/`1:1`/`adaptive`），空=通用面板走默认 `sizeOptions`
  - `VideoSecondsPresets`：秒数预设档位（如 `[5,10]`），空=连续 Slider；有值=按档位显示 OptionPill
  - `VideoSecondsSmart`：是否支持 `-1` 智能时长（Seedance）
  - 能力开关：`SupportsNegativePrompt` / `SupportsFirstLastFrame` / `SupportsMotionControl` / `SupportsAudioGeneration` / `SupportsWatermark` / `SupportsMultiShot` / `SupportsElementList`
  - 音频生成限制：`AudioRequiresMode`（如 Kling V26 要求 `mode=pro`）、`AudioMaxReferences`（如 Kling V26 要求参考图 ≤1）
- 前端 `AdminModelCapability` 类型同步新增上述字段，`AdminVideoModeOption` 类型新增
- 前端 `use-config-store` 新增 resolve 工具函数：`resolveVideoPanelType` / `resolveVideoProvider` / `resolveVideoModes` / `resolveVideoRatios` / `resolveVideoSecondsPresets` / `resolveVideoSecondsSmart` / `resolveSupportsNegativePrompt` / `resolveSupportsFirstLastFrame` / `resolveSupportsMotionControl` / `resolveSupportsAudioGeneration` / `resolveSupportsWatermark` / `resolveSupportsMultiShot` / `resolveSupportsElementList` / `resolveAudioRequiresMode` / `resolveAudioMaxReferences` / `findModelCapability`
  - 能力开关 resolve 返回 `boolean | undefined`：未配置（`undefined`）= 走前端默认硬编码兜底；有值 = 按配置
- 管理后台「模型开放与定价」视频模型配置区新增「视频专属面板配置」区块：
  - 面板类型 Select（通用/Kling V26/Kling V3/Seedance/Grok/Motion Control/Agnes）
  - 厂商 Select（仅面板类型为 `kling-v3` 或 `motion-control` 时显示，apimart/kie）
  - 视频比例 Checkbox.Group（16:9/9:16/1:1/4:3/3:4/21:9/adaptive）
  - 能力开关 Checkbox 组：负面提示词/首尾帧/运动控制/音频生成/水印/多镜头/元素列表/智能时长(-1)
  - 音频生成限制（仅勾选「音频生成」时显示）：需要模式 Select + 最大参考图 InputNumber
- 前端 `VideoSettingsPanel` 通用面板按 `videoPanelType` 分流到 Kling V26 / Seedance 专属面板；通用分支按 `videoModes` 动态渲染模式 OptionPill、按 `videoRatios` 动态渲染比例按钮（空=走默认 `sizeOptions`）、按 `resolveSupportsAudioGeneration` 控制音频生成开关显隐
- 前端 `/video` 工作台 `buildVideoConfig` 与 `createVideoRequestBody` 改用 `resolveVideoPanelType` / `resolveVideoProvider` 判断面板和厂商，替代原 `isKlingV26VideoModel` / `isSeedanceVideoConfig` / `isAPIMartKlingV26Config` 等按模型名 + 渠道文本硬编码判断
- 画布 `canvas-video-settings-popover` 与 `canvas-client-page` 视频能力判断改用 `findModelCapability` + `resolveSupportsFirstLastFrame` / `resolveSupportsAudioGeneration` / `resolveVideoPanelType` / `resolveVideoProvider`
- 删除已废弃的硬编码判断函数：
  - `next/src/lib/video-model-capabilities.ts`：删除 `supportsVideoFrameReferences` / `supportsVideoAudioGeneration`
  - `next/src/lib/seedance-video.ts`：删除 `isSeedanceVideoConfig` / `isSeedanceVideoModel` / `isSeedanceFastOrMiniModel` / `isArkPlanBaseUrl`

### 涉及文件

后端：
- `Go/model/setting.go`：`ModelCapability` 新增视频面板字段；新增 `VideoModeOption` 结构体

前端：
- `next/src/services/api/admin.ts`：`AdminModelCapability` 新增字段；新增 `AdminVideoModeOption` 类型
- `next/src/stores/use-config-store.ts`：新增 16 个 resolve 工具函数与 `findModelCapability`
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「视频专属面板配置」区块（面板类型/厂商/比例/能力开关/音频限制）及对应 `setModelCapabilityValue` / `setModelCapabilityBool` / `setModelCapabilityNumber` 辅助函数
- `next/src/components/video-settings-panel.tsx`：通用面板按 `videoPanelType` 分流；通用分支动态渲染模式/比例/音频开关
- `next/src/app/(user)/video/page.tsx`：`buildVideoConfig` 与请求体构造改用 `panelType` / `provider`
- `next/src/services/api/video.ts`：`createVideoRequestBody` 改用 `panelType` / `provider` 判断 Kling / Motion Control / Seedance / Grok 分支
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：能力判断改用 resolve 函数
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：视频首尾帧/音频生成/Kling V3 kie 判断改用 resolve 函数
- `next/src/lib/video-model-capabilities.ts`：删除 `supportsVideoFrameReferences` / `supportsVideoAudioGeneration`
- `next/src/lib/seedance-video.ts`：删除 `isSeedanceVideoConfig` / `isSeedanceVideoModel` / `isSeedanceFastOrMiniModel` / `isArkPlanBaseUrl`

文档：
- `docs/backend/backend-database.md`：`modelCapabilities` 字段说明同步新增视频面板字段
- `docs/backend/video-exclusive-panels-params.md`：标记已接入后台控制的参数

### 验证步骤

1. 进入管理后台「模型开放与定价」，选一个视频模型，确认视频配置区出现「视频专属面板配置」区块
2. 把某 Kling V26 模型的「面板类型」设为 `Kling V26`，保存；进入视频工作台选该模型，确认走 Kling V26 专属面板（模式 std/pro、比例 16:9/9:16/1:1、秒数 Slider）
3. 把某 Kling V3 模型的「面板类型」设为 `Kling V3`、「厂商」设为 `apimart`，保存；进视频工作台选该模型，确认走 Kling V3 面板（模式 std/pro/4k、多镜头、元素列表）
4. 把上一步模型「厂商」改为 `kie`，保存；确认负面提示词栏隐藏、请求体走 kie 格式（看网络面板 `multi_prompt`/`element_list` 为 kie 格式）
5. 把某 Seedance 模型的「面板类型」设为 `Seedance`、勾选「智能时长(-1)」，保存；进视频工作台选该模型，确认秒数保留 `-1` 智能选项
6. 把某 Grok 视频模型的「面板类型」设为 `Grok`，配置 `videoModes`（fun/normal/spicy），保存；进视频工作台选该模型，确认通用面板出现模式 OptionPill
7. 把某通用视频模型的「视频比例」勾选 `16:9`/`9:16`，保存；进视频工作台选该模型，确认比例栏只显示这两个按钮（不再走默认 sizeOptions）
8. 把某模型勾选「音频生成」+ 填「需要模式 = pro」「最大参考图 = 1」，保存；进视频工作台选该模型，确认音频生成开关仅在 `pro` 模式下可用且参考图 ≤1
9. 把某模型「面板类型」清空（通用），保存；确认视频工作台走通用面板（默认 sizeOptions、无模式选择、无音频开关除非勾选）
10. 进入画布，新建视频节点，确认节点设置弹窗与画布 Agent 视频生成按 `ModelCapability` 配置走对应面板与能力开关
11. 确认前端代码中 `isSeedanceVideoConfig` / `isSeedanceVideoModel` / `supportsVideoFrameReferences` / `supportsVideoAudioGeneration` 等硬编码函数已删除，无残留引用

## Seedance 分辨率与参考素材限制后台化收尾

完成「生图/视频模型能力配置」剩余 2 项收尾，让模型能力后台化重构形成完整闭环。任务 3（后端 `apimartImageConfig` / `kieModelInputConfig` 优先读配置）本轮跳过，后续按需补。

### 可测试变更

- **任务 1：Seedance 分辨率改读 `videoResolutions`**（实际 UI 早已走配置，本轮清理死代码 + 补默认档位）
  - `next/src/components/video-settings-panel.tsx`：默认 `resolutionOptions` 从 `720p/480p` 两档补为 `480p/720p/1080p` 三档，与底部栏 `quickResolutionOptions` 和任务要求「未配置=默认三档」对齐
  - `next/src/lib/seedance-video.ts`：删除 5 个死代码成员（`seedanceResolutionOptions` / `seedancePixels` / `normalizeSeedanceResolution` / `normalizeResolutionToken` / `seedancePixelLabel`），它们仅互相引用，全仓无外部调用方
- **任务 2：Seedance 参考素材数量限制改后台配置**（字节限制 30MB/50MB/15MB 保持硬编码不动）
  - 后端 `Go/model/setting.go`：`ModelCapability` 新增 `MaxImageReferences` / `MaxVideoReferences` / `MaxAudioReferences` 三个 int 字段，`0=走前端默认`
  - 后端 `Go/service/settings.go`：`normalizeModelCapabilities` 直接 append item，新字段自动透传无需改动
  - 前端 `next/src/services/api/admin.ts`：`AdminModelCapability` 新增 `maxImageReferences?` / `maxVideoReferences?` / `maxAudioReferences?`
  - 前端 `next/src/app/(admin)/admin/settings-shared.ts`：`normalizeModelCapabilities` 透传三个新字段
  - 前端 `next/src/app/(admin)/admin/model-pricing/page.tsx`：视频能力卡片新增「参考素材数量上限（0=默认）」区块，含图片/视频/音频三个 `InputNumber`；`setModelCapabilityNumber` 的 field 联合类型扩展支持新字段
  - 前端 `next/src/stores/use-config-store.ts`：新增 `resolveMaxImageReferences` / `resolveMaxVideoReferences` / `resolveMaxAudioReferences` 三个 resolve 函数，`0=走前端默认`
  - 前端 `next/src/app/(user)/video/page.tsx`：主组件新增 `referenceLimits` 对象（从 `klingWorkbenchCap` 解析数量上限，0 回退 `SEEDANCE_REFERENCE_LIMITS` 默认值），`addReferences` / `addReferencesFromClipboard` / `addVideoReferencesFromClipboard` / `addAudioReferencesFromClipboard` / `insertPickedAsset` 中所有数量引用改用 `referenceLimits`，字节引用保持 `SEEDANCE_REFERENCE_LIMITS`

### 涉及文件

后端：
- `Go/model/setting.go`：`ModelCapability` 新增 `MaxImageReferences` / `MaxVideoReferences` / `MaxAudioReferences`

前端：
- `next/src/services/api/admin.ts`：`AdminModelCapability` 新增三个字段
- `next/src/app/(admin)/admin/settings-shared.ts`：`normalizeModelCapabilities` 透传
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增「参考素材数量上限」配置 UI
- `next/src/stores/use-config-store.ts`：新增 3 个 resolve 函数
- `next/src/app/(user)/video/page.tsx`：新增 `referenceLimits`，数量引用改读模型能力
- `next/src/components/video-settings-panel.tsx`：默认 `resolutionOptions` 补 1080p
- `next/src/lib/seedance-video.ts`：删除 5 个分辨率相关死代码成员

文档：
- `docs/backend/backend-database.md`：`modelCapabilities` 新增三个字段说明
- `docs/backend/video-exclusive-panels-params.md`：标记 Seedance 分辨率与参考素材限制已接入
- `docs/progress/todo.md`：移除已完成的 2 项待办

### 验证步骤

1. 进入视频工作台选一个 Seedance 模型，确认分辨率选项按后台 `videoResolutions` 配置显示（未配置=默认 480p/720p/1080p 三档，空数组=仅自定义输入框）
2. 进入管理后台「模型开放与定价」，选一个 Seedance 模型，确认视频能力卡片出现「参考素材数量上限（0=默认）」区块，含图片/视频/音频三个输入框
3. 把某 Seedance 模型的「最大图片」填 `5`、「最大视频」填 `1`、「最大音频」填 `2`，保存；进视频工作台选该模型，上传参考素材确认图片上限 5、视频上限 1、音频上限 2（超过的会被忽略）
4. 把上一步模型三个输入框清空（或填 0）保存；进视频工作台选该模型，确认参考素材上限回退到默认值（图片 9、视频 3、音频 3）
5. 切换到 Kling V26 模型，确认参考素材仍走 Kling 固定逻辑（图片 2，无视频/音频），不受新字段影响
6. 确认参考素材字节限制（图片 30MB、视频 50MB、音频 15MB）保持硬编码不变，上传超限文件仍提示「已忽略超过 XX MB 的参考素材」
7. 确认前端代码中 `seedanceResolutionOptions` / `normalizeSeedanceResolution` / `seedancePixelLabel` / `seedancePixels` / `normalizeResolutionToken` 已删除，无残留引用

## 模型能力配置拆分与任务数量移除

把「模型能力」单卡片拆为「图片模型能力」和「视频模型能力」两个独立卡片；修复视频能力配置保存后能力开关丢失的问题；移除视频创作台任务数量输入框。

### 可测试变更

- 管理后台「模型开放与定价」原「模型能力」卡片拆为两张：
  - 「图片模型能力」：仅展示图片模型，配置图片比例、图片档位
  - 「视频模型能力」：仅展示视频模型，配置视频分辨率、秒数范围、请求体格式、厂商、视频比例、视频模式、能力开关、音频限制
- 修复 `normalizeModelCapabilities` 仅保留 `imageAspects`/`imageTiers`/`videoResolutions` 三个字段导致保存后 `videoPanelType`/`videoProvider`/`videoModes`/`videoRatios`/`videoSecondsSmart`/`supportsXxx`/`audioRequiresMode`/`audioMaxReferences` 全部丢失的问题；现在归一化时保留全部字段
- 视频能力配置删除「秒数预设档位」Select（与秒数范围冲突，统一只用 Slider 拉动条），删除对应 `setModelCapabilityPresets` 辅助函数
- `VideoSettingsPanel` 移除 OptionPill + NumberInput 秒数分支，统一走 `SecondsSlider`；删除未使用的 `NumberInput` 组件与 `resolveVideoSecondsPresets` resolve 函数
- 视频创作台移除「任务数量」输入框：
  - 删除 `TaskCountControl` 组件、`QuickNumber` 组件、`clampQuickNumberValue`、`normalizeVideoCount` 函数
  - 删除 `taskCount` state、`onTaskCountChange` prop 及其在 `WorkbenchMain` / `WorkbenchBottomBar` / `WorkbenchCompactBar` 三处子组件的传参
  - 删除底部 QuickNumber「任务」快捷按钮与「任务数量」WorkbenchSection
  - `buildRequestSnapshot` 内部 `taskCount` 固定为 1，日志/结果对象的 `taskCount` 字段保留兼容（恒为 1）

### 涉及文件

- `next/src/app/(admin)/admin/settings-shared.ts`：`normalizeModelCapabilities` 保留全部字段
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：拆分图片/视频能力卡片；删除秒数预设档位 UI 与 `setModelCapabilityPresets`
- `next/src/components/video-settings-panel.tsx`：秒数统一走 Slider；删除 `NumberInput` 组件
- `next/src/stores/use-config-store.ts`：删除 `resolveVideoSecondsPresets`
- `next/src/app/(user)/video/page.tsx`：删除任务数量 UI、`TaskCountControl`、`QuickNumber`、`normalizeVideoCount`、`taskCount` state 与相关 prop

### 验证步骤

1. 进入管理后台「模型开放与定价」，确认页面分别出现「图片模型能力」和「视频模型能力」两张卡片，图片模型只出现在图片卡片、视频模型只出现在视频卡片
2. 在视频能力卡片勾选某模型的「首尾帧」「音频生成」「多镜头」等多个能力开关，点击保存；刷新页面重新进入，确认勾选状态全部保留（不再丢失）
3. 在视频能力卡片配置某模型的「视频模式」（添加 2-3 个模式）、「请求体格式」、勾选「智能时长(-1)」，保存后刷新，确认全部保留
4. 确认视频能力卡片不再显示「秒数预设档位」配置项
5. 进入视频创作台，确认底部工具栏和侧边栏都不再有「任务数量」输入框或「任务」QuickNumber 按钮
6. 在视频创作台发起一次生成，确认日志/结果卡片中「数量」标签显示为 1，生成流程正常
7. 进入画布视频节点设置弹窗，确认秒数为 Slider 拉动条（不再有 OptionPill 按钮组），范围按 `videoSecondsMin`/`videoSecondsMax` 配置

## 图像/视频设置面板修复

修复画布图像节点分辨率档位消失、生成数量输入框显示与实际值不一致、视频比例中文标签三个问题。

### 可测试变更

- 画布图像节点设置弹窗分辨率档位（标准/2K/4K）消失修复：`ImageSettingsPanel` 的 `effectiveTiers` / `effectiveAspects` 逻辑调整为「`capabilities` 未传或对应字段为空数组 = 未配置，走默认全部；传入非空数组 = 按配置过滤」。此前 `imageTiers` 为空数组时会隐藏档位 Segmented，现在空数组视为未配置，显示全部 3 档
- 「生成张数」改名为「生成数量」
- 生成数量输入框显示值与实际值不一致修复：`ImageSettingsPanel` 的 `count` 变量此前被 `Math.min(maxCount, ...)` 截断传给 `CountInput` 的 `value`，导致输入超过 `maxCount`（默认 15）时显示回退到 15 但 `onConfigChange` 传原始值。现在 `count` 不再做 `maxCount` 截断，输入框显示用户实际输入值
- 画布 `getGenerationCount` 上限从 15 提升到 50，允许生成超过 15 张
- 视频比例标签从中文（横屏/竖屏/方形/宽屏/长图/宽银幕）改为比例格式（16:9/9:16/1:1/4:3/3:4/21:9），与图片比例提示一致；`sizeOptions` 和 `seedanceRatioOptions` 同步修改

### 涉及文件

- `next/src/components/image-settings-panel.tsx`：`effectiveTiers`/`effectiveAspects` 空数组视为未配置；`count` 不再截断；「生成张数」→「生成数量」
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：`getGenerationCount` 上限 15 → 50
- `next/src/components/video-settings-panel.tsx`：`sizeOptions` 标签改比例格式
- `next/src/lib/seedance-video.ts`：`seedanceRatioOptions` 标签改比例格式

### 验证步骤

1. 进入画布，选中图像节点，打开设置弹窗，确认「比例」行右侧出现「标准/2K/4K」三档切换按钮（不再消失）
2. 在画布图像节点设置弹窗点击「4K」档位，确认下方比例按钮切换为 4K 尺寸选项
3. 在「生成数量」输入框输入 20，确认输入框显示 20（不再回退到 15）；发起生成，确认实际生成数量与输入一致
4. 确认「生成数量」标题已从「生成张数」改为「生成数量」
5. 进入视频工作台或画布视频节点设置弹窗，确认比例按钮标签为「16:9」「9:16」「1:1」等比例格式（不再显示「横屏」「竖屏」「方形」）
6. 确认画布视频设置弹窗底部状态栏的比例显示也为比例格式（如「16:9」而非「横屏」）

## 图像档位查找与视频比例显示修复

修复画布图像节点档位 Segmented 不显示、视频比例按钮显示像素尺寸两个问题。

### 可测试变更

- 画布图像节点设置弹窗 `capabilities` 查找模型字段从 `config.imageModel` 改为 `config.imageModel || config.model`：画布节点切换图片模型时只更新 `model` 字段，`imageModel` 可能为空，导致 `modelCapabilities.find` 返回 `undefined`；现在优先用 `imageModel`，回退到 `model`，确保找到对应模型的能力配置
- 视频比例按钮删除副标签（此前会显示 `seedancePixelLabel` 计算的像素尺寸如「1280x720」），现在只显示比例主标签（如「16:9」）
- 画布视频设置弹窗底部状态栏 `videoSizeLabel` 改为新增的 `videoSizeRatioLabel`：把像素尺寸（如「1280x720」）统一映射为比例字符串（如「16:9」），不再显示像素尺寸
- 删除不再使用的 `videoSizeLabel` 函数和 `seedancePixelLabel` import

### 涉及文件

- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：`capabilities` 查找用 `imageModel || model`
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：状态栏用 `videoSizeRatioLabel`
- `next/src/components/video-settings-panel.tsx`：删除比例按钮副标签；`videoSizeLabel` 改名为 `videoSizeRatioLabel` 并简化逻辑；删除 `seedancePixelLabel` import

### 验证步骤

1. 进入画布，选中图片模型节点，打开设置弹窗，确认「比例」行右侧出现「标准/2K/4K」三档切换按钮
2. 切换不同图片模型，确认档位 Segmented 始终显示
3. 进入视频工作台或画布视频节点设置弹窗，确认比例按钮只显示比例（如「16:9」），下方不再显示像素尺寸（如「1280x720」）
4. 确认画布视频设置弹窗底部状态栏显示「720p · 16:9 · 6s」格式，比例部分不再显示像素尺寸

## 画布图片节点分辨率档位显示修复（最终版）

彻底修复画布图片节点设置弹窗中「标准/2K/4K」档位 Segmented 不显示的问题。前两次尝试（见上文「图像/视频设置面板修复」「图像档位查找与视频比例显示修复」）未解决根因，本次定位到两处真正根因并修复。

### 可测试变更

- 画布图片设置弹窗 `canvas-image-settings-popover.tsx` 能力查找模型字段从 `config.imageModel || config.model` 改为 `config.model`：画布节点的 `config.imageModel` 始终是全局默认图片模型（非空），`config.model` 才是用户在节点上通过 ModelPicker 选中的模型。原 `||` 写法永远解析到 `config.imageModel`，导致能力查找用的是全局默认模型而不是节点选中模型；如果全局默认模型配置的 `imageTiers` 少于 2 项，Segmented 就不显示
- `ImageSettingsPanel` 第 113 行渲染条件从 `tierOptions.length >= 2` 改为 `tierOptions.length >= 1`：保证模型只配了 1 档（如 `["standard"]`）时 Segmented 仍渲染，保持视觉一致（虽然只有 1 项时点击无切换效果）

### 涉及文件

- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：`capabilities` 查找用 `config.model`
- `next/src/components/image-settings-panel.tsx`：Segmented 渲染条件 `>= 2` → `>= 1`

### 验证步骤

1. 进入画布，新建或选中一个图片节点，点击节点打开设置弹窗
2. 选择一个在管理后台配置了 `imageTiers = ["standard","2k","4k"]` 的图片模型，确认「比例」行右侧出现「标准/2K/4K」三档 Segmented
3. 选择一个配置了 `imageTiers = ["standard","2k"]` 的模型，确认只出现「标准/2K」两档
4. 选择一个配置了 `imageTiers = ["standard"]` 单档的模型，确认 Segmented 仍渲染（只有「标准」一项），不再整个消失
5. 选择一个未在 `modelCapabilities` 里配置的模型，确认回退显示三档（标准/2K/4K）
6. 切换不同图片模型，确认 Segmented 档位跟随模型能力配置变化
7. 切换档位（如 4K），确认下方比例按钮跟随档位切换为 4K 尺寸选项

## 顶栏算力图标补全与首尾帧能力拆分

补全非画布页面顶栏的算力图标显示，并将视频首尾帧能力开关从单一 `supportsFirstLastFrame` 拆分为「首尾帧」+「首帧」两个独立选项，使后台可配置"仅支持首帧"的模型（如 minimax-hailuo-2-3、kling-3-0-turbo）。同时画布生图节点去掉图片数量选择，固定一个节点生成一张图。

### 可测试变更

- 顶栏 `UserStatusActions` 在非画布页面（default variant）也显示算力余额：`<CreditSymbol /> + {credits}`，与画布保持一致，使用 stone 配色适配浅色/深色主题
- 后端 `ModelCapability` 新增 `SupportsFirstFrame bool` 字段（保留 `SupportsFirstLastFrame` 表示首尾帧都支持）
- 前端 `AdminModelCapability` 类型新增 `supportsFirstFrame?: boolean`
- 前端 `use-config-store` 新增 `resolveSupportsFirstFrame`（`supportsFirstFrame || supportsFirstLastFrame`，勾选「首尾帧」或「首帧」均显示首帧上传）和 `resolveSupportsLastFrame`（仅 `supportsFirstLastFrame`，勾选「首尾帧」才显示尾帧上传）
- 管理后台「模型开放与定价」视频模型能力开关 Checkbox 拆为「首尾帧」+「首帧」两项
- 画布视频节点设置弹窗：原「首尾帧」分组拆为「首帧」和「尾帧」两个独立分组，分别按 `resolveSupportsFirstFrame` / `resolveSupportsLastFrame` 能力开关显隐
- 视频工作台：原「首尾帧」Section 拆为「首帧」和「尾帧」两个独立 Section，分别按能力开关显隐；`FrameReferenceStrip` 新增 `showFirst`/`showLast` 参数支持只显示一个 slot
- 视频工作台 `buildRequestSnapshot` 去掉 `!kling` 守卫，首帧/尾帧是否传参完全由能力开关决定
- 画布 `canvas-client-page.tsx` 视频生成与重试逻辑：`frameReferencesEnabled` 拆为 `firstFrameEnabled` / `lastFrameEnabled`，不支持的那一侧图片合并进普通参考图下发
- `video.ts` 请求体构造去掉 `!kling` 守卫，只要 `input.firstFrame` / `input.lastFrame` 存在就传 `first_frame_url` / `last_frame_url`
- 画布生图节点去掉图片数量选择：`CanvasImageSettingsPopover` 的 `showCount` 默认改为 `false`（画布中图片节点和配置节点均不显示数量选择）；画布图片生成和全景图生成时 `count` 固定为 1；配置节点和 prompt 面板的 credits 计算固定 count=1

### 涉及文件

后端：
- `Go/model/setting.go`：`ModelCapability` 新增 `SupportsFirstFrame` 字段

前端类型/store：
- `next/src/services/api/admin.ts`：`AdminModelCapability` 新增 `supportsFirstFrame`
- `next/src/app/(admin)/admin/settings-shared.ts`：`normalizeModelCapabilities` 保留 `supportsFirstFrame`
- `next/src/stores/use-config-store.ts`：新增 `resolveSupportsFirstFrame` / `resolveSupportsLastFrame`

顶栏算力图标：
- `next/src/components/layout/user-status-actions.tsx`：default variant 也显示算力余额

后台配置 UI：
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：Checkbox 拆为「首尾帧」+「首帧」

画布视频弹窗：
- `next/src/app/(user)/canvas/components/canvas-video-settings-popover.tsx`：首尾帧分组拆为两个独立分组，按能力开关显隐

视频工作台：
- `next/src/app/(user)/video/page.tsx`：Section 拆分 + `frameReferencesEnabled` 拆为 `firstFrameEnabled`/`lastFrameEnabled` + `FrameReferenceStrip` 新增 `showFirst`/`showLast`
- `next/src/services/api/video.ts`：去掉首尾帧 `!kling` 守卫

画布视频生成：
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：两处 `frameReferencesEnabled` 拆为 `firstFrameEnabled`/`lastFrameEnabled`，不支持侧合并进普通参考图

画布生图节点数量选择：
- `next/src/app/(user)/canvas/components/canvas-image-settings-popover.tsx`：`showCount` 默认改为 `false`
- `next/src/app/(user)/canvas/[id]/canvas-client-page.tsx`：图片生成和全景图生成 `count` 固定为 1
- `next/src/app/(user)/canvas/components/canvas-config-node-panel.tsx`：credits 计算固定 count=1
- `next/src/app/(user)/canvas/components/canvas-node-prompt-panel.tsx`：credits 计算固定 count=1

文档：
- `docs/backend/backend-database.md`：`supportsFirstLastFrame` 字段说明调整 + 新增 `supportsFirstFrame`
- `docs/backend/video-exclusive-panels-params.md`：首尾帧章节拆分说明 + 字段表新增 `supportsFirstFrame`

### 验证步骤

1. 登录后访问任意非画布页面（如首页、生图工作台、视频工作台），确认顶栏显示算力图标（闪电符号）+ 余额数字
2. 进入画布页面，确认顶栏算力图标仍按画布主题色显示（不变）
3. 切换浅色/深色主题，确认非画布顶栏算力图标颜色适配（stone 配色）
4. 进入管理后台「模型开放与定价」，选一个视频模型，确认能力开关区出现「首尾帧」和「首帧」两个独立 Checkbox
5. 勾选「首帧」不勾选「首尾帧」，保存后进入视频工作台选该模型，确认侧栏只出现「首帧」Section，无「尾帧」Section
6. 勾选「首尾帧」不勾选「首帧」，保存后进入视频工作台选该模型，确认侧栏「首帧」和「尾帧」两个 Section 都出现（首尾帧包含首帧）
7. 两个都不勾选，确认两个 Section 都不出现
8. 进入画布视频节点设置弹窗，选一个仅勾选「首帧」的模型，确认只出现「首帧」分组，无「尾帧」分组
9. 选一个勾选「首尾帧」的模型，确认「首帧」和「尾帧」分组都出现
10. 在视频工作台选一个仅首帧的模型，上传首帧图片后发起生成，确认请求体只包含 `first_frame_url` 不含 `last_frame_url`
11. 在画布视频节点选一个仅首帧的模型，连接首帧和尾帧图片节点，发起生成，确认首帧图片单独传 `first_frame_url`，尾帧图片合并进普通参考图 `input_reference[]`
12. 进入画布图片节点或配置节点，打开图片设置弹窗，确认不显示图片数量选择（只有比例/尺寸档位），按钮上也不显示"X 张"
13. 在画布图片节点发起生成，确认每次只生成 1 张图片节点（不再创建多个子节点）
14. 进入生图工作台（非画布），确认仍保留图片数量选择功能

## 生图并发保护与数量 UI 滑块化

统一生图请求为并发多次单张调用，避免上游 `n` 参数限制导致任务失败；生图工作台数量选择改为 Slider 滑块，上限 10 张。

### 可测试变更

- `image.ts` 的 `requestImages` 去掉 `useConcurrentSingleRequests` 条件，所有 `n > 1` 的情况统一走 `Promise.allSettled` 并发多次单张请求（count=1），不再依赖上游是否支持 `n` 参数
- `image.ts` 的 `createImageRequestParams` 中 `n` 上限从 15 调整为 10（对齐行业天花板 gpt-image-1）
- `ImageSettingsPanel` 生成数量 UI 从「快捷选项网格 + 数字输入框」改为 antd `Slider` 滑块，右侧显示当前数值（如 "3 张"）
- `ImageSettingsPanel` 的 `maxCount` 默认值从 15 改为 10，删除 `quickCount` 参数和未使用的 `OptionPill` / `CountInput` 组件
- 生图工作台 `image/page.tsx` 已传 `maxCount={10}`，与默认值一致

### 涉及文件

- `next/src/services/api/image.ts`：`requestImages` 并发逻辑统一 + `n` 上限 15→10
- `next/src/components/image-settings-panel.tsx`：Slider 滑块替换网格+输入框 + maxCount 默认 10 + 删除 OptionPill/CountInput

### 验证步骤

1. 进入生图工作台，确认生成数量区域显示为滑块（进度条样式），右侧显示当前数值
2. 拖动滑块，确认数值在 1-10 范围内变化，右侧数值同步更新
3. 确认滑块无法拖到超过 10
4. 选择一个仅支持单张生成的模型（如 Grok Imagine），设置数量为 3 张，发起生成，确认 3 张图片正常返回（并发 3 次单张请求），不再因上游 `n` 限制失败
5. 选择 gpt-image-1 模型，设置数量为 10 张，发起生成，确认 10 张图片正常返回（并发 10 次单张请求）
6. 确认画布图片节点设置弹窗不显示数量滑块（showCount=false 不受影响）
7. 确认画布生成仍固定 1 张

## 模型下拉框副标题描述

为模型下拉菜单选项接入"描述"副标题，hover 时在模型名下方淡入显示。后台在「模型开放与定价」表格中按模型填写描述（单行 30 字以内）。

### 可测试变更

- 后端 `PublicModelChannelSetting` 新增 `ModelInfos []ModelInfo` 字段（与 `ModelCosts` / `ModelCapabilities` 平级的独立列表），每项含 `model` / `description`
- 后端 `normalizeModelInfos` 规整：按 `AvailableModels` 过滤冗余项，同模型去重保留首个，描述 trim 后按 30 字截断
- 前端 `AdminPublicModelChannelSettings` 类型新增 `modelInfos` 字段；新增 `AdminModelInfo` 类型
- 前端 `AiConfig` 新增 `modelInfos` 字段；`resolveEffectiveConfig` 远程模式透传 `modelChannel.modelInfos`，本地模式返回空数组；`merge` 兜底
- 前端 `ModelPicker` 的 `channelOptions` 构建时从 `config.modelInfos` 按 model 名查找 description，作为 `subtitle` 传给 `ModelLabel`
- `ModelLabel` 组件原已预留 `subtitle` prop（hover 时 `opacity-0 → opacity-55` 淡入），本次仅接通数据，不改 UI 表现
- 管理后台「模型开放与定价」表格新增「描述」列（Input，`maxLength={30}`），放在「模型」列后、「开放」列前
- `modelInfos` 完全由 React state 管理（`useState`），不注册 antd Form.Item，避免 form store 读取数组字段丢失；`saveSettings` 时直接从 state 注入到 `rawValues.public.modelChannel.modelInfos`
- 共享助手 `settings-shared.ts` 新增 `normalizeModelInfos` / `setModelDescription`（直接用 `setModelInfos(prev => ...)` 更新 state）/ `modelInfoDescription`；`emptySettings` 默认 `modelInfos: []`

### 涉及文件

后端：
- `Go/model/setting.go`：新增 `ModelInfo` 结构体；`PublicModelChannelSetting` 新增 `ModelInfos` 字段
- `Go/service/settings.go`：新增 `normalizeModelInfos` 函数；`normalizePublicSettingWithChannels` 调用 + nil 兜底

前端类型：
- `next/src/services/api/admin.ts`：新增 `AdminModelInfo` 类型；`AdminPublicModelChannelSettings` 新增 `modelInfos` 字段

前端 store：
- `next/src/stores/use-config-store.ts`：`AiConfig` 新增 `modelInfos` 字段；`defaultConfig` / `resolveEffectiveConfig` / `merge` 同步处理

前端下拉菜单：
- `next/src/components/model-picker.tsx`：`channelOptions` 附带 description；`ModelPickerPortal` options 类型新增 `description?`；`ModelLabel` 调用传入 `subtitle={option.description}`

后台管理 UI：
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：新增 `modelInfos` state；`loadSettings` / `saveSettings` 加载保存；表格新增「描述」列；`saveSettings` 从 state 注入 `modelInfos`

共享助手：
- `next/src/app/(admin)/admin/settings-shared.ts`：新增 `AdminModelInfo` 导入；`emptySettings` 默认 `modelInfos: []`；新增 `normalizeModelInfos` / `setModelDescription` / `modelInfoDescription`

文档：
- `docs/backend/backend-database.md`：`modelChannel` 字段表新增 `modelInfos`；新增「`modelInfos` 每项字段」说明表

### 验证步骤

1. 进入管理后台「模型开放与定价」，确认「模型开放与定价」表格在「模型」列后新增「描述」列
2. 为某个模型在「描述」列输入介绍文案（如"豆包视频模型"），保存后刷新确认持久化
3. 输入超过 30 字的文案，确认输入框 `maxLength=30` 限制无法继续输入
4. 清空某模型描述并保存，刷新确认该模型不再有描述（`normalizeModelInfos` 剔除空描述项）
5. 进入画布或生图/视频/音频工作台，打开模型下拉，悬停某个配置过描述的模型选项，确认模型名下方淡入显示描述文案
6. 悬停未配置描述的模型选项，确认副标题位置为空（不显示）
7. 切换浅色/深色主题，确认副标题文字颜色（`opacity-55`）适配主题
8. 取消勾选某模型的「开放」开关并保存，刷新后确认该模型从 `modelInfos` 中被剔除（后端 `normalizeModelInfos` 按 `availableModels` 过滤）
9. 重新勾选开放并保存，确认需要重新填写描述（被剔除的项不会自动恢复）

## 修复模型描述下拉菜单不实时生效

修复两个 bug：(1) 管理后台保存模型描述后，画布/工作台页面的模型下拉菜单仍显示旧描述，需重新登录或刷新页面才生效；(2) 生图/视频工作台下方的模型下拉菜单始终不显示描述（画布页面正常）。

### 根因

1. `saveSettings` 成功后只更新管理后台本地 state，未刷新前端全局 `publicSettings`，导致订阅 `publicSettings` 的页面（画布、工作台）仍拿到登录时的旧数据
2. `ModelPicker` 的 `channelOptions` 从传入的 `config.modelInfos` 取描述，但生图/视频工作台的 `GenerationSettings` 组件传给 `ModelPicker` 的是原始 store config（其 `modelInfos` 为本地持久化默认空数组），而非 `effectiveConfig`（才会注入后端下发的描述）

### 可测试变更

- 新增 `syncPublicSettingsFromSaved` 共享助手：保存成功后用响应数据直接更新全局 `publicSettings`，零额外网络请求
- `model-pricing/page.tsx` 的 `saveSettings` 成功分支调用 `syncPublicSettingsFromSaved(saved)`
- `model-picker.tsx` 的 `channelOptions` 改为直接从 `publicSettings.modelChannel.modelInfos` 取描述，不再依赖传入的 `config.modelInfos`；`useMemo` 依赖增加 `publicSettings`

### 涉及文件

- `next/src/app/(admin)/admin/settings-shared.ts`：新增 `syncPublicSettingsFromSaved`；新增 `AdminPublicSettings` 和 `useConfigStore` 导入
- `next/src/app/(admin)/admin/model-pricing/page.tsx`：`saveSettings` 成功分支新增 `syncPublicSettingsFromSaved(saved)` 调用
- `next/src/components/model-picker.tsx`：`channelOptions` 的 `infos` 数据源从 `config.modelInfos` 改为 `publicSettings?.modelChannel?.modelInfos`

### 验证步骤

1. 登录管理后台，进入「模型开放与定价」，给某模型填入描述 A，保存
2. 切换到画布页面，打开模型下拉，悬停该模型，确认显示描述 A（无需刷新页面）
3. 切换到生图工作台，打开下方模型下拉，悬停该模型，确认显示描述 A（此前不显示）
4. 切换到视频创作台，打开下方模型下拉，悬停该模型，确认显示描述 A（此前不显示）
5. 回到管理后台，把描述改为 B，保存
6. 立即切到画布/生图/视频工作台，打开下拉，确认显示描述 B（旧版需重新登录才更新）
7. 清空某模型描述并保存，确认下拉菜单该模型不再显示副标题
8. 修改其他公开配置（如默认模型、可用模型列表），保存后确认前端立即生效

## 统一一级页面背景点阵

画布库（`/canvas`）此前是唯一没有背景点阵的一级页面，与首页、提示词库、我的素材等页面观感不一致。本次补齐点阵，并把已有点阵页面的深色模式透明度统一为同一数值。

### 可测试变更

- 画布库页面新增背景点阵，浅色 `#e5e7eb`、点径 1px、间距 16px，与其余一级页面一致
- 首页深色点阵透明度 `.18` → `.16`
- 我的素材深色点阵透明度 `.14` → `.16`
- 提示词库、登录页、素材库三处原本即为 `.16`，未改动

### 涉及文件

- `next/src/app/(user)/canvas/page.tsx`：`<main>` 新增 `bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]`、`[background-size:16px_16px]` 与 `dark:bg-[radial-gradient(rgba(245,245,244,.16)_1px,transparent_1px)]`
- `next/src/app/(user)/page.tsx`：`dark:bg-[radial-gradient(...)]` 透明度 `.18` 改为 `.16`
- `next/src/app/(user)/assets/page.tsx`：`dark:bg-[radial-gradient(...)]` 透明度 `.14` 改为 `.16`

### 验证步骤

1. 依次点击顶部导航「我的画布」「提示词库」「我的素材」与首页，确认四个一级页面均有背景点阵，且点的粗细、间距、颜色观感一致
2. 进入画布库，确认点阵出现在卡片列表后方，不与卡片内容产生视觉干扰
3. 滚动画布库页面，确认点阵随内容滚动（与首页行为一致）
4. 切换到深色模式，重复第 1 步，确认四个页面点阵的明暗程度一致
5. 检查登录页与素材库，确认点阵未受影响（原本已是 `.16`）

### 未处理项

- 生图工作台、视频创作台、工作流的背景与点阵保持原样，本次不涉及
- 工作台结果预览区点阵仍为 inline style 写死的 `rgba(120,113,108,.35)`（stone 暖灰、1.4px、无深色适配），与一级页面点阵风格不同，待后续决定是否收敛

## 修复深色模式下 Tooltip 气泡配色

悬停顶栏「当前算力点余额」等元素时弹出的 antd Tooltip 气泡，在深色模式下呈现为浅灰底 + 黑字，与深色主题冲突。

### 根因

antd Tooltip 气泡配色由两个 token 决定（`antd/es/tooltip/style/index.js`）：`colorBgSpotlight`（背景）与 `colorTextLightSolid`（文字）。

项目 `getAntThemeConfig` 把顶层 `colorTextLightSolid` 覆盖为 `primaryText`（深色下为 `#171717` 黑）；同时 antd 深色算法会把 `colorBgSpotlight` 派生为**浅灰**——

| 主题 | `colorBgSpotlight` 的算法来源 | 实际背景 | 文字 | 结果 |
|---|---|---|---|---|
| 浅色 `default/colors.js` | `getAlphaColor(colorTextBase, 0.85)` | 85% 黑 | `#ffffff` | 黑底白字（正常） |
| 深色 `dark/colors.js` | `getSolidColor(colorBgBase, 26)` | 基于白底推深 26% = 浅灰 | `#171717` | 灰底黑字（异常） |

两者叠加导致深色模式下气泡反色成浅底黑字。

### 可测试变更

`components` 中按条件追加 Tooltip 配置，**仅在深色下生效**，浅色保持 antd 默认（半透明 85% 黑 + 白字）不动：

```tsx
...(dark ? { Tooltip: { colorBgSpotlight: "#262626", colorTextLightSolid: "#f5f5f4" } } : {}),
```

- 气泡背景 `#262626` 与项目 `neutral.dark.menuBg` 同值
- 文字 `#f5f5f4` 与 `canvasThemes.dark.node.text` 同值
- 文字对比度 13.87:1

### 涉及文件

- `next/src/lib/app-theme.ts`：`getAntThemeConfig` 的 `components` 末尾追加一行条件配置

### 验证步骤

1. 切到深色模式，悬停顶栏算力点余额，确认气泡为**深底浅字**（不再出现浅灰底黑字）
2. 切到浅色模式重复，确认气泡仍是黑底白字，与修复前一致
3. 切换到画布页，悬停节点工具栏、模型选择等带 Tooltip 的元素，确认深色下气泡同样为深底浅字
4. 检查管理后台的 Tooltip（如表格内的提示图标），确认深色下配色统一
5. 确认其他依赖 `colorTextLightSolid` 的组件未受影响——重点看深色模式下的 primary 按钮（背景 `#fafafa` 白、文字 `#171717` 黑）仍保持原样

## 顶栏账户区整合（算力点 + 主题切换 + 名字下拉）

登录用户的算力点余额、浅色/深色主题切换、账户入口合并为一个**名字触发器**；未登录访客保留独立主题切换与登录入口。

### 可测试变更

- `next/src/components/layout/user-status-actions.tsx` 重写：
  - 登录用户：移除行内常驻的 `AnimatedThemeToggler` 与两块算力点显示，改为一个只显示 `userName` 的名字按钮（无头像、无首字母）；点击弹出 `dropdownRender` 自定义面板
  - 面板结构：头部（名字 + 「管理员」角色标签，admin 才显示）→ 分割线 → 算力点余额行（含数值）→ 主题行（内嵌 `AnimatedThemeToggler`）→ 分割线 → 原菜单项（管理后台 / 快捷键 / 退出登录）
  - 面板内点击主题切换**不关闭**下拉（自定义内容非 menu item），全屏视图过渡保留
  - 面板定位由 `bottomRight` 改为**在名字正下方水平居中展开**：`placement="bottom"`（antd 自带 `points: ['tc','bc']` 即面板顶部中点对齐名字底部中点 = 下方居中），`align` 仅保留 `offset: [0,14]` 与 `overflow` 保护，**不加箭头**，与名字保持约 14px 间距；面板加宽至 `min-w-[260px]`、圆角 `rounded-xl`、阴影 `shadow-xl`、内边距 `py-1.5`，强化弹窗浮起感。⚠️ 曾误写为 `points: ["bc","tc"]` 导致面板被翻到名字**上方盖住名字**，已修正为不覆盖 points、交由 placement 决定下方定位
  - 余额行文案由「算力点余额」改为「余额」
  - 访客：仍渲染独立 `AnimatedThemeToggler` + 「登录」链接 + 快捷键按钮（若有 `onOpenShortcuts`），未登录可正常切主题
  - 画布工具栏的画面深浅切换（`canvas-toolbar.tsx`）不在本次范围，保持独立
- 移除未使用的 `Avatar` / `Tooltip` import

### 涉及文件

- `next/src/components/layout/user-status-actions.tsx`：整文件重写

### 验证步骤

1. 登录 admin，首页右上角只显示名字 `admin`，无头像圆圈、无首字母
2. 点击名字，面板显示：名字+「管理员」、算力点余额（含数值）、主题切换、管理后台、退出登录
3. 点击面板内主题切换，全屏视图过渡执行，下拉保持打开；再次点击可切回
4. 点击「退出登录」，下拉关闭并执行退出
5. 退出到未登录，确认顶栏仍有独立主题切换按钮与「登录」链接，点击可正常切主题
6. 进入画布页，点击名字下拉内可切换全局主题；画布工具栏的画面深浅切换仍独立可用
7. 深色模式下确认面板文字清晰（浅色用 `bg-white`、深色用 `bg-neutral-900`），且与已修的 Tooltip 气泡配色一致
8. 管理后台（`/admin`）顶栏同样显示名字下拉（`showConfig={false}`，无配置按钮）
9. 点击名字，确认面板在名字**正下方居中**展开（面板顶部在名字下方约 14px，**绝不覆盖名字本身**），**无箭头**，面板加宽至 260px 且阴影明显浮起；面板内余额行显示「余额」而非「算力点余额」

## 空图片节点占位图标去包围

空图片节点（及复用同一函数的 Config 配置节点、Panorama 全景图节点）的占位图标原先被套在一个 `size-14 rounded-2xl` + `theme.toolbar.activeBg` 的圆角背景方块里，观感上像"图标被包围"；而空视频节点、空音频节点的占位图标是裸 SVG 直接绘制，没有这层底块。两者渲染风格不一致。注意：导演节点走独立面板 `canvas-director-node-panel.tsx`（由 `renderNodeContent` 注入，优先于 `EmptyImageContent`），其占位图标与文字不在此列，单独处理。

### 可测试变更

- `canvas-node.tsx` 的 `EmptyImageContent`：删除包裹 ImageIcon 的 `size-14 rounded-2xl` + `activeBg` 背景方块，图标改为裸 `<ImageIcon className="size-7 opacity-35" />`，与视频/音频空节点一致；占位文字由 `text-[10px] tracking-[0.18em] opacity-50` 统一为 `text-sm` 并**去掉多余的 `opacity-50`**（视频/音频空节点占位文字本就无 opacity），与视频/音频空节点亮度一致
- 受影响范围：空图片节点、空全景图节点、空配置节点（共用 `EmptyImageContent`）；空视频、空音频节点未改动；导演节点见下方「3D 导演台节点占位文字字号」独立章节

### 验证步骤

1. 在画布新建一个空图片节点，确认占位 ImageIcon **不再有圆角背景方块包裹**，呈裸图标 + "空图片节点"文字
2. 新建空视频节点、空音频节点对比，确认三者占位图标风格一致（均无背景块）
3. 新建空配置节点、空导演节点，确认同样为裸图标、无包围方块
4. 切换浅色/深色主题，确认空图片节点占位图标在两种主题下均清晰可见、无背景方块残留

## 画布库文字颜色深浅主题统一

画布库（`/canvas`）及其项目卡片、删除确认弹窗中的次级文字（"画布库"标签、加载态、空状态提示、"更新于"日期、删除确认文案）原本只写 `text-stone-500` 而没有 `dark:` 变体。浅色模式正常，但深色模式下这些文字仍渲染为中灰 `#78716c`（约 3.5:1 对比度，低于 WCAG AA 4.5:1），与同一页面已正确适配的"节点数·连线数"（`dark:text-stone-400`，约 6:1）亮度不一致，观感上像文字颜色不统一。

画布节点本体（`canvas-node.tsx`）与各类节点面板始终使用 `canvasThemes` token，已正确适配，不在本次范围内。

### 可测试变更

- `canvas/page.tsx`：画布库标签、加载态、空状态提示三处 `text-stone-500` 补 `dark:text-stone-400`
- `canvas/components/canvas-project-card.tsx`："更新于"日期 `text-stone-500` 补 `dark:text-stone-400`
- `canvas/components/canvas-delete-projects-dialog.tsx`：删除确认文案 `text-stone-500` 补 `dark:text-stone-400`
- 侧栏/素材选择器内的搜索图标 `text-stone-400` 为装饰性图标，深浅两模式均可辨识，本次未改动
- 不在范围内：画布节点内文字（已由 `canvasThemes` 驱动，无需修改）

### 验证步骤

1. 进入画布库，切换到深色模式，确认"画布库"小标签、"更新于"日期、空状态提示文字均呈浅灰（`stone-400`）而非中灰，与项目卡片"节点数·连线数"亮度一致
2. 选中若干画布点击"删除选中"，在弹出的确认弹窗中确认深色模式下说明文字同样为浅灰、清晰可读
3. 切回浅色模式，确认上述文字仍为 `stone-500` 中灰，与改动前一致（本次仅补齐深色适配，不改变浅色观感）
4. 进入画布实际工作区，确认节点内文字、节点面板文字深浅主题配色如常（未被本次改动影响）

## 3D 导演台节点占位文字字号

3D 导演台节点（`canvas-director-node-panel.tsx`）的占位文字"在3D空间中搭建场景并进行多视角截图"原本是 `text-[17px] font-medium leading-7`，而空视频节点、空图片节点的占位文字均为 `text-sm`（14px）。两者字号不一致，导演节点文字明显偏大。注：该节点由 `NodeContent` 的 `renderNodeContent` 分支注入（line 433 优先于 `nodeContentRenderers` 中的 `EmptyImageContent` 映射），不共享空图片节点的渲染逻辑，需单独修正。

### 可测试变更

- `canvas/components/canvas-director-node-panel.tsx`：占位文字 `<p>` 的 `text-[17px]` 改为 `text-sm`，与空视频/空图片节点占位文字字号一致；保留 `font-medium leading-7`（较长中文句子 + 下方"打开导演台"按钮，加粗与宽松行距为独立排版需要，仅字号对齐）

### 验证步骤

1. 画布新建一个空 3D 导演台节点，对比空视频节点、空图片节点，确认三者的占位文字字号（14px）完全一致
2. 切换浅色/深色主题，确认导演台节点占位文字在两种主题下字号与其余空节点一致、颜色随主题正常适配
3. 点击"打开导演台"按钮，确认弹窗交互不受影响

## 空节点占位图标亮度/色值对齐 3D 导演台

3D 导演台节点（`canvas-director-node-panel.tsx`）的 SVG 图标 Layers3 使用 `style={{ color: theme.node.muted }}` 且**无** opacity（全亮）。而空图片/全景图（共用 `EmptyImageContent`）、空视频、空音频节点的占位图标原本颜色继承父级 `theme.node.placeholder` 且带 `opacity-35`，整体偏暗、色值也与导演台不同，观感不一致。

### 可测试变更

- `canvas-node.tsx` `EmptyImageContent`（空图片/空全景图）：`<ImageIcon className="size-7 opacity-35" />` 改为 `<ImageIcon className="size-7" style={{ color: theme.node.muted }} />`
- `canvas-node.tsx` `VideoNodeContent`（空视频）：`<Video className="size-7 opacity-35" />` 改为 `<Video className="size-7" style={{ color: theme.node.muted }} />`
- `canvas-node.tsx` `AudioNodeContent`（空音频）：`<Music2 className="size-7 opacity-35" />` 改为 `<Music2 className="size-7" style={{ color: theme.node.muted }} />`
- 父级 `div` 仍是 `color: theme.node.placeholder`（供下方占位文字使用，导演台文字同样用 `theme.node.placeholder`，文字未改动）
- 图标尺寸保持 `size-7`，导演台图标为 `size-11`，本次仅对齐亮度与色值，未改尺寸
- Config / Director 节点走独立面板（`CanvasConfigNodePanel` / `CanvasDirectorNodePanel`），导演台图标本就是 `theme.node.muted` 无透明，已一致；Config 面板无同类"空节点提示图标"

### 验证步骤

1. 画布新建空图片、空全景图、空视频、空音频节点，并排放，确认四个占位图标的颜色与亮度完全一致，且与空 3D 导演台节点的 Layers3 图标同色值（均为 `theme.node.muted`、无透明）
2. 切换浅色/深色主题，确认四类图标与导演台图标在两种主题下亮度一致、随主题正常适配
3. 确认图标下方的占位文字（"空图片节点"等）颜色不受影响，仍为 `theme.node.placeholder`

## 画布视频节点模式：默认全能参考 + 动态标签 + 弹窗去冗余

画布视频节点上的设置触发按钮（`canvas-video-settings-popover.tsx` 的 `CanvasVideoSettingsPopover` 主按钮）原本写死显示"全能参考"，弹窗用「首尾帧 / 全能参考」两段式切换，在默认处于全能参考时仍把"全能参考"列为一个可选项，冗余。本次改为：按钮动态显示当前模式，弹窗去掉冗余的"全能参考"选项、只保留切换到另一模式的入口。

### 可测试变更

- `canvas-video-settings-popover.tsx` 触发按钮文案改为动态：当前为首尾帧（且模型支持首尾帧）时显示"首尾帧"，否则显示"全能参考"（`{showFrameOrReference && activeTab === "frames" ? "首尾帧" : "全能参考"}`），与图片节点默认显示"智能比例"一致
- 弹窗模式切换由两段式改为单一切换入口：当前为全能参考（默认）时只显示"切换为首尾帧"；当前为首尾帧时显示模式名"首尾帧" + "切换为全能参考"按钮
- 首尾帧图片选择器（首帧/尾帧）仅在 `activeTab === "frames"` 时渲染，逻辑不变
- 默认模式仍为 `reference`（全能参考）：`activeTab` 取 `hasFrames && metadata?.klingActiveTab === "frames" ? "frames" : "reference"`，新建节点默认即"全能参考"

### 验证步骤

1. 画布新建视频节点，确认节点设置按钮显示"全能参考"（默认）
2. 打开弹窗，确认处于全能参考时弹窗内只有"切换为首尾帧"入口，不再有"全能参考"选项
3. 点击"切换为首尾帧"，确认弹窗显示首尾帧图片选择器且出现"切换为全能参考"入口；关闭再打开（模型支持首尾帧时）确认停留在首尾帧、节点按钮显示"首尾帧"
4. 点"切换为全能参考"回到默认，节点按钮显示"全能参考"
5. 模型不支持首尾帧时（`showFrameOrReference=false`），按钮固定显示"全能参考"，弹窗无模式切换入口

## 画布视频节点"生成音频"控件精简

画布视频节点弹窗（`variant="canvas"`）的「生成音频」section 原本用 `min-h-[52px]` 的大号「关闭 / 开启」两段按钮（`VolumeX`/`Volume2` 图标 + 文字），与同弹窗「输出 / 添加水印」用的紧凑 antd 小开关（`SwitchRow`）风格不一致、显大且突兀。

### 可测试变更

- `components/video-settings-panel.tsx` canvas 变体「生成音频」：去掉外层圆角边框卡片（`rounded-xl border p-2.5`）与独立的「生成 AI 音频」标签；不再用 `SwitchRow`（其 label 为 `text-sm` 偏大），改为自定义行——标题「生成音频」用与其它 section 标题完全一致的 `text-[10.8px] font-medium opacity-55`，滑动开关（`Switch size="small"`）居右，无独立框；`audioHint`（仅音频受限模式时显示）保留为标题下方纯文字说明
- 同文件「生成时长」：不再用 `CanvasSection`（其上标题在下内容、天然不同行），改为与「生成音频」完全同构的行内布局——标题「生成时长」用同样的 `text-[10.8px] font-medium opacity-55` 小灰字在左，右侧为滑块 + 「Xs」数值；`SecondsSlider` 增加可选 `sliderWidth` 参数，画布变体传 `CANVAS_SLIDER_WIDTH`（200px，满足 4-30s 拖动精度；默认变体/视频创作台整页不传，仍用 `CanvasSection` + 满宽，未改动）
- 「生成音频」开关位置：由行最右改为居中于一个与滑块等宽（`CANVAS_SLIDER_WIDTH`）的区域，正下方对齐滑块；右侧加等宽（`min-w-[2.5rem]`）隐形占位 + 相同 `gap-3`，保证两行右缘结构对称；`audioHint` 保留为该行下方纯文字
- 「视频生成方式」切换样式统一：由圆角胶囊按钮（`SegmentedPill` + Film/Sparkles 图标）改为与「选择分辨率」完全一致的分段控件——等分按钮 + `text-[10.8px]`，文字-only；同步删除无用的 `SegmentedPill`/`modeIcon` 函数与 `Film`/`Sparkles` 导入
- 分段控件色值精确化（`lib/canvas-theme.ts`）：`canvasThemes` 两套主题各新增 `node.segmentBg`（未选中底槽：浅 `#f2f0ed` / 深 `#282623`）与 `node.segmentActive`（选中块：浅 `#f9f8f6` / 深 `#1f1d1a`）两个实色 token，替代原先的 rgba 半透明叠加（`subtleFill`）与 `panel`
- 「视频能力」切换（`canvas-video-settings-popover.tsx`，全能参考/首尾帧）同步统一：去掉 `border` + `borderColor`（无边框、仅选中块阴影），容器由 `rounded-xl gap-1` 改 `rounded-lg gap-0.5` + `min-h-[52px]`，选中块由 `toolbar.activeBg`/`activeText` 改 `segmentActive` + `0 2px 8px rgba(0,0,0,0.12)` 阴影 + `theme.node.text`；disabled 态保留
- 删除选中首尾帧后的提示文字「请在输入框中分别上传或选择首帧、尾帧图片」
- 节点弹窗全部小标题改纯色（`lib/canvas-theme.ts` 新增 `node.titleText`：浅 `#000000` / 深 `#ffffff`）：`CanvasSection` 新增 `theme` 参数并去掉 `opacity-55`，视频/图片/音频弹窗共 11 处调用同步传参；「生成时长」「生成音频」内联标题、「视频能力」标题、`CanvasSettingGroup`（角色朝向参考/多镜头分镜/分镜模式/分镜提示词）全部改用 `titleText`，不再为 `muted` 灰字
- 同步清理因不再使用而多余的 `Volume2`/`VolumeX` 导入（lucide-react）
- 默认变体（视频创作台页面）的音频控件本就用 `AudioGenerationSetting`（`SwitchRow`），未改动

### 验证步骤

1. 画布新建视频节点（模型支持音频生成），打开设置弹窗，确认「生成音频」的标题字号（约 10.8px 小灰字）与「生成时长」「输出」等 section 标题完全一致，不再偏大
2. 确认「生成音频」是「标题 + 滑动开关」单行、无任何外框，且开关水平位置居中于上方滑块的正下方（两行对称）
3. 确认「生成时长」标题与进度条在同一行（标题在左、滑块 +「Xs」数值在右），且标题字号与「生成音频」等 section 标题一致；滑块约 200px，4-30s 全范围拖动手感正常
4. 切换开关，确认 `videoGenerateAudio` 仍正确写入 true/false，生成时请求体仍按模型能力带 `video_generate_audio`（行为不变）
5. 模型不支持音频生成时，「生成音频」section 不渲染（门控未变）；音频受限时标题下方出现纯文字提示
6. 「视频能力」（全能参考/首尾帧）、「视频生成方式」、「选择分辨率」三处分段控件样式完全一致：同样的 `segmentBg` 底槽（浅 `#f2f0ed` / 深 `#282623`）、选中块 `segmentActive`（浅 `#f9f8f6` / 深 `#1f1d1a`）、无边框仅阴影、同字号；切换视频能力/模式/分辨率功能均正常
7. 切到首尾帧后不再出现"请在输入框中分别上传或选择首帧、尾帧图片"提示；上传首/尾帧图片功能正常
8. 深色/浅色主题下开关与标题文字清晰可读
9. 弹窗内所有小标题（视频能力/视频生成方式/生成时长/生成音频/选择分辨率/选择比例/输出/生成数量/角色朝向参考/多镜头分镜/分镜模式/分镜提示词/声音/格式/语速/声音指令）：深色模式纯白、浅色模式纯黑，不再偏灰；图片节点、音频节点弹窗标题同步生效

## 画布非视频节点输入框模型名完整显示

视频节点输入框参数按钮多，`ModelPicker` 用 `nameMaxWidth={50}` 固定模型名长度；其他节点参数栏空间充足，无需截断。

### 可测试变更

- `canvas-node-prompt-panel.tsx`：图片、音频、文本三处 `ModelPicker` 去掉 `nameMaxWidth={50}`，模型名完整显示；视频节点保留
- `canvas-config-node-panel.tsx`（配置节点）：按模式条件 `nameMaxWidth={mode === "video" ? 50 : undefined}`——视频模式保留 50px，其他模式完整显示
- `ModelPicker` 外层已有 `min-w-0 + truncate` 兜底：模型名极长且空间不足时仍会省略号截断，不会撑破节点

### 验证步骤

1. 画布新建图片/音频/文本节点，选择名称较长的模型，确认输入框参数栏显示完整模型名（不再 50px 截断）
2. 视频节点确认模型名仍为固定短长度（50px），参数按钮布局不受影响
3. 配置节点切图片/音频模式显示完整模型名；切视频模式恢复固定短长度
4. 浅色/深色主题下均正常

## 创作Agent 图片/视频参数弹窗去标题 + 主页加入参数 chips

### 可测试变更

- `canvas-assistant-composer.tsx`：`ComposerMediaPopover` 删除弹窗顶部标题行（"图片参数"/"视频参数"），`ComposerMediaChip`/`ComposerMediaPopover` 移除 `title` prop
- 两个参数 chip 从 `showOptions` 条件中移出、始终渲染：主页（`showOptions={false}`，仅控制模型选择器显隐）在模型选择器旁新增图片/视频参数 chips；画布创作Agent面板行为不变（本就显示 chips）
- 主页底部条为 flex-wrap：+ 按钮、模型选择器、图片 chip、视频 chip、积分、发送，空间不足自动换行

### 验证步骤

1. 画布创作Agent面板：点击底部"图片 ×× · ××"chip，弹窗顶部不再有"图片参数"标题，只有"比例/质量"组标题与选项；视频 chip 同理无"视频参数"标题
2. 主页创作Agent对话框：模型选择器右侧出现"图片 …""视频 …"两个 chip，点击弹出与画布一致的参数弹窗（无标题行）
3. 主页选择比例/质量后创建画布，确认参数随 `agentConfig` 带入画布 Agent
4. 弹窗在浅色/深色主题下正常

## Agent 图片档位断链修复

### 可测试变更

- `canvas-client-page.tsx` `generate_image` 工具分支（:3350）：新增 `metadata.imageTier = generationConfig.imageTier`——Agent 参数弹窗选的档位（standard/2k/4k）现在会持久化到节点 metadata；`buildGenerationConfig` 生成时优先读 `node.metadata.imageTier`（:4915），最终请求体 `image_tier` 使用 Agent 选的档位（修复前回落全局设置）

### 验证步骤

1. 全局图片模型与 Agent 弹窗选不同档位（如全局 standard、Agent 选 4K）
2. 创作Agent对话让它生成一张图片
3. 生成的图片节点右键/检查参数，确认 imageTier 为 4k；实际出图分辨率与 4K 档一致
4. 对照：修复前同操作出图实际按全局 standard 档

## 创作Agent参数chips跟随模型能力（按方案文档实施）

### 可测试变更

- `canvas-assistant-composer.tsx`：四组 chips 选项由硬编码常量改为组件内 `useMemo` 派生（`xxxOptionsForRender`），按生效的默认图片模型（`config.imageModel || config.model`）与视频模型（`config.videoModel || config.model`）的 `findModelCapability` 能力过滤：
  - 图片比例：`imageAspects` 过滤（auto 始终保留；能力中多出的比例值追加展示）
  - 图片分辨率：`imageTiers` 过滤（standard/2k/4k）
  - 视频比例：`videoRatios` 过滤（chips 像素值经 `normalizeSeedanceRatio` 归一为比例后比对；多出的比例追加展示）
  - 视频分辨率：`videoResolutions` 过滤（`normalizeVideoResolutionValue` 归一，480p/480 均兼容）
- 失效回落 useEffect：已选值不在当前能力集合内时自动 `onAgentConfigChange` 写回落值（图片档位用 `resolveEffectiveImageTier`、视频分辨率用 `resolveEffectiveVideoQuality`，均与节点弹窗同款逻辑；比例回集合第一项）
- `use-config-store.ts`：`resolveEffectiveImageTier` / `resolveEffectiveVideoQuality` 补 export（原模块私有，逻辑未动）
- 能力未配置（后台无该模型条目或字段为空）→ 全量常量，行为与改动前完全一致

### 验证步骤

1. 后台给默认图片模型配置 `imageTiers: [standard, 2k]` → Agent 图片参数弹窗仅显示 标准/2K；已选 4K 的会话打开后自动回落为 2K，chip 标签同步刷新
2. 配置 `videoResolutions: [720p, 1080p]` → 视频参数弹窗无 480p；已选 480p 自动回落 720p
3. 配置 `videoRatios: [16:9, 9:16]` → 视频比例仅剩 16:9 / 9:16（对应像素项）
4. 配置 `imageAspects: [1:1, 16:9]` → 图片比例仅剩 智能/1:1/16:9
5. 删除该模型能力配置 → 四组选项恢复全量（现状行为），无报错
6. 主页与画布创作Agent行为一致（共用组件）
7. 回落仅发生在值非法时，正常选择、切换不受影响

## 创作Agent图片/视频参数弹窗比例选项布局优化

### 可测试变更

- 图片和视频参数弹窗的比例选项改为最多三列网格布局，不再因 `flex-1` 在同一行被压缩成过窄按钮。
- 选项之间增加间距并统一最小高度；弹窗宽度由 216px 调整为 240px，比例名称在浅色/深色模式下均清晰可读。
- 分辨率选项同步采用自适应列数（1–3 列），保持不同能力数量下的布局平衡。

### 验证步骤

1. 打开创作Agent图片参数弹窗，确认 9 个比例以三列网格排列，不再挤在一行。
2. 打开视频参数弹窗，确认 5 个比例以三列网格排列，按钮文字和间距正常。
3. 切换模型能力使比例数量减少或增加，确认网格列数和弹窗宽度自适应，浅色/深色主题均正常。

## 首页与画布库画布预览

### 可测试变更

- 首页创作 Agent 对话框下方新增画布快捷入口区域，包含“创建画布”卡片和最近 5 个已有画布预览卡片。
- 已有画布卡片展示最新图片/全景图/视频节点的缩略图、画布名称、节点数量和更新时间；本地存储图片会按 storageKey 自动解析预览地址。
- “我的画布”画布库中的画布卡片增加媒体预览区域，同样优先展示该画布最新的图片、全景图或视频节点。
- 画布库卡片与首页快捷预览统一为“上方媒体预览、下方画布名称与更新时间”的结构；节点数和连线数统一放在预览右下角角标中，原有画布操作按钮继续保留。
- 画布库卡片浅色/深色背景透明度、边框和悬停层级与首页快捷预览统一。
- 点击“创建画布”进入新的空白画布；点击已有画布预览卡片直接进入对应画布；点击“查看全部”进入画布库。
- 无媒体内容的画布显示主题适配的占位图标，浅色/深色模式下卡片、文字和悬停状态保持一致。

### 验证步骤

1. 打开首页，确认创作 Agent 对话框下方出现“创建画布”和已有画布预览区域。
2. 点击“创建画布”，确认创建并进入新的空白画布。
3. 点击已有画布卡片，确认直接进入对应画布；点击“查看全部”确认进入画布库。
4. 创建包含图片或视频结果的画布并返回首页，确认预览卡片显示最新媒体缩略图；无媒体画布显示占位图标。
5. 进入“我的画布”，确认每个画布卡片优先展示最新图片、全景图或视频节点；无媒体画布显示占位图标。
6. 首页和“我的画布”预览右下角角标显示节点数与连线数，卡片正文不再重复显示节点/连线统计。
7. 浅色/深色模式下检查卡片边框、背景、文字和悬停效果。

## 创作Agent参数弹窗按钮自适应宽度 + "自适应"改"智能"

### 可测试变更

- `canvas-assistant-composer.tsx` `ComposerMediaPopover`：选项按钮由 `basis-[calc(25%-2px)]`（固定一行 4 个）改为 `flex-1` 等分——选项随数量与文字长度自适应分布（如 2 个选项时各占一半），flex-wrap 保留兜底
- 视频比例的 adaptive 展示文案统一为"智能"：弹窗内选项 label 与 chip 顶部标签（`videoSizeRatioLabel` 返回"自适应"处覆写），value 仍为 adaptive，数据流不变；图片比例的"智能"（auto）本就叫"智能"，两弹窗叫法统一

### 验证步骤

1. 打开图片参数弹窗：分辨率 3 个选项（标准/2K/4K）自适应等分整行；比例 9 项自动换行铺排，不再固定 4 列
2. 打开视频参数弹窗：比例选项中 adaptive 显示为"智能"（不再"自适应"）
3. 选中"智能"后 chip 顶部标签显示"视频 智能 · 720P"（不再是"自适应"）
4. 节点设置弹窗（图片/视频工作台）内文案不受影响（仍走全局 videoSizeRatioLabel）

## 账户弹窗配置与主题双按钮

### 可测试变更

- 登录后点击右上角用户名，账户弹窗聚合主题、个人中心、算力余额和操作入口；顶部不显示重复配置图标。
- 账户弹窗的主题区域改为“浅色”和“深色”两个明确按钮，当前主题有选中态，可直接切换。
- 未登录状态仍保留原有配置入口和主题切换按钮。
- 账户弹窗改为“主题 → 个人中心 → 算力余额 → 画布主题（画布页）→ 管理后台（管理员）→ 退出登录”的纵向顺序，使用横线分组；行项目默认透明，仅悬停时显示填充和阴影。
- 设置区和账户操作菜单统一使用文字样式，移除混用的前置 SVG 图标；“个人中心”暂不提供页面跳转。
- 账户头部不再显示头像框和“账户中心”副标题；弹窗各行字号、色值和交互状态保持一致。
- 画布页账户弹窗提升到 Agent 面板之上，不会被展开的创作 Agent 遮挡。
- 画布页快捷键入口仅保留在左下角缩放控制条最右侧，账户弹窗和“画布外观”设置面板不再显示快捷键入口。
- 创作 Agent 底部图片/视频参数 chip 使用对应 SVG 图标，不再显示“图片”“视频”文字前缀。

### 验证步骤

1. 登录后点击右上角用户名，确认弹窗按主题、个人中心、算力余额、画布主题、管理员入口（仅管理员）、退出登录顺序显示。
2. 确认账户弹窗内同时显示“浅色”“深色”两个主题按钮，切换后页面主题立即更新且弹窗保持可用。
3. 确认登录状态下顶部不再出现重复的独立配置图标；退出登录后配置和主题入口仍可用。
4. 画布页展开创作 Agent 后打开账户弹窗，确认弹窗完整显示在 Agent 面板上方。
5. 画布页确认缩放控制条最右侧只有一个快捷键入口；确认账户弹窗和“画布外观”设置面板不再重复显示快捷键按钮。
6. 画布页账户弹窗按顺序显示主题、个人中心、算力余额、画布主题、管理员入口（仅管理员）和退出登录；横线分组，悬停行才显示填充和阴影。
7. 创作 Agent 底部参数栏确认图片和视频 chip 显示 SVG 图标与参数信息，不再显示文字前缀。

## 管理后台模型能力模块布局重构

### 可测试变更

- 管理后台「模型定价」页的「模型能力配置」卡片重构为左右布局：左侧上下两个纯文字列表（图片模型 / 视频模型），无卡片边框和阴影填充；右侧为固定高度（600px）的所选模型能力配置区，内容超高时内部滚动。
- 左侧每个列表约显示 8 个模型，超过 8 个才出现滚动条，不足则不显示。
- 点击左侧模型名即切换右侧配置；图片/视频不再用 Tab 切换，两个列表同屏。
- 右侧顶部显示模型名、已开放开关和「图片/视频生成模型 · 已配置 X/Y 项能力」统计行（含模型描述，如有）。
- 右侧配置按分组标题组织：基础能力（比例/档位/分辨率/视频模式）、参数限制（时长范围、参考素材上限、音频生成限制）、请求与能力（请求体格式、厂商、能力开关）、高级协议适配（原渠道适配参数折叠面板，字段不变）。
- 卡片标题栏右侧新增「保存」按钮，与页面顶部「保存设置」等效。
- 修复了重构前遗留的 JSX 标签嵌套错位导致的构建错误（Expected '</', got 'jsx text'）。

### 验证步骤

1. 打开管理后台 → 模型定价页，确认模型能力配置卡片左侧同屏显示图片模型和视频模型两个纯文字列表，选中项高亮，无卡片边框。
2. 分别构造多于 8 个和多于 8 个以下的模型列表，确认只有超过 8 个时才出现滚动条。
3. 点击左侧任一图片/视频模型，右侧顶部显示模型名、已开放开关、统计行；开关可切换开放状态。
4. 图片模型确认显示基础能力（图片比例/图片档位）和高级协议适配折叠面板；视频模型确认显示基础能力、参数限制（含秒数范围、参考素材上限、勾选音频生成后出现的音频限制）、请求与能力、高级协议适配。
5. 右侧内容较多时整体在固定高度内滚动；点卡片右上角「保存」能正常保存设置。

## 视频节点能力弹窗精简

### 可测试变更

- 视频节点能力弹窗中的“添加水印”改为与“生成音频”一致的单行开关，不再显示“输出”分组和卡片容器。
- 视频节点能力弹窗移除“角色朝向参考”和“多镜头分镜”前端设置；运动控制不再由通用视频节点能力弹窗提供，后续由技能模块承接。
- 清理多镜头分镜专用的已连接资源选项计算与组件参数传递；首帧、首尾帧、视频模式、时长、生成音频和水印能力保持不变。
- 管理后台「模型定价 → 模型能力配置」移除“运动控制”和“多镜头”能力开关，并移除“运动控制请求适配”面板类型选项；已有底层字段仍保留透传。
- 管理后台视频能力配置移除“音频生成限制”区块；音频限制字段仍保留兼容，不再提供后台编辑入口。
- “参考素材数量上限”中视频数量支持 `-1=不支持视频参考`，`0` 继续表示使用默认上限。
- 删除管理后台能力开关下方的说明性提示文案。
- “首帧”和“首尾帧”能力改为互斥配置：首帧模型显示一个上传框，首尾帧模型显示首帧与尾帧两个上传框。
- 视频比例 `adaptive` 的展示文案统一为“智能”，内部值仍保持 `adaptive`。
- 现有视频生成请求与底层 Motion Control 协议适配保留，避免影响已有模型接口。

### 验证步骤

1. 在画布中打开视频节点的能力弹窗，确认不再出现“角色朝向参考”和“多镜头分镜”。
2. 选择支持生成音频与水印的视频模型，确认“生成音频”和“添加水印”均为同样布局的单行开关。
3. 分别切换“生成音频”和“添加水印”，确认视频节点对应配置正常保存。
4. 选择支持首帧或首尾帧的视频模型，确认原有“视频能力”切换和帧输入交互不受影响。
5. 打开管理后台模型能力配置，确认能力开关中不再出现“运动控制”“多镜头”，面板类型中不再出现“运动控制请求适配”。
6. 确认参数限制中不再出现“音频生成限制”；将视频参考数量设为 `-1`，确认对应模型的视频参考入口不可用。
7. 在管理后台能力开关中交替勾选“首帧”和“首尾帧”，确认两者始终互斥；前端分别显示单上传框和双上传框。
8. 检查管理后台和视频/画布节点比例选项，确认 `adaptive` 显示为“智能”，请求值仍为 `adaptive`。

## 管理后台渠道删除确认

### 可测试变更

- 管理后台渠道列表点击删除后先弹出二次确认弹窗，展示渠道名称和删除后果。
- 点击“取消”不会删除渠道；点击“确认删除”后才提交删除并刷新渠道列表。

### 验证步骤

1. 打开管理后台渠道列表，点击任意渠道的删除按钮，确认出现二次确认弹窗。
2. 点击“取消”，确认渠道仍保留。
3. 再次点击删除并确认，确认渠道删除成功并从列表移除。
