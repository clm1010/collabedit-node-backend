import { prisma } from '../../db/prisma.js'

// ===== 操作日志 =====
export const operateLogService = {
  async page(query: { userId?: number; type?: string }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.userId) where.userId = query.userId
    if (query.type) where.type = query.type
    const [list, total] = await Promise.all([
      prisma.operateLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.operateLog.count({ where })
    ])
    return { list, total }
  },

  /** 记录操作日志（供其他模块调用） */
  async create(data: {
    userId?: number
    userName?: string
    type?: string
    subType?: string
    bizId?: number
    action?: string
    extra?: string
    requestMethod?: string
    requestUrl?: string
    userIp?: string
    userAgent?: string
  }) {
    return prisma.operateLog.create({ data })
  }
}

// ===== 登录日志 =====
export const loginLogService = {
  async page(query: { username?: string; result?: number; userIp?: string }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.username) where.username = { contains: query.username }
    if (query.result !== undefined) where.result = query.result
    if (query.userIp) where.userIp = { contains: query.userIp }
    const [list, total] = await Promise.all([
      prisma.loginLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.loginLog.count({ where })
    ])
    return { list, total }
  },

  /** 记录登录日志 */
  async create(data: {
    logType?: number
    userId?: number
    username?: string
    result?: number
    userIp?: string
    userAgent?: string
  }) {
    return prisma.loginLog.create({ data })
  }
}
