import type { Response } from 'express'

export type ApiResponse<T> = {
  code: number
  data: T
  msg: string
}

export const ok = <T>(res: Response, data: T, msg = 'success') => {
  const payload: ApiResponse<T> = { code: 0, data, msg }
  return res.json(payload)
}

export const fail = (res: Response, msg = 'error', code = 500) => {
  // 认证/授权错误同时设置 HTTP 状态码，与 Java 后端行为对齐
  if (code === 401 || code === 403) {
    res.status(code)
  }
  return res.json({ code, data: null, msg })
}
