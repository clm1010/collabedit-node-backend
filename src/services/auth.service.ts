import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { randomUUID } from 'crypto'

// 令牌签发与刷新工具。

// 创建 access/refresh 令牌并持久化 refresh token。
export const issueTokens = async (userId: string, username: string, tenantId?: string) => {
  const payload = { userId, username, tenantId }
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
  const refreshToken = jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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

// 校验 refresh token 并轮换。
export const rotateRefreshToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) {
    return null
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } })
  if (!user) return null
  await prisma.refreshToken.delete({ where: { token } })
  return issueTokens(user.id, user.username, user.tenantId ?? undefined)
}
