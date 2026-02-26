import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { menuService } from '../../services/system/menu.service.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/menu/list
router.get('/system/menu/list', requirePermission('system:menu:query'), async (req, res) => {
  try {
    const { name, status } = req.query
    const list = await menuService.list({
      name: name as string | undefined,
      status: status !== undefined ? Number(status) : undefined
    })
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/menu/simple-list
router.get('/system/menu/simple-list', async (req, res) => {
  try {
    const list = await menuService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/menu/get?id=
router.get('/system/menu/get', requirePermission('system:menu:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const menu = await menuService.get(id)
    if (!menu) return fail(res, '菜单不存在', 404)
    return ok(res, menu)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/menu/create
router.post('/system/menu/create', requirePermission('system:menu:create'), async (req, res) => {
  try {
    const menu = await menuService.create(req.body)
    return ok(res, menu.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/menu/update
router.put('/system/menu/update', requirePermission('system:menu:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await menuService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/menu/delete?id=
router.delete('/system/menu/delete', requirePermission('system:menu:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await menuService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

export default router
