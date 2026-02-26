import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { prisma } from '../db/prisma.js'
import { issueTokens, rotateRefreshToken } from '../services/auth.service.js'
import { authGuard } from '../middleware/auth.js'

// 认证相关路由（本地登录、刷新、用户信息）。
// 当前：无 /api 前缀，由前端代理层 strip /api/ 后转发到这些裸路径
// 备用：如果启用 main.ts 中的 apiRouter，则所有路由自动加上 /api 前缀

const router = Router()

// ===== 辅助：构建菜单树 =====
interface MenuTreeNode {
  id: number
  parentId: number
  name: string
  path: string | null
  component: string | null
  componentName: string | null
  icon: string | null
  sort: number
  visible: boolean
  keepAlive: boolean
  alwaysShow: boolean
  children?: MenuTreeNode[]
}

function buildMenuTree(menus: MenuTreeNode[], parentId = 0): MenuTreeNode[] {
  const result: MenuTreeNode[] = []
  for (const menu of menus) {
    if (menu.parentId === parentId) {
      const children = buildMenuTree(menus, menu.id)
      const node: MenuTreeNode = { ...menu }
      if (children.length > 0) {
        node.children = children
      }
      result.push(node)
    }
  }
  return result.sort((a, b) => a.sort - b.sort)
}

// 简单用户名密码登录（仅本地开发）。
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    if (!username || !password) {
      return fail(res, '缺少用户名或密码', 400)
    }
    const tenantId = req.headers['tenant-id']
      ? parseInt(req.headers['tenant-id'] as string, 10) || undefined
      : undefined
    let user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          password,
          tenantId
        }
      })
    }
    if (user.password !== password) {
      return fail(res, '用户名或密码错误', 401)
    }
    // 检查账号状态（对齐芋道：0=正常，非0=禁用）
    if (user.status !== 0) {
      return fail(res, '账号已被禁用', 403)
    }
    const tokens = await issueTokens(user.id, user.username, user.tenantId ?? tenantId)
    return ok(res, tokens)
  } catch (e: any) {
    console.error('[auth] login error:', e)
    return fail(res, e.message || '登录失败', 500)
  }
})

// 使用 refresh token 刷新访问令牌。
router.post('/system/auth/refresh-token', async (req, res) => {
  const refreshToken = String(req.query.refreshToken ?? '')
  if (!refreshToken) {
    return fail(res, '缺少刷新令牌', 400)
  }
  const tokens = await rotateRefreshToken(refreshToken)
  if (!tokens) {
    return fail(res, '无效的刷新令牌', 401)
  }
  return ok(res, tokens)
})

