# Agnes 模型能力配置清单（后台生图/生视频配置项）

> 用途：给 infinite-canvas **后台管理**用——配置生图 / 生视频模型时，明确「哪些是可选开关、哪些是可枚举下拉项、哪些写死不能配」，用于渲染后台配置表单。
>
> 数据来源：Agnes 官方文档 `agnes-image-2.1-flash` 与 `agnes-video-2.5`（已逐字段核对）。本文档不修改仓库代码。

---

## 1. 能力总览（后台开关依据）

后台先用这张表决定**给某个模型展示哪些功能入口**（capability 标志位），再按枚举项渲染下拉。

| 能力 | 生图 `agnes-image-2.1-flash` | 生视频 `agnes-video-2.5` | 后台含义 |
|------|:--:|:--:|------|
| 文生图 (text→media) | ✅ | ✅ (`mode=text`) | 基础入口，恒开 |
| 图生图 / img2img | ✅ (`extra_body.image`) | — | 生图专属：传输入图 |
| 多图合成 | ✅ (多张 `image`) | — | 生图专属：多参考图 |
| 首尾帧控制 | — | ✅ (`mode=keyframe`) | 视频专属：首帧/尾帧 |
| 图片参考 | — | ✅ (`mode=reference` + `images`) | 视频参考模式 |
| 音频参考 | — | ✅ (`mode=reference` + `audios`) | 视频参考模式（音画协同） |
| 视频参考 | — | ✅ (`mode=reference` + `videos`) | 视频参考模式 |
| 随机种子 seed | ❌ 文档未提供 | ✅ (integer) | 仅视频可配可复现 |
| 负向提示词 negative_prompt | ❌ 文档未提供 | ❌ | 两模型均不支持，勿配 |
| 数量 n（一次多张） | 未规定上限（建议默认 1） | ❌ 固定为 1 | 视频恒为 1；生图先按 1 |
| 异步轮询 | ❌ 同步返回 | ✅ 建任务+轮询 | 视频必须轮询 |

> 要点：**生图是同步的、没有首尾帧/参考概念**；**视频才有首尾帧、图片/音频/视频参考、seed**。后台不要把视频能力误配到生图模型上。

---

## 2. 生图模型配置项（`agnes-image-2.1-flash`）

### 2.1 基本信息

| 项 | 值 |
|----|----|
| 模型 ID（写入 `model` 字段） | `agnes-image-2.1-flash` |
| 端点 | `POST /v1/images/generations` |
| 同步 / 异步 | 同步（直接返回 `data[0].url` 或 `b64_json`） |
| 当前价格 | **全部输出档位 + 输入参考图免费** |

### 2.2 可配置枚举项（后台下拉来源）

**① 尺寸档位 `size`**（推荐用档位而非像素）

| 档位 | 含义 |
|------|------|
| `1K` | 1024 基准 |
| `2K` | 2048 基准（推荐默认） |
| `3K` | 3072 基准 |
| `4K` | 4096 基准 |

> 也兼容精确像素写法（如 `1024x768`），但**不支持的尺寸会被自动标准化**到最接近的档位+画幅；后台建议只暴露档位下拉，避免用户填像素被静默改值。

**② 画幅比例 `ratio`**（默认 `1:1`）

`1:1` · `3:4` · `4:3` · `16:9` · `9:16` · `2:3` · `3:2` · `21:9`

**③ 输出格式 `response_format`**（必须走 `extra_body`，不能放顶层）

`url`（默认，推荐） · `b64_json`（图生图 Base64 也可用顶层 `return_base64: true`）

### 2.3 输出像素参考（后台可展示给用户，或做裁剪提示）

| ratio＼size | 1K | 2K | 3K | 4K |
|---|---|---|---|---|
| 1:1 | 1024×1024 | 2048×2048 | 3072×3072 | 4096×4096 |
| 3:4 | 864×1152 | 1728×2304 | 2592×3456 | 3456×4608 |
| 4:3 | 1152×864 | 2304×1728 | 3456×2592 | 4608×3456 |
| 16:9 | 1312×736 | 2624×1472 | 3936×2208 | 5248×2944 |
| 9:16 | 736×1312 | 1472×2624 | 2208×3936 | 2944×5248 |
| 2:3 | 832×1248 | 1664×2496 | 2496×3744 | 3328×4992 |
| 3:2 | 1248×832 | 2496×1664 | 3744×2496 | 4992×3328 |
| 21:9 | 1568×672 | 3136×1344 | 4704×2016 | 6272×2688 |

> 如需标准显示器素材（如 `1920x1080`），后台引导用户选 `size=2K` + `ratio=16:9`，再在下游裁剪/缩放。

