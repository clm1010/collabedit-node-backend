import { prisma } from '../../db/prisma.js'

export const noticeService = {
  async page(query: { title?: string; type?: number; status?: number }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.title) where.title = { contains: query.title }
    if (query.type !== undefined) where.type = query.type
    if (query.status !== undefined) where.status = query.status
    const [list, total] = await Promise.all([
      prisma.notice.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notice.count({ where })
    ])
    return { list, total }
  },

  async get(id: number) {
    return prisma.notice.findUnique({ where: { id } })
  },

  async create(data: { title: string; type: number; content: string; status?: number; remark?: string }) {
    return prisma.notice.create({ data })
  },

  async update(id: number, data: Partial<{ title: string; type: number; content: string; status: number; remark: string }>) {
    return prisma.notice.update({ where: { id }, data })
  },

  async remove(id: number) {
    return prisma.notice.delete({ where: { id } })
  },

  async removeList(ids: number[]) {
    return prisma.notice.deleteMany({ where: { id: { in: ids } } })
  },

  /** 推送通知（当前仅更新状态为发布） */
  async push(id: number) {
    return prisma.notice.update({ where: { id }, data: { status: 1 } })
  }
}
