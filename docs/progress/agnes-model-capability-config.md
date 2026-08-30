# Agnes 模型能力配置清单（后台文本 / 生图 / 生视频配置项）

> 用途：给 infinite-canvas **后台管理**用——配置文本、生图、生视频模型时，明确「哪些是可选开关、哪些是可枚举下拉项、哪些写死不能配」，用于渲染后台配置表单与前端校验。
>
> 数据来源：Agnes 官方文档（已逐字段核对）：
> - 文本：[agnes-2.5-flash](https://www.agnes-ai.cn/zh-Hans/docs/agnes-25-flash)
> - 生图：[agnes-image-2.1-flash](https://www.agnes-ai.cn/zh-Hans/docs/agnes-image-21-flash)
> - 生视频：[agnes-video-2.5-flash](https://www.agnes-ai.cn/zh-Hans/docs/agnes-video-25-flash)
>
> 覆盖模型：`agnes-2.5-flash`、`agnes-image-2.1-flash`、`agnes-video-2.5-flash`（共 3 个）。
>
> 本文档不修改仓库代码。

---

## 1. 模型清单与选型速查

| 模型 ID | 类型 | 端点 | 同步 / 异步 | 当前价格 | 定位 |
|---|---|---|---|---|---|
| `agnes-2.5-flash` | text | `/v1/chat/completions` · `/v1/responses` · `/v1/messages` | 同步（支持流式） | **限时 ¥0**（原价 输入 ¥0.20 / 输出 ¥1.00 每百万） | 2.0-flash 全量升级，优化编码、智能体、工具调用与图像理解 |
| `agnes-image-2.1-flash` | image | `POST /v1/images/generations` | 同步 | 全档位免费 | 图像生成与编辑，优化高信息密度、复杂构图与编辑时的构图保留 |
| `agnes-video-2.5-flash` | video | `POST /v1/videos` + `GET /agnesapi` | 异步 | **限时 ¥0/s**（原价 ¥0.15/s） | 2.5 的轻量版，复用同一接口，砍掉 960P/2K 与视频参考 |

> 统一：`api_base` = `https://api.agnes-ai.cn/v1`。文本与媒体模型默认鉴权为 `Authorization: Bearer <API_KEY>`；**例外**是文本模型的 Messages API（Anthropic 兼容），用 `x-api-key` + `anthropic-version` 头，见 5.2。

---

## 2. 能力总览矩阵（后台开关依据）

后台先用这两张表决定**给某个模型展示哪些功能入口**（capability 标志位），再按枚举项渲染下拉。

### 2.1 媒体模型（生图 / 生视频）

| 能力 | image<br>2.1-flash | video<br>2.5-flash | 后台含义 |
|---|:--:|:--:|---|
| 文生图 / 文生视频 | ✅ | ✅ (`mode=text`) | 基础入口，恒开 |
| 图生图 / img2img | ✅ | — | 生图专属：`extra_body.image` |
| 多图合成 | ✅ | — | 生图专属：多张 `image` |
| 首尾帧控制 | — | ✅ (`mode=keyframe`) | 视频专属：首帧 / 尾帧 |
| 图片参考 | — | ✅（`images`，**≤5 张**） | `mode=reference` |
| 音频参考 | — | ✅ (`audios`) | `mode=reference`，音画协同 |
| 视频参考 | — | ❌ **不支持**（传了 400） | Flash 无此能力 |
| 随机种子 `seed` | ❌ 未提供 | ✅ (integer) | 仅视频可配可复现 |
| 负向提示词 `negative_prompt` | ❌ | ❌ | 两模型均不支持，勿配 |
| 数量 `n`（一次多个） | 未规定上限（建议默认 1） | ❌ 固定 `1` | 视频恒为 1；生图先按 1 |
| 异步轮询 | ❌ 同步返回 | ✅ 建任务 + 轮询 | 视频必须轮询 |

> 要点：**生图是同步的、没有首尾帧 / 参考概念**；**视频才有首尾帧与参考素材**。`agnes-video-2.5-flash` 是裁剪 + 限时免费版本，后台必须按模型区分表单，不能共用一套配置。

### 2.2 文本模型

| 能力 | `agnes-2.5-flash` | 后台含义 |
|---|:--:|---|
| 聊天补全 | ✅ | 基础入口，恒开 |
| 多轮对话 | ✅ | 传完整 `messages` 历史 |
| 图像 URL 输入（视觉理解） | ✅ 文本 + 图像 | **仅输入侧支持图像，输出仍为文本**；图片须公网可访问 URL |
| 工具调用 / Function Calling | ✅ (`tools` / `tool_choice`) | 智能体工作流开关 |
| 流式输出 | ✅ (`stream`) | 画布助手建议默认开启 |
| Thinking / Reasoning | ✅ Thinking 模式开关（见 5.5） | 后台做「深度思考」开关 |
| 系统提示词 | ✅（`messages[].role=system`） | Messages API 下改为顶层 `system` |
| 生图 / 生视频 | ❌ | 文本模型不做媒体生成，勿误配 |
| 上下文窗口 | `512K` tokens | 后台做输入长度上限校验 |
| 最大输出 | `65.5K` tokens | 后台做 `max_tokens` 上限校验 |

> `agnes-2.5-flash` 的请求参数表： `model` / `messages` / `temperature` / `top_p` / `max_tokens` / `stream` / `tools` / `tool_choice` / `chat_template_kwargs` / `thinking`。日常编码助手、画布助手对话、工具调用首选，且当前限时免费。

---

## 3. 生图模型配置项（`agnes-image-2.1-flash`）

### 3.1 基本信息

| 项 | 值 |
|---|---|
| 模型 ID | `agnes-image-2.1-flash` |
| 端点 | `POST /v1/images/generations` |
| 同步 / 异步 | 同步（直接返回 `data[0].url` 或 `b64_json`） |
| 价格（刊例 / 当前） | 1K ¥0.07/张→**¥0**、2K ¥0.12/张→**¥0**、3K ¥0.14/张→**¥0**、4K ¥0.16/张→**¥0**；第 4 张起输入参考图 ¥0.02/张→**¥0** |

### 3.2 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `model` | string | 是 | `agnes-image-2.1-flash` |
| `prompt` | string | 是 | 生成或编辑的文本指令 |
| `size` | string | 是 | 档位 `1K` / `2K` / `3K` / `4K`（推荐）；兼容 `1024x768` 等历史像素写法，但不支持的尺寸会被自动标准化 |
| `ratio` | string | 否 | 见 3.3，默认 `1:1` |
| `image` | string[] | 图生图 / 多图合成必填 | 公网 URL 或 Data URI Base64 |
| `return_base64` | boolean | 否 | 文生图返回 Base64 |
| `extra_body.response_format` | string | 否 | `url`（默认） / `b64_json`，**必须嵌套在 `extra_body` 内** |

### 3.3 支持比例与具体输出像素（后台下拉 + 尺寸提示的唯一数据源）

**支持的 `ratio` 共 8 种（默认 `1:1`）**：`1:1` · `3:4` · `4:3` · `16:9` · `9:16` · `2:3` · `3:2` · `21:9`

**支持的输出档位 `size` 共 4 档（推荐默认 `2K`）**：`1K` · `2K` · `3K` · `4K`

以下像素表为**官方文档确认值**，后台可直接用于下拉提示、裁剪预检和结果尺寸预判：

| ratio | 1K | 2K | 3K | 4K | 适用场景 |
|---|---|---|---|---|---|
| `1:1` | 1024×1024 | 2048×2048 | 3072×3072 | 4096×4096 | 方形主图、头像、社媒方图 |
| `3:4` | 864×1152 | 1728×2304 | 2592×3456 | 3456×4608 | 竖版海报、人物肖像 |
| `4:3` | 1152×864 | 2304×1728 | 3456×2592 | 4608×3456 | 传统横版、演示配图 |
| `16:9` | 1312×736 | 2624×1472 | 3936×2208 | 5248×2944 | 横屏壁纸、视频封面 |
| `9:16` | 736×1312 | 1472×2624 | 2208×3936 | 2944×5248 | 手机竖屏、短视频封面 |
| `2:3` | 832×1248 | 1664×2496 | 2496×3744 | 3328×4992 | 竖版印刷、海报 |
| `3:2` | 1248×832 | 2496×1664 | 3744×2496 | 4992×3328 | 横版摄影、电商主图 |
| `21:9` | 1568×672 | 3136×1344 | 4704×2016 | 6272×2688 | 超宽银幕、电影感横幅 |

**输出格式 `extra_body.response_format`**：`url`（默认） · `b64_json`

> 两点必须写进后台校验：
> 1. **只暴露「档位 + 画幅」两个下拉，禁止自由输入像素**。非原生尺寸（如 `1920x1080`、`2560x1440`）会被静默映射到最接近的档位 + 画幅——例如 `1920x1080` 会落到 16:9 的 1K 档 `1312×736`，用户会拿到与预期完全不符的尺寸。
> 2. 需要标准显示器素材时，引导用户选 `size=2K` + `ratio=16:9`（输出 `2624×1472`），再在下游裁剪 / 缩放到目标画布。

### 3.4 生图能力开关（写入 capability）

- `text2img`（文生图）：✅ 必开
- `img2img`（图生图）：✅ 开（`extra_body.image` 单张）
- `multi_image`（多图合成）：✅ 开（`extra_body.image` 多张）
- `first_last_frame` / `reference_image` / `reference_audio` / `reference_video` / `seed`：❌ 关

### 3.5 生图响应与易错点（后台校验要拦截）

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `created` | integer | 请求创建时间戳 |
| `data[].url` | string / null | 图像 URL；Base64 输出时为 null |
| `data[].b64_json` | string / null | Base64 数据；URL 输出时为 null |
| `data[].revised_prompt` | string / null | 修正后的提示词，无则 null |

**易错点**

- `response_format` **绝不能放请求顶层**，必须写 `extra_body.response_format`。
- 图生图 **不要传** `tags: ["img2img"]`。
- 文生图不传 `image`；图生图 / 多图合成 `extra_body.image` 为必填。
- 输入图必须是**公网可访问 HTTPS URL**（无需登录 / cookie）或 Data URI Base64。
- 客户端超时建议 `60s – 360s`。

---

## 4. 生视频模型配置项（`agnes-video-2.5-flash`）

### 4.1 基本信息与硬限制

| 项 | 值 |
|---|---|
| 模型 ID | `agnes-video-2.5-flash` |
| 端点 | `POST /v1/videos` + `GET /agnesapi` |
| 同步 / 异步 | 异步（建任务 + 轮询） |
| `size` | **固定 `720P`**，传其它值 400：`size must be 720P` |
| `reference.images` | **最多 5 张**，超出 400：`images length must not exceed 5` |
| `reference.videos` | ❌ 不支持，传入有效内容 400：`videos is not supported` |
| 轮询 `model_name` | `agnes-video-2.5-flash` |
| 价格 | 720P 原价 ¥0.15/s，**现价 ¥0/s（限时免费）** |

> Flash 的专属校验在**任务创建、排队、计费和推理前**执行，失败不建任务、不产生费用。同一次请求有多个错误时，按 `size` → `images` → `videos` 的顺序返回首个错误，后台前端应按这个顺序做校验提示。

### 4.2 请求参数（全部为 Flash 生效项）

| 参数 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `model` | string | 是 | `agnes-video-2.5-flash` |
| `prompt` | string | 是 | 视频内容描述；参考模式用 `<Picture N>` / `<Audio N>` 指代素材 |
| `mode` | string | 是 | `text` / `keyframe` / `reference` |
| `seconds` | string | 否 | **字符串** `"4"`–`"12"`，默认 `"5"` |
| `size` | string | 否 | **固定 `720P`**（不开放选择，避免 400） |
| `aspect_ratio` | string | 否 | 默认 `16:9`，**不支持 `auto`**，取值见 4.3 |
| `seed` | integer | 否 | 相同种子提高可复现性 |
| `n` | integer | 否 | 仅支持 `1`，默认 `1` |

**生成模式 `mode`（决定后台显示哪些媒体上传框）**

| 模式 | 说明 | 必需媒体 | 不允许的媒体字段 |
|---|---|---|---|
| `text` | 纯文本生成 | 无 | `first_frame`、`last_frame`、`images`、`audios`、`videos` |
| `keyframe` | 首尾帧控制 | `first_frame` 与 `last_frame` 至少一个 | `images`、`audios`、`videos` |
| `reference` | 多模态参考 | `images` 或 `audios` 至少一类非空（**≤5 张图**） | `first_frame`、`last_frame`、`videos` |

**其余可配置枚举项**

- 时长 `seconds`（**字符串**）：后台下拉 `4` `5` `6` `8` `10` `12`，提交时必须是 `"5"` 这类字符串。
- 种子 `seed`：integer，可选，后台做「可复现」开关 + 数字输入。

### 4.3 支持比例与具体输出像素

**支持的 `aspect_ratio` 共 6 种（默认 `16:9`，不支持 `auto`）**：`21:9` · `16:9` · `4:3` · `1:1` · `3:4` · `9:16`

#### 720P 档 —— 官方确认值（Flash 的全部尺寸组合）

| aspect_ratio | 720P 输出像素 | 推荐场景 |
|---|---|---|
| `21:9` | 1680×720 | 超宽银幕、电影感场景 |
| `16:9` | 1280×720 | 横版视频、产品展示（默认） |
| `4:3` | 960×720 | 通用横版和传统画幅 |
| `1:1` | 720×720 | 社交媒体信息流和方形内容 |
| `3:4` | 720×960 | 竖版展示和人物内容 |
| `9:16` | 720×1280 | 移动端短视频和竖屏内容 |

> `agnes-video-2.5-flash` 只支持 720P，上表即它的**全部**尺寸组合，无需再考虑其它分辨率档位。

### 4.4 模式专用媒体字段

| 字段 | 适用模式 | 说明 |
|---|---|---|
| `first_frame` | keyframe | 首帧图片 URL（与 `last_frame` 至少一） |
| `last_frame` | keyframe | 尾帧图片 URL |
| `images[]` | reference | 参考图片 URL 列表；提示词用 `<Picture N>` 指代（从 1 编号）。**Flash 上限 5 张** |
| `audios[]` | reference | 参考音频 URL 列表；提示词用 `<Audio N>` 指代 |
| `videos[]` | （不支持） | Flash 不支持视频参考，传入有效内容 400 |

> `keyframe` 尽力把输入图保持为成片真实首/尾帧；`reference` 把素材当内容 / 风格 / 动作 / 节奏参考，可能重新构图。两类媒体字段不要混用。

### 4.5 异步任务与轮询

**创建任务** `POST /v1/videos`，响应关键字段：

| 字段 | 说明 |
|---|---|
| `id` / `task_id` | 任务 ID（两者同一任务） |
| `video_id` | **查询进度与结果要用这个** |
| `status` | `queued` / `in_progress` / `completed` / `failed` |
| `progress` | 0–100 |
| `seconds` / `size` / `created_at` | 回显参数与创建时间 |

**轮询** `GET /agnesapi?video_id=<ID>&model_name=agnes-video-2.5-flash`

- 带 `model_name` 的查询**适用于全部模式**，是推荐且后台应默认采用的方式。
- 不带 `model_name` 的纯 `video_id` 查询**仅适用于 `mode=text`**；`keyframe` / `reference` 必须带 `model_name`，否则查不到。
- 后台需为**该模型单独配置 `poll_model_name`**（`agnes-video-2.5-flash`）。
- 建议 1–2 秒轮询一次，设置最大轮询时长，并对超时与 `429` 做指数退避。

**任务完成响应**：`status=completed` 且 `progress=100` 时取 `metadata.url` 作为可交付视频地址；失败时 `metadata` 为 `null`，`error.message` 给出原因。仅 `status=completed` 时 `metadata.url` 才有效。

**错误码处理**

| 状态码 | 常见原因 | 处理建议 |
|---|---|---|
| 400 | 参数缺失、模式与媒体不匹配、时长/画幅非法、Flash 专属限制 | 按 `size`→`images`→`videos` 顺序提示 |
| 401 / 403 | API Key 无效、过期或无权限 | 检查请求头与密钥、模型权限 |
| 404 | `video_id` 不存在 | 确认用的是创建响应里的 `video_id` |
| 429 | 频率超限 | 指数退避、降低轮询频率 |
| 500 | 服务端内部错误 | 稍后重试，持续失败联系技术支持 |

### 4.6 视频能力开关（写入 capability）

| 开关 | `agnes-video-2.5-flash` |
|---|:--:|
| `text2video` | ✅ 必开 |
| `first_last_frame` | ✅ |
| `reference_image` | ✅（`max_images: 5`） |
| `reference_audio` | ✅ |
| `reference_video` | ❌ 关 |
| `seed` | ✅ |
| `img2img` | ❌ 用 keyframe 替代 |

### 4.7 视频计费（后台可展示）

`agnes-video-2.5-flash`：当前**限时免费**，输出秒数、输入视频秒数、参考图片均按 `¥0` 计（原价 720P ¥0.15/s）。后台价格提示需展示「限时免费」，政策以平台公告为准。

### 4.8 视频不可配置 / 会 400 的项（后台校验拦截）

- ❌ `size` 写成像素（如 `1280x720`），或传 `720P` 以外档位。
- ❌ `aspect_ratio` 设为 `auto` 或 `21:9`/`16:9`/`4:3`/`1:1`/`3:4`/`9:16` 之外的比例。
- ❌ `n` 设为 1 以外。
- ❌ `width` / `height` / `fps` / `num_frames` / `quality` / `num_inference_steps` 等字段。
- ❌ 用 `video_url` / `video_path` / `video_reference` / `input_reference` / `reference_url` 传素材，必须用 `images[]`、`audios[]`、`first_frame`、`last_frame`。
- ❌ `mode` 与媒体字段不匹配，或 `reference` 未提供任何参考媒体。
- ❌ 上传超过 5 张参考图，或传入有效 `videos`。
- ❌ 轮询时 `keyframe` / `reference` 任务漏带 `model_name`。
- 所有媒体 URL 必须公网可访问，且在任务完成前保持有效。

---

## 5. 文本模型配置项（`agnes-2.5-flash`）

### 5.1 基本信息与能力定位

| 项 | 值 |
|---|---|
| 模型 ID | `agnes-2.5-flash` |
| 定位 | 2.0-flash 全量升级，均衡型语言模型，优化编码、智能体、工具调用与图像理解 |
| 端点 | `/v1/chat/completions` · `/v1/responses` · `/v1/messages` |
| 上下文窗口 | `512K` tokens |
| 最大输出 | `65.5K` tokens |
| 输入模态 | 文本 + 图像 URL（仅输入侧，输出仍为文本） |
| 输出模态 | 文本 |
| 价格 | **限时 ¥0**（原价 输入 ¥0.20 / 输出 ¥1.00 每百万 Token） |
| 可访问性 | 已全量上线，有 API 访问权限即可用 |
| Thinking | 需显式启用（见 5.5） |

> 请求参数表： `model` / `messages` / `temperature` / `top_p` / `max_tokens` / `stream` / `tools` / `tool_choice` / `chat_template_kwargs` / `thinking`。后台可用一套文本模型表单承载，仅需按本模型的上下文 / 输出上限、价格、Thinking 默认值取值。

### 5.2 三种 API 风格（后台需先选风格，再决定鉴权与解析逻辑）

| 风格 | 端点 | 鉴权头 | 输入字段 | 输出读取路径 | 建议 |
|---|---|---|---|---|---|
| **Chat Completions**（OpenAI 兼容，推荐默认） | `POST /v1/chat/completions` | `Authorization: Bearer <KEY>` | `messages` | `choices[0].message.content` | **后台默认选这个**，与现有 OpenAI SDK 调用路径最贴合 |
| **Responses**（OpenAI 新版） | `POST /v1/responses` | `Authorization: Bearer <KEY>` | `input`（字符串或结构化数组） | `output[].type=message` → `content[].type=output_text` | 需要 reasoning 输出项时用；**解析方式与 Chat 不同，见 5.6** |
| **Messages**（Anthropic 兼容） | `POST /v1/messages` | **`x-api-key: <KEY>`** + **`anthropic-version: 2023-06-01`** | `messages` + 顶层 `system` | `content[].type=text` → `content[].text` | 仅在已有 Anthropic 集成时选；`max_tokens` 为必填 |

> ⚠️ **鉴权差异是接入时最容易踩的点**：Chat Completions 与 Responses 走 `Authorization: Bearer`，Messages 走 `x-api-key` 且必须带 `anthropic-version`，三者不能混用。后台配置里 `api_style` 与鉴权头必须绑定。

### 5.3 请求参数

**Chat Completions**

| 参数 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `model` | string | 是 | `agnes-2.5-flash` |
| `messages` | array | 是 | 对话消息数组，含 `system` / `user` / `assistant` 角色 |
| `messages[].content` | string / array | 是 | 纯文本，或含 `text` 与 `image_url` 的内容块数组 |
| `temperature` | number | 否 | 输出随机性，值越低越确定 |
| `top_p` | number | 否 | 核采样 |
| `max_tokens` | number | 否 | 响应生成的最大 token 数 |
| `stream` | boolean | 否 | 是否启用流式输出 |
| `tools` | array | 否 | 工具调用的工具定义 |
| `tool_choice` | string / object | 否 | 控制是否使用工具及如何使用 |
| `chat_template_kwargs` | object | 否 | OpenAI 兼容请求的扩展字段（用于启用 Thinking） |
| `thinking` | object | 否 | Anthropic 兼容请求启用 Thinking 模式 |

**图像 URL 输入格式**（图片必须是公网可访问 URL）：

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "分析这张架构图，指出可能的故障点。" },
    { "type": "image_url", "image_url": { "url": "https://example.com/diagram.png" } }
  ]
}
```

**Responses API 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `model` | string | 是 | `agnes-2.5-flash` |
| `input` | string / array | 是 | 纯文本 Prompt 或结构化输入数组（内容块类型为 `input_text`） |
| `max_output_tokens` | integer | 否 | 最大输出预算；**推理模型建议设大，避免状态变为 `incomplete`** |

**Messages API 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `model` | string | 是 | `agnes-2.5-flash` |
| `max_tokens` | integer | **是** | 最大输出 token；推理模型建议设大 |
| `messages` | array | 是 | 支持 `user` / `assistant` 角色 |
| `system` | string / array | 否 | 系统指令（**注意是顶层字段，不在 `messages` 里**） |
| `temperature` | number | 否 | 输出随机性 |
| `stream` | boolean | 否 | 是否流式 |

### 5.4 限制与价格（后台做输入 / 输出上限校验与费用提示）

| 项 | `agnes-2.5-flash` |
|---|---|
| 上下文窗口 | `512K` tokens |
| 最大输出 | `65.5K` tokens |
| 输入 | ¥0.20 / 百万 Token → **现价 ¥0（限时免费）** |
| 输出 | ¥1.00 / 百万 Token → **现价 ¥0（限时免费）** |

> flash 当前限时免费，但原价不为 0；后台价格文案应写成「限时免费」，不要写成永久免费。

### 5.5 Thinking 模式

`agnes-2.5-flash` 的 `chat_template_kwargs` 与 `thinking` 字段用于显式启用 Thinking（默认不开启）。

**OpenAI 兼容格式**（走 `/v1/chat/completions`）

```json
{
  "model": "agnes-2.5-flash",
  "messages": [{ "role": "user", "content": "帮我写一个处理 CSV 的 Python 脚本。" }],
  "chat_template_kwargs": { "enable_thinking": true }
}
```

**Anthropic 兼容格式**（走 `/v1/messages`）

```json
{
  "model": "agnes-2.5-flash",
  "messages": [{ "role": "user", "content": "重构这个 TypeScript 函数并说明改动。" }],
  "thinking": { "type": "enabled", "budget_tokens": 2048 }
}
```

- 常规编码任务建议从 `budget_tokens: 2048` 起；复杂调试、重构或多步智能体任务可适当提高预算。
- 开启 Thinking 后，`max_tokens` / `max_output_tokens` 的默认值应上调（推理过程会占用输出预算）。

**后台落地建议**

- 文本模型表单加一个「深度思考」开关：对应 `chat_template_kwargs.enable_thinking`。
- 开启 Thinking 时，`max_tokens` 默认值应上调。

### 5.6 响应解析要点（接入时最容易出错，务必按此实现）

1. **Responses 没有顶层 `output_text`**。官方明确说明：「当前响应不包含顶层 `output_text` 便捷字段」，必须遍历 `output[]`，取 `type === "message"` 的项，再取其 `content[]` 中 `type === "output_text"` 的 `text`。
2. **Reasoning 输出位置不固定**，可能在 `content[].reasoning_text`，也可能在 `summary[].summary_text`，客户端应两处都兼容，且不要把 reasoning 内容直接当正文展示给用户。
3. **Token 字段名不统一**：官方文档要求「客户端应同时兼容 `input_tokens` / `output_tokens` 与 `prompt_tokens` / `completion_tokens`」。用量统计与计费展示必须做双字段兜底。
4. **`status === "incomplete"` 要处理**：读 `incomplete_details` 判断原因，用更大的 `max_output_tokens` 重试——推理模型可能在输出正文前就消耗掉一部分输出预算。
5. **Messages API 的 `stop_reason === "max_tokens"`** 表示被长度截断，应提示并允许提高 `max_tokens` 后重试。
6. Messages API 的 `usage` 含 `cache_creation_input_tokens` 与 `cache_read_input_tokens`，可做缓存命中率统计。

### 5.7 文本模型能力开关（写入 capability）

| 开关 | `agnes-2.5-flash` | 后台含义 |
|---|:--:|---|
| `chat` | ✅ 必开 | 基础对话入口 |
| `vision`（图像 URL 输入） | ✅ | 开启后允许在消息里贴图；仅输入侧，输出仍是文本 |
| `tools`（函数调用） | ✅ | 智能体工作流开关 |
| `stream`（流式） | ✅ | 建议默认开启 |
| `thinking` | ✅ 可切换开关 | 见 5.5 |
| `text2img` / `text2video` 等媒体能力 | ❌ | 文本模型不提供媒体生成 |

---

## 6. 后台存储的 ModelConfig 结构建议

每个模型在后台存一条配置，前端 / 适配层读取后渲染与校验：

```yaml
# ---------- 文本 ----------
- model_id: agnes-2.5-flash
  type: text
  enabled: true
  api_base: https://api.agnes-ai.cn/v1
  api_style: chat_completions          # chat_completions | responses | messages
  endpoints:
    chat_completions: /v1/chat/completions
    responses: /v1/responses
    messages: /v1/messages
  auth:
    chat_completions: { header: Authorization, scheme: Bearer }
    responses:        { header: Authorization, scheme: Bearer }
    messages:         { header: x-api-key, extra: { anthropic-version: "2023-06-01" } }
  capabilities:
    chat: true
    vision: true        # 输入侧图像 URL，输出仍为文本
    tools: true
    stream: true
    thinking: true      # 需显式开启：chat_template_kwargs.enable_thinking
    text2img: false
    text2video: false
  limits:
    context_window: 512000
    max_output_tokens: 65536           # 文档记为 65.5K
  options:
    temperature: { min: 0, max: 2, default: 0.7 }
    top_p:       { min: 0, max: 1 }
    max_tokens:  { min: 1, max: 65536, default: 2048 }
    stream: true
  thinking:
    openai_style:  { chat_template_kwargs: { enable_thinking: true } }
    anthropic_style: { thinking: { type: enabled, budget_tokens: 2048 } }
  pricing:
    per_million_tokens:
      input: 0                          # 原价 0.20，限时免费
      output: 0                         # 原价 1.00，限时免费
    free: true
    note: 限时免费，政策以平台公告为准

