package service

import (
	"strings"
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
	sources := promptSourceOptions(ListPromptSources())
	return model.PromptList{Items: items, Tags: tags, Sources: sources, Total: int(total)}, nil
}

// ListUserPrompts 返回用户端可见的提示词列表，仅包含启用来源及其提示词。
func ListUserPrompts(q model.Query) (model.PromptList, error) {
	enabledSources := repository.ListEnabledPromptSources()
	enabledCodes := promptSourceCodes(enabledSources)
	if q.Source != "" {
		if !containsString(enabledCodes, q.Source) {
			return model.PromptList{Items: []model.Prompt{}, Tags: []string{}, Sources: promptSourceOptions(enabledSources), Total: 0}, nil
		}
	} else if len(enabledCodes) > 0 {
		q.Sources = enabledCodes
	}
	items, total, err := repository.ListPrompts(q)
	if err != nil {
		return model.PromptList{}, err
	}
	tags, err := repository.ListPromptTags(q)
	if err != nil {
		return model.PromptList{}, err
	}
	return model.PromptList{Items: items, Tags: tags, Sources: promptSourceOptions(enabledSources), Total: int(total)}, nil
}

func ListPromptSources() []model.PromptSource {
	sources, _ := repository.ListPromptSources()
	return sources
}

// CreatePromptSource 新增来源，来源 ID 必填且不可重复。
func CreatePromptSource(item model.PromptSource) (model.PromptSource, error) {
	item.Source = strings.TrimSpace(item.Source)
	if item.Source == "" {
		return item, safeMessageError{message: "来源 ID 不能为空"}
	}
	if _, ok := repository.PromptSourceByCode(item.Source); ok {
		return item, safeMessageError{message: "来源 ID 已存在"}
	}
	now := time.Now().Format(time.RFC3339)
	if item.Enabled == nil {
		enabled := true
		item.Enabled = &enabled
	}
	if item.CreatedAt == "" {
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	return repository.SavePromptSource(item)
}

// UpdatePromptSource 更新来源，仅允许修改 name、description、enabled、sortOrder。
func UpdatePromptSource(source string, payload model.PromptSource) (model.PromptSource, error) {
	existing, ok := repository.PromptSourceByCode(source)
	if !ok {
		return existing, safeMessageError{message: "来源不存在"}
	}
	if strings.TrimSpace(payload.Name) != "" {
		existing.Name = payload.Name
	}
	existing.Description = payload.Description
	if payload.Enabled != nil {
		existing.Enabled = payload.Enabled
	}
	existing.SortOrder = payload.SortOrder
	existing.UpdatedAt = time.Now().Format(time.RFC3339)
	return repository.SavePromptSource(existing)
}

// DeletePromptSource 删除来源记录，保留该来源下的提示词数据。
func DeletePromptSource(source string) error {
	return repository.DeletePromptSource(source)
}

func SavePrompt(item model.Prompt) (model.Prompt, error) {
	now := time.Now().Format(time.RFC3339)
	if item.Source == "" {
		sources := repository.PromptSources()
		if len(sources) == 0 {
			return item, safeMessageError{message: "暂无可用来源，请先在管理后台创建来源"}
		}
		item.Source = sources[0].Source
	}
	if item.ID == "" {
		item.ID = newID(item.Source)
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	source, ok := repository.PromptSourceByCode(item.Source)
	if !ok {
		sources := repository.PromptSources()
		if len(sources) == 0 {
			return item, safeMessageError{message: "暂无可用来源，请先在管理后台创建来源"}
		}
		source = sources[0]
		item.Source = source.Source
	}
	item.GithubURL = ""
	return repository.SavePrompt(item)
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

func promptSourceCodes(items []model.PromptSource) []string {
	codes := []string{}
	for _, item := range items {
		if item.Source != "" {
			codes = append(codes, item.Source)
		}
	}
	return codes
}

func promptSourceOptions(items []model.PromptSource) []model.PromptSourceOption {
	options := make([]model.PromptSourceOption, 0, len(items))
	for _, item := range items {
		if item.Source == "" {
			continue
		}
		name := item.Name
		if name == "" {
			name = item.Source
		}
		options = append(options, model.PromptSourceOption{Source: item.Source, Name: name})
	}
	return options
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}
