import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'

const router = Router()

router.post('/file/page', async (req, res) => {
  const { fileTypeList, pageNo, pageSize } = req.body ?? {}

  const where: any = { delFlg: 0 }

  if (fileTypeList) {
    const types = Array.isArray(fileTypeList) ? fileTypeList : [fileTypeList]
    if (types.length > 0) {
      where.fileType = { in: types.map(String) }
    }
  }

  if (pageNo && pageSize) {
    const [list, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip: (Number(pageNo) - 1) * Number(pageSize),
        take: Number(pageSize)
      }),
      prisma.material.count({ where })
    ])
    return ok(res, { records: list, total })
  }

  const list = await prisma.material.findMany({
    where,
    orderBy: { createTime: 'desc' }
  })
  return ok(res, { records: list, total: list.length })
})

export default router
