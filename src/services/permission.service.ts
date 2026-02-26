import { prisma } from '../db/prisma.js'

// 写作权限校验相关。

// 返回用户写作权限与范围。
export const checkWritePermission = async (bizId: string, bizType: 'training' | 'template', userId: number) => {
  const record = await prisma.permission.findFirst({
    where: { bizId, bizType, userId }
  })
  if (!record) {
    return { canWrite: true, scope: 'all' }
  }
  return { canWrite: record.canWrite, scope: 'limited' }
}
