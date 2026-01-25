import { prisma } from '../db/prisma.js'

// 字典查询相关。

// 按类型获取字典项列表。
export const listDict = async (dictType: string) => {
  return prisma.dictItem.findMany({
    where: { dictType },
    orderBy: { sort: 'asc' }
  })
}
