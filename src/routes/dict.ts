import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { listDict } from '../services/dict.service.js'

// 字典相关路由。

const router = Router()

// 按类型获取字典项列表。
router.get('/dict/list', async (req, res) => {
  const dictType = String(req.query.dictType ?? '')
  if (!dictType) return fail(res, '缺少dictType', 400)
  const data = await listDict(dictType)
  const mapped = data.map((item) => ({
    value: item.value,
    label: item.label
  }))
  return ok(res, mapped)
})

export default router
