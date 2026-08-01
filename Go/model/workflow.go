package model

// CreativeWorkflow 创意工作流模板。
type CreativeWorkflow struct {
	ID          string `json:"id" gorm:"primaryKey"`
	OwnerUserID string `json:"ownerUserId" gorm:"index"`
	Scope       string `json:"scope" gorm:"index"` // "private" | "public"
	Name        string `json:"name" gorm:"index"`
	Category    string `json:"category" gorm:"index"`
	Description string `json:"description"`
	Data        string `json:"data" gorm:"type:text"` // JSON: variables + config
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
	LastRunAt   string `json:"lastRunAt"`
}
