import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'

// userId 改为 number（对齐芋道 User.id Int 自增）
export type AuthPayload = {
  userId: number
  username: string
  tenantId?: number
}

// Request.auth 扩展定义在 src/types/express.d.ts

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (env.skipAuth) {
    // skipAuth 模式：尝试解析 token，失败则使用数据库默认用户
    const auth = req.headers.authorization
    if (auth) {
      try {
        // JWT payload 使用短字段名(uid/un/tid)，这里映射回标准 AuthPayload
        const decoded = jwt.verify(auth.replace('Bearer ', ''), env.jwtSecret) as any
        req.auth = { userId: decoded.uid, username: decoded.un, tenantId: decoded.tid }
        return next()
      } catch { /* 外部 token 无法验证（如 Java 后端签发），使用默认用户 */ }
    }
    // 从数据库查找默认管理员用户
    try {
      const defaultUser = await prisma.user.findFirst({ where: { username: 'admin' } })
      if (defaultUser) {
        req.auth = { userId: defaultUser.id, username: defaultUser.username }
      } else {
        req.auth = { userId: 0, username: 'dev-user' }
      }
    } catch {
      req.auth = { userId: 0, username: 'dev-user' }
    }
    return next()
  }
  const auth = req.headers.authorization
  if (!auth) {
    return fail(res, '未认证', 401)
  }
  const token = auth.replace('Bearer ', '')
  try {
    // JWT payload 使用短字段名(uid/un/tid)，这里映射回标准 AuthPayload
    const decoded = jwt.verify(token, env.jwtSecret) as any
    const payload: AuthPayload = { userId: decoded.uid, username: decoded.un, tenantId: decoded.tid }
    // 查询用户状态，对齐芋道行为（禁用账号 → 403，status 0=正常）
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return fail(res, '用户不存在', 403)
    }
    if (user.status !== 0) {
      return fail(res, '账号已被禁用', 403)
    }
    req.auth = payload
    return next()
  } catch {
    return fail(res, '未认证', 401)
  }
}

// ===== roleGuard：角色校验中间件 =====
// 使用方式：router.get('/xxx', authGuard, roleGuard('super_admin', 'common'), handler)
export const roleGuard = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return fail(res, '未认证', 401)
    const userRoles = await prisma.userRole.findMany({
      where: { userId: req.auth.userId },
      include: { role: { select: { code: true, status: true } } }
    })
    const activeCodes = userRoles.filter(ur => ur.role.status === 0).map(ur => ur.role.code)
    // super_admin 拥有全部权限
    if (activeCodes.includes('super_admin')) return next()
    const hasRole = requiredRoles.some(r => activeCodes.includes(r))
    if (!hasRole) return fail(res, '无权限访问', 403)
    return next()
  }
}

// ===== requirePermission：权限标识校验中间件 =====
// 使用方式：router.get('/xxx', authGuard, requirePermission('system:user:query'), handler)
export const requirePermission = (...requiredPerms: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return fail(res, '未认证', 401)
    // 查用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId: req.auth.userId },
      include: { role: { select: { code: true, status: true, id: true } } }
    })
    const activeRoles = userRoles.filter(ur => ur.role.status === 0)
    // super_admin 跳过权限检查
    if (activeRoles.some(ur => ur.role.code === 'super_admin')) return next()
    // 查角色关联的菜单权限
    const roleIds = activeRoles.map(ur => ur.role.id)
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId: { in: roleIds } },
      include: { menu: { select: { permission: true, status: true } } }
    })
    const perms = new Set(
      roleMenus
        .filter(rm => rm.menu.status === 0 && rm.menu.permission)
        .map(rm => rm.menu.permission!)
    )
    // 检查是否拥有 *:*:* 全局权限
    if (perms.has('*:*:*')) return next()
    const hasPerm = requiredPerms.some(p => perms.has(p))
    if (!hasPerm) return fail(res, '无权限访问', 403)
    return next()
  }
}
