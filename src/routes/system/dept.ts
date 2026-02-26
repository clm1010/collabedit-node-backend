import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { deptService } from '../../services/system/dept.service.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/dept/list
router.get('/system/dept/list', requirePermission('system:dept:query'), async (req, res) => {
  try {
    const { name, status } = req.query
    const list = await deptService.list({
      name: name as string | undefined,
      status: status !== undefined ? Number(status) : undefined
    })
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dept/simple-list
router.get('/system/dept/simple-list', async (req, res) => {
  try {
    const list = await deptService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/dept/get?id=
router.get('/system/dept/get', requirePermission('system:dept:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const dept = await deptService.get(id)
    if (!dept) return fail(res, '部门不存在', 404)
    return ok(res, dept)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/dept/create
router.post('/system/dept/create', requirePermission('system:dept:create'), async (req, res) => {
  try {
    const dept = await deptService.create(req.body)
    return ok(res, dept.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/dept/update
router.put('/system/dept/update', requirePermission('system:dept:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await deptService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/dept/delete?id=
router.delete('/system/dept/delete', requirePermission('system:dept:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await deptService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/dept/delete-list
router.delete('/system/dept/delete-list', requirePermission('system:dept:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await deptService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

export default router
