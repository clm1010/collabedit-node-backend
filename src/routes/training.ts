import { Router } from 'express'
import { createHash } from 'crypto'
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

const isDocStreamDebugEnabled = () =>
  process.env.DOC_STREAM_DEBUG === '1' ||
  process.env.DOC_STREAM_DEBUG === 'true' ||
  process.env.DOC_STREAM_DEBUG === 'yes'

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
  const bodyUserId = Number(userId)
  const authUserId = Number((req as any).auth?.userId)
  const parsedUserId = Number.isFinite(bodyUserId) ? bodyUserId : authUserId
  if (!id || !Number.isFinite(parsedUserId)) return fail(res, '缺少参数', 400)
  const result = await checkWritePermission(String(id), 'training', parsedUserId)
  return ok(res, result)
})

// 下载演训文件流（支持 JSON 新格式和 DOCX 旧格式）。
router.get('/getPlan/getFileStream', async (req, res) => {
  const id = String(req.query.id ?? '')
  if (!id) return fail(res, '缺少id', 400)

  const plan = await prisma.trainingPerformance.findUnique({ where: { id } })

  // prefer=content 时优先返回 JSON 格式的内容文件
  const preferContent = req.query.prefer === 'content'

  // 优先尝试 contentFileId（新格式 JSON）
  if (preferContent && plan?.contentFileId) {
    const streamInfo = await getFileStream(plan.contentFileId)
    if (streamInfo) {
      if (isDocStreamDebugEnabled()) {
        console.info('[doc-stream] training getFileStream (content JSON)', {
          planId: id,
          fileId: streamInfo.file.id,
          objectKey: streamInfo.file.objectKey,
          mimeType: streamInfo.file.mimeType,
          size: streamInfo.file.size,
        })
      }
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(streamInfo.file.originalName)}"`)
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      streamInfo.stream.pipe(res)
      return
    }
  }

  // 降级到 fileId（旧格式 DOCX）
  if (!plan?.fileId) {
    res.status(204).end()
    return
  }

  const streamInfo = await getFileStream(plan.fileId)
  if (!streamInfo) return fail(res, '文件不存在', 404)
  if (isDocStreamDebugEnabled()) {
    console.info('[doc-stream] training getFileStream', {
      planId: id,
      fileId: streamInfo.file.id,
      objectKey: streamInfo.file.objectKey,
      mimeType: streamInfo.file.mimeType,
      size: streamInfo.file.size,
      etag: streamInfo.file.etag
    })
  }
  res.setHeader('Content-Type', streamInfo.file.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(streamInfo.file.originalName)}"`)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  if (isDocStreamDebugEnabled()) {
    let bytesSent = 0
    const hash = createHash('sha256')
    streamInfo.stream.on('data', (chunk: Buffer) => {
      bytesSent += chunk.length
      hash.update(chunk)
    })
    streamInfo.stream.on('end', () => {
      console.info('[doc-stream] training stream end', {
        planId: id,
        fileId: streamInfo.file.id,
        bytesSent,
        sha256: hash.digest('hex')
      })
    })
    streamInfo.stream.on('error', (error: Error) => {
      console.warn('[doc-stream] training stream error', {
        planId: id,
        fileId: streamInfo.file.id,
        message: error.message
      })
    })
    res.on('close', () => {
      console.info('[doc-stream] training response closed', {
        planId: id,
        fileId: streamInfo.file.id,
        bytesSent
      })
    })
  }
  streamInfo.stream.pipe(res)
})

// 上传演训文件并绑定记录。
router.post('/getPlan/saveFile', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return fail(res, '缺少文件', 400)
  const id = req.body?.id
  const fileType = req.body?.fileType
  const saveAs = req.body?.saveAs // 'content' 表示存为 contentFileId（JSON 日常保存）

  let existingFileId: string | undefined
  if (id) {
    const plan = await prisma.trainingPerformance.findUnique({ where: { id } })
    if (saveAs === 'content') {
      existingFileId = plan?.contentFileId ?? undefined
    } else {
      existingFileId = plan?.fileId ?? undefined
    }
  }
  const rawUserId = (req as any).auth?.userId
  const record = await uploadFile(file, rawUserId != null ? String(rawUserId) : undefined, existingFileId)
  if (id) {
    if (saveAs === 'content') {
      await prisma.trainingPerformance.update({
        where: { id },
        data: { contentFileId: record.id, ...(fileType ? { fileType } : {}) }
      })
    } else {
      await prisma.trainingPerformance.update({
        where: { id },
        data: { fileId: record.id, ...(fileType ? { fileType } : {}) }
      })
    }
  }
  return ok(res, { fileId: record.id })
})

// 获取演训数据（用于选择）。
router.post('/getPlan/getExerciseData', async (req, res) => {
  const payload = req.body ?? {}
  const data = await getExerciseData(payload)
  return ok(res, data)
})

// 保存原始 DOCX 文件（导入时保留原件用于高保真导出）。
router.post('/getPlan/saveOriginalFile', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return fail(res, '缺少文件', 400)
    const id = req.body?.id
    if (!id) return fail(res, '缺少文档id', 400)

    const plan = await prisma.trainingPerformance.findUnique({ where: { id } })
    if (!plan) return fail(res, '文档不存在', 404)

    const rawUserId = (req as any).auth?.userId
    const record = await uploadFile(file, rawUserId != null ? String(rawUserId) : undefined, plan.originalFileId ?? undefined)

    await prisma.trainingPerformance.update({
      where: { id },
      data: { originalFileId: record.id }
    })

    return ok(res, { fileId: record.id })
  } catch (err: any) {
    return fail(res, err.message || '保存原始文件失败')
  }
})