### 2.4 生图能力开关（写入 capability）

- `text2img`（文生图）：✅ 必开
- `img2img`（图生图）：✅ 开（`extra_body.image` 单张，URL 或 Data URI Base64）
- `multi_image`（多图合成）：✅ 开（`extra_body.image` 多张；前 3 张参考图免费）
- `first_last_frame`：❌ 关（生图无此概念）
- `reference_audio` / `reference_video`：❌ 关

### 2.5 生图易错点（后台校验要拦截）

- `response_format` **绝不能放请求顶层**，必须嵌套 `extra_body.response_format`；图生图不需要 `tags:["img2img"]`。
- 输入图必须是**公开 HTTPS URL** 或 Data URI Base64；图生图 / 多图合成时 `image` 为必填。
- 客户端超时建议 60s–360s（复杂提示/大尺寸可能数十秒）。

---

## 3. 生视频模型配置项（`agnes-video-2.5`）

### 3.1 基本信息

| 项 | 值 |
|----|----|
| 模型 ID（写入 `model` 字段） | `agnes-video-2.5` |
| 创建端点 | `POST /v1/videos` |
| 轮询端点 | `GET /agnesapi?video_id=<ID>&model_name=agnes-video-2.5` |
| 同步 / 异步 | **异步**：建任务 → 轮询至 `completed`/`failed` |
| 结果地址 | `metadata.url`（仅 `status=completed` 时有效） |
| `n` | 固定 `1`（不可配） |

### 3.2 可配置枚举项（后台下拉来源）

**① 生成模式 `mode`**（决定了后续显示哪些媒体上传框）

| 模式 | 说明 | 必需媒体 | 后台显示 |
|------|------|---------|---------|
| `text` | 纯文本生成 | 无 | 仅提示词框 |
| `keyframe` | 首尾帧控制 | `first_frame` 与 `last_frame` 至少一 | 首帧 / 尾帧上传框 |
| `reference` | 多模态参考 | `images` / `audios` / `videos` 至少一类 | 图片 / 音频 / 视频参考上传框 |

**② 时长 `seconds`**（**字符串**，默认 `"5"`，范围 `"4"`–`"12"`）

后台下拉建议：`4` `5` `6` `8` `10` `12`（注意发给接口必须是字符串，如 `"5"`）

**③ 分辨率档位 `size`**

`720P`（¥0.15/秒） · `960P`（¥0.25/秒） · `2K`（¥0.35/秒）

**④ 画幅比例 `aspect_ratio`**（默认 `16:9`，**不支持 `auto`**）

`21:9` · `16:9` · `4:3` · `1:1` · `3:4` · `9:16`

**⑤ 随机种子 `seed`**：integer，可选；相同种子提高可复现性（后台做「可复现」开关 + 数字输入）。

### 3.3 画幅像素参考（720P 档，后台可展示）

| aspect_ratio | 720P 输出像素 | 推荐场景 |
|---|---|---|
| 21:9 | 1680×720 | 超宽银幕、电影感 |
| 16:9 | 1280×720 | 横版视频、产品展示（默认） |
| 4:3 | 960×720 | 通用横版/传统画幅 |
| 1:1 | 720×720 | 社媒信息流/方形 |
| 3:4 | 720×960 | 竖版展示/人物 |
| 9:16 | 720×1280 | 移动端短视频/竖屏 |

> 960P / 2K 按所选 `aspect_ratio` 输出更高分辨率，实际宽高以 API 响应为准。

### 3.4 模式专用媒体字段（后台按 mode 动态渲染）

| 字段 | 适用模式 | 说明 |
|------|---------|------|
| `first_frame` | keyframe | 首帧图片 URL（与 `last_frame` 至少一） |
| `last_frame` | keyframe | 尾帧图片 URL |
| `images[]` | reference | 参考图片 URL 列表；提示词用 `<Picture N>` 指代（从 1 编号） |
| `audios[]` | reference | 参考音频 URL 列表；提示词用 `<Audio N>` 指代 |
| `videos[]` | reference | 参考视频对象列表；提示词用 `<Video N>` 指代 |
| `videos[].url` | reference | 可公开访问视频 URL（必填） |
| `videos[].start_seconds` | reference | 从指定秒数读取，默认 `0` |
| `videos[].require_audio` | reference | 是否要求片源带音轨，默认 `false` |

> `keyframe` 尽力把输入图保持为成片真实首/尾帧；`reference` 把素材当内容/风格/动作/节奏参考，可能重新构图。两者不要混用媒体字段。

### 3.5 视频能力开关（写入 capability）

