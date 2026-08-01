package repository

import (
	"errors"
	"time"

	"github.com/tigerowo/infinite-canvas/model"
	"gorm.io/gorm"
)

// PromptSources 返回数据库中的全部来源。
func PromptSources() []model.PromptSource {
	items, _ := ListPromptSources()
	return items
}

// PromptSourceByCode 根据来源 ID 查找来源。
func PromptSourceByCode(source string) (model.PromptSource, bool) {
	db, err := DB()
	if err != nil {
		return model.PromptSource{}, false
	}
	var item model.PromptSource
	if err := db.Where("source = ?", source).First(&item).Error; err != nil {
		return model.PromptSource{}, false
	}
	return item, true
}

// ListPromptSources 返回全部来源，按 sort_order 和 created_at 升序。
func ListPromptSources() ([]model.PromptSource, error) {
	db, err := DB()
	if err != nil {
		return nil, err
	}
	var items []model.PromptSource
	err = db.Order("sort_order asc, created_at asc").Find(&items).Error
	return items, err
}

// ListEnabledPromptSources 返回启用的来源，按 sort_order 和 created_at 升序。
func ListEnabledPromptSources() []model.PromptSource {
	db, err := DB()
	if err != nil {
		return nil
	}
	var items []model.PromptSource
	_ = db.Where("enabled = ?", true).Order("sort_order asc, created_at asc").Find(&items).Error
	return items
}

// ListEnabledRemotePromptSources 返回启用且需要远程同步的来源。
func ListEnabledRemotePromptSources() []model.PromptSource {
	db, err := DB()
	if err != nil {
		return nil
	}
	var items []model.PromptSource
	_ = db.Where("enabled = ? AND remote = ?", true, true).Order("sort_order asc, created_at asc").Find(&items).Error
	return items
}

// SavePromptSource 新增或更新来源。
func SavePromptSource(item model.PromptSource) (model.PromptSource, error) {
	db, err := DB()
	if err != nil {
		return item, err
	}
	return item, db.Save(&item).Error
}

// DeletePromptSource 删除来源记录（不级联删除提示词）。
func DeletePromptSource(source string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Delete(&model.PromptSource{}, "source = ?", source).Error
}

// UpdatePromptSourceSyncedAt 更新来源的最后同步时间。
func UpdatePromptSourceSyncedAt(source string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	now := time.Now().Format(time.RFC3339)
	return db.Model(&model.PromptSource{}).Where("source = ?", source).Updates(map[string]any{
		"last_synced_at": now,
		"updated_at":     now,
	}).Error
}

// ListPrompts 按查询条件返回提示词分页列表。
func ListPrompts(q model.Query) ([]model.Prompt, int64, error) {
	db, err := DB()
	if err != nil {
		return nil, 0, err
	}
	q.Normalize()
	tx := applyPromptFilters(db.Model(&model.Prompt{}), q)

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.Prompt
	if err := tx.Order("updated_at desc").Offset(q.Offset()).Limit(q.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	sources, _ := ListPromptSources()
	githubURLs := map[string]string{}
	for _, item := range sources {
		githubURLs[item.Source] = item.GithubURL
	}
	for i := range items {
		items[i].GithubURL = githubURLs[items[i].Source]
	}
	return items, total, nil
}

// ListPromptTags 返回当前提示词查询条件下的全部标签。
func ListPromptTags(q model.Query) ([]string, error) {
	db, err := DB()
	if err != nil {
		return nil, err
	}
	q.Normalize()
	q.Tags = nil
	tx := applyPromptFilters(db.Model(&model.Prompt{}), q)

	var items []model.Prompt
	if err := tx.Select("tags").Find(&items).Error; err != nil {
		return nil, err
	}
	return promptTagsFromItems(items), nil
}

// SavePrompt 保存提示词，并在更新时保留原创建时间。
func SavePrompt(item model.Prompt) (model.Prompt, error) {
	db, err := DB()
	if err != nil {
		return item, err
	}
	if saved, ok, err := findPrompt(db, item.ID); err != nil {
		return item, err
	} else if ok && item.CreatedAt == "" {
		item.CreatedAt = saved.CreatedAt
	}
	item.GithubURL = ""
	return item, db.Save(&item).Error
}

// DeletePrompt 删除指定提示词。
func DeletePrompt(id string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Delete(&model.Prompt{}, "id = ?", id).Error
}

// DeletePrompts 批量删除提示词。
func DeletePrompts(ids []string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Delete(&model.Prompt{}, "id IN ?", ids).Error
}

// ReplacePromptSource 用远程同步结果替换整个提示词来源。
func ReplacePromptSource(source model.PromptSource, items []model.Prompt) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("source = ?", source.Source).Delete(&model.Prompt{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		for i := range items {
			items[i].Source = source.Source
			items[i].GithubURL = ""
		}
		return tx.Create(&items).Error
	})
}

// applyPromptFilters 应用提示词列表的搜索条件。
func applyPromptFilters(tx *gorm.DB, q model.Query) *gorm.DB {
	if q.Keyword != "" {
		like := "%" + q.Keyword + "%"
		tx = tx.Where("title LIKE ? OR prompt LIKE ?", like, like)
	}
	if isActivePromptOption(q.Source) {
		tx = tx.Where("source = ?", q.Source)
	} else if len(q.Sources) > 0 {
		tx = tx.Where("source IN ?", q.Sources)
	}
	return applyPromptTagsFilter(tx, q.Tags)
}

// findPrompt 根据 ID 查询提示词。
func findPrompt(db *gorm.DB, id string) (model.Prompt, bool, error) {
	item := model.Prompt{}
	err := db.Where("id = ?", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Prompt{}, false, nil
	}
	return item, err == nil, err
}

// applyPromptTagsFilter 应用 JSON 标签条件。
func applyPromptTagsFilter(tx *gorm.DB, tags []string) *gorm.DB {
	if len(tags) == 0 {
		return tx
	}
	condition := tx.Session(&gorm.Session{NewDB: true})
	for _, tag := range tags {
		condition = condition.Or(promptJSONTagsContains(tx), tag)
	}
	return tx.Where(condition)
}

func promptTagsFromItems(items []model.Prompt) []string {
	seen := map[string]bool{}
	tags := []string{}
	for _, item := range items {
		for _, tag := range item.Tags {
			if tag != "" && !seen[tag] {
				seen[tag] = true
				tags = append(tags, tag)
			}
		}
	}
	return tags
}

// promptJSONTagsContains 返回提示词 tags 的 JSON 包含条件。
func promptJSONTagsContains(tx *gorm.DB) string {
	switch tx.Dialector.Name() {
	case "mysql":
		return "JSON_CONTAINS(tags, JSON_QUOTE(?))"
	case "postgres":
		return "jsonb_exists(tags::jsonb, ?)"
	default:
		return "EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)"
	}
}

// isActivePromptOption 判断提示词筛选项有效状态。
func isActivePromptOption(value string) bool {
	return value != "" && value != "全部" && value != "all"
}
