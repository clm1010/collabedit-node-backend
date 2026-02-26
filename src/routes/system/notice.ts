import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { noticeService } from '../../services/system/notice.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/notice/page
router.get('/system/notice/page', requirePermission('system:notice:query'), async (req, res) => {
  try {
    const { title, type, status } = req.query
    const { skip, take } = parsePage(req)
    const result = await noticeService.page(
      { title: title as string, type: type !== undefined ? Number(type) : undefined, status: status !== undefined ? Number(status) : undefined },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/notice/get?id=
router.get('/system/notice/get', requirePermission('system:notice:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const notice = await noticeService.get(id)
    if (!notice) return fail(res, '公告不存在', 404)
    return ok(res, notice)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/notice/create
router.post('/system/notice/create', requirePermission('system:notice:create'), async (req, res) => {
  try {
    const notice = await noticeService.create(req.body)
    return ok(res, notice.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/notice/update
router.put('/system/notice/update', requirePermission('system:notice:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await noticeService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/notice/delete?id=
router.delete('/system/notice/delete', requirePermission('system:notice:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await noticeService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/notice/delete-list
router.delete('/system/notice/delete-list', requirePermission('system:notice:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await noticeService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// POST /system/notice/push?id=
router.post('/system/notice/push', requirePermission('system:notice:update'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await noticeService.push(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '推送失败')
  }
})

export default router
