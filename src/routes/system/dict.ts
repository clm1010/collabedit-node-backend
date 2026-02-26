import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { dictTypeService, dictDataService } from '../../services/system/dict.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// ===================== 字典类型 =====================

// GET /system/dict-type/page
router.get('/system/dict-type/page', requirePermission('system:dict:query'), async (req, res) => {
  try {
    const { name, type, status } = req.query
    const { skip, take } = parsePage(req)
    const result = await dictTypeService.page(
      { name: name as string, type: type as string, status: status !== undefined ? Number(status) : undefined },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dict-type/simple-list
router.get('/system/dict-type/simple-list', async (req, res) => {
  try {
    const list = await dictTypeService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dict-type/get?id=
router.get('/system/dict-type/get', requirePermission('system:dict:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const dt = await dictTypeService.get(id)
    if (!dt) return fail(res, '字典类型不存在', 404)
    return ok(res, dt)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/dict-type/create
router.post('/system/dict-type/create', requirePermission('system:dict:create'), async (req, res) => {
  try {
    const dt = await dictTypeService.create(req.body)
    return ok(res, dt.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/dict-type/update
router.put('/system/dict-type/update', requirePermission('system:dict:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await dictTypeService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/dict-type/delete?id=
router.delete('/system/dict-type/delete', requirePermission('system:dict:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await dictTypeService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/dict-type/delete-list
router.delete('/system/dict-type/delete-list', requirePermission('system:dict:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await dictTypeService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// ===================== 字典数据 =====================

// GET /system/dict-data/page
router.get('/system/dict-data/page', requirePermission('system:dict:query'), async (req, res) => {
  try {
    const { dictType, label, status } = req.query
    const { skip, take } = parsePage(req)
    const result = await dictDataService.page(
      { dictType: dictType as string, label: label as string, status: status !== undefined ? Number(status) : undefined },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dict-data/simple-list
router.get('/system/dict-data/simple-list', async (req, res) => {
  try {
    const list = await dictDataService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dict-data/get?id=
router.get('/system/dict-data/get', requirePermission('system:dict:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const item = await dictDataService.get(id)
    if (!item) return fail(res, '字典数据不存在', 404)
    return ok(res, item)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dict-data/type?type=
router.get('/system/dict-data/type', async (req, res) => {
  try {
    const type = req.query.type as string
    if (!type) return fail(res, '缺少 type 参数', 400)
    const list = await dictDataService.getByType(type)
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/dict-data/create
router.post('/system/dict-data/create', requirePermission('system:dict:create'), async (req, res) => {
  try {
    const item = await dictDataService.create(req.body)
    return ok(res, item.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/dict-data/update
router.put('/system/dict-data/update', requirePermission('system:dict:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await dictDataService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/dict-data/delete?id=
router.delete('/system/dict-data/delete', requirePermission('system:dict:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await dictDataService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/dict-data/delete-list
router.delete('/system/dict-data/delete-list', requirePermission('system:dict:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await dictDataService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

export default router
