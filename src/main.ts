import express, { Router } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import { authGuard } from './middleware/auth.js'
import { tenantGuard } from './middleware/tenant.js'
import authRoutes from './routes/auth.js'
import trainingRoutes from './routes/training.js'
import templateRoutes from './routes/template.js'
import examRoutes from './routes/examRecord.js'
import dictRoutes from './routes/dict.js'
import { fail } from './utils/response.js'

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
apiRouter.use(trainingRoutes)
apiRouter.use(templateRoutes)
apiRouter.use(examRoutes)
apiRouter.use(dictRoutes)
app.use('/api', apiRouter)

// 404 兜底
app.use((req, res) => {
  return fail(res, `未找到接口: ${req.path}`, 404)
})

app.listen(env.port, () => {
  console.log(`[collabedit-node-backend] listening on ${env.port}`)
})
