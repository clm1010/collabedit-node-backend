import { prisma } from '../../db/prisma.js'
import { buildTree } from '../../utils/tree.js'

export interface DeptQuery {
  name?: string
  status?: number
}

export const deptService = {
  /** 查部门列表（树形返回） */
  async list(query: DeptQuery) {
    const where: Record<string, any> = {}
    if (query.name) where.name = { contains: query.name }
    if (query.status !== undefined) where.status = query.status
    const list = await prisma.dept.findMany({ where, orderBy: { sort: 'asc' } })
    return list
  },

  /** 精简列表（用于下拉选择） */
  async simpleList() {
    return prisma.dept.findMany({
      where: { status: 0 },
      select: { id: true, name: true, parentId: true },
      orderBy: { sort: 'asc' }
    })
  },

  /** 获取单个部门 */
  async get(id: number) {
    return prisma.dept.findUnique({ where: { id } })
  },

  /** 创建部门 */
  async create(data: {
    name: string
    parentId?: number
    sort?: number
    leaderUserId?: number
    phone?: string
    email?: string
    status?: number
  }) {
    return prisma.dept.create({ data: { ...data, parentId: data.parentId ?? 0 } })
  },

  /** 更新部门 */
  async update(id: number, data: Partial<{
    name: string
    parentId: number
    sort: number
    leaderUserId: number
    phone: string
    email: string
    status: number
  }>) {
    return prisma.dept.update({ where: { id }, data })
  },

  /** 删除部门 */
  async remove(id: number) {
    // 检查是否有子部门
    const children = await prisma.dept.count({ where: { parentId: id } })
    if (children > 0) throw new Error('存在子部门，无法删除')
    // 检查是否有关联用户
    const users = await prisma.user.count({ where: { deptId: id } })
    if (users > 0) throw new Error('部门下存在用户，无法删除')
    return prisma.dept.delete({ where: { id } })
  },

  /** 批量删除部门 */
  async removeList(ids: number[]) {
    for (const id of ids) {
      await this.remove(id)
    }
  }
}
