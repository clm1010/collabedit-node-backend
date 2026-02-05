# CollabEdit NodeJS Backend

对齐前端 `src/api/training` 与 `src/api/template` 的接口路径，并提供 MySQL + MinIO 的落地实现。

## 快速开始

1. 复制环境变量
   - `cp .env.example .env`
2. 安装依赖
   - `pnpm install` 或 `npm install`
3. 生成 Prisma 客户端
   - `pnpm prisma:generate`
4. 推送数据库结构
   - `pnpm prisma:push`
5. 启动
   - `pnpm dev`

## 路由概览

- 演训方案：`/getPlan/*`
- 模板管理：`/tbTemplate/*`
- 审核流程：`/examRecord/*`
- 字典：`/dict/list`
- 鉴权刷新：`/system/auth/refresh-token`

## 说明

- 所有响应格式统一为 `{ code, data, msg }`
- 中间件项目只负责 WebSocket 协同，不承担业务逻辑
- 文件存储使用 MinIO，`objectKey` 采用 `YYYY-MM-DD/uuid-filename` 命名
- 鉴权：`Authorization: Bearer <token>`，刷新端点：`POST /system/auth/refresh-token?refreshToken=...`
- 多租户：支持请求头 `tenant-id` 与 `visit-tenant-id`
- 协同边界：`collaborative-middleware` 仅提供 WebSocket 协同服务，不做任何业务与持久化

## 脚本 命令 说明

| 脚本            |                  命令                   |                                           说明 |
| :-------------- | :-------------------------------------: | ---------------------------------------------: |
| dev             |          tsx watch src/main.ts          |                               开发模式，热重载 |
| build           | prisma generate && tsc -p tsconfig.json | 组合脚本 构建时都会确保 Prisma Client 是最新的 |
| start           |            node dist/main.js            |                                   生产环境启动 |
| prisma:generate |             prisma generate             |                             生成 Prisma Client |
| prisma:push     |             prisma db push              |                           同步 schema 到数据库 |
| db:reset        |      prisma db push --force-reset       |                                     重置数据库 |
| seed            |             tsx src/seed.ts             |                                       种子数据 |
| cleanup:minio   |    tsx src/scripts/cleanup-minio.ts     |                                       清理文件 |

## 项目初始化执行顺序

### 1. 安装依赖

pnpm install

### 2. 配置环境变量（复制并修改 .env 文件）

cp .env.example .env

### 然后编辑 .env 配置数据库连接等

### 3. 同步数据库 schema（创建表结构）

pnpm prisma:push

### 4. 生成 Prisma Client

pnpm prisma:generate

### 5. （可选）初始化种子数据

pnpm seed

### 6. 启动开发服务

pnpm dev
