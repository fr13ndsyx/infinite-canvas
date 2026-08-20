package model

// Prompt 提示词记录。
type Prompt struct {
	ID        string   `json:"id" gorm:"primaryKey"`
	Title     string   `json:"title"`
	CoverURL  string   `json:"coverUrl"`
	Prompt    string   `json:"prompt"`
	Tags      []string `json:"tags" gorm:"serializer:json"`
	Category  string   `json:"category" gorm:"index"`
	Source    string   `json:"source" gorm:"index"`
	Preview   string   `json:"preview"`
	CreatedAt string   `json:"createdAt"`
	UpdatedAt string   `json:"updatedAt"`
}

// PromptList 提示词分页结果。
type PromptList struct {
	Items   []Prompt `json:"items"`
	Tags    []string `json:"tags"`
	Sources []string `json:"sources"`
	Total   int      `json:"total"`
}

// IsValidPromptCategory 校验提示词分类取值。
func IsValidPromptCategory(category string) bool {
	return category == "image" || category == "video" || category == "cinematic"
}
