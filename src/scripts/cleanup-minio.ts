import { Client } from 'minio'
import { env } from '../config/env.js'
import { prisma } from '../db/prisma.js'

// 一键清理 MinIO 中不在数据库引用的垃圾对象。

const minio = new Client({
  endPoint: env.minio.endPoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey
})

const listAllObjects = async () => {
  const objects: string[] = []
  const stream = minio.listObjectsV2(env.minio.bucket, '', true)
  return new Promise<string[]>((resolve, reject) => {
    stream.on('data', (obj) => {
      if (obj?.name) objects.push(obj.name)
    })
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(objects))
  })
}

const main = async () => {
  const dbKeys = await prisma.fileObject.findMany({ select: { objectKey: true } })
  const dbSet = new Set(dbKeys.map((k) => k.objectKey))

  const objects = await listAllObjects()
  const stale = objects.filter((key) => !dbSet.has(key))

  for (const key of stale) {
    await minio.removeObject(env.minio.bucket, key)
  }

  console.log(`清理完成：删除 ${stale.length} 个垃圾对象`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
