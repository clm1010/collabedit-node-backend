/**
 * 将扁平列表构建成树形结构。
 * 用于部门树、菜单树等。
 */
export function buildTree<T extends { id: number; parentId: number; children?: T[] }>(
  list: T[],
  parentId = 0
): T[] {
  const result: T[] = []
  for (const item of list) {
    if (item.parentId === parentId) {
      const children = buildTree(list, item.id)
      if (children.length > 0) {
        item.children = children
      }
      result.push(item)
    }
  }
  return result
}
