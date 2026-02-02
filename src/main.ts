import express from 'express'
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

// 【已删除】T-User 响应头配置，改为使用 /api/user/info 接口
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(authRoutes)

app.use(tenantGuard)
app.use(authGuard)

app.use(trainingRoutes)
app.use(templateRoutes)
app.use(examRoutes)
app.use(dictRoutes)

app.use((req, res) => {
  return fail(res, `未找到接口: ${req.path}`, 404)
})

app.listen(env.port, () => {
  console.log(`[collabedit-node-backend] listening on ${env.port}`)
})
