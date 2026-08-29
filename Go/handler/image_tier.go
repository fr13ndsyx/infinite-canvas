package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"

	"infinite-canvas/service"
)

// imageTierPixels 档位像素表（比例 → 上游像素尺寸），与前端 IMAGE_TIER_PIXELS 一致。
var imageTierPixels = map[string]map[string]string{
	"2k": {
		"1:1": "2048x2048", "3:2": "2048x1360", "2:3": "1360x2048", "4:3": "2048x1536",
		"3:4": "1536x2048", "16:9": "2048x1152", "9:16": "1152x2048", "21:9": "3136x1344",
	},
	"4k": {
		"1:1": "4096x4096", "3:2": "4096x2720", "2:3": "2720x4096", "4:3": "4096x3072",
		"3:4": "3072x4096", "16:9": "3840x2160", "9:16": "2160x3840", "21:9": "6272x2688",
	},
}

// normalizeImageTierBody 把前端发来的 size=比例 + image_tier=档位 翻译成上游原生参数。
// 有 tierField 映射配置时按模型方言翻译（如 gpt-image 档位→quality、grok 档位→resolution、
// seedream 档位→size + 比例写 prompt）；未配置时折算成像素 size（OpenAI 标准协议）。
// 无 image_tier 字段（旧前端/本地直连/图生图 multipart）时原样透传。
func normalizeImageTierBody(body []byte, contentType string, modelName string) ([]byte, string, error) {
	if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(contentType)), "application/json") {
		return body, contentType, nil
	}
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil || payload == nil {
		return body, contentType, nil
	}
	tier := strings.TrimSpace(toStringSafe(payload["image_tier"]))
	if tier == "" {
		return body, contentType, nil
	}
	delete(payload, "image_tier")
	ratio := strings.TrimSpace(toStringSafe(payload["size"]))
	_, _, isPixels := parseAPIMartSize(ratio)

	adapter := service.ImageAdapterFor(modelName)
	if adapter != nil && adapter.TierField != "" {
		value := adapter.TierStandard
		if tier == "2k" {
			value = adapter.Tier2K
		} else if tier == "4k" {
			value = adapter.Tier4K
		}
		if value != "" {
			payload[adapter.TierField] = value
		}
		switch adapter.RatioMode {
		case "prompt": // 比例写入提示词（Seedream 官方协议），档位占用 size 字段
			if !isPixels && ratio != "" && ratio != "auto" {
				if prompt := strings.TrimSpace(toStringSafe(payload["prompt"])); prompt != "" {
					payload["prompt"] = prompt + "，画面比例 " + ratio
				}
			}
			if !isPixels {
				delete(payload, "size")
			}
		case "field": // 比例直传（grok 等），保留在 size 由 APIMart 归一化按 aspectField 处理
			if !isPixels && (ratio == "" || ratio == "auto") {
				delete(payload, "size")
			}
		default: // 像素折算（gpt-image 等原生像素 size 协议）
			applyFoldImageTierSize(payload, ratio, tier)
		}
	} else {
		applyFoldImageTierSize(payload, ratio, tier)
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return body, contentType, err
	}
	return encoded, "application/json", nil
}

func applyFoldImageTierSize(payload map[string]any, ratio string, tier string) {
	if pixels := foldImageTierPixels(ratio, tier); pixels != "" {
		payload["size"] = pixels
	} else {
		delete(payload, "size")
	}
}

// foldImageTierPixels 比例 + 档位 → 上游像素尺寸：
// - 存量像素值（如节点元数据）直传；
// - 2K/4K 档查档位像素表，表外比例按 2048/2880 基准折算；
// - 标准档按 1024 基准折算（与前端旧折算公式一致）。
func foldImageTierPixels(ratio string, tier string) string {
	ratio = strings.TrimSpace(strings.ToLower(ratio))
	if ratio == "" || ratio == "auto" {
		return ""
	}
	if width, height, ok := parseAPIMartSize(ratio); ok {
		return fmt.Sprintf("%dx%d", width, height)
	}
	if tier == "2k" || tier == "4k" {
		if table := imageTierPixels[tier]; table != nil {
			if pixels, ok := table[ratio]; ok {
				return pixels
			}
		}
		base := 2880.0 // 4K 档表外比例折算基准（对齐前端 resolveSize("high")）
		if tier == "2k" {
			base = 2048
		}
		return foldImageRatioPixels(ratio, base)
	}
	return foldImageRatioPixels(ratio, 1024)
}

// foldImageRatioPixels 比例按基准像素折算（对齐前端 resolveSize：unit 取 16 的倍数）。
func foldImageRatioPixels(ratio string, base float64) string {
	parts := strings.Split(ratio, ":")
	if len(parts) != 2 {
		return ""
	}
	width, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	height, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil || width <= 0 || height <= 0 {
		return ""
	}
	a, b := width, height
	for b != 0 {
		a, b = b, a%b
	}
	unit := int(math.Round(math.Sqrt(base*base/float64((width/a)*(height/a)))/16) * 16)
	if unit <= 0 {
		return ""
	}
	return fmt.Sprintf("%dx%d", (width/a)*unit, (height/a)*unit)
}
