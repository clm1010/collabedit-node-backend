import { prisma } from '../../db/prisma.js'

export interface UserQuery {
  username?: string
  nickname?: string
  mobile?: string
  status?: number
  deptId?: number
}

export const userService = {
  /** 分页查询用户 */
  async page(query: UserQuery, skip: number, take: number) {
    const where: Record<string, any> = {}
    if (query.username) where.username = { contains: query.username }
    if (query.nickname) where.nickname = { contains: query.nickname }
    if (query.mobile) where.mobile = { contains: query.mobile }
    if (query.status !== undefined) where.status = query.status
    if (query.deptId !== undefined) where.deptId = query.deptId
    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, username: true, nickname: true, email: true, mobile: true,
          sex: true, avatar: true, status: true, deptId: true, loginIp: true,
          loginDate: true, remark: true, createdAt: true, updatedAt: true,
          dept: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])
    return { list, total }
  },

  /** 精简列表 */
  async simpleList() {
    return prisma.user.findMany({
      where: { status: 0 },
      select: { id: true, username: true, nickname: true },
      orderBy: { createdAt: 'desc' }
    })
  },

  /** 获取单个用户（含角色、岗位） */
  async get(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, nickname: true, email: true, mobile: true,
        sex: true, avatar: true, status: true, deptId: true, remark: true,
        loginIp: true, loginDate: true, createdAt: true, updatedAt: true,
        dept: { select: { id: true, name: true } },
        userRoles: { select: { roleId: true } },
        userPosts: { select: { postId: true } }
      }
    })
    if (!user) return null
    return {
      ...user,
      roleIds: user.userRoles.map(ur => ur.roleId),
      postIds: user.userPosts.map(up => up.postId),
      userRoles: undefined,
      userPosts: undefined
    }
  },

  /** 创建用户 */
  async create(data: {
    username: string
    password: string
    nickname?: string
    email?: string
    mobile?: string
    sex?: number
    avatar?: string
    status?: number
    deptId?: number
    remark?: string
    roleIds?: number[]
    postIds?: number[]
  }) {
    const { roleIds, postIds, ...userData } = data
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: userData })
      if (roleIds && roleIds.length) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({ userId: user.id, roleId }))
        })
      }
      if (postIds && postIds.length) {
        await tx.userPost.createMany({
          data: postIds.map(postId => ({ userId: user.id, postId }))
        })
      }
      return user
    })
  },

  /** 更新用户 */
  async update(id: number, data: Partial<{
    username: string
    nickname: string
    email: string
    mobile: string
    sex: number
    avatar: string
    status: number
    deptId: number
    remark: string
    roleIds: number[]
    postIds: number[]
  }>) {
    const { roleIds, postIds, ...userData } = data
    return prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: userData })
      if (roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } })
        if (roleIds.length) {
          await tx.userRole.createMany({
            data: roleIds.map(roleId => ({ userId: id, roleId }))
          })
        }
      }
      if (postIds !== undefined) {
        await tx.userPost.deleteMany({ where: { userId: id } })
        if (postIds.length) {
          await tx.userPost.createMany({
            data: postIds.map(postId => ({ userId: id, postId }))
          })
        }
      }
    })
  },

  /** 删除用户 */
  async remove(id: number) {
    return prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userPost.deleteMany({ where: { userId: id } }),
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ])
  },

  /** 批量删除 */
  async removeList(ids: number[]) {
    return prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: { in: ids } } }),
      prisma.userPost.deleteMany({ where: { userId: { in: ids } } }),
      prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } })
    ])
  },

  /** 重置密码 */
  async resetPassword(id: number, password: string) {
    return prisma.user.update({ where: { id }, data: { password } })
  },

  /** 更新状态 */
  async updateStatus(id: number, status: number) {
    return prisma.user.update({ where: { id }, data: { status } })
  },

  /** 获取用户个人资料 */
  async getProfile(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, nickname: true, email: true, mobile: true,
        sex: true, avatar: true, deptId: true, remark: true,
        createdAt: true, updatedAt: true,
        dept: { select: { id: true, name: true } },
        userRoles: { include: { role: { select: { id: true, name: true } } } },
        userPosts: { include: { post: { select: { id: true, name: true } } } }
      }
    })
  },

  /** 更新个人资料 */
  async updateProfile(id: number, data: Partial<{
    nickname: string
    email: string
    mobile: string
    sex: number
    avatar: string
  }>) {
    return prisma.user.update({ where: { id }, data })
  },

  /** 修改密码 */
  async updatePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: { password: true } })
    if (!user || user.password !== oldPassword) {
      throw new Error('原密码不正确')
    }
    return prisma.user.update({ where: { id }, data: { password: newPassword } })
  }
}