// ===== Phase 4：完整 get-permission-info =====
// 从数据库查询真实角色、权限、菜单数据返回
// 返回结构完全对齐芋道 Java 后端的 get-permission-info
router.get('/system/auth/get-permission-info', authGuard, async (req, res) => {
  try {
    if (!req.auth) {
      return fail(res, '未认证：缺少用户身份信息', 401)
    }
    const { userId } = req.auth

    // 1. 查用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, nickname: true, email: true, avatar: true, deptId: true }
    })
    if (!user) {
      return fail(res, '用户不存在', 403)
    }

    // 2. 查用户角色（含角色详情）
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    })
    const activeRoles = userRoles.filter(ur => ur.role.status === 0)
    const roleCodes = activeRoles.map(ur => ur.role.code) // 如 ['super_admin', 'common']
    const isSuperAdmin = roleCodes.includes('super_admin')

    // 3. 查权限标识
    let permissions: string[] = []
    if (isSuperAdmin) {
      permissions = ['*:*:*'] // 超级管理员拥有全部权限
    } else {
      const roleIds = activeRoles.map(ur => ur.role.id)
      const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId: { in: roleIds } },
        include: { menu: { select: { permission: true, type: true, status: true } } }
      })
      const permSet = new Set<string>()
      for (const rm of roleMenus) {
        if (rm.menu.status === 0 && rm.menu.permission) {
          permSet.add(rm.menu.permission)
        }
      }
      permissions = Array.from(permSet)
    }

    // 4. 查菜单树（type=1 目录, type=2 菜单；不含 type=3 按钮）
    let menuList: {
      id: number
      parentId: number
      name: string
      path: string | null
      component: string | null
      componentName: string | null
      icon: string | null
      sort: number
      visible: boolean
      keepAlive: boolean
      alwaysShow: boolean
    }[]

    if (isSuperAdmin) {
      // 超级管理员：查所有已启用的目录和菜单
      menuList = await prisma.menu.findMany({
        where: { type: { in: [1, 2] }, status: 0 },
        select: { id: true, parentId: true, name: true, path: true, component: true, componentName: true, icon: true, sort: true, visible: true, keepAlive: true, alwaysShow: true },
        orderBy: { sort: 'asc' }
      })
    } else {
      // 普通用户：只查角色关联的目录和菜单
      const roleIds = activeRoles.map(ur => ur.role.id)
      const roleMenuRecords = await prisma.roleMenu.findMany({
        where: { roleId: { in: roleIds } },
        include: {
          menu: {
            select: { id: true, parentId: true, name: true, path: true, component: true, componentName: true, icon: true, sort: true, type: true, status: true, visible: true, keepAlive: true, alwaysShow: true }
          }
        }
      })
      // 去重 + 过滤 type=3 按钮和已禁用
      const menuMap = new Map<number, typeof roleMenuRecords[0]['menu']>()
      for (const rm of roleMenuRecords) {
        if (rm.menu.status === 0 && rm.menu.type !== 3) {
          menuMap.set(rm.menu.id, rm.menu)
        }
      }
      menuList = Array.from(menuMap.values()).map(m => ({
        id: m.id,
        parentId: m.parentId,
        name: m.name,
        path: m.path,
        component: m.component,
        componentName: m.componentName,
        icon: m.icon,
        sort: m.sort,
        visible: m.visible,
        keepAlive: m.keepAlive,
        alwaysShow: m.alwaysShow
      }))
    }

    const menuTree = buildMenuTree(menuList as MenuTreeNode[])

    // 5. 构造 rolesVoList（角色详情列表，对齐 Java 后端）
    const rolesVoList = activeRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      sort: ur.role.sort,
      status: ur.role.status,
      type: ur.role.type,
      dataScope: ur.role.dataScope,
      remark: ur.role.remark || ''
    }))

    return ok(res, {
      user: {
        id: user.id,
        deptId: user.deptId || null,
        nickname: user.nickname || user.username,
        username: user.username,
        email: user.email || '',
        avatar: user.avatar || ''
      },
      roles: roleCodes,           // ['super_admin', 'common']
      rolesVoList,                // 角色详情数组
      permissions,                // ['*:*:*'] 或具体权限数组
      menus: menuTree             // 菜单树（前端 generateRoute 使用）
    })
  } catch (e) {
    console.error('[auth] get-permission-info error:', e)
    return fail(res, '获取用户信息失败', 500)
  }
})

// 旧接口保留作为向后兼容
router.get('/user/info', authGuard, async (req, res) => {
  if (!req.auth) {
    return fail(res, '未认证：缺少用户身份信息', 401)
  }
  const { userId, username } = req.auth
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, nickname: true }
  })
  return ok(res, {
    userId: userId,
    username: user?.username || username,
    nickname: user?.nickname || user?.username || username,
    level: '普通用户',
    permissions: ['read', 'write']
  })
})

// ===== 模拟 Java 接口（本地测试用） =====

// 模拟 Java 刷新 Token 接口（Java 后端只接受 GET）
router.get('/sjrh/permission/refreshToken', async (req, res) => {
  const refreshToken = String(req.query.refreshToken ?? '')
  if (!refreshToken) {
    return fail(res, '缺少刷新令牌', 400)
  }
  const tokens = await rotateRefreshToken(refreshToken)
  if (!tokens) {
    return fail(res, '无效的刷新令牌', 401)
  }
  return ok(res, tokens)
})

// 模拟 Java 获取权限接口
router.get('/sjrh/permission/getPermission', authGuard, async (req, res) => {
  try {
    if (!req.auth) {
      return fail(res, '未认证：缺少用户身份信息', 401)
    }
    const { userId, username } = req.auth
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, nickname: true, email: true, avatar: true, deptId: true }
    })
    // Java 模拟接口返回简化格式（menus 为字符串数组，不做路由生成）
    return ok(res, {
      user: {
        id: userId,
        deptId: user?.deptId || null,
        nickname: user?.nickname || user?.username || username,
        username: user?.username || username,
        email: user?.email || '',
        avatar: user?.avatar || ''
      },
      roles: ['common'],
      permissions: ['read', 'write'],
      buttons: [],
      menus: []
    })
  } catch (e) {
    console.error('[auth] sjrh/permission/getPermission error:', e)
    return fail(res, '获取用户信息失败', 500)
  }
})

export default router
