package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"infinite-canvas/model"
	"infinite-canvas/service"
)

func normalizeAPIMartImageBody(body []byte, contentType string, modelName string, channel model.ModelChannel) ([]byte, string, error) {
	payload, err := readAPIMartPayload(body, contentType, channel)
	if err != nil {
		return body, contentType, err
	}
	finalModel := strings.TrimSpace(modelName)
	if finalModel == "" {
		finalModel = strings.TrimSpace(toStringSafe(payload["model"]))
	}
	if finalModel != "" {
		payload["model"] = finalModel
	}
	normalizeAPIMartImageParams(payload, finalModel, channel)
	if errMessage := strings.TrimSpace(toStringSafe(payload["_apimart_reference_error"])); errMessage != "" {
		return body, contentType, errors.New(errMessage)
	}
	delete(payload, "_apimart_reference_error")

	encoded, err := json.Marshal(payload)
	if err != nil {
		return body, contentType, err
	}
	return encoded, "application/json", nil
}

func normalizeAPIMartImageParams(payload map[string]any, modelName string, channel model.ModelChannel) {
	config := apimartImageConfig(modelName)
	if config.aspectField == "" {
		config.aspectField = "size"
	}

	normalizeAPIMartResolution(payload, config)
	normalizeAPIMartAspect(payload, config)
	normalizeAPIMartImageCount(payload, config)
	normalizeAPIMartImageQuality(payload, config)
	if config.imageRefField == "" {
		clearAPIMartImageReferenceFields(payload)
	} else {
		normalizeAPIMartReferenceInputs(payload, modelName, config, channel)
	}
	if err := validateAPIMartImageRequiredInputs(payload, config); err != nil {
		payload["_apimart_reference_error"] = err.Error()
	}
}

// apimartImageConfig 生图请求归一化配置：优先读后台模型能力配置的 imageAdapter；
// 未配置走通用默认（OpenAI images 标准协议），代码里不做任何按模型的特殊分支。
func apimartImageConfig(modelName string) apimartInputConfig {
	config := apimartInputConfig{
		aspectField:    "size",
		hasResolution:  true,
		resolutionCase: "upper",
		hasCount:       true,
		imageRefField:  "image_urls",
		imageRefKind:   "array",
	}
	adapter := service.ImageAdapterFor(modelName)
	if adapter == nil {
		return config
	}
	if adapter.AspectField != "" {
		config.aspectField = adapter.AspectField
	}
	if adapter.HasResolution != nil {
		config.hasResolution = *adapter.HasResolution
	}
	if adapter.ResolutionCase != "" {
		config.resolutionCase = adapter.ResolutionCase
	}
	config.minResolution = adapter.MinResolution
	config.maxResolution = adapter.MaxResolution
	if adapter.HasCount != nil {
		config.hasCount = *adapter.HasCount
	}
	if adapter.HasQuality != nil {
		config.hasQuality = *adapter.HasQuality
	}
	if adapter.HasOutput != nil {
		config.hasOutput = *adapter.HasOutput
	}
	if adapter.HasImageRefs != nil && !*adapter.HasImageRefs {
		config.imageRefField = ""
	}
	if adapter.ImageRefField != "" {
		config.imageRefField = adapter.ImageRefField
	}
	config.maxImageRefs = adapter.MaxImageRefs
	if adapter.RequireRefs != nil {
		config.requireImageRefs = *adapter.RequireRefs
	}
	return config
}

func normalizeAPIMartImageQuality(payload map[string]any, config apimartInputConfig) {
	if config.hasQuality {
		if value := strings.TrimSpace(toStringSafe(payload["quality"])); value != "" {
			payload["quality"] = strings.ToLower(value)
		}
	} else {
		delete(payload, "quality")
	}

	if config.hasOutput {
		value := firstNonEmpty(toStringSafe(payload["output_format"]), toStringSafe(payload["format"]))
		if strings.TrimSpace(value) != "" {
			payload["output_format"] = normalizeAPIMartOutputFormat(value)
		}
	} else {
		delete(payload, "output_format")
	}
	delete(payload, "format")
}

