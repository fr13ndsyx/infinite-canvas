---
title: 本地开发
description: 前后端分开启动时的本地开发方式
---

# 本地开发

如果你需要改代码，建议前后端分开启动。完整部署流程见 [deployment.md](../overview/deployment.md)。

## 1. 准备环境变量

后端从 `Go/` 目录启动，读取 `Go/.env`（仓库根目录的 `.env.example` 是模板）。

```bash
cp .env.example Go/.env
```

默认配置下：

- 后端端口是 `8080`
- 前端端口是 `3000`
- 数据库默认 SQLite，路径 `data/infinite-canvas.db`（相对于 `Go/` 目录）

切换 PostgreSQL 见 [deployment.md - PostgreSQL 安装与配置](../overview/deployment.md#三-postgresql-安装与配置)。

## 2. 启动后端

在 `Go` 目录执行：

```bash
cd Go
go run .
```

后端读取 `Go/.env`，监听：

```text
http://127.0.0.1:8080
```

## 3. 启动前端

在 `next` 目录执行：

```bash
cd next
bun install        # 首次或依赖变更时
bun run dev
```

前端默认访问：

```text
http://localhost:3000
```

开发代理默认转发到 `http://127.0.0.1:8080`。如果你的后端端口不同，启动前设置 `API_BASE_URL`。

## 常见场景

- 改画布、页面和交互：主要看 `next/`
- 改接口、业务逻辑和数据库：主要看 `Go/`
- 改文档站内容：主要看 `docs/`
