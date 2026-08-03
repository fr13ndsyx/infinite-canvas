---
title: 部署指南
description: Docker 部署、本地开发、PostgreSQL 安装与配置完整流程
---

# 部署指南

本文档覆盖三种场景：Docker 一键部署、本地开发（前后端分开跑）、PostgreSQL 数据库准备。

项目结构：

```text
infinite-canvas/
├── Go/             # 后端 Go 代码（main.go 在此目录）
├── next/           # 前端 Next.js 代码
├── .env.example    # 环境变量模板（位于仓库根目录）
├── docker-compose.yml          # 使用已发布镜像
└── docker-compose.local.yml    # 基于本地源码构建镜像
```

## 一、Docker 部署

适合只想运行项目、不需要改代码的场景。Docker 镜像内前端监听 3000，Go 后端在容器内部监听 8080，由 Next.js 代理 `/api/*`。

### 1. 准备 .env

`.env` 文件需要放在 `Go/.env`（`docker-compose.yml` 通过 `env_file: Go/.env` 引用）。

```bash
cp .env.example Go/.env
```

### 2. 使用已发布镜像

```bash
docker compose up -d
```

启动后访问 <http://localhost:3000>。

默认管理员账号：

```text
用户名：admin
密码：Go/.env 中的 ADMIN_PASSWORD
```

### 3. 本地构建镜像

适合需要改代码后重新打包：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

### 4. 数据目录

`docker-compose.yml` 把本地 `./data` 挂载到容器内 `/app/data`，用于保存数据库文件、提示词数据和上传素材。

SQLite 部署时建议把 `Go/.env` 中 SQLite 路径设为绝对路径：

```text
DATABASE_DSN=/app/data/infinite-canvas.db
```

### 5. Docker 中使用 PostgreSQL

修改 `Go/.env`：

```text
STORAGE_DRIVER=postgres
DATABASE_DSN=postgres://postgres:YOUR_PASSWORD@host.docker.internal:5432/infinite_canvas?sslmode=disable
```

`host.docker.internal` 让容器访问宿主机上的 PostgreSQL；如果 PostgreSQL 也跑在容器里，建议放进同一 docker network 用服务名访问。

如果需要让火山方舟拉取本地上传的 Seedance 参考素材，还需要把 `PUBLIC_BASE_URL` 设置为公网可访问的站点地址。

## 二、本地开发（前后端分开跑）

适合改代码的场景，前端热更新，后端单独调试。

### 1. 准备环境变量

```bash
cp .env.example Go/.env
```

后端从 `Go/` 目录启动，读取 `Go/.env`。默认配置：

- 后端端口：`8080`
- 前端端口：`3000`
- 数据库：见 `STORAGE_DRIVER` 和 `DATABASE_DSN`

### 2. 启动后端

```bash
cd Go
go run .
```

监听 <http://127.0.0.1:8080>。

### 3. 启动前端

另开终端：

```bash
cd next
bun install        # 首次或依赖变更时
bun run dev
```

监听 <http://localhost:3000>，开发代理默认转发到 `http://127.0.0.1:8080`。如果后端端口不同，启动前设置 `API_BASE_URL`。

### 4. 常见场景

- 改画布、页面和交互：主要看 `next/`
- 改接口、业务逻辑和数据库：主要看 `Go/`
- 改文档站内容：主要看 `docs/`

## 三、PostgreSQL 安装与配置

### 1. 安装 PostgreSQL（Windows）

1. 访问 <https://www.postgresql.org/download/windows/>
2. 下载 PostgreSQL 16 LTS 的 EDB 安装包并运行
3. 安装时记住 postgres 超级用户密码（自行设定）
4. 端口保持默认 `5432`
5. Stack Builder 可不勾选（项目用不上）
6. 安装完成后服务自动启动，监听 `127.0.0.1:5432`

### 2. 配置 .env

修改 `Go/.env`（如果还没创建，先 `cp .env.example Go/.env`）：

```text
STORAGE_DRIVER=postgres
DATABASE_DSN=postgres://postgres:你的密码@127.0.0.1:5432/infinite_canvas?sslmode=disable
```

DSN 字段说明：

| 字段 | 说明 |
| --- | --- |
| `postgres`（用户名） | PostgreSQL 默认超级用户，保持不变 |
| `你的密码` | 安装时为 postgres 用户设置的密码 |
| `127.0.0.1:5432` | 主机和端口，本地默认值 |
| `infinite_canvas` | 数据库名，后端首次启动会自动创建 |
| `sslmode=disable` | 本地开发关闭 SSL；生产环境建议改为 `require` |

### 3. 自动建库与建表

后端首次启动时：

1. `ensurePostgresDatabase` 检测到目标库 `infinite_canvas` 不存在，自动用 postgres 维护连接执行 `CREATE DATABASE infinite_canvas`（postgres 超级用户默认有 CREATEDB 权限，无需手动授权）
2. `AutoMigrate` 自动创建全部业务表
3. `seedPromptSourcesIfEmpty` 写入 8 条提示词源种子数据（1 个 system 本地分类 + 7 个 GitHub 远程同步源）
4. `EnsureDefaultAdmin` 创建默认 admin 账号

### 4. 验证连接

启动后端：

```bash
cd Go
go run .
```

看到类似以下日志即连接成功：

```text
[GIN-debug] listening and serving HTTP on :8080
```

如果报错 `failed to connect to ...` 检查：

- PostgreSQL 服务是否在跑（`services.msc` 查看 `postgresql-16` 服务状态）
- `.env` 中密码是否与安装时一致
- `5432` 端口是否被防火墙拦截
- DSN 中的数据库名 `infinite_canvas` 是否拼错（首次启动前不需要手动建库，但库名必须与 DSN 一致）

### 5. 使用 psql 验证

如果安装时勾选了 pgAdmin 或命令行工具，可执行：

```bash
psql -U postgres -h 127.0.0.1
# 输入密码后进入 psql
\l                                # 列出所有数据库，应能看到 infinite_canvas
\c infinite_canvas                # 连接到该库
\dt                               # 列出所有表
SELECT key, value FROM settings;  # 查看 settings 表
```

## 四、环境变量速查

完整变量见 `.env.example`，常用项：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ADMIN_USERNAME` | `admin` | 首次启动自动创建的管理员账号 |
| `ADMIN_PASSWORD` | `infinite-canvas` | 管理员密码 |
| `JWT_SECRET` | `infinite-canvas` | JWT 签名密钥，正式部署必须修改 |
| `JWT_EXPIRE_HOURS` | `168` | JWT 过期小时数 |
| `PORT` | `8080` | 后端监听端口（Docker 镜像内固定） |
| `STORAGE_DRIVER` | `sqlite` | 数据库驱动：`sqlite` / `postgres` / `mysql` |
| `DATABASE_DSN` | `data/infinite-canvas.db` | 数据库连接串，按驱动格式不同 |
| `PUBLIC_BASE_URL` | 空 | 公网访问地址，火山方舟拉取本地上传素材时必填 |
| `AI_LOG_DIR` | `data/logs/ai-calls` | AI 调用日志本地目录 |

## 五、注意事项

- 切换数据库驱动后，原 SQLite 数据不会自动迁移。需要从零开始的话直接换驱动即可，后端会自动建新库建表；要保留旧数据需要写迁移脚本。
- `JWT_SECRET` 留默认值时，后端启动会自动生成随机密钥并写入运行时配置（不持久化），重启后旧 token 失效。正式部署请显式设置固定值。
- 项目尚未上线，无旧数据兼容；切换数据库或修改表结构直接改配置即可，不需要写数据迁移兜底逻辑。
