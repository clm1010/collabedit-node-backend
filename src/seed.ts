import { prisma } from './db/prisma.js'

// ===================== 系统管理种子数据 =====================

// ===== 2.1 部门 =====
const seedDepts = async () => {
  const depts = [
    { id: 100, name: '总公司', parentId: 0, sort: 0, status: 0 },
    { id: 101, name: '研发部', parentId: 100, sort: 1, status: 0 },
    { id: 102, name: '测试部', parentId: 100, sort: 2, status: 0 },
    { id: 103, name: '运维部', parentId: 100, sort: 3, status: 0 }
  ]
  for (const dept of depts) {
    await prisma.dept.upsert({
      where: { id: dept.id },
      update: { name: dept.name, parentId: dept.parentId, sort: dept.sort, status: dept.status },
      create: dept
    })
  }
}

// ===== 2.2 角色 =====
const seedRoles = async () => {
  const roles = [
    { id: 1, name: '超级管理员', code: 'super_admin', sort: 1, status: 0, type: 1, dataScope: 1 },
    { id: 2, name: '普通用户', code: 'common', sort: 2, status: 0, type: 2, dataScope: 5 }
  ]
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, code: role.code, sort: role.sort, status: role.status, type: role.type, dataScope: role.dataScope },
      create: role
    })
  }
}

// ===== 2.3 岗位 =====
const seedPosts = async () => {
  const posts = [
    { id: 1, code: 'ceo', name: '总经理', sort: 1, status: 0 },
    { id: 2, code: 'pm', name: '项目经理', sort: 2, status: 0 },
    { id: 3, code: 'staff', name: '普通员工', sort: 3, status: 0 }
  ]
  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: { code: post.code, name: post.name, sort: post.sort, status: post.status },
      create: post
    })
  }
}

// ===== 2.4 用户（id 改 Int，status 改 Int） =====
const seedUsers = async () => {
  // 1. 管理员
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { nickname: '管理员', email: 'admin@collabedit.local', deptId: 100, status: 0, avatar: '' },
    create: { id: 1, username: 'admin', password: 'admin123', nickname: '管理员', email: 'admin@collabedit.local', deptId: 100, status: 0, avatar: '' }
  })
  // 2. 禁用测试用户
  await prisma.user.upsert({
    where: { username: 'disabled-user' },
    update: { status: 1 },
    create: { id: 2, username: 'disabled-user', password: 'test123', nickname: '禁用测试用户', status: 1 }
  })
  // 3. 普通测试用户
  await prisma.user.upsert({
    where: { username: 'testuser' },
    update: { nickname: '测试用户', status: 0, deptId: 101 },
    create: { id: 3, username: 'testuser', password: 'test123', nickname: '测试用户', email: 'test@collabedit.local', deptId: 101, status: 0 }
  })
}

// ===== 2.5 用户-角色关联 =====
const seedUserRoles = async () => {
  const relations = [
    { userId: 1, roleId: 1 }, // admin → super_admin
    { userId: 1, roleId: 2 }, // admin → common
    { userId: 3, roleId: 2 }  // testuser → common
  ]
  for (const rel of relations) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: rel.userId, roleId: rel.roleId } },
      update: {},
      create: rel
    })
  }
}

// ===== 2.6 用户-岗位关联 =====
const seedUserPosts = async () => {
  const relations = [
    { userId: 1, postId: 1 }, // admin → 总经理
    { userId: 3, postId: 3 }  // testuser → 普通员工
  ]
  for (const rel of relations) {
    await prisma.userPost.upsert({
      where: { userId_postId: { userId: rel.userId, postId: rel.postId } },
      update: {},
      create: rel
    })
  }
}

