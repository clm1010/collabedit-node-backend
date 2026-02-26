import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { roleService } from '../../services/system/role.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/role/page
router.get('/system/role/page', requirePermission('system:role:query'), async (req, res) => {
  try {
    const { name, code, status } = req.query
    const { skip, take } = parsePage(req)
    const result = await roleService.page(
      { name: name as string, code: code as string, status: status !== undefined ? Number(status) : undefined },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/role/simple-list
router.get('/system/role/simple-list', async (req, res) => {
  try {
    const list = await roleService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/role/get?id=
router.get('/system/role/get', requirePermission('system:role:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const role = await roleService.get(id)
    if (!role) return fail(res, '角色不存在', 404)
    return ok(res, role)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/role/create
router.post('/system/role/create', requirePermission('system:role:create'), async (req, res) => {
  try {
    const role = await roleService.create(req.body)
    return ok(res, role.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/role/update
router.put('/system/role/update', requirePermission('system:role:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await roleService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/role/delete?id=
router.delete('/system/role/delete', requirePermission('system:role:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await roleService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/role/delete-list
router.delete('/system/role/delete-list', requirePermission('system:role:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await roleService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

export default router
