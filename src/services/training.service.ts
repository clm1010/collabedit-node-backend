import { prisma } from '../db/prisma.js'

// 演训模块数据访问层。

export type TrainingQuery = {
  pageNo?: number
  pageSize?: number
  planName?: string
  applyNode?: string
  fileType?: string
  exerciseTheme?: string
  exerciseType?: string
  level?: string
  collegeCode?: string
  docType?: string
  tabType?: string
}

export type ExerciseQuery = {
  pageNo?: number
  pageSize?: number
  exerciseName?: string
  exerciseType?: string
  level?: string
  academy?: string
  city?: string
}

// 分页查询演训列表。
export const getTrainingPage = async (query: TrainingQuery) => {
  const pageNo = Math.max(1, Number(query.pageNo ?? 1))
  const pageSize = Math.max(1, Number(query.pageSize ?? 10))
  const where: any = {
    delFlg: 0
  }
  if (query.planName) where.planName = { contains: query.planName }
  if (query.applyNode) where.applyNode = query.applyNode
  if (query.fileType) where.fileType = query.fileType
  if (query.exerciseTheme) where.exerciseTheme = query.exerciseTheme
  if (query.exerciseType) where.exerciseType = query.exerciseType
  if (query.level) where.level = query.level
  if (query.collegeCode) where.collegeCode = query.collegeCode
  if (query.docType) where.docType = query.docType

  const [total, list] = await Promise.all([
    prisma.trainingPerformance.count({ where }),
    prisma.trainingPerformance.findMany({
      where,
      orderBy: { createTime: 'desc' },
      skip: (pageNo - 1) * pageSize,
      take: pageSize
    })
  ])
  return { records: list, total }
}

// 新增或更新演训记录。
export const saveTraining = async (payload: any) => {
  const normalized = {
    ...payload,
    applyNode: payload.applyNode ?? '1'
  }
  if (payload.id) {
    return prisma.trainingPerformance.update({
      where: { id: payload.id },
      data: normalized
    })
  }
  return prisma.trainingPerformance.create({ data: normalized })
}

// 软删除演训记录。
export const deleteTraining = async (ids: string[]) => {
  await prisma.trainingPerformance.updateMany({
    where: { id: { in: ids } },
    data: { delFlg: 1 }
  })
  return true
}

// 将演训记录标记为已发布。
export const publishTraining = async (data: {
  id: string
  visibleScope?: string | string[]
}) => {
  const scope =
    Array.isArray(data.visibleScope)
      ? data.visibleScope.filter(Boolean).join(',')
      : data.visibleScope ?? ''
  return prisma.trainingPerformance.update({
    where: { id: data.id },
    data: { publishStatus: 'published', visibleScope: scope, applyNode: '4' }
  })
}

// 查询演训数据（用于选择弹窗）。
export const getExerciseData = async (query: ExerciseQuery) => {
  const pageNo = Math.max(1, Number(query.pageNo ?? 1))
  const pageSize = Math.max(1, Number(query.pageSize ?? 10))
  const where: any = {}

  if (query.exerciseName) where.exerciseName = { contains: query.exerciseName }
  if (query.exerciseType) where.exerciseType = query.exerciseType
  if (query.level) where.level = query.level
  if (query.academy) where.academy = query.academy
  if (query.city) where.city = { contains: query.city }

  const [total, list] = await Promise.all([
    prisma.exerciseData.count({ where }),
    prisma.exerciseData.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNo - 1) * pageSize,
      take: pageSize
    })
  ])
  return { records: list, total }
}
