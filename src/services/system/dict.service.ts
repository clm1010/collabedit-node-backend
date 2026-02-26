import { prisma } from '../../db/prisma.js'

// ===== 字典类型 =====
export const dictTypeService = {
  async page(query: { name?: string; type?: string; status?: number }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.name) where.name = { contains: query.name }
    if (query.type) where.type = { contains: query.type }
    if (query.status !== undefined) where.status = query.status
    const [list, total] = await Promise.all([
      prisma.dictType.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.dictType.count({ where })
    ])
    return { list, total }
  },

  async simpleList() {
    return prisma.dictType.findMany({
      where: { status: 0 },
      select: { id: true, name: true, type: true },
      orderBy: { createdAt: 'desc' }
    })
  },

  async get(id: number) {
    return prisma.dictType.findUnique({ where: { id } })
  },

  async create(data: { name: string; type: string; status?: number; remark?: string }) {
    return prisma.dictType.create({ data })
  },

  async update(id: number, data: Partial<{ name: string; type: string; status: number; remark: string }>) {
    return prisma.dictType.update({ where: { id }, data })
  },

  async remove(id: number) {
    const dt = await prisma.dictType.findUnique({ where: { id } })
    if (!dt) throw new Error('字典类型不存在')
    // 删除关联的字典数据
    await prisma.$transaction([
      prisma.dictItem.deleteMany({ where: { dictType: dt.type } }),
      prisma.dictType.delete({ where: { id } })
    ])
  },

  async removeList(ids: number[]) {
    for (const id of ids) {
      await this.remove(id)
    }
  }
}

// ===== 字典数据 =====
export const dictDataService = {
  async page(query: { dictType?: string; label?: string; status?: number }, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.dictType) where.dictType = query.dictType
    if (query.label) where.label = { contains: query.label }
    if (query.status !== undefined) where.status = query.status
    const [list, total] = await Promise.all([
      prisma.dictItem.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      prisma.dictItem.count({ where })
    ])
    return { list, total }
  },

  async simpleList() {
    return prisma.dictItem.findMany({
      where: { status: 0 },
      orderBy: { sort: 'asc' }
    })
  },

  async get(id: number) {
    return prisma.dictItem.findUnique({ where: { id } })
  },

  /** 按字典类型查数据 */
  async getByType(dictType: string) {
    return prisma.dictItem.findMany({
      where: { dictType, status: 0 },
      orderBy: { sort: 'asc' }
    })
  },

  async create(data: { dictType: string; value: string; label: string; sort?: number; status?: number; colorType?: string; cssClass?: string; remark?: string }) {
    return prisma.dictItem.create({ data })
  },

  async update(id: number, data: Partial<{ dictType: string; value: string; label: string; sort: number; status: number; colorType: string; cssClass: string; remark: string }>) {
    return prisma.dictItem.update({ where: { id }, data })
  },

  async remove(id: number) {
    return prisma.dictItem.delete({ where: { id } })
  },

  async removeList(ids: number[]) {
    return prisma.dictItem.deleteMany({ where: { id: { in: ids } } })
  }
}
