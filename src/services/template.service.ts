import { prisma } from '../db/prisma.js'

// 模板模块数据访问层。

export type TemplateQuery = {
  pageNo?: number
  pageSize?: number
  templateName?: string
  temCategory?: string
  temSubclass?: string
  createTime?: string
  applyNode?: string
  tabType?: string
}

// 分页查询模板列表。
export const getTemplatePage = async (query: TemplateQuery) => {
  const pageNo = Math.max(1, Number(query.pageNo ?? 1))
  const pageSize = Math.max(1, Number(query.pageSize ?? 10))
  const where: any = { delFlg: 0 }
  if (query.templateName) where.templateName = { contains: query.templateName }
  if (query.temCategory) where.temCategory = query.temCategory
  if (query.temSubclass) where.temSubclass = query.temSubclass
  if (query.applyNode) where.applyNode = query.applyNode

  const [total, list] = await Promise.all([
    prisma.template.count({ where }),
    prisma.template.findMany({
      where,
      orderBy: { createTime: 'desc' },
      skip: (pageNo - 1) * pageSize,
      take: pageSize
    })
  ])
  return { records: list, total }
}

// 新增或更新模板记录。
export const saveTemplate = async (payload: any) => {
  const normalized = {
    ...payload,
    applyNode: payload.applyNode ?? '1',
    elementsItems: payload.elementsItems ?? payload.elements_items
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'elements_items')) {
    delete normalized.elements_items
  }
  if (payload.id) {
    return prisma.template.update({
      where: { id: payload.id },
      data: normalized
    })
  }
  return prisma.template.create({ data: normalized })
}

// 软删除模板记录。
export const deleteTemplates = async (ids: string[]) => {
  await prisma.template.updateMany({
    where: { id: { in: ids } },
    data: { delFlg: 1 }
  })
  return true
}

// 将模板记录标记为已发布。
export const publishTemplate = async (data: { id: string; visibleScope?: string }) => {
  return prisma.template.update({
    where: { id: data.id },
    data: { publishStatus: 'published', visibleScope: data.visibleScope ?? '' }
  })
}

// 读取模板自定义要素列表。
export const getElements = async (id: string) => {
  const record = await prisma.template.findUnique({ where: { id } })
  return record?.elementsItems ?? []
}
