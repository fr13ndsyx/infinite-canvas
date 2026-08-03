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

// ModelCapability 模型能力配置。
// 空字段语义：ImageAspects 空=支持全部标准比例；ImageTiers 空=仅标准档；
// VideoResolutions 空=480p/720p/1080p 三档。
type ModelCapability struct {
	Model            string   `json:"model"`
	ImageAspects     []string `json:"imageAspects,omitempty"`
	ImageTiers       []string `json:"imageTiers,omitempty"`
	VideoResolutions []string `json:"videoResolutions,omitempty"`
}

// PublicModelChannelSetting 公开模型渠道配置。
type PublicModelChannelSetting struct {
	AvailableModels        []string                 `json:"availableModels"`
	ModelCosts             []ModelCost              `json:"modelCosts"`
	ModelCapabilities      []ModelCapability        `json:"modelCapabilities"`
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
	Channels   []ModelChannel        `json:"channels"`
	PromptSync PromptSyncSetting     `json:"promptSync"`
	AILog      AILogSetting          `json:"aiLog"`
	Auth       PrivateAuthSetting    `json:"auth"`
	Storage    PrivateStorageSetting `json:"storage"`
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

// PromptSyncSetting 提示词定时同步配置。
type PromptSyncSetting struct {
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
