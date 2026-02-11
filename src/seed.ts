import { prisma } from './db/prisma.js'

// 本地开发数据初始化工具。

// 文件类型字典（用于 /dict/list?dictType=FILE_TYPE）。
const dictItems = [
  { value: 'ZCQB', label: '侦察情报' },
  { value: 'QTLA', label: '企图立案' },
  { value: 'ZZJH', label: '作战计划' },
  { value: 'YXFA', label: '演训方案' },
  { value: 'ZZWS', label: '作战文书' },
  { value: 'DDJH', label: '导调计划' },
  { value: 'ZJZB', label: '战绩战报' },
  { value: 'ZZXT', label: '作战想定' },
  { value: 'ZJBG', label: '总结报告' },
  { value: 'TZ', label: '通知' },
  { value: 'TG', label: '通告' },
  { value: 'PGJG', label: '评估结果' },
  { value: 'QT', label: '其它' }
]

// 模板子类列表（模板模块使用）。
const templateSubclass = [
  { category_id: 'ZCQB', category_name: '侦察情报' },
  { category_id: 'QTLA', category_name: '企图立案' },
  { category_id: 'ZZJH', category_name: '作战计划' },
  { category_id: 'YXFA', category_name: '演训方案' },
  { category_id: 'ZZWS', category_name: '作战文书' },
  { category_id: 'DTJH', category_name: '导调计划' },
  { category_id: 'ZZXD', category_name: '作战想定' },
  { category_id: 'ZJZG', category_name: '战绩战报' },
  { category_id: 'ZJBG', category_name: '总结报告' },
  { category_id: 'TZ', category_name: '通知' },
  { category_id: 'TG', category_name: '通告' },
  { category_id: 'PGJG', category_name: '评估结果' }
]

// 如果缺失则插入字典项。
const seedDict = async () => {
  for (const item of dictItems) {
    const exists = await prisma.dictItem.findFirst({
      where: { dictType: 'FILE_TYPE', value: item.value }
    })
    if (!exists) {
      await prisma.dictItem.create({
        data: {
          dictType: 'FILE_TYPE',
          value: item.value,
          label: item.label,
          sort: 0
        }
      })
    }
  }
}

// 如果缺失则插入模板子类。
const seedTemplateSubclass = async () => {
  for (const item of templateSubclass) {
    const exists = await prisma.templateSubclass.findFirst({
      where: { categoryId: item.category_id, categoryName: item.category_name }
    })
    if (!exists) {
      await prisma.templateSubclass.create({
        data: {
          categoryId: item.category_id,
          categoryName: item.category_name
        }
      })
    }
  }
}

// 创建或更新本地登录用的默认管理员用户（upsert 确保新字段也被填充）。
const seedUser = async () => {
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      nickname: '管理员',
      email: 'admin@collabedit.local',
      deptId: 'dept-001'
    },
    create: {
      username: 'admin',
      password: 'admin123',
      nickname: '管理员',
      email: 'admin@collabedit.local',
      deptId: 'dept-001'
    }
  })
}

// 如果不存在则创建演训样例数据。
const seedTrainingSamples = async () => {
  const samples = [
    {
      planName: '演训方案示例A',
      exerciseName: '联合演训A',
      fileType: 'YXFA',
      docType: 'MD',
      level: '1',
      exerciseType: '1',
      applyNode: '1',
      createBy: 'admin',
      collegeCode: 'COL001',
      exerciseTheme: '联合防卫',
      flowId: 'flow-001',
      flowNode: 'node-1',
      scope: 'all',
      description: '演训方案样例数据'
    },
    {
      planName: '演训方案示例B',
      exerciseName: '联合演训B',
      fileType: 'ZZWS',
      docType: 'MD',
      level: '2',
      exerciseType: '2',
      applyNode: '3',
      createBy: 'admin',
      collegeCode: 'COL002',
      exerciseTheme: '信息支援',
      flowId: 'flow-002',
      flowNode: 'node-2',
      scope: 'all',
      description: '已审核通过样例'
    },
    {
      planName: '演训方案示例C',
      exerciseName: '实兵演训C',
      fileType: 'ZZJH',
      docType: 'MD',
      level: '3',
      exerciseType: '3',
      applyNode: '4',
      createBy: 'admin',
      collegeCode: 'COL003',
      exerciseTheme: '联合作战',
      flowId: 'flow-003',
      flowNode: 'node-3',
      scope: 'all',
      description: '发布态样例（可预览）'
    }
  ]
  for (const sample of samples) {
    const exist = await prisma.trainingPerformance.findFirst({
      where: { planName: sample.planName }
    })
    if (!exist) {
      await prisma.trainingPerformance.create({ data: sample })
    }
  }
}

