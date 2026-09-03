package service

import (
	"log"
	"time"

	"infinite-canvas/model"
	"infinite-canvas/repository"
)

func ListSkills(nodeType string, onlyEnabled bool) ([]model.Skill, error) {
	return repository.ListSkills(nodeType, onlyEnabled)
}

func SaveSkill(item model.Skill) (model.Skill, error) {
	if !model.IsValidSkillNodeType(item.NodeType) {
		return item, safeMessageError{message: "节点类型仅支持 text / image / video"}
	}
	if item.Name == "" || item.Prompt == "" {
		return item, safeMessageError{message: "技能名称和提示词内容不能为空"}
	}
	now := time.Now().Format(time.RFC3339)
	if item.ID == "" {
		item.ID = newID("skill")
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	return repository.SaveSkill(item)
}

func DeleteSkill(id string) error {
	return repository.DeleteSkill(id)
}

// SeedSkills 首次启动时写入首批预置技能，已有技能时跳过。
func SeedSkills() {
	total, err := repository.CountSkills()
	if err != nil {
		log.Printf("seed skills skipped: %v", err)
		return
	}
	if total > 0 {
		return
	}
	now := time.Now().Format(time.RFC3339)
	presets := []model.Skill{
		{NodeType: "text", Name: "翻译", Description: "将文本在中英文之间准确互译", Prompt: "将本段文本在中英文之间互译：内容为中文则翻译为英文，为英文则翻译为中文。保持原意、语气与专业术语，译文自然流畅，输出仅包含译文，不添加额外解释。", SortOrder: 1, Enabled: true},
		{NodeType: "text", Name: "文本扩写", Description: "在保持原意的前提下丰富表达", Prompt: "在保持原意和事实准确的前提下，将本段文本扩写为更丰富细腻的表达：补充必要细节、增强画面感与表现力，逻辑连贯，篇幅约为原文的 2-3 倍，不虚构关键信息。", SortOrder: 2, Enabled: true},
		{NodeType: "image", Name: "16 宫格连贯分镜", Description: "一张图内 4x4 分镜讲述连贯故事", Prompt: "生成一张 16 宫格连贯分镜图：画面均匀分为 4x4 共 16 格，按时间顺序讲述一个连贯的小故事，相邻分镜保持角色形象、场景风格与色调一致，分镜之间动作自然衔接，整体构图清晰可辨。", SortOrder: 1, Enabled: true},
		{NodeType: "image", Name: "电影级光影矫正", Description: "按电影级布光标准优化画面影调", Prompt: "以电影级布光标准处理这张图片：校正曝光与白平衡，增强明暗层次与色彩氛围，高光不过曝、暗部有细节，主体突出，整体呈现电影质感的影调。", SortOrder: 2, Enabled: true},
		{NodeType: "video", Name: "运镜 - 轨道右移", Description: "设备沿轨道匀速水平向右平稳移动", Prompt: "运镜：设备沿轨道匀速水平向右平稳移动，画面透视稳定，主体保持清晰，无抖动，背景随移动自然延展。", SortOrder: 1, Enabled: true},
		{NodeType: "video", Name: "运镜 - 环绕拍摄", Description: "镜头围绕主体匀速环绕拍摄", Prompt: "运镜：镜头围绕主体匀速环绕拍摄一周，主体始终处于画面中心，背景随镜头角度连续变化，运动平稳流畅，无跳变。", SortOrder: 2, Enabled: true},
	}
	for i := range presets {
		presets[i].ID = newID("skill")
		presets[i].CreatedAt = now
		presets[i].UpdatedAt = now
	}
	if err := repository.CreateSkills(presets); err != nil {
		log.Printf("seed skills failed: %v", err)
	}
}
