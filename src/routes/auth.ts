import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'
import { issueTokens, rotateRefreshToken } from '../services/auth.service.js'

// 认证相关路由（本地登录与刷新）。

const router = Router()

// 简单用户名密码登录（仅本地开发）。
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) {
    return fail(res, '缺少用户名或密码', 400)
  }
  const tenantId = (req.headers['tenant-id'] as string | undefined) ?? undefined
  let user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        password,
        tenantId
      }
    })
  }
  if (user.password !== password) {
    return fail(res, '用户名或密码错误', 401)
  }
  const tokens = await issueTokens(user.id, user.username, user.tenantId ?? tenantId)
  return ok(res, tokens)
})

// 使用 refresh token 刷新访问令牌。
router.post('/system/auth/refresh-token', async (req, res) => {
  const refreshToken = String(req.query.refreshToken ?? '')
  if (!refreshToken) {
    return fail(res, '缺少刷新令牌', 400)
  }
  const tokens = await rotateRefreshToken(refreshToken)
  if (!tokens) {
    return fail(res, '无效的刷新令牌', 401)
  }
  return ok(res, tokens)
})

export default router
