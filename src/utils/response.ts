import type { Response } from 'express'

export type ApiResponse<T> = {
  code: number
  data: T
  message: string
}

export const ok = <T>(res: Response, data: T, message = 'success') => {
  const payload: ApiResponse<T> = { code: 200, data, message }
  return res.json(payload)
}

export const fail = (res: Response, message = 'error', code = 500) => {
  if (code === 401 || code === 403) {
    res.status(code)
  }
  return res.json({ code, data: null, message })
}
