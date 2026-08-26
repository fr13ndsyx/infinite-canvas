package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"infinite-canvas/model"
	"infinite-canvas/service"
)

type adminBatchDeleteRequest struct {
	IDs []string `json:"ids"`
}

type adminImportResponse struct {
	Count int `json:"count"`
}

func AdminPrompts(w http.ResponseWriter, r *http.Request) {
	result, err := service.ListPrompts(parseQuery(r))
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminSavePrompt(w http.ResponseWriter, r *http.Request) {
	var item model.Prompt
	_ = json.NewDecoder(r.Body).Decode(&item)
	result, err := service.SavePrompt(item)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminDeletePrompt(w http.ResponseWriter, r *http.Request, id string) {
	if err := service.DeletePrompt(id); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

func AdminDeletePrompts(w http.ResponseWriter, r *http.Request) {
	var request adminBatchDeleteRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	if err := service.DeletePrompts(request.IDs); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

// AdminImportPrompts 批量导入提示词：JSON 描述文件 + 媒体文件，cover 为媒体文件名时上传后替换为 URL。
func AdminImportPrompts(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		Fail(w, "请上传 JSON 描述文件")
		return
	}
	jsonFile, _, err := r.FormFile("file")
	if err != nil {
		Fail(w, "请上传 JSON 描述文件")
		return
	}
	defer jsonFile.Close()
	data, err := io.ReadAll(jsonFile)
	if err != nil {
		FailError(w, err)
		return
	}
	var items []model.Prompt
	if err := json.Unmarshal(data, &items); err != nil {
		Fail(w, "JSON 描述文件格式错误")
		return
	}

	// 媒体文件上传到现有存储链路，按文件名建立 URL 映射。
	mediaURLs := map[string]string{}
	for _, mediaHeader := range r.MultipartForm.File["media"] {
		if mediaHeader == nil || strings.HasSuffix(strings.ToLower(mediaHeader.Filename), ".json") {
			continue
		}
		media, err := mediaHeader.Open()
		if err != nil {
			FailError(w, err)
			return
		}
		mediaData, err := io.ReadAll(media)
		_ = media.Close()
		if err != nil {
			FailError(w, err)
			return
		}
		contentType := mediaHeader.Header.Get("Content-Type")
		if strings.TrimSpace(contentType) == "" {
			contentType = http.DetectContentType(mediaData)
		}
		object, err := service.UploadStorageObject(r.Context(), mediaHeader.Filename, contentType, mediaData)
		if err != nil {
			FailError(w, err)
			return
		}
		mediaURLs[mediaHeader.Filename] = object.URL
	}

	for i := range items {
		if url, ok := mediaURLs[items[i].CoverURL]; ok {
			items[i].CoverURL = url
		}
	}
	count, err := service.ImportPrompts(items)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, adminImportResponse{Count: count})
}
