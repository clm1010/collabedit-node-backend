import type { Request } from 'express'

/**
 * 从请求中解析芋道分页参数。
 * 前端发送: pageNo（从1开始）, pageSize
 * Prisma 需要: skip, take
 */
export function parsePage(req: Request) {
  const pageNo = Math.max(1, parseInt(String(req.query.pageNo ?? '1'), 10) || 1)
  const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize ?? '10'), 10) || 10))
  return {
    pageNo,
    pageSize,
    skip: (pageNo - 1) * pageSize,
    take: pageSize
  }
}

/**
 * 构造芋道分页返回结构
 */
export function pageResult<T>(list: T[], total: number) {
  return { list, total }
}
