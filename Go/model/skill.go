package model

// Skill 技能记录：绑定节点类型的预置 AI 能力包，一键注入节点输入框。
type Skill struct {
	ID          string `json:"id" gorm:"primaryKey"`
	NodeType    string `json:"nodeType" gorm:"index"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Prompt      string `json:"prompt"`
	CoverURL    string `json:"coverUrl"`
	SortOrder   int    `json:"sortOrder"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// IsValidSkillNodeType 校验技能节点类型取值。
func IsValidSkillNodeType(nodeType string) bool {
	return nodeType == "text" || nodeType == "image" || nodeType == "video"
}
