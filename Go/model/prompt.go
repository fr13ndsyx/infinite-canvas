package model

// Prompt 提示词记录。
type Prompt struct {
	ID        string   `json:"id" gorm:"primaryKey"`
	Title     string   `json:"title"`
	CoverURL  string   `json:"coverUrl"`
	Prompt    string   `json:"prompt"`
	Tags      []string `json:"tags" gorm:"serializer:json"`
	Source    string   `json:"source" gorm:"index"`
	GithubURL string   `json:"githubUrl" gorm:"-"`
	Preview   string   `json:"preview"`
	CreatedAt string   `json:"createdAt"`
	UpdatedAt string   `json:"updatedAt"`
}

// PromptList 提示词分页结果。
type PromptList struct {
	Items   []Prompt             `json:"items"`
	Tags    []string             `json:"tags"`
	Sources []PromptSourceOption `json:"sources"`
	Total   int                  `json:"total"`
}

// PromptSourceOption 提示词来源选项。
type PromptSourceOption struct {
	Source string `json:"source"`
	Name   string `json:"name"`
}

// PromptSource 提示词来源。
type PromptSource struct {
	Source       string `json:"source" gorm:"primaryKey"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	GithubURL    string `json:"githubUrl"`
	Remote       bool   `json:"remote"`
	Enabled      *bool  `json:"enabled" gorm:"default:true"`
	SortOrder    int    `json:"sortOrder" gorm:"default:0"`
	LastSyncedAt string `json:"lastSyncedAt"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}
