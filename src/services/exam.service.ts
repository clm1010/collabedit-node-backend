import { prisma } from '../db/prisma.js'

// 审核记录相关工具。

// 创建提交审核记录，并更新业务状态。
export const submitExam = async (payload: {
  applyId: string
  applyType: 'training' | 'template'
  comment?: string
  flowId?: string
  auditors?: Record<string, string[]>
}) => {
  const { applyId, applyType, comment, flowId, auditors } = payload
  return prisma.$transaction(async (tx) => {
    const record = await tx.examRecord.create({
      data: {
        applyId,
        applyType,
        examResult: 0,
        examOpinion: comment ?? '',
        examNode: 'submit',
        auditors: auditors ?? undefined
      }
    })

    if (applyType === 'training') {
      await tx.trainingPerformance.update({
        where: { id: applyId },
        data: {
          applyNode: '2', // 审核中
          flowId: flowId ?? undefined,
          flowNode: 'submit'
        }
      })
    }

    if (applyType === 'template') {
      await tx.template.update({
        where: { id: applyId },
        data: {
          applyNode: '2', // 审核中
          flowId: flowId ?? undefined
        }
      })
    }

    return record
  })
}

// 创建通过/驳回记录。
export const applyExam = async (payload: {
  applyId: string
  applyType: 'training' | 'template'
  examResult: number
  examOpinion?: string
  examUserId?: string
}) => {
  return prisma.$transaction(async (tx) => {
    const record = await tx.examRecord.create({
      data: {
        applyId: payload.applyId,
        applyType: payload.applyType,
        examResult: payload.examResult,
        examOpinion: payload.examOpinion ?? '',
        examUserId: payload.examUserId ?? '',
        examNode: payload.examResult === 1 ? 'approved' : 'rejected'
      }
    })

    const nextNode = payload.examResult === 1 ? '3' : '5'
    if (payload.applyType === 'training') {
      await tx.trainingPerformance.update({
        where: { id: payload.applyId },
        data: { applyNode: nextNode }
      })
    }

    if (payload.applyType === 'template') {
      await tx.template.update({
        where: { id: payload.applyId },
        data: { applyNode: nextNode }
      })
    }

    return record
  })
}

// 根据 applyId 查询审核记录。
export const listExamRecords = async (applyId: string) => {
  return prisma.examRecord.findMany({
    where: { applyId },
    orderBy: { createdAt: 'desc' }
  })
}
