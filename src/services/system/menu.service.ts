import { prisma } from '../../db/prisma.js'

export interface MenuQuery {
  name?: string
  status?: number
}

export const menuService = {
  /** 查菜单列表 */
  async list(query: MenuQuery) {
    const where: Record<string, any> = {}
    if (query.name) where.name = { contains: query.name }
    if (query.status !== undefined) where.status = query.status
    return prisma.menu.findMany({ where, orderBy: { sort: 'asc' } })
  },

  /** 精简列表（用于下拉选择，返回树） */
  async simpleList() {
    return prisma.menu.findMany({
      where: { status: 0 },
      select: { id: true, name: true, parentId: true, type: true },
      orderBy: { sort: 'asc' }
    })
  },

  /** 获取单个菜单 */
  async get(id: number) {
    return prisma.menu.findUnique({ where: { id } })
  },

  /** 创建菜单 */
  async create(data: {
    name: string
    permission?: string
    type: number
    sort?: number
    parentId?: number
    path?: string
    icon?: string
    component?: string
    componentName?: string
    status?: number
    visible?: boolean
    keepAlive?: boolean
    alwaysShow?: boolean
  }) {
    return prisma.menu.create({ data: { ...data, parentId: data.parentId ?? 0 } })
  },

  /** 更新菜单 */
  async update(id: number, data: Partial<{
    name: string
    permission: string
    type: number
    sort: number
    parentId: number
    path: string
    icon: string
    component: string
    componentName: string
    status: number
    visible: boolean
    keepAlive: boolean
    alwaysShow: boolean
  }>) {
    return prisma.menu.update({ where: { id }, data })
  },

  /** 删除菜单 */
  async remove(id: number) {
    // 检查是否有子菜单
    const children = await prisma.menu.count({ where: { parentId: id } })
    if (children > 0) throw new Error('存在子菜单，无法删除')
    await prisma.$transaction([
      prisma.roleMenu.deleteMany({ where: { menuId: id } }),
      prisma.menu.delete({ where: { id } })
    ])
  }
}
