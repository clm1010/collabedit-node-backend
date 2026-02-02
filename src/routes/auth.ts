import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'
import { issueTokens, rotateRefreshToken } from '../services/auth.service.js'
import { authGuard } from '../middleware/auth.js'

// 认证相关路由（本地登录、刷新、用户信息）。

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

// 获取当前用户信息（需要认证）
// 用于嵌入式场景，前端在 token 有效后调用一次获取用户信息
router.get('/api/user/info', authGuard, async (req, res) => {
  const { userId, username } = req.auth!
  
  // 从数据库查询用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  })
  
  return ok(res, {
    username: user?.username || username,
    level: '普通用户',           // TODO: 可扩展从数据库查询实际职级
    permissions: ['read', 'write'] // TODO: 可扩展从数据库查询实际权限
  })
})

export default router
