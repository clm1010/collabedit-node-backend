import { prisma } from '../../db/prisma.js'

export interface RoleQuery {
  name?: string
  code?: string
  status?: number
}

export const roleService = {
  /** 分页查询角色 */
  async page(query: RoleQuery, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.name) where.name = { contains: query.name }
    if (query.code) where.code = { contains: query.code }
    if (query.status !== undefined) where.status = query.status
    const [list, total] = await Promise.all([
      prisma.role.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      prisma.role.count({ where })
    ])
    return { list, total }
  },

  /** 精简列表 */
  async simpleList() {
    return prisma.role.findMany({
      where: { status: 0 },
      select: { id: true, name: true, code: true },
      orderBy: { sort: 'asc' }
    })
  },

  /** 获取单个角色 */
  async get(id: number) {
    return prisma.role.findUnique({ where: { id } })
  },

  /** 创建角色 */
  async create(data: {
    name: string
    code: string
    sort?: number
    status?: number
    remark?: string
    dataScope?: number
  }) {
    return prisma.role.create({ data })
  },

  /** 更新角色 */
  async update(id: number, data: Partial<{
    name: string
    code: string
    sort: number
    status: number
    remark: string
    dataScope: number
    dataScopeDeptIds: string
  }>) {
    return prisma.role.update({ where: { id }, data })
  },

  /** 删除角色 */
  async remove(id: number) {
    // 检查是否为内置角色
    const role = await prisma.role.findUnique({ where: { id } })
    if (role?.type === 1) throw new Error('内置角色不能删除')
    // 检查是否有关联用户
    const count = await prisma.userRole.count({ where: { roleId: id } })
    if (count > 0) throw new Error('角色下存在用户，无法删除')
    await prisma.$transaction([
      prisma.roleMenu.deleteMany({ where: { roleId: id } }),
      prisma.role.delete({ where: { id } })
    ])
  },

  /** 批量删除 */
  async removeList(ids: number[]) {
    for (const id of ids) {
      await this.remove(id)
    }
  }
}