# ---------- 生图 ----------
- model_id: agnes-image-2.1-flash
  type: image
  enabled: true
  api_base: https://api.agnes-ai.cn/v1
  endpoint: /v1/images/generations
  async: false
  capabilities:
    text2img: true
    img2img: true
    multi_image: true
    first_last_frame: false
    reference_image: false
    reference_audio: false
    reference_video: false
    seed: false
  options:
    size: [1K, 2K, 3K, 4K]                             # 默认 2K
    ratio: [1:1, 3:4, 4:3, 16:9, 9:16, 2:3, 3:2, 21:9] # 默认 1:1
    response_format: [url, b64_json]                   # 走 extra_body.response_format
    n: 1
  # 官方确认值，后台可直接用于下拉提示与结果尺寸预判
  size_pixels:
    1:1:  { 1K: 1024x1024, 2K: 2048x2048, 3K: 3072x3072, 4K: 4096x4096 }
    3:4:  { 1K: 864x1152,  2K: 1728x2304, 3K: 2592x3456, 4K: 3456x4608 }
    4:3:  { 1K: 1152x864,  2K: 2304x1728, 3K: 3456x2592, 4K: 4608x3456 }
    16:9: { 1K: 1312x736,  2K: 2624x1472, 3K: 3936x2208, 4K: 5248x2944 }
    9:16: { 1K: 736x1312,  2K: 1472x2624, 3K: 2208x3936, 4K: 2944x5248 }
    2:3:  { 1K: 832x1248,  2K: 1664x2496, 3K: 2496x3744, 4K: 3328x4992 }
    3:2:  { 1K: 1248x832,  2K: 2496x1664, 3K: 3744x2496, 4K: 4992x3328 }
    21:9: { 1K: 1568x672,  2K: 3136x1344, 3K: 4704x2016, 4K: 6272x2688 }
  pricing: { free: true }