func clearAPIMartImageReferenceFields(payload map[string]any) {
	for _, key := range []string{
		"image",
		"images",
		"image_url",
		"image_urls",
		"input_url",
		"input_urls",
		"input_reference",
		"input_reference[]",
		"image_input",
		"reference_image",
		"reference_images",
		"reference_image_url",
		"reference_image_urls",
		"first_frame_url",
		"first_frame_image",
		"last_frame_url",
		"last_frame_image",
	} {
		delete(payload, key)
	}
}

func validateAPIMartImageRequiredInputs(payload map[string]any, config apimartInputConfig) error {
	if config.requireImageRefs {
		return requireAPIMartAnyInput(payload, config.imageRefField)
	}
	return nil
}

func normalizeAPIMartOutputFormat(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	switch value {
	case "jpg":
		return "jpeg"
	case "jpeg", "png", "webp":
		return value
	default:
		return value
	}
}

func copyAPIMartImageResponse(w http.ResponseWriter, response *http.Response, request *http.Request, channel model.ModelChannel, logContext aiLogContext, onFailure func()) bool {
	if !strings.Contains(request.URL.Path, "/images/generations") && !strings.Contains(request.URL.Path, "/images/edits") {
		return false
	}

	payload, _ := io.ReadAll(response.Body)
	if imageURLs, ok := readAPIMartDirectImageURLs(payload); ok {
		writeAPIMartImagesResponse(w, response.StatusCode, imageURLs, logContext)
		return true
	}

	taskID, _, ok := readAPIMartCreateTask(payload)
	if !ok {
		w.WriteHeader(response.StatusCode)
		_, _ = w.Write(payload)
		saveAIProxyLog(logContext, response.StatusCode, string(payload), "")
		return true
	}

	imageURLs, errorMessage := pollAPIMartImageTask(request, channel, taskID)
	if errorMessage != "" {
		if onFailure != nil {
			onFailure()
		}
		writeAPIMartImageError(w, response.StatusCode, errorMessage, logContext)
		return true
	}
	writeAPIMartImagesResponse(w, response.StatusCode, imageURLs, logContext)
	return true
}

func pollAPIMartImageTask(request *http.Request, channel model.ModelChannel, taskID string) ([]string, string) {
	pollURL := buildAPIMartTaskURL(channel, taskID)
	for attempt := 0; attempt < 300; attempt++ {
		if attempt > 0 {
			select {
			case <-request.Context().Done():
				return nil, request.Context().Err().Error()
			case <-time.After(2 * time.Second):
			}
		}

		pollRequest, err := http.NewRequestWithContext(request.Context(), http.MethodGet, pollURL, nil)
		if err != nil {
			return nil, err.Error()
		}
		pollRequest.Header.Set("Authorization", "Bearer "+channel.APIKey)
		response, err := service.HTTPClientForChannel(channel).Do(pollRequest)
		if err != nil {
			return nil, err.Error()
		}
		body, _ := io.ReadAll(io.LimitReader(response.Body, 512*1024))
		_ = response.Body.Close()
		if response.StatusCode >= http.StatusBadRequest {
			return nil, readUpstreamAIErrorMessage(body, response.StatusCode)
		}
		imageURLs, done, errorMessage := readAPIMartImageTaskResult(body)
		if errorMessage != "" {
			return nil, errorMessage
		}
		if done {
			if len(imageURLs) == 0 {
				return nil, "APIMart image task completed but returned no image URL"
			}
			return imageURLs, ""
		}
	}
	return nil, "APIMart image task timed out"
}

