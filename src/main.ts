import express, { Router } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import { authGuard } from './middleware/auth.js'
import { tenantGuard } from './middleware/tenant.js'
import { fail } from './utils/response.js'

// 认证路由
import authRoutes from './routes/auth.js'
// 业务路由
import trainingRoutes from './routes/training.js'
import templateRoutes from './routes/template.js'
import examRoutes from './routes/examRecord.js'
import dictRoutes from './routes/dict.js'
// 系统管理路由
import systemDeptRoutes from './routes/system/dept.js'
import systemRoleRoutes from './routes/system/role.js'
import systemMenuRoutes from './routes/system/menu.js'
import systemUserRoutes from './routes/system/user.js'
import systemPermissionRoutes from './routes/system/permission.js'
import systemDictRoutes from './routes/system/dict.js'
import systemPostRoutes from './routes/system/post.js'
import systemLogRoutes from './routes/system/log.js'
import systemNoticeRoutes from './routes/system/notice.js'

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))

// ===== 所有路由统一 /api 前缀（与 Java 后端对齐） =====
const apiRouter = Router()
// 认证路由（部分无需 authGuard，路由内部自行控制）
apiRouter.use(authRoutes)
// 以下路由全部需要认证
apiRouter.use(tenantGuard)
apiRouter.use(authGuard)
// 业务路由
apiRouter.use(trainingRoutes)
apiRouter.use(templateRoutes)
apiRouter.use(examRoutes)
apiRouter.use(dictRoutes)
// 系统管理路由（内部自行控制 requirePermission）
apiRouter.use(systemDeptRoutes)
apiRouter.use(systemRoleRoutes)
apiRouter.use(systemMenuRoutes)
apiRouter.use(systemUserRoutes)
apiRouter.use(systemPermissionRoutes)
apiRouter.use(systemDictRoutes)
apiRouter.use(systemPostRoutes)
apiRouter.use(systemLogRoutes)
apiRouter.use(systemNoticeRoutes)

app.use('/api', apiRouter)

// 404 兜底
app.use((req, res) => {
  return fail(res, `未找到接口: ${req.path}`, 404)
})

app.listen(env.port, () => {
  console.log(`[collabedit-node-backend] listening on ${env.port}`)
})
