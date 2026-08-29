package model

import "encoding/json"

type SettingKey string

const (
	SettingKeyPublic  SettingKey = "public"
	SettingKeyPrivate SettingKey = "private"
)

// ModelChannel 模型渠道配置。
type ModelChannel struct {
	ID       string   `json:"id"`
	Protocol string   `json:"protocol"`
	Name     string   `json:"name"`
	BaseURL  string   `json:"baseUrl"`
	APIKey   string   `json:"apiKey"`
	Models   []string `json:"models"`
	Weight   int      `json:"weight"`
	Timeout  int      `json:"timeout"`
	Enabled  bool     `json:"enabled"`
	Remark   string   `json:"remark"`
	ApiMode  string   `json:"apiMode"` // 生图接口模式：images（默认）/ responses
}

// ModelCost 模型算力点配置。
type ModelCost struct {
	Model   string `json:"model"`
	Credits int    `json:"credits"`
}

// ModelInfo 模型展示信息（下拉框副标题，hover 时显示）。
type ModelInfo struct {
	Model       string `json:"model"`
	Description string `json:"description,omitempty"`
}

// ModelCapability 模型能力配置。
// 空字段语义：ImageAspects 空=支持全部标准比例；ImageTiers 空=仅标准档；
// VideoResolutions 空=480p/720p/1080p 三档。
// VideoSecondsMin/Max 空=默认 4-20 秒。
// VideoPanelType 空=通用面板；kling-v26/kling-v3/seedance/grok/motion-control/agnes。
// VideoProvider 空=不区分；apimart（仅 kling-v3/motion-control 需要区分请求体格式）。
type ModelCapability struct {
	Model            string   `json:"model"`
	ImageAspects     []string `json:"imageAspects,omitempty"`
	ImageTiers       []string `json:"imageTiers,omitempty"`
	VideoResolutions []string `json:"videoResolutions,omitempty"`
	VideoSecondsMin  *int     `json:"videoSecondsMin,omitempty"`
	VideoSecondsMax  *int     `json:"videoSecondsMax,omitempty"`

	// 生图渠道适配参数：后端把统一生图请求归一化为各上游 API 方言的规则。
	// nil（未配置）= 走通用默认（OpenAI images 标准协议），代码里不做任何按模型的特殊分支。
	ImageAdapter *ImageAdapterConfig `json:"imageAdapter,omitempty"`

	// 生视频渠道适配参数：后端把统一视频请求归一化为各上游 API 方言的规则。
	// nil（未配置）= 走通用默认（aspect_ratio + resolution + duration + image_urls 数组）。
	VideoAdapter *VideoAdapterConfig `json:"videoAdapter,omitempty"`

	// 视频面板类型与厂商，替代前端按模型名+渠道硬编码判断面板和请求体格式。
	VideoPanelType string `json:"videoPanelType,omitempty"`
	VideoProvider  string `json:"videoProvider,omitempty"`

	// 视频模式选项（Kling std/pro/4k、Grok fun/normal/spicy）。空=不支持模式选择。
	VideoModes []VideoModeOption `json:"videoModes,omitempty"`

	// 视频比例选项（如 16:9/9:16/1:1/adaptive）。空=通用面板走默认 sizeOptions。
	VideoRatios []string `json:"videoRatios,omitempty"`

	// 秒数预设档位（如 [5,10]）。空=连续 Slider；有值=按档位显示 OptionPill。
	VideoSecondsPresets []int `json:"videoSecondsPresets,omitempty"`

	// 能力开关，控制 UI 功能显隐和请求体字段。
	SupportsFirstLastFrame  bool `json:"supportsFirstLastFrame,omitempty"` // 兼容字段：首尾帧都支持时勾选；仅首帧用 SupportsFirstFrame
	SupportsFirstFrame      bool `json:"supportsFirstFrame,omitempty"`     // 仅支持首帧（部分模型如 minimax-hailuo-2-3、kling-3-0-turbo）
	SupportsMotionControl   bool `json:"supportsMotionControl,omitempty"`
	SupportsAudioGeneration bool `json:"supportsAudioGeneration,omitempty"`
	SupportsWatermark       bool `json:"supportsWatermark,omitempty"`
	SupportsMultiShot       bool `json:"supportsMultiShot,omitempty"`

	// 音频生成限制：AudioRequiresMode 如 "pro" 表示仅该模式可用；AudioMaxReferences 如 1。
	AudioRequiresMode  string `json:"audioRequiresMode,omitempty"`
	AudioMaxReferences int    `json:"audioMaxReferences,omitempty"`

	// 参考素材数量上限（Seedance 等）。0=走前端默认硬编码（图片 9/视频 3/音频 3）。
	MaxImageReferences int `json:"maxImageReferences,omitempty"`
	MaxVideoReferences int `json:"maxVideoReferences,omitempty"`
	MaxAudioReferences int `json:"maxAudioReferences,omitempty"`
}