# ---------- 生视频 ----------
- model_id: agnes-video-2.5-flash
  type: video
  enabled: true
  api_base: https://api.agnes-ai.cn/v1
  endpoint: /v1/videos
  async: true
  poll:
    path: /agnesapi
    model_name: agnes-video-2.5-flash                  # 必须按模型配置
    require_model_name_for: [text, keyframe, reference]
    interval_seconds: 1.5
  capabilities:
    text2video: true
    first_last_frame: true
    reference_image: true
    reference_audio: true
    reference_video: false                             # Flash 硬限制
    seed: true
  options:
    mode: [text, keyframe, reference]
    seconds: ["4","5","6","8","10","12"]
    size: [720P]                                       # 固定，只读
    aspect_ratio: [21:9, 16:9, 4:3, 1:1, 3:4, 9:16]    # 默认 16:9
    n: 1
  # Flash 仅 720P，下表即其全部尺寸组合（官方确认值）
  size_pixels:
    720P: { 21:9: 1680x720, 16:9: 1280x720, 4:3: 960x720,
            1:1: 720x720,   3:4: 720x960,   9:16: 720x1280 }
  reference_limits: { images: 5, videos: false }
  pricing:
    per_second: { 720P: 0 }                            # 限时免费
    free_images: 5
    extra_image_fee: 0
    note: 限时免费，政策以平台公告为准