// ===== 2.7 系统菜单树（完整，匹配前端 src/views/system/ 下所有页面） =====
const seedMenus = async () => {
  const menus = [
    // ===== 系统管理 目录 =====
    { id: 1, name: '系统管理', permission: '', type: 1, sort: 1, parentId: 0, path: '/system', icon: 'ep:tools', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 用户管理 菜单 ---
    { id: 100, name: '用户管理', permission: '', type: 2, sort: 1, parentId: 1, path: 'user', icon: 'ep:user', component: 'system/user/index', componentName: 'SystemUser', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1001, name: '用户查询', permission: 'system:user:query', type: 3, sort: 1, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1002, name: '用户创建', permission: 'system:user:create', type: 3, sort: 2, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1003, name: '用户修改', permission: 'system:user:update', type: 3, sort: 3, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1004, name: '用户删除', permission: 'system:user:delete', type: 3, sort: 4, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1005, name: '用户导出', permission: 'system:user:export', type: 3, sort: 5, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1006, name: '用户导入', permission: 'system:user:import', type: 3, sort: 6, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1007, name: '分配用户角色', permission: 'system:permission:assign-user-role', type: 3, sort: 7, parentId: 100, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 角色管理 菜单 ---
    { id: 101, name: '角色管理', permission: '', type: 2, sort: 2, parentId: 1, path: 'role', icon: 'ep:user-filled', component: 'system/role/index', componentName: 'SystemRole', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1011, name: '角色查询', permission: 'system:role:query', type: 3, sort: 1, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1012, name: '角色创建', permission: 'system:role:create', type: 3, sort: 2, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1013, name: '角色修改', permission: 'system:role:update', type: 3, sort: 3, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1014, name: '角色删除', permission: 'system:role:delete', type: 3, sort: 4, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1015, name: '角色导出', permission: 'system:role:export', type: 3, sort: 5, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1016, name: '分配角色菜单', permission: 'system:permission:assign-role-menu', type: 3, sort: 6, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1017, name: '分配角色数据权限', permission: 'system:permission:assign-role-data-scope', type: 3, sort: 7, parentId: 101, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 菜单管理 菜单 ---
    { id: 102, name: '菜单管理', permission: '', type: 2, sort: 3, parentId: 1, path: 'menu', icon: 'ep:menu', component: 'system/menu/index', componentName: 'SystemMenu', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1021, name: '菜单查询', permission: 'system:menu:query', type: 3, sort: 1, parentId: 102, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1022, name: '菜单创建', permission: 'system:menu:create', type: 3, sort: 2, parentId: 102, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1023, name: '菜单修改', permission: 'system:menu:update', type: 3, sort: 3, parentId: 102, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1024, name: '菜单删除', permission: 'system:menu:delete', type: 3, sort: 4, parentId: 102, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 部门管理 菜单 ---
    { id: 103, name: '部门管理', permission: '', type: 2, sort: 4, parentId: 1, path: 'dept', icon: 'ep:office-building', component: 'system/dept/index', componentName: 'SystemDept', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1031, name: '部门查询', permission: 'system:dept:query', type: 3, sort: 1, parentId: 103, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1032, name: '部门创建', permission: 'system:dept:create', type: 3, sort: 2, parentId: 103, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1033, name: '部门修改', permission: 'system:dept:update', type: 3, sort: 3, parentId: 103, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1034, name: '部门删除', permission: 'system:dept:delete', type: 3, sort: 4, parentId: 103, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 岗位管理 菜单 ---
    { id: 104, name: '岗位管理', permission: '', type: 2, sort: 5, parentId: 1, path: 'post', icon: 'ep:postcard', component: 'system/post/index', componentName: 'SystemPost', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1041, name: '岗位查询', permission: 'system:post:query', type: 3, sort: 1, parentId: 104, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1042, name: '岗位创建', permission: 'system:post:create', type: 3, sort: 2, parentId: 104, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1043, name: '岗位修改', permission: 'system:post:update', type: 3, sort: 3, parentId: 104, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1044, name: '岗位删除', permission: 'system:post:delete', type: 3, sort: 4, parentId: 104, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 字典管理 菜单 ---
    { id: 105, name: '字典管理', permission: '', type: 2, sort: 6, parentId: 1, path: 'dict', icon: 'ep:collection', component: 'system/dict/index', componentName: 'SystemDictType', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1051, name: '字典查询', permission: 'system:dict:query', type: 3, sort: 1, parentId: 105, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1052, name: '字典创建', permission: 'system:dict:create', type: 3, sort: 2, parentId: 105, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1053, name: '字典修改', permission: 'system:dict:update', type: 3, sort: 3, parentId: 105, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1054, name: '字典删除', permission: 'system:dict:delete', type: 3, sort: 4, parentId: 105, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 通知公告 菜单 ---
    { id: 107, name: '通知公告', permission: '', type: 2, sort: 8, parentId: 1, path: 'notice', icon: 'ep:chat-dot-round', component: 'system/notice/index', componentName: 'SystemNotice', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1071, name: '通知查询', permission: 'system:notice:query', type: 3, sort: 1, parentId: 107, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1072, name: '通知创建', permission: 'system:notice:create', type: 3, sort: 2, parentId: 107, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1073, name: '通知修改', permission: 'system:notice:update', type: 3, sort: 3, parentId: 107, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1074, name: '通知删除', permission: 'system:notice:delete', type: 3, sort: 4, parentId: 107, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 操作日志 菜单 ---
    { id: 108, name: '操作日志', permission: '', type: 2, sort: 9, parentId: 1, path: 'operate-log', icon: 'ep:document', component: 'system/operatelog/index', componentName: 'SystemOperateLog', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1081, name: '操作日志查询', permission: 'system:operate-log:query', type: 3, sort: 1, parentId: 108, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true },

    // --- 登录日志 菜单 ---
    { id: 109, name: '登录日志', permission: '', type: 2, sort: 10, parentId: 1, path: 'login-log', icon: 'ep:key', component: 'system/loginlog/index', componentName: 'SystemLoginLog', status: 0, visible: true, keepAlive: true, alwaysShow: true },
    { id: 1091, name: '登录日志查询', permission: 'system:login-log:query', type: 3, sort: 1, parentId: 109, path: '', icon: '', component: '', componentName: '', status: 0, visible: true, keepAlive: true, alwaysShow: true }
  ]

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: { name: menu.name, permission: menu.permission, type: menu.type, sort: menu.sort, parentId: menu.parentId, path: menu.path, icon: menu.icon, component: menu.component, componentName: menu.componentName, status: menu.status, visible: menu.visible, keepAlive: menu.keepAlive, alwaysShow: menu.alwaysShow },
      create: menu
    })
  }
}

// ===== 2.8 角色-菜单关联（super_admin 拥有所有菜单） =====
const seedRoleMenus = async () => {
  const allMenus = await prisma.menu.findMany({ select: { id: true } })
  for (const menu of allMenus) {
    await prisma.roleMenu.upsert({
      where: { roleId_menuId: { roleId: 1, menuId: menu.id } },
      update: {},
      create: { roleId: 1, menuId: menu.id } // super_admin
    })
  }
  // common 角色只分配查询权限（type=2 的菜单 + type=3 中 query 权限）
  const commonMenus = await prisma.menu.findMany({
    where: {
      OR: [
        { type: { in: [1, 2] } }, // 目录和菜单
        { type: 3, permission: { contains: ':query' } } // 查询按钮
      ]
    },
    select: { id: true }
  })
  for (const menu of commonMenus) {
    await prisma.roleMenu.upsert({
      where: { roleId_menuId: { roleId: 2, menuId: menu.id } },
      update: {},
      create: { roleId: 2, menuId: menu.id } // common
    })
  }
}

// ===== 2.9 字典类型 =====
const seedDictTypes = async () => {
  const types = [
    { name: '用户性别', type: 'system_user_sex', status: 0, remark: '用户性别' },
    { name: '通用状态', type: 'common_status', status: 0, remark: '系统通用状态' },
    { name: '菜单类型', type: 'system_menu_type', status: 0, remark: '菜单类型' },
    { name: '角色类型', type: 'system_role_type', status: 0, remark: '角色类型' },
    { name: '数据权限', type: 'system_data_scope', status: 0, remark: '数据权限范围' },
    { name: '登录结果', type: 'system_login_result', status: 0, remark: '登录结果' },
    { name: '登录类型', type: 'system_login_type', status: 0, remark: '登录类型' },
    { name: '通知类型', type: 'system_notice_type', status: 0, remark: '通知公告类型' },
    { name: '文件类型', type: 'FILE_TYPE', status: 0, remark: '业务文件类型' }
  ]
  for (const t of types) {
    await prisma.dictType.upsert({
      where: { type: t.type },
      update: { name: t.name, status: t.status, remark: t.remark },
      create: t
    })
  }
}

// ===== 2.10 字典数据 =====
const seedDictItems = async () => {
  const items = [
    // 用户性别
    { dictType: 'system_user_sex', value: '0', label: '未知', sort: 0 },
    { dictType: 'system_user_sex', value: '1', label: '男', sort: 1 },
    { dictType: 'system_user_sex', value: '2', label: '女', sort: 2 },
    // 通用状态
    { dictType: 'common_status', value: '0', label: '正常', sort: 0, colorType: 'success' },
    { dictType: 'common_status', value: '1', label: '禁用', sort: 1, colorType: 'danger' },
    // 菜单类型
    { dictType: 'system_menu_type', value: '1', label: '目录', sort: 0 },
    { dictType: 'system_menu_type', value: '2', label: '菜单', sort: 1 },
    { dictType: 'system_menu_type', value: '3', label: '按钮', sort: 2 },
    // 角色类型
    { dictType: 'system_role_type', value: '1', label: '内置', sort: 0 },
    { dictType: 'system_role_type', value: '2', label: '自定义', sort: 1 },
    // 数据权限
    { dictType: 'system_data_scope', value: '1', label: '全部数据', sort: 0 },
    { dictType: 'system_data_scope', value: '2', label: '自定义数据', sort: 1 },
    { dictType: 'system_data_scope', value: '3', label: '本部门数据', sort: 2 },
    { dictType: 'system_data_scope', value: '4', label: '本部门及以下数据', sort: 3 },
    { dictType: 'system_data_scope', value: '5', label: '仅本人数据', sort: 4 },
    // 登录结果
    { dictType: 'system_login_result', value: '0', label: '成功', sort: 0, colorType: 'success' },
    { dictType: 'system_login_result', value: '1', label: '失败', sort: 1, colorType: 'danger' },
    // 登录类型
    { dictType: 'system_login_type', value: '1', label: '登录', sort: 0 },
    { dictType: 'system_login_type', value: '2', label: '登出', sort: 1 },
    // 通知类型
    { dictType: 'system_notice_type', value: '1', label: '通知', sort: 0 },
    { dictType: 'system_notice_type', value: '2', label: '公告', sort: 1 },
    // 文件类型（保留原有业务字典）
    { dictType: 'FILE_TYPE', value: 'ZCQB', label: '侦察情报', sort: 0 },
    { dictType: 'FILE_TYPE', value: 'QTLA', label: '企图立案', sort: 1 },
    { dictType: 'FILE_TYPE', value: 'ZZJH', label: '作战计划', sort: 2 },
    { dictType: 'FILE_TYPE', value: 'YXFA', label: '演训方案', sort: 3 },
    { dictType: 'FILE_TYPE', value: 'ZZWS', label: '作战文书', sort: 4 },
    { dictType: 'FILE_TYPE', value: 'DDJH', label: '导调计划', sort: 5 },
    { dictType: 'FILE_TYPE', value: 'ZJZB', label: '战绩战报', sort: 6 },
    { dictType: 'FILE_TYPE', value: 'ZZXT', label: '作战想定', sort: 7 },
    { dictType: 'FILE_TYPE', value: 'ZJBG', label: '总结报告', sort: 8 },
    { dictType: 'FILE_TYPE', value: 'TZ', label: '通知', sort: 9 },
    { dictType: 'FILE_TYPE', value: 'TG', label: '通告', sort: 10 },
    { dictType: 'FILE_TYPE', value: 'PGJG', label: '评估结果', sort: 11 },
    { dictType: 'FILE_TYPE', value: 'QT', label: '其它', sort: 12 }
  ]
  for (const item of items) {
    const exists = await prisma.dictItem.findFirst({
      where: { dictType: item.dictType, value: item.value }
    })
    if (!exists) {
      await prisma.dictItem.create({ data: item })
    }
  }
}

// ===================== 业务种子数据（保留原有） =====================

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

const seedTemplateSubclass = async () => {
  for (const item of templateSubclass) {
    const exists = await prisma.templateSubclass.findFirst({
      where: { categoryId: item.category_id, categoryName: item.category_name }
    })
    if (!exists) {
      await prisma.templateSubclass.create({
        data: { categoryId: item.category_id, categoryName: item.category_name }
      })
    }
  }
}

const seedTrainingSamples = async () => {
  const samples = [
    { planName: '演训方案示例A', exerciseName: '联合演训A', fileType: 'YXFA', docType: 'MD', level: '1', exerciseType: '1', applyNode: '1', createBy: 'admin', collegeCode: 'COL001', exerciseTheme: '联合防卫', flowId: 'flow-001', flowNode: 'node-1', scope: 'all', description: '演训方案样例数据' },
    { planName: '演训方案示例B', exerciseName: '联合演训B', fileType: 'ZZWS', docType: 'MD', level: '2', exerciseType: '2', applyNode: '3', createBy: 'admin', collegeCode: 'COL002', exerciseTheme: '信息支援', flowId: 'flow-002', flowNode: 'node-2', scope: 'all', description: '已审核通过样例' },
    { planName: '演训方案示例C', exerciseName: '实兵演训C', fileType: 'ZZJH', docType: 'MD', level: '3', exerciseType: '3', applyNode: '4', createBy: 'admin', collegeCode: 'COL003', exerciseTheme: '联合作战', flowId: 'flow-003', flowNode: 'node-3', scope: 'all', description: '发布态样例（可预览）' }
  ]
  for (const sample of samples) {
    const exist = await prisma.trainingPerformance.findFirst({ where: { planName: sample.planName } })
    if (!exist) {
      await prisma.trainingPerformance.create({ data: sample })
    }
  }
}

const seedTrainingMaterials = async () => {
  const trainings = await prisma.trainingPerformance.findMany()
  for (const plan of trainings) {
    const existing = await prisma.trainingMaterial.findFirst({ where: { planId: plan.id } })
    if (existing) continue
    await prisma.trainingMaterial.createMany({
      data: [
        { planId: plan.id, title: `${plan.planName ?? '演训方案'}参考素材-任务背景`, author: plan.createBy ?? 'admin', content: '<p>本素材用于说明演训任务背景与总体目标。</p>' },
        { planId: plan.id, title: `${plan.planName ?? '演训方案'}参考素材-组织结构`, author: plan.createBy ?? 'admin', content: '<p>本素材提供组织结构示例。</p>' }
      ]
    })
  }
}

const seedExerciseData = async () => {
  const samples = [
    { exerciseName: '联合演训-东部战区', supportUnit: '后勤保障部', organizer: '联合作战学院', exerciseType: 'LHL', level: 'ZYJ', participatingUnits: '陆军、海军、空军', city: '南京', academy: 'LHZZXY', subject: '联合作战', course: '指挥协同', content: '围绕联合作战体系进行指挥协同演练。', relatedSystems: '指控系统、态势系统', implPlan: '第一阶段筹划、第二阶段实施、第三阶段评估。', groupingInfo: '红蓝对抗编组', keyClasses: '指挥班', participantCount: 120, updater: 'admin', startTime: new Date('2026-01-10'), endTime: new Date('2026-01-20'), exerciseTheme: '体系联训', collegeCode: 'LHZZXY' },
    { exerciseName: '年度演训-综合保障', supportUnit: '综合保障部', organizer: '联合勤务学院', exerciseType: 'DXNDYX', level: 'ZLJ', participatingUnits: '保障部队', city: '北京', academy: 'LHQWXY', subject: '保障协同', course: '后勤支援', content: '保障资源统筹与协同指挥演练。', relatedSystems: '保障系统', implPlan: '方案编制、资源调度、复盘总结。', groupingInfo: '保障编组', keyClasses: '保障班', participantCount: 80, updater: 'admin', startTime: new Date('2026-02-05'), endTime: new Date('2026-02-12'), exerciseTheme: '综合保障', collegeCode: 'LHQWXY' }
  ]
  for (const sample of samples) {
    const exist = await prisma.exerciseData.findFirst({ where: { exerciseName: sample.exerciseName } })
    if (!exist) {
      await prisma.exerciseData.create({ data: sample })
    }
  }
}

const seedTemplateSamples = async () => {
  const samples = [
    { templateName: '作战命令模板', temCategory: '筹划文档', temSubclass: 'ZZWS', temSubName: '作战文书', temStatus: '0', applyNode: '3', createBy: 'admin', flowId: 'flow-t-001', description: '模板样例数据', elementsItems: [{ item_type: 'text', item_label: '发文单位' }, { item_type: 'time', item_label: '签发时间' }] },
    { templateName: '演训方案模板', temCategory: '筹划文档', temSubclass: 'YXFA', temSubName: '演训方案', temStatus: '0', applyNode: '2', createBy: 'admin', flowId: 'flow-t-002', description: '审核中样例', elementsItems: [{ item_type: 'text', item_label: '演训地点' }] },
    { templateName: '发布预览模板', temCategory: '筹划文档', temSubclass: 'ZZJH', temSubName: '作战计划', temStatus: '0', applyNode: '4', createBy: 'admin', flowId: 'flow-t-003', description: '发布态样例（可预览）', elementsItems: [{ item_type: 'text', item_label: '任务代号' }] }
  ]
  for (const sample of samples) {
    const exist = await prisma.template.findFirst({ where: { templateName: sample.templateName } })
    if (!exist) {
      await prisma.template.create({ data: sample })
    }
  }
}

const seedExamRecords = async () => {
  const training = await prisma.trainingPerformance.findMany({ where: { applyNode: { in: ['3', '4'] } } })
  for (const item of training) {
    const exist = await prisma.examRecord.findFirst({ where: { applyId: item.id } })
    if (exist) continue
    await prisma.examRecord.createMany({
      data: [
        { applyId: item.id, applyType: 'training', examResult: 1, examOpinion: '初审通过', examOffice: 'office-001', examUserId: 'user1', nextUserId: 'user2', examOfficeName: '演训审核部', examNode: '节点1' },
        { applyId: item.id, applyType: 'training', examResult: 1, examOpinion: '复审通过', examOffice: 'office-002', examUserId: 'user2', nextUserId: '', examOfficeName: '联合指挥部', examNode: '节点2' }
      ]
    })
  }
  const templates = await prisma.template.findMany({ where: { applyNode: { in: ['3', '4'] } } })
  for (const item of templates) {
    const exist = await prisma.examRecord.findFirst({ where: { applyId: item.id } })
    if (exist) continue
    await prisma.examRecord.createMany({
      data: [
        { applyId: item.id, applyType: 'template', examResult: 1, examOpinion: '模板规范，审核通过', examOffice: 'office-010', examUserId: 'user1', nextUserId: 'user2', examOfficeName: '模板管理部', examNode: '节点1' },
        { applyId: item.id, applyType: 'template', examResult: 1, examOpinion: '内容完整，同意发布', examOffice: 'office-011', examUserId: 'user2', nextUserId: '', examOfficeName: '审核部', examNode: '节点2' }
      ]
    })
  }
}

// ===================== 执行全部初始化 =====================
const main = async () => {
  console.log('--- 系统管理数据 ---')
  await seedDepts()
  console.log('  [OK] 部门')
  await seedRoles()
  console.log('  [OK] 角色')
  await seedPosts()
  console.log('  [OK] 岗位')
  await seedUsers()
  console.log('  [OK] 用户')
  await seedUserRoles()
  console.log('  [OK] 用户-角色')
  await seedUserPosts()
  console.log('  [OK] 用户-岗位')
  await seedMenus()
  console.log('  [OK] 菜单')
  await seedRoleMenus()
  console.log('  [OK] 角色-菜单')
  await seedDictTypes()
  console.log('  [OK] 字典类型')
  await seedDictItems()
  console.log('  [OK] 字典数据')

  console.log('--- 业务数据 ---')
  await seedTemplateSubclass()
  console.log('  [OK] 模板子类')
  await seedTrainingSamples()
  console.log('  [OK] 演训样例')
  await seedTrainingMaterials()
  console.log('  [OK] 演训素材')
  await seedExerciseData()
  console.log('  [OK] 演训选择器')
  await seedTemplateSamples()
  console.log('  [OK] 模板样例')
  await seedExamRecords()
  console.log('  [OK] 审核记录')
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