// VideoModeOption 视频模式选项。
type VideoModeOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
	Desc  string `json:"desc,omitempty"`
}

// ImageAdapterConfig 生图渠道适配参数（按模型在后台配置）。
// 各字段留空 = 走通用默认（OpenAI images 标准协议：比例字段 size、resolution 大写、
// 支持比例/分辨率/n、不支持 quality/output_format、参考图字段 image_urls 且不限数量）。
type ImageAdapterConfig struct {
	AspectField    string `json:"aspectField,omitempty"`    // 比例参数字段名，空=默认 size
	HasResolution  *bool  `json:"hasResolution,omitempty"`  // 是否支持 resolution 参数，空=支持
	ResolutionCase string `json:"resolutionCase,omitempty"` // 分辨率大小写：upper（默认）/ lower
	MinResolution  string `json:"minResolution,omitempty"`  // 分辨率下限（如 2K），低于则抬高；空=不限
	MaxResolution  string `json:"maxResolution,omitempty"`  // 分辨率上限（如 1K/2K），高于则压低；空=不限
	HasCount       *bool  `json:"hasCount,omitempty"`       // 是否支持 n 参数，空=支持
	HasQuality     *bool  `json:"hasQuality,omitempty"`     // 是否支持 quality 参数，空=不支持
	HasOutput      *bool  `json:"hasOutput,omitempty"`      // 是否支持 output_format 参数，空=不支持
	HasImageRefs   *bool  `json:"hasImageRefs,omitempty"`   // 是否支持参考图，空=支持
	ImageRefField  string `json:"imageRefField,omitempty"`  // 参考图字段名，空=默认 image_urls
	MaxImageRefs   int    `json:"maxImageRefs,omitempty"`   // 参考图数量上限，0=不限
	RequireRefs    *bool  `json:"requireRefs,omitempty"`    // 是否必须提供参考图（如图生图编辑模型），空=不强制

	// 档位映射（比例/档位解耦）：前端发来 size=比例 + image_tier=档位时，
	// 按模型翻译成上游原生参数；未配置 = 折算成像素 size（OpenAI 标准协议，兼容现状）。
	TierField    string `json:"tierField,omitempty"`    // 档位映射目标字段：quality / resolution / size
	TierStandard string `json:"tierStandard,omitempty"` // standard 档映射值（如 low / 1k / 2K）
	Tier2K       string `json:"tier2k,omitempty"`       // 2k 档映射值（如 medium / 2k / 2K）
	Tier4K       string `json:"tier4k,omitempty"`       // 4k 档映射值（如 high / 2k / 4K）
	RatioMode    string `json:"ratioMode,omitempty"`    // 比例处理：空=折算像素；field=直传比例字段；prompt=写入提示词
}