- `text2img`（文生视频）：✅ 必开
- `first_last_frame`：✅ 开（keyframe）
- `reference_image`：✅ 开（reference + images）
- `reference_audio`：✅ 开（reference + audios，音画协同）
- `reference_video`：✅ 开（reference + videos）
- `img2img`（生图式单图转视频）：❌ 此模型无，首尾帧用 keyframe 替代
- `seed`：✅ 可选开

### 3.6 视频计费（后台可展示给用户）

- 输出：720P ¥0.15/秒、960P ¥0.25/秒、2K ¥0.35/秒。
- 输入图片前 5 张免费，第 6 张起 ¥0.03/张。
- 输入视频时长计入总计费时长（与输出秒数相加）。
- 公式：`金额 = (输出秒数 + 输入视频秒数) × 分辨率单价 + max(0, 图片数−5) × ¥0.03`。

### 3.7 视频不可配置 / 会 400 的项（后台校验拦截）

- ❌ `width` / `height` / `fps` / `num_frames` / `quality` / `num_inference_steps` 等字段（不存在）。
- ❌ `size` 写成像素（如 `1280x720`）；分辨率用 `size` 档位，画幅用 `aspect_ratio`。
- ❌ `aspect_ratio` 设为 `auto` 或白名单外比例。
- ❌ `n` 设为 `1` 以外。
- ❌ `mode` 与媒体字段不匹配，或 `reference` 未提供任何参考媒体。
- ❌ 用 `video_url` / `video_path` / `input_reference` 等错误字段名传参考（必须用 `videos[].url` 等）。
- 参考媒体链接必须公开可访问，且任务完成前保持有效。

---

## 4. 后台存储的 ModelConfig 结构建议

每个模型在后台存一条配置，前端/适配层读取后渲染与校验：

```yaml
# 生图模型示例
- model_id: agnes-image-2.1-flash
  type: image
  enabled: true
  api_base: https://api.agnes-ai.cn/v1
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
    size: [1K, 2K, 3K, 4K]            # 默认 2K
    ratio: [1:1, 3:4, 4:3, 16:9, 9:16, 2:3, 3:2, 21:9]  # 默认 1:1
    response_format: [url, b64_json]  # 默认 url
    n: 1
  pricing:
    free: true

# 生视频模型示例
- model_id: agnes-video-2.5
  type: video
  enabled: true
  api_base: https://api.agnes-ai.cn/v1
  async: true
  capabilities:
    text2img: true
    first_last_frame: true
    reference_image: true
    reference_audio: true
    reference_video: true
    seed: true
  options:
    mode: [text, keyframe, reference]   # 默认 text
    seconds: ["4","5","6","8","10","12"]  # 字符串
    size: [720P, 960P, 2K]             # 默认 720P
    aspect_ratio: [21:9, 16:9, 4:3, 1:1, 3:4, 9:16]  # 默认 16:9
    n: 1
  pricing:
    per_second: { 720P: 0.15, 960P: 0.25, 2K: 0.35 }
    free_images: 5
    extra_image_fee: 0.03
```

---

## 5. 后台 UI 渲染规则（落地建议）

1. **先读 `capabilities` 决定显示哪些卡片**：生图只显「文生图 / 图生图 / 多图合成」；视频显「文生视频 / 首尾帧 / 参考（图·音·视频）」。
2. **下拉项来自 `options` 枚举**，不要手写自由输入（尤其 `size`/`ratio`/`aspect_ratio`/`seconds`）。
3. **视频 `mode` 切换时联动媒体上传区**：`text`→只提示词；`keyframe`→首/尾帧；`reference`→图/音/视频参考 + 提示词占位符说明（`<Picture N>`/`<Audio N>`/`<Video N>`）。
4. **隐藏不可配项**：`n` 恒 1、无 `negative_prompt`、无 `seed`（生图）、无 `width/height/fps` 等，后台表单不出现，避免用户误填导致 400。
5. **视频必带轮询状态**：提交后后台/前端按 `GET /agnesapi` 轮询，直到 `completed` 取 `metadata.url`；展示 `progress` 进度条。
6. **价格提示**：视频按档位+时长实时预估费用，生图当前标注「免费」。

---

## 6. 一句话结论

- **生图**：能力 = 文生图 + 图生图 + 多图合成；可配项 = `size`(1K–4K) / `ratio`(8 种) / `response_format`；**无首尾帧、无参考、无 seed**。
- **视频**：能力 = 文生视频 + 首尾帧(keyframe) + 图片/音频/视频参考(reference) + seed；可配项 = `mode` / `seconds`(字符串4–12) / `size`(720P/960P/2K) / `aspect_ratio`(6 种)；**n 恒 1、必须轮询、禁止像素尺寸与 auto 画幅**。
