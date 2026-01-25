import { Router } from 'express'
import { ok, fail } from '../utils/response.js'
import { applyExam, listExamRecords, submitExam } from '../services/exam.service.js'

// 审核记录路由。

const router = Router()

// 提交演训审核。
router.post('/examRecord/submitReview', async (req, res) => {
  const { id, comment, flowId } = req.body ?? {}
  if (!id) return fail(res, '缺少id', 400)
  const record = await submitExam({ applyId: id, applyType: 'training', comment, flowId })
  return ok(res, record)
})

// 提交模板审核。
router.post('/examRecord/TemSubmit', async (req, res) => {
  const { id, comment, flowId } = req.body ?? {}
  if (!id) return fail(res, '缺少id', 400)
  const record = await submitExam({ applyId: id, applyType: 'template', comment, flowId })
  return ok(res, record)
})

// 演训审核通过/驳回。
router.post('/examRecord/examApply', async (req, res) => {
  const { applyId, examResult, examOpinion, examUserId } = req.body ?? {}
  if (!applyId) return fail(res, '缺少applyId', 400)
  const record = await applyExam({
    applyId,
    applyType: 'training',
    examResult: Number(examResult ?? 0),
    examOpinion,
    examUserId
  })
  return ok(res, record)
})

// 模板审核通过/驳回。
router.post('/examRecord/examTem', async (req, res) => {
  const { applyId, examResult, examOpinion, examUserId } = req.body ?? {}
  if (!applyId) return fail(res, '缺少applyId', 400)
  const record = await applyExam({
    applyId,
    applyType: 'template',
    examResult: Number(examResult ?? 0),
    examOpinion,
    examUserId
  })
  return ok(res, record)
})

// 获取文档审核记录列表。
router.get('/examRecord/getOpinion', async (req, res) => {
  const id = String(req.query.id ?? '')
  if (!id) return fail(res, '缺少id', 400)
  const data = await listExamRecords(id)
  const mapped = data.map((item) => ({
    id: item.id,
    applyId: item.applyId,
    examNode: item.examNode ?? '',
    examResult: item.examResult != null ? String(item.examResult) : '',
    examOpinion: item.examOpinion ?? '',
    examOffice: item.examOffice ?? '',
    examUserId: item.examUserId ?? '',
    nextUserId: item.nextUserId ?? '',
    examOfficeName: item.examOfficeName ?? '',
    createTime: item.createdAt.toISOString()
  }))
  return ok(res, mapped)
})

export default router