// VideoAdapterConfig 生视频渠道适配参数（按模型在后台配置）。
// 各字段留空 = 走通用默认（aspect_ratio 比例字段、resolution 小写 p 档、duration 时长、
// image_urls 纯 URL 数组参考图、不支持 video/audio 引用与 quality）。
// AspectField 特殊值 "none" = 该模型不支持比例参数（发送时删除比例字段）。
// ImageRefKind/VideoRefKind/AudioRefKind 为参考媒体组装模式（受控枚举）：
// array=纯 URL 数组（默认）；roles=图+角色描述配对；first_last=首尾帧双字段；
// first_only=仅首帧；array_frames=多帧序列；single=单 URL 字段；
// seedance2/minimax_h3/skyreels/happyhorse/happyhorse11/pixverse/kling_video_list/
// skyreels_ref_images/wan_r2v_voice=厂商专有组装逻辑。
type VideoAdapterConfig struct {
	AspectField    string `json:"aspectField,omitempty"`    // 比例字段名：空=默认 aspect_ratio；none=不支持；如 size
	HasResolution  *bool  `json:"hasResolution,omitempty"`  // 是否支持 resolution 参数，空=支持
	ResolutionCase string `json:"resolutionCase,omitempty"` // 分辨率表达：video（默认，720p 小写 p）/ upper_video
	MaxResolution  string `json:"maxResolution,omitempty"`  // 分辨率上限（如 720p），高于则压低；空=不限
	ModeFromRes    *bool  `json:"modeFromRes,omitempty"`    // 分辨率反推 std/pro 模式（Kling 系），空=否
	HasQuality     *bool  `json:"hasQuality,omitempty"`     // 是否支持 quality 参数（Grok），空=不支持
	DropAspectWithImage *bool `json:"dropAspectWithImage,omitempty"` // 带参考图时丢弃比例参数，空=否
	ImageRefField  string `json:"imageRefField,omitempty"`  // 参考图字段名，空=默认 image_urls
	ImageRefKind   string `json:"imageRefKind,omitempty"`   // 参考图组装模式，空=默认 array
	MaxImageRefs   int    `json:"maxImageRefs,omitempty"`   // 参考图数量上限，0=不限
	VideoRefField  string `json:"videoRefField,omitempty"`  // 参考视频字段名，空=不支持参考视频
	VideoRefKind   string `json:"videoRefKind,omitempty"`    // 参考视频组装模式，空=不支持
	AudioRefField  string `json:"audioRefField,omitempty"`  // 参考音频字段名，空=不支持参考音频
	AudioRefKind   string `json:"audioRefKind,omitempty"`    // 参考音频组装模式，空=不支持
}

// PublicModelChannelSetting 公开模型渠道配置。
type PublicModelChannelSetting struct {
	AvailableModels        []string                 `json:"availableModels"`
	ModelCosts             []ModelCost              `json:"modelCosts"`
	ModelCapabilities      []ModelCapability        `json:"modelCapabilities"`
	ModelInfos             []ModelInfo              `json:"modelInfos"`
	Channels               []PublicModelChannelInfo `json:"channels"`
	DefaultImageModel      string                   `json:"defaultImageModel"`
	DefaultVideoModel      string                   `json:"defaultVideoModel"`
	DefaultTextModel       string                   `json:"defaultTextModel"`
	DefaultAudioModel      string                   `json:"defaultAudioModel"`
	SystemPrompt           string                   `json:"systemPrompt"`
	SystemPrompts          SystemPromptSetting      `json:"systemPrompts"`
	AllowCustomChannel     *bool                    `json:"allowCustomChannel"`
	AllowUserRemoteChannel *bool                    `json:"allowUserRemoteChannel"`
	AllowGuestConfig       *bool                    `json:"allowGuestConfig"`
}

type SystemPromptSetting struct {
	Image         string `json:"image"`
	Video         string `json:"video"`
	Text          string `json:"text"`
	Workflow      string `json:"workflow"`
	WorkflowAgent string `json:"workflowAgent"`
}

