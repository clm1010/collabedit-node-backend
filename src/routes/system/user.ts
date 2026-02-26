import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { userService } from '../../services/system/user.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/user/page
router.get('/system/user/page', requirePermission('system:user:query'), async (req, res) => {
  try {
    const { username, nickname, mobile, status, deptId } = req.query
    const { skip, take } = parsePage(req)
    const result = await userService.page(
      {
        username: username as string,
        nickname: nickname as string,
        mobile: mobile as string,
        status: status !== undefined ? Number(status) : undefined,
        deptId: deptId !== undefined ? Number(deptId) : undefined
      },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/user/simple-list
router.get('/system/user/simple-list', async (req, res) => {
  try {
    const list = await userService.simpleList()
    return ok(res, list)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// GET /system/user/get?id=
router.get('/system/user/get', requirePermission('system:user:query'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    const user = await userService.get(id)
    if (!user) return fail(res, '用户不存在', 404)
    return ok(res, user)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/user/create
router.post('/system/user/create', requirePermission('system:user:create'), async (req, res) => {
  try {
    const user = await userService.create(req.body)
    return ok(res, user.id)
  } catch (e: any) {
    return fail(res, e.message || '创建失败')
  }
})

// PUT /system/user/update
router.put('/system/user/update', requirePermission('system:user:update'), async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return fail(res, '缺少 id 参数', 400)
    await userService.update(Number(id), data)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// DELETE /system/user/delete?id=
router.delete('/system/user/delete', requirePermission('system:user:delete'), async (req, res) => {
  try {
    const id = Number(req.query.id)
    if (!id) return fail(res, '缺少 id 参数', 400)
    await userService.remove(id)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// DELETE /system/user/delete-list
router.delete('/system/user/delete-list', requirePermission('system:user:delete'), async (req, res) => {
  try {
    const ids = req.body?.ids as number[]
    if (!ids || !ids.length) return fail(res, '缺少 ids 参数', 400)
    await userService.removeList(ids.map(Number))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '删除失败')
  }
})

// PUT /system/user/update-password（重置密码）
router.put('/system/user/update-password', requirePermission('system:user:update'), async (req, res) => {
  try {
    const { id, password } = req.body
    if (!id || !password) return fail(res, '缺少参数', 400)
    await userService.resetPassword(Number(id), password)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '操作失败')
  }
})

// PUT /system/user/update-status
router.put('/system/user/update-status', requirePermission('system:user:update'), async (req, res) => {
  try {
    const { id, status } = req.body
    if (id === undefined || status === undefined) return fail(res, '缺少参数', 400)
    await userService.updateStatus(Number(id), Number(status))
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '操作失败')
  }
})

// ===== 个人资料接口（不需要 system:user 权限，仅需要登录） =====

// GET /system/user/profile/get
router.get('/system/user/profile/get', async (req, res) => {
  try {
    if (!req.auth) return fail(res, '未认证', 401)
    const profile = await userService.getProfile(req.auth.userId)
    if (!profile) return fail(res, '用户不存在', 404)
    return ok(res, profile)
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// PUT /system/user/profile/update
router.put('/system/user/profile/update', async (req, res) => {
  try {
    if (!req.auth) return fail(res, '未认证', 401)
    await userService.updateProfile(req.auth.userId, req.body)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '更新失败')
  }
})

// PUT /system/user/profile/update-password
router.put('/system/user/profile/update-password', async (req, res) => {
  try {
    if (!req.auth) return fail(res, '未认证', 401)
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return fail(res, '缺少参数', 400)
    await userService.updatePassword(req.auth.userId, oldPassword, newPassword)
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '操作失败')
  }
})

export default router
