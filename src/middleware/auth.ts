import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { fail } from '../utils/response.js'

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

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (env.skipAuth) {
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
    // 【已删除】T-User 响应头设置，改为使用 /api/user/info 接口获取用户信息
    return next()
  } catch {
    return fail(res, '未认证', 401)
  }
}