type PublicModelChannelInfo struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	BaseURL string   `json:"baseUrl"`
	Models  []string `json:"models"`
	Weight  int      `json:"weight"`
	Timeout int      `json:"timeout"`
	Enabled bool     `json:"enabled"`
	Remark  string   `json:"remark"`
	ApiMode string   `json:"apiMode"` // 生图接口模式：images（默认）/ responses
}

// PublicSetting 公开配置。
type PublicSetting struct {
	ModelChannel PublicModelChannelSetting `json:"modelChannel"`
	Auth         PublicAuthSetting         `json:"auth"`
	Storage      PublicStorageSetting      `json:"storage"`
	Modules      PublicModuleSetting       `json:"modules"`
}

// PublicModuleSetting 功能模块可见性配置。nil 默认开启。
type PublicModuleSetting struct {
	ImageWorkbench *bool `json:"imageWorkbench"`
	VideoWorkbench *bool `json:"videoWorkbench"`
	Workflows      *bool `json:"workflows"`
}

type PublicStorageSetting struct {
	Mode                    string `json:"mode"`
	AllowUserProvider       bool   `json:"allowUserProvider"`
	AllowUserGlobalProvider bool   `json:"allowUserGlobalProvider"`
}

type PublicAuthSetting struct {
	AllowRegister *bool `json:"allowRegister"`
}

// PrivateSetting 私有配置。
type PrivateSetting struct {
	Channels []ModelChannel        `json:"channels"`
	AILog    AILogSetting          `json:"aiLog"`
	Auth     PrivateAuthSetting    `json:"auth"`
	Storage  PrivateStorageSetting `json:"storage"`
}

type AILogSetting struct {
	LocalDirectReportEnabled *bool               `json:"localDirectReportEnabled"`
	Cleanup                  AILogCleanupSetting `json:"cleanup"`
}

type AILogCleanupSetting struct {
	Enabled       *bool  `json:"enabled"`
	RetentionDays int    `json:"retentionDays"`
	Cron          string `json:"cron"`
}

type PrivateStorageSetting struct {
	Mode                    string                      `json:"mode"`
	AllowUserProvider       bool                        `json:"allowUserProvider"`
	AllowUserGlobalProvider bool                        `json:"allowUserGlobalProvider"`
	Providers               []StorageProvider           `json:"providers"`
	RoundRobinCursor        int                         `json:"roundRobinCursor"`
	CapacityCheck           StorageCapacityCheckSetting `json:"capacityCheck"`
	CapacityLimitBytes      int64                       `json:"capacityLimitBytes"`
}

type StorageProvider struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Type              string `json:"type"`
	Endpoint          string `json:"endpoint"`
	Region            string `json:"region"`
	Bucket            string `json:"bucket"`
	AccessKeyID       string `json:"accessKeyId"`
	SecretAccessKey   string `json:"secretAccessKey"`
	PublicBaseURL     string `json:"publicBaseUrl"`
	PathPrefix        string `json:"pathPrefix"`
	Weight            int    `json:"weight"`
	Enabled           bool   `json:"enabled"`
	OwnerUserID       string `json:"ownerUserId"`
	CapacityBytes     int64  `json:"capacityBytes"`
	CapacityCheckedAt string `json:"capacityCheckedAt"`
	CapacityExceeded  bool   `json:"capacityExceeded"`
}

type StorageCapacityCheckSetting struct {
	Enabled *bool  `json:"enabled"`
	Cron    string `json:"cron"`
}

type PrivateAuthSetting struct {
}

// Setting 系统配置。
type Setting struct {
	Key       SettingKey      `json:"key" gorm:"primaryKey"`
	Value     json.RawMessage `json:"value" gorm:"serializer:json"`
	CreatedAt string          `json:"createdAt"`
	UpdatedAt string          `json:"updatedAt"`
}

// Settings 系统公开和私有配置。
type Settings struct {
	Public  PublicSetting  `json:"public"`
	Private PrivateSetting `json:"private"`
}
