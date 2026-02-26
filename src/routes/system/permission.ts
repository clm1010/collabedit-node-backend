import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { prisma } from '../../db/prisma.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// GET /system/permission/list-role-menus?roleId=
router.get('/system/permission/list-role-menus', requirePermission('system:permission:assign-role-menu'), async (req, res) => {
  try {
    const roleId = Number(req.query.roleId)
    if (!roleId) return fail(res, '缺少 roleId 参数', 400)
    const list = await prisma.roleMenu.findMany({
      where: { roleId },
      select: { menuId: true }
    })
    return ok(res, list.map(rm => rm.menuId))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/permission/assign-role-menu
router.post('/system/permission/assign-role-menu', requirePermission('system:permission:assign-role-menu'), async (req, res) => {
  try {
    const { roleId, menuIds } = req.body as { roleId: number; menuIds: number[] }
    if (!roleId || !menuIds) return fail(res, '缺少参数', 400)
    await prisma.$transaction([
      prisma.roleMenu.deleteMany({ where: { roleId } }),
      prisma.roleMenu.createMany({
        data: menuIds.map(menuId => ({ roleId, menuId }))
      })
    ])
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '分配失败')
  }
})

// POST /system/permission/assign-role-data-scope
router.post('/system/permission/assign-role-data-scope', requirePermission('system:permission:assign-role-data-scope'), async (req, res) => {
  try {
    const { roleId, dataScope, dataScopeDeptIds } = req.body
    if (!roleId || dataScope === undefined) return fail(res, '缺少参数', 400)
    await prisma.role.update({
      where: { id: Number(roleId) },
      data: {
        dataScope: Number(dataScope),
        dataScopeDeptIds: dataScopeDeptIds ? JSON.stringify(dataScopeDeptIds) : null
      }
    })
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '分配失败')
  }
})

// GET /system/permission/list-user-roles?userId=
router.get('/system/permission/list-user-roles', requirePermission('system:permission:assign-user-role'), async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    if (!userId) return fail(res, '缺少 userId 参数', 400)
    const list = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true }
    })
    return ok(res, list.map(ur => ur.roleId))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// POST /system/permission/assign-user-role
router.post('/system/permission/assign-user-role', requirePermission('system:permission:assign-user-role'), async (req, res) => {
  try {
    const { userId, roleIds } = req.body as { userId: number; roleIds: number[] }
    if (!userId || !roleIds) return fail(res, '缺少参数', 400)
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId }))
      })
    ])
    return ok(res, true)
  } catch (e: any) {
    return fail(res, e.message || '分配失败')
  }
})

export default router
