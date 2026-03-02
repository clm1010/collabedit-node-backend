import { Router } from 'express'
import { createHash } from 'crypto'
import multer from 'multer'
import { ok, fail } from '../utils/response.js'
import {
  deleteTemplates,
  getElements,
  getTemplatePage,
  publishTemplate,
  saveTemplate
} from '../services/template.service.js'
import { checkWritePermission } from '../services/permission.service.js'
import { prisma } from '../db/prisma.js'
import { uploadFile, getFileStream } from '../services/file.service.js'
import { prisma as db } from '../db/prisma.js'

// 模板模块路由。

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

const isDocStreamDebugEnabled = () =>
  process.env.DOC_STREAM_DEBUG === '1' ||
  process.env.DOC_STREAM_DEBUG === 'true' ||
  process.env.DOC_STREAM_DEBUG === 'yes'

// 分页查询模板记录。
router.post('/tbTemplate/getPageList', async (req, res) => {
  const data = await getTemplatePage(req.body ?? {})
  return ok(res, data)
})

// 新增模板。
router.post('/tbTemplate/savaTemplate', async (req, res) => {
  const payload = req.body ?? {}
  if (payload.temStatus) {
    payload.temStatus = payload.temStatus === '启用' ? '0' : payload.temStatus
  }
  const saved = await saveTemplate(payload)
  return ok(res, saved)
})

// 更新模板。
router.post('/tbTemplate/editData', async (req, res) => {
  const payload = req.body ?? {}
  const saved = await saveTemplate(payload)
  return ok(res, saved)
})

// 批量软删除模板记录。
router.post('/tbTemplate/delList', async (req, res) => {
  const ids = Array.isArray(req.body) ? req.body.map(String) : []
  await deleteTemplates(ids)
  return ok(res, true)
})

router.post('/tbTemplate/TemSubmit', async (_req, res) => {
  return fail(res, '路径有误', 404)
})

// 校验模板写作权限。
router.post('/tbTemplate/getPermissionCheck', async (req, res) => {
  const { id, userId } = req.body ?? {}
  if (!id || !userId) return fail(res, '缺少参数', 400)
  const result = await checkWritePermission(id, 'template', Number(userId))
  return ok(res, result)
})

// 下载模板文件流。
router.get('/tbTemplate/getFileStream', async (req, res) => {
  const id = String(req.query.id ?? '')
  if (!id) return fail(res, '缺少id', 400)
  let fileId = id
  const tpl = await prisma.template.findUnique({ where: { id } })
  if (tpl?.fileId) fileId = tpl.fileId
  const streamInfo = await getFileStream(fileId)
  if (!streamInfo) return fail(res, '文件不存在', 404)
  if (isDocStreamDebugEnabled()) {
    console.info('[doc-stream] template getFileStream', {
      templateId: id,
      fileId: streamInfo.file.id,
      objectKey: streamInfo.file.objectKey,
      mimeType: streamInfo.file.mimeType,
      size: streamInfo.file.size,
      etag: streamInfo.file.etag
    })
  }
  res.setHeader('Content-Type', streamInfo.file.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(streamInfo.file.originalName)}"`)
  if (isDocStreamDebugEnabled()) {
    let bytesSent = 0
    const hash = createHash('sha256')
    streamInfo.stream.on('data', (chunk: Buffer) => {
      bytesSent += chunk.length
      hash.update(chunk)
    })
    streamInfo.stream.on('end', () => {
      console.info('[doc-stream] template stream end', {
        templateId: id,
        fileId: streamInfo.file.id,
        bytesSent,
        sha256: hash.digest('hex')
      })
    })
    streamInfo.stream.on('error', (error: Error) => {
      console.warn('[doc-stream] template stream error', {
        templateId: id,
        fileId: streamInfo.file.id,
        message: error.message
      })
    })
    res.on('close', () => {
      console.info('[doc-stream] template response closed', {
        templateId: id,
        fileId: streamInfo.file.id,
        bytesSent
      })
    })
  }
  streamInfo.stream.pipe(res)
})

// 上传模板文件并绑定记录。
router.post('/tbTemplate/saveFile', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return fail(res, '缺少文件', 400)
  const id = req.body?.id
  let existingFileId: string | undefined
  if (id) {
    const tpl = await prisma.template.findUnique({ where: { id } })
    existingFileId = tpl?.fileId ?? undefined
  }
  const rawUserId = (req as any).auth?.userId
  const record = await uploadFile(file, rawUserId != null ? String(rawUserId) : undefined, existingFileId)
  if (id) {
    await prisma.template.update({
      where: { id },
      data: { fileId: record.id }
    })
  }
  return ok(res, { fileId: record.id })
})

// 获取模板自定义要素列表。
router.get('/tbTemplate/getElement', async (req, res) => {
  const id = String(req.query.id ?? '')
  if (!id) return fail(res, '缺少id', 400)
  const data = await getElements(id)
  return ok(res, data)
})

// 发布模板。
router.post('/tbTemplate/publishData', async (req, res) => {
  const { id, visibleScope } = req.body ?? {}
  if (!id) return fail(res, '缺少id', 400)
  const result = await publishTemplate({ id, visibleScope })
  return ok(res, result)
})

export default router
