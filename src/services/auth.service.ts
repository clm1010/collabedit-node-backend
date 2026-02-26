import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { randomUUID } from 'crypto'

// 令牌签发与刷新工具。

/** 解析时间字符串为毫秒（如 '7d' → 604800000, '2h' → 7200000） */
function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000 // 解析失败兜底 7 天
  const num = parseInt(match[1])
  const unit = match[2]
  const ms: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return num * (ms[unit] || ms.d)
}

// 创建 access/refresh 令牌并持久化 refresh token。
// userId 改为 Int（对齐芋道 User.id Int 自增）
export const issueTokens = async (userId: number, username: string, tenantId?: number) => {
  // JWT payload 使用短字段名以缩短 token 长度，中间件解析时映射回标准字段名
  const payload = { uid: userId, un: username, tid: tenantId }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshToken = jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn } as any)

  // DB expiresAt 与 JWT exp 保持同步（解析 env.refreshExpiresIn 而非硬编码）
  const expiresAt = new Date(Date.now() + parseExpiry(env.refreshExpiresIn))
  await prisma.refreshToken.create({
    data: {
      id: randomUUID(),
      userId,
      token: refreshToken,
      expiresAt
    }
  })

  return { accessToken, refreshToken, expiresAt }
}

// 校验 refresh token 并轮换（三层验证：JWT 签名 → DB 查询 → 用户状态）。
export const rotateRefreshToken = async (token: string) => {
  // 1. 先验证 JWT 签名（确保 token 未被篡改）
  try {
    jwt.verify(token, env.refreshSecret)
  } catch {
    return null
  }
  // 2. 再查数据库（确保 token 未被使用/撤销）
  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) {
    return null
  }
  // 3. 检查用户状态（对齐芋道：禁用用户不可刷新，status 0=正常）
  const user = await prisma.user.findUnique({ where: { id: stored.userId } })
  if (!user || user.status !== 0) return null
  await prisma.refreshToken.delete({ where: { token } })
  return issueTokens(user.id, user.username, user.tenantId ?? undefined)
}
