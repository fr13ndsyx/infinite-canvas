# Infinite-Canvas 媒体生成适配层设计文档

> 目标：在 Go 后端（:8080）做一层**供应商无关的 OpenAI 兼容适配层**，把生图 / 生视频收敛成前端早已在用的 OpenAI 调用形态。前端零改动、API Key 只在后端、异步轮询在后端内部消化。
>
> 本文档只描述设计与契约，不修改任何仓库代码。落地时再转 todo → 编码。

---

## 1. 背景与问题定位

你当前的现象是：**对话模型能用，生图 / 生视频用不了**。这恰恰说明 `base_url` 和 `API Key` 是对的（否则对话也连不上），问题出在「生图 / 视频的调用契约和 OpenAI 官方客户端对不齐」。

| 端点 | OpenAI 路径 | Agnes 实际 | 能否走 OpenAI 客户端 | 根因 |
|------|------------|-----------|--------------------|------|
| 对话 | `/v1/chat/completions` | 标准兼容 | ✅ 原生可用 | Agnes 完整实现该协议 |
| 生图 | `/v1/images/generations` | 路径 + 返回 `{data:[{url}]}` **兼容**，参数细节不兼容 | ⚠️ 默认调法必报错 | 模型名 / `response_format` 嵌套 / size 档位 |
| 视频 | `/v1/videos`（**非** OpenAI 路径） | 异步任务式 + 自定义轮询 `/agnesapi` | ❌ 完全不行 | 客户端无 `.videos` 方法，且是异步 |

> **核心判断**：单纯「改 `base_url`」只能覆盖 OpenAI 兼容那一层，Agnes 视频这种非标准还是会漏。所以必须把适配做成一个**抽象层**，而非配置捷径。

---

## 2. 接口契约对照表（关键交付物）

### 2.1 三维度对照

| 维度 | OpenAI 标准 | Agnes 生图 (`agnes-image-2.1-flash`) | Agnes 视频 (`agnes-video-2.5`) |
|------|------------|--------------------------------------|-------------------------------|
| 端点路径 | `POST /v1/images/generations` | `POST /v1/images/generations` ✅ 同 | `POST /v1/videos` ❌ 非标准 |
| 是否 OpenAI 兼容 | — | ✅ 路径 + 响应兼容 | ❌ 仅建任务 body 兼容 |
| 鉴权 | `Authorization: Bearer <KEY>` | 同 | 同 |
| 模型名字段 | `model` | 必须显式 `agnes-image-2.1-flash` | 必须显式 `agnes-video-2.5` |
| 同步 / 异步 | 同步返回 URL | 同步返回 URL | **异步**：建任务 → 轮询 |
| 建任务响应 | `{created, data:[{url}]}` | 同 | `{video_id, status:"queued", ...}` |
| 取结果 | 直接拿 `data[0].url` | 直接拿 `data[0].url` | `GET /agnesapi?video_id=<ID>&model_name=agnes-video-2.5` 轮询 |
| 最终地址位置 | `data[0].url` | `data[0].url` | `metadata.url`（status=completed） |

### 2.2 生图请求字段对照（最容易踩坑）

| 字段 | OpenAI 默认 | Agnes 要求 | 说明 |
|------|------------|-----------|------|
| `model` | `dall-e-2` / `gpt-image-1` | **必须** `agnes-image-2.1-flash` | 不传 / 传错 → 报错 |
| `prompt` | 文本 | 文本 | 一致 |
| `size` | `1024x1024` 等 | `1K`/`2K`/`3K`/`4K` 或精确值 `1024x768` | 不要传 OpenAI 专属档 |
| `n` | 1–10 | **只能 1** | 传 >1 必错 |
| `response_format` | 顶层 `url`/`b64_json` | **必须嵌套** `extra_body.response_format` | SDK 会把它拍平到顶层，正好被拒 |
| `image`（图生图） | — | 数组，**必须**在嵌套 `extra_body` | 同上 |
| `ratio` | 无 | `"16:9"` 等 | Agnes 扩展字段 |

> **关键坑**：OpenAI SDK 的 `extra_body` 会被**自动拍平到顶层**。用 SDK 传 `response_format` / `image` 会发出顶层字段，被 Agnes 拒收。所以生图建议用**裸 `fetch` / 原生 HTTP** 直接打 `/v1/images/generations`，自己拼好嵌套 `extra_body`。

### 2.3 视频请求字段对照

