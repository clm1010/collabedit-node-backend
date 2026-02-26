import { prisma } from '../../db/prisma.js'

export const postService = {
  async page(query: { name?: string; code?: string; status?: number }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.name) where.name = { contains: query.name }
    if (query.code) where.code = { contains: query.code }
    if (query.status !== undefined) where.status = query.status
    const [list, total] = await Promise.all([
      prisma.post.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      prisma.post.count({ where })
    ])
    return { list, total }
  },

  async simpleList() {
    return prisma.post.findMany({
      where: { status: 0 },
      select: { id: true, name: true, code: true },
      orderBy: { sort: 'asc' }
    })
  },

  async get(id: number) {
    return prisma.post.findUnique({ where: { id } })
  },

  async create(data: { code: string; name: string; sort?: number; status?: number; remark?: string }) {
    return prisma.post.create({ data })
  },

  async update(id: number, data: Partial<{ code: string; name: string; sort: number; status: number; remark: string }>) {
    return prisma.post.update({ where: { id }, data })
  },

  async remove(id: number) {
    const count = await prisma.userPost.count({ where: { postId: id } })
    if (count > 0) throw new Error('岗位下存在用户，无法删除')
    return prisma.post.delete({ where: { id } })
  },

  async removeList(ids: number[]) {
    for (const id of ids) {
      await this.remove(id)
    }
  }
}