```

---

## 7. 后台 UI 渲染与校验规则（落地建议）

**通用**

1. **先按 `type` 分流，再按 `model_id` 取模板**：`text` 走对话模型表单，`image` 走生图表单，`video` 走生视频表单；同类型内再按模型能力裁剪字段。
2. **下拉项全部来自 `options` 枚举**，不要开放自由输入（`size` / `ratio` / `aspect_ratio` / `seconds`）。

**文本模型（agnes-2.5-flash）**

3. **先选 `api_style` 再渲染鉴权与解析相关配置**：选 `messages` 时，鉴权必须切成 `x-api-key` + `anthropic-version: 2023-06-01`，且 `max_tokens` 变为必填、系统提示词移到顶层 `system` 字段。
4. **按 `limits` 做长度校验**：`context_window` 用于前端输入长度上限提示，`max_output_tokens` 约束 `max_tokens` 输入，避免 400。
5. **Thinking 开关**：做成可切换开关，开启后自动提高默认 `max_tokens`。
6. **Responses 风格必须按 5.6 实现解析**：不要期望顶层 `output_text`；`status=incomplete` 时读 `incomplete_details` 并提示加大 `max_output_tokens`；用量统计兼容 `input_tokens/output_tokens` 与 `prompt_tokens/completion_tokens` 两套字段名。
7. **视觉输入仅支持公网图片 URL**：后台贴图功能需校验 URL 可公开访问，且明确提示「输出仍为文本，不生成图片」。

**媒体模型**

8. **读 `capabilities` 显示卡片**：生图只显「文生图 / 图生图 / 多图合成」；`agnes-video-2.5-flash` 显「文生视频 / 首尾帧 / 图·音参考」，**隐藏「视频参考」入口并把 `size` 锁为 `720P`**。
9. **选中比例后展示具体像素**：生图读 `size_pixels[ratio][size]`（官方确认值，如 2K + 16:9 → `2624×1472`）；视频 720P 同样读 `size_pixels[720P][ratio]`。
10. **视频 `mode` 切换时联动媒体上传区**：`text`→仅提示词；`keyframe`→首/尾帧；`reference`→图/音参考 + 提示词占位符说明（`<Picture N>` / `<Audio N>`，各自数组从 1 编号）。
11. **Flash 前端硬校验**：`size` 恒 `720P`、`images` ≤ 5 张、禁止上传参考视频；提示顺序按 `size` → `images` → `videos`，与接口返回一致。
12. **隐藏不可配项**：`n` 恒 1、无 `negative_prompt`、生图无 `seed`、无 `width/height/fps` 等，表单里不出现。
13. **视频必带轮询**：提交后按 `GET /agnesapi?video_id=...&model_name=agnes-video-2.5-flash` 轮询至 `completed`，取 `metadata.url`，展示 `progress` 进度条；`keyframe`/`reference` 切勿省略 `model_name`。
14. **价格提示按模型切换**：生图、`agnes-2.5-flash`、`agnes-video-2.5-flash` 均显示「免费 / 限时免费」。
15. **用 OpenAI 兼容 SDK 时注意**：视频的 `mode`、`aspect_ratio` 和媒体字段需通过 `extra_body` 合并到请求 JSON 顶层；图片的 `response_format` 必须放在 `extra_body` 内，不能放顶层。

---

## 8. 一句话结论

- **文本 `agnes-2.5-flash`**：512K 上下文 / 65.5K 输出，支持图像 URL 输入、工具调用、流式；三端点（Chat Completions / Responses / Messages）通用，靠 `chat_template_kwargs.enable_thinking` 或 `thinking` 显式开启 Thinking；**限时免费**（原价 ¥0.20 / ¥1.00）。日常编码与智能体任务首选。
- **文本模型三条铁律**：① Messages API 用 `x-api-key` + `anthropic-version` 鉴权，与另两种风格不同；② Responses 无顶层 `output_text`，须遍历 `output[]` 取 `type=message` 下的 `output_text`；③ Token 字段名两套命名都要兼容，`status=incomplete` 要加大 `max_output_tokens` 重试。
- **生图 `agnes-image-2.1-flash`**：同步返回，能力 = 文生图 + 图生图 + 多图合成；可配项 = `size`(1K–4K) × `ratio`(8 种)，**8×4 共 32 种组合的像素已由官方确认**（1:1 的 1K 为 1024×1024，16:9 的 2K 为 2624×1472，以此类推）；无首尾帧、无参考、无 seed，`response_format` 必须放 `extra_body`，不要开放像素自由输入。
- **生视频 `agnes-video-2.5-flash`**：异步 + 轮询，仅 720P（6 种画幅像素均为官方确认值），三条硬限制为 `size` 只能 `720P`、`images` ≤ 5 张、不支持 `videos`；轮询必须带 `model_name=agnes-video-2.5-flash`；当前限时免费。