| 字段 | Agnes 视频要求 | 类型 / 取值 | 说明 |
|------|---------------|------------|------|
| `model` | `agnes-video-2.5` | string | 必填 |
| `prompt` | 文本 | string | 一致 |
| `mode` | `text` / `keyframe` / `reference` | string | 媒体字段必须配套 |
| `seconds` | `"4"`–`"12"` | **字符串** | 传数字必错 |
| `size` | `720P` / `960P` / `2K` | string 档位 | 不能传像素 |
| `aspect_ratio` | `"16:9"` 等 | string | — |
| `n` | **只能 1** | int | — |
| `first_frame` / `last_frame` | 图生视频首末帧 | string（url/base64） | 仅 `mode=keyframe` |
| `images` / `audios` / `videos` | 多模态参考 | string[] | 仅 `mode=reference`，提示词里用 `<Picture 1>` 占位 |

> **轮询约定**：`GET https://api.agnes-ai.cn/agnesapi?video_id=<ID>&model_name=agnes-video-2.5`，每 1–2 秒一次，直到 `status=completed`（取 `metadata.url`）或 `status=failed`。

---

## 3. 架构设计（供应商无关）

```
前端 (Next.js :3000)  ──OpenAI 形态──▶  Go 适配层 (:8080)
   client.images.generate()                 │
   client.videos.*  (自定义)                ├─ 统一内部契约 (MediaGenerator 接口)
                                           ├─ 注册表 + 配置 (name → 适配器 + key + model map)
  只认一套 OpenAI 形态，永远不变            ├─ 能力声明 (capability)
                                           │
                  ┌────────────────────────┼────────────────────────┐
                  ▼                        ▼                        ▼
           Agnes 适配器             硅基流动 / 百炼 ...        未来任意聚合服务商
           (非标准，含轮询)         (OpenAI 兼容，仅配置)      (加一个文件即可)
```

满足「加供应商 = 加一个文件」的四个前提：

1. **统一内部契约**：前端只认 `/v1/images` 与 `/v1/videos`，永远不变。
2. **`MediaGenerator` 接口**：每个供应商是一个实现该接口的结构体。
3. **注册表 + 配置**：`name → 适配器实现 + 凭据 + model 映射`。新增 = 注册一条 + 加一个文件。
4. **能力声明（capability）**：每个适配器声明支持生图 / 图生图 / 生视频 / 参考模式 / 尺寸档位。**很多聚合服务商根本没有视频**，UI 必须按能力展示，不能假设所有供应商都有视频。

### 异步归一化（最关键的一招）

不同供应商有「同步秒回 URL」和「异步任务轮询」两种模式。适配层把**两者都归一化成内部的异步任务模型**（提交 → 查询 → 出结果）。同步供应商的适配器把那一次调用包成一个「一步完成的任务」即可。这样**前端永远看到统一的异步流**，是否真异步由适配器在内部消化——Agnes 视频那种坑被彻底藏起来。

---

## 4. 目录结构（建议）

```
infinite-canvas/backend/
├── media/
│   ├── core/
│   │   ├── types.go        // 统一请求/响应/Task/Capability
│   │   ├── generator.go    // MediaGenerator 接口
│   │   └── registry.go     // 注册表 + 配置加载
│   ├── providers/
│   │   ├── agnes/
│   │   │   ├── image.go    // Agnes 生图适配器（同步包成任务）
│   │   │   └── video.go    // Agnes 视频适配器（建任务 + 轮询）
│   │   └── openai_compat/
│   │       └── compat.go   // 通用 OpenAI 兼容供应商（仅配置）
│   ├── handler/
│   │   └── routes.go       // HTTP 路由，暴露 OpenAI 形态
│   └── config/providers.yaml
```

---

## 5. 核心接口定义（Go 骨架，非生产代码）