// 仅检查是否存在原始 DOCX，供前端在首屏补传 originalFile 前做判断。
// 与 getOriginalFile 分离，避免"判断存在性"却整体下载大文件。
router.get('/getPlan/hasOriginalFile', async (req, res) => {
  try {
    const id = String(req.query.id ?? '')
    if (!id) return fail(res, '缺少id', 400)
    const plan = await prisma.trainingPerformance.findUnique({
      where: { id },
      select: { originalFileId: true }
    })
    if (!plan) return fail(res, '文档不存在', 404)
    return ok(res, { hasOriginalFile: !!plan.originalFileId })
  } catch (err: any) {
    return fail(res, err.message || '查询原始文件状态失败')
  }
})

// 获取原始 DOCX 文件流。
router.get('/getPlan/getOriginalFile', async (req, res) => {
  try {
    const id = String(req.query.id ?? '')
    if (!id) return fail(res, '缺少id', 400)

    const plan = await prisma.trainingPerformance.findUnique({ where: { id } })
    if (!plan?.originalFileId) {
      res.status(204).end()
      return
    }

    const streamInfo = await getFileStream(plan.originalFileId)
    if (!streamInfo) return fail(res, '原始文件不存在', 404)

    res.setHeader('Content-Type', streamInfo.file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(streamInfo.file.originalName)}"`)
    streamInfo.stream.pipe(res)
  } catch (err: any) {
    return fail(res, err.message || '获取原始文件失败')
  }
})

// 保存/更新文档元数据。
router.post('/getPlan/saveDocMeta', async (req, res) => {
  try {
    const { documentId, metadata } = req.body ?? {}
    if (!documentId || !metadata) return fail(res, '缺少 documentId 或 metadata', 400)

    const record = await prisma.documentMetadata.upsert({
      where: { documentId },
      create: {
        documentId,
        paperWidth: metadata.paperSize?.width,
        paperHeight: metadata.paperSize?.height,
        marginTop: metadata.margins?.top,
        marginBottom: metadata.margins?.bottom,
        marginLeft: metadata.margins?.left,
        marginRight: metadata.margins?.right,
        defaultFont: metadata.defaultFont,
        defaultFontSize: metadata.defaultFontSize,
        headersJson: metadata.headers ? JSON.stringify(metadata.headers) : undefined,
        footersJson: metadata.footers ? JSON.stringify(metadata.footers) : undefined,
        sectionsJson: metadata.sections ? JSON.stringify(metadata.sections) : undefined,
        numberingJson: metadata.numberingDefinitions ? JSON.stringify(metadata.numberingDefinitions) : undefined,
        stylesJson: metadata.customStyles ? JSON.stringify(metadata.customStyles) : undefined,
        isRedHead: metadata.isRedHead ?? undefined,
        hasFootnotes: metadata.hasFootnotes ?? undefined,
        hasEndnotes: metadata.hasEndnotes ?? undefined,
      },
      update: {
        paperWidth: metadata.paperSize?.width,
        paperHeight: metadata.paperSize?.height,
        marginTop: metadata.margins?.top,
        marginBottom: metadata.margins?.bottom,
        marginLeft: metadata.margins?.left,
        marginRight: metadata.margins?.right,
        defaultFont: metadata.defaultFont,
        defaultFontSize: metadata.defaultFontSize,
        headersJson: metadata.headers ? JSON.stringify(metadata.headers) : undefined,
        footersJson: metadata.footers ? JSON.stringify(metadata.footers) : undefined,
        sectionsJson: metadata.sections ? JSON.stringify(metadata.sections) : undefined,
        numberingJson: metadata.numberingDefinitions ? JSON.stringify(metadata.numberingDefinitions) : undefined,
        stylesJson: metadata.customStyles ? JSON.stringify(metadata.customStyles) : undefined,
        isRedHead: metadata.isRedHead ?? undefined,
        hasFootnotes: metadata.hasFootnotes ?? undefined,
        hasEndnotes: metadata.hasEndnotes ?? undefined,
      },
    })

    await prisma.trainingPerformance.update({
      where: { id: documentId },
      data: { docMetadataId: record.id }
    }).catch(() => {
      // documentId 可能不在 trainingPerformance 表中（如模板），忽略
    })

    return ok(res, { id: record.id })
  } catch (err: any) {
    return fail(res, err.message || '保存元数据失败')
  }
})

// 获取文档元数据。
router.get('/getPlan/getDocMeta', async (req, res) => {
  try {
    const documentId = String(req.query.documentId ?? '')
    if (!documentId) return fail(res, '缺少 documentId', 400)

    const record = await prisma.documentMetadata.findUnique({ where: { documentId } })
    if (!record) {
      res.status(204).end()
      return
    }

    const metadata = {
      paperSize: record.paperWidth != null ? { width: record.paperWidth, height: record.paperHeight } : undefined,
      margins: record.marginTop != null ? {
        top: record.marginTop, bottom: record.marginBottom,
        left: record.marginLeft, right: record.marginRight
      } : undefined,
      defaultFont: record.defaultFont,
      defaultFontSize: record.defaultFontSize,
      headers: record.headersJson ? JSON.parse(record.headersJson) : undefined,
      footers: record.footersJson ? JSON.parse(record.footersJson) : undefined,
      sections: record.sectionsJson ? JSON.parse(record.sectionsJson) : undefined,
      numberingDefinitions: record.numberingJson ? JSON.parse(record.numberingJson) : undefined,
      customStyles: record.stylesJson ? JSON.parse(record.stylesJson) : undefined,
      isRedHead: record.isRedHead ?? undefined,
      hasFootnotes: record.hasFootnotes ?? undefined,
      hasEndnotes: record.hasEndnotes ?? undefined,
    }

    return ok(res, metadata)
  } catch (err: any) {
    return fail(res, err.message || '获取元数据失败')
  }
})

export default router
