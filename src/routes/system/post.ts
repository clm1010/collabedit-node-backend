import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { postService } from '../../services/system/post.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/post/page
router.get('/system/post/page', requirePermission('system:post:query'), async (req, res) => {
  try {
    const { name, code, status } = req.query
    const { skip, take } = parsePage(req)
    const result = await postService.page(
      { name: name as string, code: code as string, status: status !== undefined ? Number(status) : undefined },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/post/simple-list
router.get('/system/post/simple-list', async (req, res) => {
  try {
    const list = await postService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/post/get?id=
router.get('/system/post/get', requirePermission('system:post:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const post = await postService.get(id)
    if (!post) return fail(res, '岗位不存在', 404)
    return ok(res, post)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/post/create
router.post('/system/post/create', requirePermission('system:post:create'), async (req, res) => {
  try {
    const post = await postService.create(req.body)
    return ok(res, post.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/post/update
router.put('/system/post/update', requirePermission('system:post:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await postService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/post/delete?id=
router.delete('/system/post/delete', requirePermission('system:post:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await postService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/post/delete-list
router.delete('/system/post/delete-list', requirePermission('system:post:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await postService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

export default router
