import { Router } from 'express'
import multer from 'multer'
import { ok, fail } from '../utils/response.js'
import {
  deleteTraining,
  getExerciseData,
  getTrainingPage,
  publishTraining,
  saveTraining
} from '../services/training.service.js'
import { checkWritePermission } from '../services/permission.service.js'
import { prisma } from '../db/prisma.js'
import { uploadFile, getFileStream } from '../services/file.service.js'

// 演训模块路由。

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// 分页查询演训记录。
router.post('/getPlan/getPageList', async (req, res) => {
  const data = await getTrainingPage(req.body ?? {})
  return ok(res, data)
})

// 新增/更新演训记录。
router.post('/getPlan/saveData', async (req, res) => {
  const saved = await saveTraining(req.body ?? {})
  return ok(res, saved)
})

// 根据 ids 软删除演训记录。
router.post('/getPlan/delData', async (req, res) => {
  const ids = Array.isArray(req.body) ? req.body : []
  await deleteTraining(ids)
  return ok(res, true)
})

// 发布演训记录。
router.post('/getPlan/publishData', async (req, res) => {
  const { id, visibleScope } = req.body ?? {}
  if (!id) return fail(res, '缺少id', 400)
  const result = await publishTraining({ id, visibleScope })
  return ok(res, result)
})

// 校验写作权限。
router.post('/getPlan/getPermissionCheck', async (req, res) => {
  const { id, userId } = req.body ?? {}
  if (!id || !userId) return fail(res, '缺少参数', 400)
  const result = await checkWritePermission(id, 'training', userId)
  return ok(res, result)
})

// 获取参考素材列表。
router.post('/getPlan/getMaterial', async (req, res) => {
  const { id } = req.body ?? {}
  if (!id) return fail(res, '缺少id', 400)

  const materials = await prisma.trainingMaterial.findMany({
    where: { planId: String(id) },
    orderBy: { publishAt: 'desc' }
  })

  const mapped = materials.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.publishAt.toISOString(),
    author: item.author ?? '未知',
    content: item.content
  }))

  return ok(res, mapped)
})

// 下载演训文件流。
router.get('/getPlan/getFileStream', async (req, res) => {
  const id = String(req.query.id ?? '')
  if (!id) return fail(res, '缺少id', 400)

  const plan = await prisma.trainingPerformance.findUnique({ where: { id } })
  
  // 如果记录不存在或没有关联文件，返回空响应（新建的空文档）
  if (!plan?.fileId) {
    // 返回空内容，不报错（前端会识别为空文档）
    res.status(204).end()
    return
  }

  const streamInfo = await getFileStream(plan.fileId)
  if (!streamInfo) return fail(res, '文件不存在', 404)
  res.setHeader('Content-Type', streamInfo.file.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(streamInfo.file.originalName)}"`)
  streamInfo.stream.pipe(res)
})

// 上传演训文件并绑定记录。
router.post('/getPlan/saveFile', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return fail(res, '缺少文件', 400)
  const id = req.body?.id
  let existingFileId: string | undefined
  if (id) {
    const plan = await prisma.trainingPerformance.findUnique({ where: { id } })
    existingFileId = plan?.fileId ?? undefined
  }
  const record = await uploadFile(file, (req as any).auth?.userId, existingFileId)
  if (id) {
    await prisma.trainingPerformance.update({
      where: { id },
      data: { fileId: record.id }
    })
  }
  return ok(res, { fileId: record.id })
})

// 获取演训数据（用于选择）。
router.post('/getPlan/getExerciseData', async (req, res) => {
  const payload = req.body ?? {}
  const data = await getExerciseData(payload)
  return ok(res, data)
})

export default router
