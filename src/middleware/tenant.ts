import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export const tenantGuard = (req: Request, _res: Response, next: NextFunction) => {
  if (env.tenantEnable) {
    const tenantId = req.headers['tenant-id'] as string | undefined
    const visitTenantId = req.headers['visit-tenant-id'] as string | undefined
    req.headers['tenant-id'] = tenantId ?? visitTenantId ?? ''
  }
  next()
}
