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
  return res.json({ code, data: null, msg })
}