```go
// media/core/types.go
package core

type Kind string
const (
    KindImage Kind = "image"
    KindVideo Kind = "video"
)

type TaskStatus string
const (
    StatusQueued   TaskStatus = "queued"
    StatusRunning  TaskStatus = "running"
    StatusCompleted TaskStatus = "completed"
    StatusFailed   TaskStatus = "failed"
)

// Capability 描述适配器能力，前端据此决定是否展示某项功能
type Capability struct {
    ImageGen      bool     `json:"image_gen"`
    ImageEdit     bool     `json:"image_edit"`       // 图生图
    VideoGen      bool     `json:"video_gen"`
    VideoFromImage bool    `json:"video_from_image"` // 图生视频
    Reference     bool     `json:"reference"`        // 多模态参考
    Async         bool     `json:"async"`            // 底层是否真异步
    Sizes         []string `json:"sizes"`
    Durations     []string `json:"durations"`        // 视频时长（字符串）
    AspectRatios  []string `json:"aspect_ratios"`
}

// ImageRequest 统一内部生图请求（前端永远发这个）
type ImageRequest struct {
    Prompt         string         `json:"prompt"`
    NegativePrompt string         `json:"negative_prompt,omitempty"`
    Size           string         `json:"size,omitempty"`   // 内部档位，如 "2K"
    Ratio          string         `json:"ratio,omitempty"`  // 如 "16:9"
    Image          []string       `json:"image,omitempty"`  // 图生图输入
    N              int            `json:"n,omitempty"`
    Seed           int64          `json:"seed,omitempty"`
    Extra          map[string]any `json:"extra,omitempty"`  // 供应商专属透传
}

// VideoRequest 统一内部生视频请求
type VideoRequest struct {
    Prompt      string         `json:"prompt"`
    Mode        string         `json:"mode,omitempty"`       // text|keyframe|reference
    Seconds     string         `json:"seconds,omitempty"`    // 字符串 "5"
    Size        string         `json:"size,omitempty"`       // 720P/960P/2K
    AspectRatio string         `json:"aspect_ratio,omitempty"`
    FirstFrame  string         `json:"first_frame,omitempty"`
    LastFrame   string         `json:"last_frame,omitempty"`
    Images      []string       `json:"images,omitempty"`
    Audios      []string       `json:"audios,omitempty"`
    Videos      []string       `json:"videos,omitempty"`
    Extra       map[string]any `json:"extra,omitempty"`
}

// MediaResult 统一结果
type MediaResult struct {
    URL      string `json:"url"`
    B64JSON  string `json:"b64_json,omitempty"`
    Seed     int64  `json:"seed,omitempty"`
    Provider string `json:"provider"`
    Model    string `json:"model"`
}

// Task 统一异步任务视图（无论底层同步/异步，前端看到一致）
type Task struct {
    ID        string       `json:"id"`
    Status    TaskStatus   `json:"status"`
    Provider  string       `json:"provider"`
    Kind      Kind         `json:"kind"`
    Result    *MediaResult `json:"result,omitempty"`
    Error     string       `json:"error,omitempty"`
    CreatedAt int64        `json:"created_at"`
}
```

```go
// media/core/generator.go
package core

import "context"

// MediaGenerator 所有供应商适配器都实现这个接口
type MediaGenerator interface {
    Name() string
    Capability() Capability
    // 提交任务：底层同步的也包成「一步完成的任务」返回
    SubmitImage(ctx context.Context, req ImageRequest) (*Task, error)
    SubmitVideo(ctx context.Context, req VideoRequest) (*Task, error)
    // 查询任务状态：同步适配器直接返回 completed
    Query(ctx context.Context, taskID string, kind Kind) (*Task, error)
}
```

```go
// media/core/registry.go
package core

import "sync"

type ProviderConfig struct {
    Name     string            `yaml:"name"`
    BaseURL  string            `yaml:"base_url"`
    APIKey   string            `yaml:"api_key"`     // 走 secret/env，不落库明文
    ModelMap map[string]string `yaml:"model_map"`   // 内部模型名 -> 供应商模型名
    Enabled  bool              `yaml:"enabled"`
}

type Registry struct {
    mu        sync.RWMutex
    providers map[string]MediaGenerator
    configs   map[string]ProviderConfig
}

func (r *Registry) Register(name string, p MediaGenerator, cfg ProviderConfig) {
    r.mu.Lock(); defer r.mu.Unlock()
    r.providers[name] = p
    r.configs[name] = cfg
}
func (r *Registry) Get(name string) (MediaGenerator, bool) {
    r.mu.RLock(); defer r.mu.RUnlock()
    p, ok := r.providers[name]; return p, ok
}
// List 返回含 capability 的摘要，供前端展示可用功能
func (r *Registry) List() []ProviderSummary { /* ... */ }
```

---

## 6. Agnes 适配器实现要点

### 6.1 生图适配器（`providers/agnes/image.go`）

- 底层是**同步**的，所以 `SubmitImage` 直接发请求、把返回的 `data[0].url` 包成一个 `StatusCompleted` 的 Task 返回。
- 用**原生 HTTP**（不要 OpenAI SDK），手动拼 `extra_body` 嵌套，避免 SDK 拍平。
- 内部模型名 `agnes-image-2.1-flash`，size 用档位，`n` 强制为 1。

```go
func (a *AgnesImage) SubmitImage(ctx context.Context, req ImageRequest) (*Task, error) {
    body := map[string]any{
        "model":  a.cfg.ModelMap["image"], // agnes-image-2.1-flash
        "prompt": req.Prompt,
        "size":   orDefault(req.Size, "2K"),
        "n":      1,
        "extra_body": map[string]any{        // 关键：嵌套，不让 SDK 拍平
            "response_format": "url",
            "ratio":           orDefault(req.Ratio, "16:9"),
        },
    }
    if len(req.Image) > 0 {
        body["extra_body"].(map[string]any)["image"] = req.Image
    }
    // POST a.cfg.BaseURL + "/images/generations"
    // 解析 {created, data:[{url}]} -> Task{Status:completed, Result.URL}
}
```

