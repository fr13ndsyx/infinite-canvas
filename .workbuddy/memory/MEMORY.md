# 项目长期记忆 — infinite-canvas

## 架构速览
- 前端：Next.js 16.2（`next/`，:3000），经 `src/app/api/[...path]/route.ts` 反代 `/api/*` 到后端
- 后端：Go 1.25 + Gin + GORM（`Go/`，:8080）；自研画布引擎（DOM+SVG）；3D 导演台为预构建 three.js iframe+postMessage
- 设置体系：`settings` 表仅 public/private 两行 JSON；`availableModels` 语义"空=全部开放"；公开接口 `/api/settings` 从私有渠道派生并脱敏
- 计费：平台渠道（后端预扣算力点→转发→失败返还）vs 用户自定义渠道（浏览器直连，不收费）

## 本机环境坑（重要）
- 无系统 Go/bun；Go SDK 在 `C:\Users\Administrator\go-sdk\`，前端用 managed node 22.22.2 + npm
- `NODE_OPTIONS` 被全局注入 genie-safe-delete shim，会导致 Next dev 崩溃 → 启动时须 `NODE_OPTIONS=""`
- Next 对 `.next/` 新文件在后台/提权执行时必现 EPERM → `next build` 须前台 PowerShell 执行；`next start` 可后台
- Bash 工具每条命令 cwd 重置为仓库根目录 → 命令内必须显式 `cd`
- Git Bash 下 curl `-o` 须用 Windows 路径（`C:\...`），POSIX 路径会 error 23
- git push/pull 走 https 时 schannel 报 CRYPT_E_REVOCATION_OFFLINE（吊销服务器不可达，schannelCheckRevoke=false 也无效）→ 用 `git -c http.sslBackend=openssl push` 绕过

## AGENTS.md 关键约束
- 改任何文件前必须先询问用户
- 任务完成前检查更新 `docs/progress/todo.md` 与 `docs/progress/pending-test.md`
- 最少行数原则；不写旧数据兼容；不执行构建/语法检查（用户自己做）
- 工作区已有用户改动时不要回滚、不要覆盖

## 2026-08-03 教训
- 工作区曾被整体回退（git checkout + 删未跟踪文件）导致未提交修复全部丢失；以后有修复应尽快提交或备份
