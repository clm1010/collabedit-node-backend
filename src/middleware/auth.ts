import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'

export type AuthPayload = {
  userId: string
  username: string
  tenantId?: string
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (env.skipAuth) {
    // skipAuth 模式：尝试解析 token，失败则使用数据库默认用户
    const auth = req.headers.authorization
    if (auth) {
      try {
        req.auth = jwt.verify(auth.replace('Bearer ', ''), env.jwtSecret) as AuthPayload
        return next()
      } catch { /* 外部 token 无法验证（如 Java 后端签发），使用默认用户 */ }
    }
    // 从数据库查找默认管理员用户
    try {
      const defaultUser = await prisma.user.findFirst({ where: { username: 'admin' } })
      if (defaultUser) {
        req.auth = { userId: defaultUser.id, username: defaultUser.username }
      } else {
        req.auth = { userId: 'skip-auth-default', username: 'dev-user' }
      }
    } catch {
      req.auth = { userId: 'skip-auth-default', username: 'dev-user' }
    }
    return next()
  }
  const auth = req.headers.authorization
  if (!auth) {
    return fail(res, '未认证', 401)
  }
  const token = auth.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload
    req.auth = payload
    return next()
  } catch {
    return fail(res, '未认证', 401)
  }
}