### 6.2 视频适配器（`providers/agnes/video.go`）

- `SubmitVideo`：`POST /v1/videos`，取 `video_id`，返回 `StatusQueued` 的 Task。
- `Query`：`GET /agnesapi?video_id=<ID>&model_name=agnes-video-2.5`，轮询直到 `completed`/`failed`。
- `seconds` 用 `strconv` 保证发出字符串；`size` 用档位；`n` 强制 1。
- 建议 `Query` 内部带**短超时 + 指数退避**，避免单请求卡死。

```go
func (a *AgnesVideo) SubmitVideo(ctx context.Context, req VideoRequest) (*Task, error) {
    body := map[string]any{
        "model":        a.cfg.ModelMap["video"], // agnes-video-2.5
        "prompt":       req.Prompt,
        "mode":         orDefault(req.Mode, "text"),
        "seconds":      orDefault(req.Seconds, "5"), // 字符串！
        "size":         orDefault(req.Size, "720P"),
        "aspect_ratio": orDefault(req.AspectRatio, "16:9"),
        "n":            1,
    }
    // POST a.cfg.BaseURL + "/videos" -> 取 video_id
    return &Task{ID: videoID, Status: StatusQueued, Kind: KindVideo, Provider: "agnes"}, nil
}

func (a *AgnesVideo) Query(ctx context.Context, taskID string, _ Kind) (*Task, error) {
    url := a.cfg.BaseURL + "/agnesapi?video_id=" + taskID + "&model_name=" + a.cfg.ModelMap["video"]
    // GET，解析 status；completed 时取 metadata.url
}
```

---

## 7. HTTP 路由（Go :8080 暴露 OpenAI 形态）

```
POST /v1/images/generations   → 适配器转发，返回 {created, data:[{url}]}   （同步，前端零改动）
POST /v1/videos/generations   → 返回 {id, status, provider}                （异步入口）
GET  /v1/videos/{id}          → 返回 Task（轮询用，completed 时含 url）     （前端轮询这条）
GET  /v1/providers            → 返回各供应商 capability 摘要，供前端展示功能
```

- 生图保持 OpenAI 兼容返回，前端 `client.images.generate()` **无需改**。
- 视频 OpenAI 无标准端点，定义上述约定；前端用一个轻量轮询（每 1–2s 打 `GET /v1/videos/{id}`）即可，不用管底层是不是 Agnes。
- 所有请求在 Go 侧注入 `Authorization: Bearer <KEY>`，**Key 永不进前端**。

---

## 8. 错误处理与韧性

- **429 / 限流**：适配器内做指数退避（如 1s→2s→4s，最多 N 次），超出标记 `Task.Status=failed` 并带回错误信息。
- **超时**：每个外部请求带 `context.WithTimeout`（建议 30–60s），`Query` 轮询总上限建议 ~3 分钟。
- **统一错误**：返回 `Task.Error` 字段，前端按 `failed` 展示，不自爆。
- **配置隔离**：`api_key` 只从 env / secret 注入，配置文件里只留占位。

---

## 9. 后续接入新聚合服务商（加一个文件）

1. **OpenAI 兼容型**（硅基流动、阿里百炼、火山方舟等）：只需在 `providers.yaml` 加一条 `base_url + api_key + model_map`，**零代码**。复用 `openai_compat/compat.go`。
2. **非标准型**（如另一种私有协议）：新建 `providers/xxx/{image,video}.go` 实现 `MediaGenerator`，在 `registry` 注册一条。
3. **前端无需改动**（只要能力声明正确），UI 按 `GET /v1/providers` 的能力展示对应按钮。

---

## 10. 与前端对接小结

- 生图：前端维持现有 OpenAI 调用，只把 `baseURL` 指向 Go 后端、模型名改成内部名（如 `agnes-image-2.1-flash`）。
- 生视频：前端加一个「提交 → 轮询 `GET /v1/videos/{id}`」的小封装（因 OpenAI 无视频标准）。
- API Key 全部留在 Go 后端，前端只持有访问自己后端的凭证。

---

## 11. 落地步骤建议（转 todo 用）

1. 建 `media/core` 三个文件（types / generator / registry）。
2. 实现 `openai_compat` 通用适配器（覆盖未来大多数聚合商）。
3. 实现 `agnes/image.go` + `agnes/video.go`。
4. 写 `providers.yaml` + 配置加载（env 注入 key）。
5. 实现 `handler/routes.go` 四个路由。
6. 加单测：用 httptest 模拟 Agnes 建任务 / 轮询 / 完成。
7. 前端接 `GET /v1/providers` 做能力展示，视频加轮询封装。
8. dev 阶段先在 Next.js Route Handler 直连打通，再切到 Go 适配层。