// 如果不存在则创建演训参考素材。
const seedTrainingMaterials = async () => {
  const trainings = await prisma.trainingPerformance.findMany()
  for (const plan of trainings) {
    const existing = await prisma.trainingMaterial.findFirst({
      where: { planId: plan.id }
    })
    if (existing) continue

    await prisma.trainingMaterial.createMany({
      data: [
        {
          planId: plan.id,
          title: `${plan.planName ?? '演训方案'}参考素材-任务背景`,
          author: plan.createBy ?? 'admin',
          content:
            '<p>本素材用于说明演训任务背景与总体目标。</p><p>请结合演训阶段和任务节点进行补充。</p>'
        },
        {
          planId: plan.id,
          title: `${plan.planName ?? '演训方案'}参考素材-组织结构`,
          author: plan.createBy ?? 'admin',
          content:
            '<p>本素材提供组织结构示例，包括指挥关系与协同单位。</p><ul><li>指挥部</li><li>保障组</li><li>演训实施组</li></ul>'
        }
      ]
    })
  }
}

// 如果不存在则创建演训选择器样例数据。
const seedExerciseData = async () => {
  const samples = [
    {
      exerciseName: '联合演训-东部战区',
      supportUnit: '后勤保障部',
      organizer: '联合作战学院',
      exerciseType: 'LHL',
      level: 'ZYJ',
      participatingUnits: '陆军、海军、空军',
      city: '南京',
      academy: 'LHZZXY',
      subject: '联合作战',
      course: '指挥协同',
      content: '围绕联合作战体系进行指挥协同演练。',
      relatedSystems: '指控系统、态势系统',
      implPlan: '第一阶段筹划、第二阶段实施、第三阶段评估。',
      groupingInfo: '红蓝对抗编组',
      keyClasses: '指挥班',
      participantCount: 120,
      updater: 'admin',
      startTime: new Date('2026-01-10'),
      endTime: new Date('2026-01-20'),
      exerciseTheme: '体系联训',
      collegeCode: 'LHZZXY'
    },
    {
      exerciseName: '年度演训-综合保障',
      supportUnit: '综合保障部',
      organizer: '联合勤务学院',
      exerciseType: 'DXNDYX',
      level: 'ZLJ',
      participatingUnits: '保障部队',
      city: '北京',
      academy: 'LHQWXY',
      subject: '保障协同',
      course: '后勤支援',
      content: '保障资源统筹与协同指挥演练。',
      relatedSystems: '保障系统',
      implPlan: '方案编制、资源调度、复盘总结。',
      groupingInfo: '保障编组',
      keyClasses: '保障班',
      participantCount: 80,
      updater: 'admin',
      startTime: new Date('2026-02-05'),
      endTime: new Date('2026-02-12'),
      exerciseTheme: '综合保障',
      collegeCode: 'LHQWXY'
    },
    {
      exerciseName: '网络攻防演训',
      supportUnit: '信息保障部',
      organizer: '国家安全学院',
      exerciseType: 'WLL',
      level: 'ZSJ',
      participatingUnits: '网络部队',
      city: '武汉',
      academy: 'GJAQXY',
      subject: '网络攻防',
      course: '网络安全',
      content: '模拟网络攻击与防御响应演练。',
      relatedSystems: '安全监测系统',
      implPlan: '预案演练、实战演练、效果评估。',
      groupingInfo: '红蓝对抗编组',
      keyClasses: '技术班',
      participantCount: 60,
      updater: 'admin',
      startTime: new Date('2026-03-01'),
      endTime: new Date('2026-03-07'),
      exerciseTheme: '网络安全',
      collegeCode: 'GJAQXY'
    }
  ]

  for (const sample of samples) {
    const exist = await prisma.exerciseData.findFirst({
      where: { exerciseName: sample.exerciseName }
    })
    if (!exist) {
      await prisma.exerciseData.create({ data: sample })
    }
  }
}

