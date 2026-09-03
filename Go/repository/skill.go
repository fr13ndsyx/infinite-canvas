package repository

import (
	"errors"

	"infinite-canvas/model"
	"gorm.io/gorm"
)

// ListSkills 按节点类型返回技能列表，nodeType 为空时返回全部，onlyEnabled 为 true 时仅返回已上架技能。
func ListSkills(nodeType string, onlyEnabled bool) ([]model.Skill, error) {
	db, err := DB()
	if err != nil {
		return nil, err
	}
	tx := db.Model(&model.Skill{})
	if nodeType != "" {
		tx = tx.Where("node_type = ?", nodeType)
	}
	if onlyEnabled {
		tx = tx.Where("enabled = ?", true)
	}
	var items []model.Skill
	if err := tx.Order("sort_order asc, updated_at desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

// CountSkills 返回技能总数。
func CountSkills() (int64, error) {
	db, err := DB()
	if err != nil {
		return 0, err
	}
	var total int64
	err = db.Model(&model.Skill{}).Count(&total).Error
	return total, err
}

// CreateSkills 批量写入技能。
func CreateSkills(items []model.Skill) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Create(&items).Error
}

// SaveSkill 保存技能，并在更新时保留原创建时间。
func SaveSkill(item model.Skill) (model.Skill, error) {
	db, err := DB()
	if err != nil {
		return item, err
	}
	if saved, ok, err := findSkill(db, item.ID); err != nil {
		return item, err
	} else if ok && item.CreatedAt == "" {
		item.CreatedAt = saved.CreatedAt
	}
	return item, db.Save(&item).Error
}

// DeleteSkill 删除指定技能。
func DeleteSkill(id string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Delete(&model.Skill{}, "id = ?", id).Error
}

// findSkill 根据 ID 查询技能。
func findSkill(db *gorm.DB, id string) (model.Skill, bool, error) {
	item := model.Skill{}
	err := db.Where("id = ?", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Skill{}, false, nil
	}
	return item, err == nil, err
}
