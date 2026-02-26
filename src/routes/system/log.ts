import { Router } from 'express'
import { ok, fail } from '../../utils/response.js'
import { operateLogService, loginLogService } from '../../services/system/log.service.js'
import { parsePage, pageResult } from '../../utils/pagination.js'
import { requirePermission } from '../../middleware/auth.js'

const router = Router()

// ===== 操作日志 =====

// GET /system/operate-log/page
router.get('/system/operate-log/page', requirePermission('system:operate-log:query'), async (req, res) => {
  try {
    const { userId, type } = req.query
    const { skip, take } = parsePage(req)
    const result = await operateLogService.page(
      { userId: userId ? Number(userId) : undefined, type: type as string },
      skip, take
    )
    return ok(res, pageResult(result.list, result.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

// ===== 登录日志 =====

// GET /system/login-log/page
router.get('/system/login-log/page', requirePermission('system:login-log:query'), async (req, res) => {
  try {
    const { username, result, userIp } = req.query
    const { skip, take } = parsePage(req)
    const data = await loginLogService.page(
      { username: username as string, result: result !== undefined ? Number(result) : undefined, userIp: userIp as string },
      skip, take
    )
    return ok(res, pageResult(data.list, data.total))
  } catch (e: any) {
    return fail(res, e.message || '查询失败')
  }
})

export default router