// 如果不存在则创建模板样例数据。
const seedTemplateSamples = async () => {
  const samples = [
    {
      templateName: '作战命令模板',
      temCategory: '筹划文档',
      temSubclass: 'ZZWS',
      temSubName: '作战文书',
      temStatus: '0',
      applyNode: '3',
      createBy: 'admin',
      flowId: 'flow-t-001',
      description: '模板样例数据',
      elementsItems: [
        { item_type: 'text', item_label: '发文单位' },
        { item_type: 'time', item_label: '签发时间' }
      ]
    },
    {
      templateName: '演训方案模板',
      temCategory: '筹划文档',
      temSubclass: 'YXFA',
      temSubName: '演训方案',
      temStatus: '0',
      applyNode: '2',
      createBy: 'admin',
      flowId: 'flow-t-002',
      description: '审核中样例',
      elementsItems: [
        { item_type: 'text', item_label: '演训地点' },
        { item_type: 'multiple', item_label: '参与单位', item_options: ['指挥部', '后勤部'] }
      ]
    },
    {
      templateName: '发布预览模板',
      temCategory: '筹划文档',
      temSubclass: 'ZZJH',
      temSubName: '作战计划',
      temStatus: '0',
      applyNode: '4',
      createBy: 'admin',
      flowId: 'flow-t-003',
      description: '发布态样例（可预览）',
      elementsItems: [
        { item_type: 'text', item_label: '任务代号' },
        { item_type: 'radio', item_label: '密级', item_options: ['机密', '秘密', '内部'] }
      ]
    }
  ]
  for (const sample of samples) {
    const exist = await prisma.template.findFirst({
      where: { templateName: sample.templateName }
    })
    if (!exist) {
      await prisma.template.create({ data: sample })
    }
  }
}

// 如果缺失则为发布/通过的数据生成审核记录。
const seedExamRecords = async () => {
  const training = await prisma.trainingPerformance.findMany({
    where: { applyNode: { in: ['3', '4'] } }
  })
  for (const item of training) {
    const exist = await prisma.examRecord.findFirst({ where: { applyId: item.id } })
    if (exist) continue
    await prisma.examRecord.createMany({
      data: [
        {
          applyId: item.id,
          applyType: 'training',
          examResult: 1,
          examOpinion: '初审通过',
          examOffice: 'office-001',
          examUserId: 'user1',
          nextUserId: 'user2',
          examOfficeName: '演训审核部',
          examNode: '节点1'
        },
        {
          applyId: item.id,
          applyType: 'training',
          examResult: 1,
          examOpinion: '复审通过',
          examOffice: 'office-002',
          examUserId: 'user2',
          nextUserId: '',
          examOfficeName: '联合指挥部',
          examNode: '节点2'
        }
      ]
    })
  }

  const templates = await prisma.template.findMany({
    where: { applyNode: { in: ['3', '4'] } }
  })
  for (const item of templates) {
    const exist = await prisma.examRecord.findFirst({ where: { applyId: item.id } })
    if (exist) continue
    await prisma.examRecord.createMany({
      data: [
        {
          applyId: item.id,
          applyType: 'template',
          examResult: 1,
          examOpinion: '模板规范，审核通过',
          examOffice: 'office-010',
          examUserId: 'user1',
          nextUserId: 'user2',
          examOfficeName: '模板管理部',
          examNode: '节点1'
        },
        {
          applyId: item.id,
          applyType: 'template',
          examResult: 1,
          examOpinion: '内容完整，同意发布',
          examOffice: 'office-011',
          examUserId: 'user2',
          nextUserId: '',
          examOfficeName: '审核部',
          examNode: '节点2'
        }
      ]
    })
  }
}

// 执行全部初始化步骤。
const main = async () => {
  await seedDict()
  await seedTemplateSubclass()
  await seedUser()
  await seedTrainingSamples()
  await seedTrainingMaterials()
  await seedExerciseData()
  await seedTemplateSamples()
  await seedExamRecords()
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Seed completed.')
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