func readAPIMartImageTaskResult(payload []byte) ([]string, bool, string) {
	var result struct {
		Code int `json:"code"`
		Data struct {
			Status string         `json:"status"`
			Result map[string]any `json:"result"`
			Error  *struct {
				Message string `json:"message"`
			} `json:"error"`
		} `json:"data"`
		Msg string `json:"msg"`
	}
	if err := json.Unmarshal(payload, &result); err != nil {
		return nil, false, err.Error()
	}
	if result.Code != 200 {
		return nil, false, firstNonEmpty(result.Msg, "APIMart image task query failed")
	}

	imageURLs := extractAPIMartImageURLs(result.Data.Result)
	if len(imageURLs) > 0 {
		return imageURLs, true, ""
	}
	switch normalizeAPIMartTaskStatus(result.Data.Status) {
	case "completed":
		return imageURLs, true, ""
	case "failed":
		if result.Data.Error != nil && strings.TrimSpace(result.Data.Error.Message) != "" {
			return nil, false, result.Data.Error.Message
		}
		return nil, false, firstNonEmpty(result.Msg, "APIMart image task failed")
	default:
		return nil, false, ""
	}
}

func extractAPIMartImageURLs(result map[string]any) []string {
	if result == nil {
		return nil
	}
	values := collectAPIMartURLs(result, 0)
	seen := map[string]bool{}
	urls := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" || seen[value] || !(strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://")) {
			continue
		}
		seen[value] = true
		urls = append(urls, value)
	}
	return urls
}

func collectAPIMartURLs(value any, depth int) []string {
	if depth > 6 || value == nil {
		return nil
	}
	switch typed := value.(type) {
	case string:
		text := strings.TrimSpace(typed)
		if strings.HasPrefix(text, "http://") || strings.HasPrefix(text, "https://") {
			return []string{text}
		}
		var parsed any
		if json.Unmarshal([]byte(text), &parsed) == nil {
			return collectAPIMartURLs(parsed, depth+1)
		}
	case []any:
		var result []string
		for _, item := range typed {
			result = append(result, collectAPIMartURLs(item, depth+1)...)
		}
		return result
	case map[string]any:
		var result []string
		for _, key := range []string{"images", "image", "url", "urls", "image_url", "imageUrl", "download_url", "downloadUrl", "data", "result"} {
			result = append(result, collectAPIMartURLs(typed[key], depth+1)...)
		}
		return result
	}
	return nil
}

func readAPIMartDirectImageURLs(payload []byte) ([]string, bool) {
	var result struct {
		Data []struct {
			URL string `json:"url"`
		} `json:"data"`
	}
	if json.Unmarshal(payload, &result) != nil || len(result.Data) == 0 {
		return nil, false
	}
	urls := make([]string, 0, len(result.Data))
	for _, item := range result.Data {
		if strings.TrimSpace(item.URL) != "" {
			urls = append(urls, strings.TrimSpace(item.URL))
		}
	}
	return urls, len(urls) > 0
}

func writeAPIMartImagesResponse(w http.ResponseWriter, statusCode int, imageURLs []string, logContext aiLogContext) {
	items := make([]map[string]any, 0, len(imageURLs))
	for _, imageURL := range imageURLs {
		items = append(items, map[string]any{"url": imageURL})
	}
	converted := map[string]any{
		"created": time.Now().Unix(),
		"data":    items,
	}
	encoded, err := json.Marshal(converted)
	if err != nil {
		writeAPIMartImageError(w, statusCode, err.Error(), logContext)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_, _ = w.Write(encoded)
	saveAIProxyLog(logContext, statusCode, string(encoded), "")
}

func writeAPIMartImageError(w http.ResponseWriter, statusCode int, message string, logContext aiLogContext) {
	if statusCode < http.StatusBadRequest {
		statusCode = http.StatusBadGateway
	}
	body, _ := json.Marshal(map[string]any{
		"error": map[string]any{
			"message": message,
		},
	})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_, _ = w.Write(body)
	saveAIProxyLog(logContext, statusCode, string(body), message)
}
