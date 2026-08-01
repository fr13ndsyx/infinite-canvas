---
title: TODO
description: 当前项目后续值得处理的事项
---

# TODO

本文档用来记录当前项目后续比较值得处理的事项。

## 待办

### KIE AI 接口代码清理

- 状态：暂不考虑删除
- 说明：`Go/handler/kie_image.go` 中的 `kieFileStreamUploadURL`（`https://kieai.redpandaai.co/api/file-stream-upload`）是第三方 AI 服务商 KIE AI 的文件上传接口
- 触发条件：仅当用户在画布图像生成中选择 KIE 作为模型渠道，并上传参考图时才会调用
- 不接 KIE 渠道时该代码不会执行，无副作用；如未来确定不使用 KIE，可删除相关适配逻辑（涉及 handler/service/router 多处）
