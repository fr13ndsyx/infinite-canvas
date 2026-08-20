package service

import (
	"time"

	"github.com/tigerowo/infinite-canvas/model"
	"github.com/tigerowo/infinite-canvas/repository"
)

func ListPrompts(q model.Query) (model.PromptList, error) {
	items, total, err := repository.ListPrompts(q)
	if err != nil {
		return model.PromptList{}, err
	}
	tags, err := repository.ListPromptTags(q)
	if err != nil {
		return model.PromptList{}, err
	}
	sources, err := repository.DistinctPromptSources()
	if err != nil {
		return model.PromptList{}, err
	}
	return model.PromptList{Items: items, Tags: tags, Sources: sources, Total: int(total)}, nil
}

func SavePrompt(item model.Prompt) (model.Prompt, error) {
	if item.Category == "" {
		item.Category = "image"
	}
	if !model.IsValidPromptCategory(item.Category) {
		return item, safeMessageError{message: "分类仅支持 image / video / cinematic"}
	}
	now := time.Now().Format(time.RFC3339)
	if item.ID == "" {
		item.ID = newID("prompt")
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	return repository.SavePrompt(item)
}

// ImportPrompts 批量写入提示词，cover 为媒体文件名时替换为上传后的 URL。
func ImportPrompts(items []model.Prompt) (int, error) {
	if len(items) == 0 {
		return 0, safeMessageError{message: "导入文件中没有提示词"}
	}
	now := time.Now().Format(time.RFC3339)
	for i := range items {
		if items[i].Title == "" || items[i].Prompt == "" {
			return 0, safeMessageError{message: "每条提示词的标题和内容不能为空"}
		}
		if items[i].Category == "" {
			items[i].Category = "image"
		}
		if !model.IsValidPromptCategory(items[i].Category) {
			return 0, safeMessageError{message: "分类仅支持 image / video / cinematic"}
		}
		if items[i].ID == "" {
			items[i].ID = newID("prompt")
			items[i].CreatedAt = now
		}
		items[i].UpdatedAt = now
	}
	if err := repository.CreatePrompts(items); err != nil {
		return 0, err
	}
	return len(items), nil
}

func DeletePrompt(id string) error {
	return repository.DeletePrompt(id)
}

func DeletePrompts(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return repository.DeletePrompts(ids)
}
