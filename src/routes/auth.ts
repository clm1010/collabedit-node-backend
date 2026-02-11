import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'
import { issueTokens, rotateRefreshToken } from '../services/auth.service.js'
import { authGuard } from '../middleware/auth.js'

// 认证相关路由（本地登录、刷新、用户信息）。
// 当前：无 /api 前缀，由前端代理层 strip /api/ 后转发到这些裸路径
// 备用：如果启用 main.ts 中的 apiRouter，则所有路由自动加上 /api 前缀

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

// 统一用户信息接口（与 Java 后端格式对齐）
// 实际 URL: /system/auth/get-permission-info（前端 /api/system/auth/... 由代理 strip /api/ 后到达）
router.get('/system/auth/get-permission-info', authGuard, async (req, res) => {
  try {
    if (!req.auth) {
      return fail(res, '未认证：缺少用户身份信息', 401)
    }
    const { userId, username } = req.auth
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, nickname: true, email: true, avatar: true, deptId: true }
    })
    return ok(res, {
      user: {
        id: userId,
        deptId: user?.deptId || null,
        nickname: user?.nickname || user?.username || username,
        username: user?.username || username,
        email: user?.email || '',
        avatar: user?.avatar || ''
      },
      roles: ['common'],
      permissions: ['read', 'write'],
      buttons: [],
      menus: []
    })
  } catch (e) {
    console.error('[auth] get-permission-info error:', e)
    return fail(res, '获取用户信息失败', 500)
  }
})

// 旧接口保留作为向后兼容
// 实际 URL: /api/user/info（通过 apiRouter 自动加 /api 前缀）
router.get('/user/info', authGuard, async (req, res) => {
  if (!req.auth) {
    return fail(res, '未认证：缺少用户身份信息', 401)
  }
  const { userId, username } = req.auth
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, nickname: true }
  })
  return ok(res, {
    userId: userId,
    username: user?.username || username,
    nickname: user?.nickname || user?.username || username,
    level: '普通用户',
    permissions: ['read', 'write']
  })
})

// ===== 模拟 Java 接口（本地测试用） =====

// 模拟 Java 刷新 Token 接口
// 实际 URL: /api/sjrh/permission/refreshToken?refreshToken=xxx
router.post('/sjrh/permission/refreshToken', async (req, res) => {
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

// 模拟 Java 获取权限接口
// 实际 URL: /api/sjrh/permission/getPermission
router.get('/sjrh/permission/getPermission', authGuard, async (req, res) => {
  try {
    if (!req.auth) {
      return fail(res, '未认证：缺少用户身份信息', 401)
    }
    const { userId, username } = req.auth
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, nickname: true, email: true, avatar: true, deptId: true }
    })
    return ok(res, {
      user: {
        id: userId,
        deptId: user?.deptId || null,
        nickname: user?.nickname || user?.username || username,
        username: user?.username || username,
        email: user?.email || '',
        avatar: user?.avatar || ''
      },
      roles: ['common'],
      permissions: ['read', 'write'],
      buttons: [],
      menus: []
    })
  } catch (e) {
    console.error('[auth] sjrh/permission/getPermission error:', e)
    return fail(res, '获取用户信息失败', 500)
  }
})

export default router
