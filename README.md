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
