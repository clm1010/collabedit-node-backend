import { Client } from 'minio'
import { env } from '../config/env.js'
import { prisma } from '../db/prisma.js'
import { randomUUID } from 'crypto'
import path from 'path'

// MinIO 对象存储客户端。

const minio = new Client({
  endPoint: env.minio.endPoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey
})

// 上传前确保 bucket 存在。
export const ensureBucket = async () => {
  const exists = await minio.bucketExists(env.minio.bucket)
  if (!exists) {
    await minio.makeBucket(env.minio.bucket, 'cn-north-1')
  }
}

const buildObjectKey = (fileId: string, filename: string) => {
  const ext = path.extname(filename)
  const datePrefix = new Date().toISOString().slice(0, 10)
  return `${datePrefix}/${fileId}${ext}`
}

/**
 * 修复 multer 中文文件名编码问题
 * 浏览器在 multipart/form-data 中传输非 ASCII 文件名时可能使用 Latin-1 编码
 * 导致 multer 解析出的 originalname 是乱码，需要转换为正确的 UTF-8
 */
const fixFilename = (filename: string): string => {
  try {
    // 尝试将 Latin-1 编码的字符串转换为 UTF-8
    // 如果文件名已经是正确的 UTF-8，这个操作会抛出错误或返回乱码
    const buffer = Buffer.from(filename, 'latin1')
    const utf8Filename = buffer.toString('utf8')
    
    // 检查转换后是否看起来像有效的 UTF-8 文本
    // 如果原始文件名就是 ASCII，直接返回原始值
    if (/^[\x00-\x7F]*$/.test(filename)) {
      return filename
    }
    
    // 检查转换结果是否包含常见的中文字符范围
    if (/[\u4e00-\u9fff]/.test(utf8Filename)) {
      return utf8Filename
    }
    
    // 如果转换后没有中文，尝试 URL 解码（某些客户端会 URL 编码文件名）
    try {
      const decoded = decodeURIComponent(filename)
      if (decoded !== filename) {
        return decoded
      }
    } catch {
      // URL 解码失败，忽略
    }
    
    // 返回原始文件名
    return filename
  } catch {
    return filename
  }
}

// 上传文件到 MinIO，并将元数据写入数据库。
export const uploadFile = async (
  file: Express.Multer.File,
  uploaderId?: string,
  existingFileId?: string
) => {
  await ensureBucket()
  
  // 修复中文文件名编码问题
  const originalName = fixFilename(file.originalname)
  
  let fileRecord = existingFileId
    ? await prisma.fileObject.findUnique({ where: { id: existingFileId } })
    : null
  const fileId = fileRecord?.id ?? randomUUID()
  const objectKey = fileRecord?.objectKey ?? buildObjectKey(fileId, originalName)
  const result = await minio.putObject(
    env.minio.bucket,
    objectKey,
    file.buffer,
    file.size,
    {
      'Content-Type': file.mimetype
    }
  )
  if (fileRecord) {
    await prisma.fileOverwriteLog.create({
      data: {
        fileId: fileRecord.id,
        objectKey: fileRecord.objectKey,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        etag: fileRecord.etag ?? undefined,
        uploaderId: fileRecord.uploaderId ?? undefined
      }
    })
    fileRecord = await prisma.fileObject.update({
      where: { id: fileRecord.id },
      data: {
        bucket: env.minio.bucket,
        objectKey,
        originalName: originalName, // 使用修复后的文件名
        mimeType: file.mimetype,
        size: file.size,
        etag: (result as any)?.etag,
        uploaderId
      }
    })
    return fileRecord
  }
  return prisma.fileObject.create({
    data: {
      id: fileId,
      bucket: env.minio.bucket,
      objectKey,
      originalName: originalName, // 使用修复后的文件名
      mimeType: file.mimetype,
      size: file.size,
      etag: (result as any)?.etag,
      uploaderId
    }
  })
}

// 根据 fileId 从 MinIO 获取文件流。
export const getFileStream = async (fileId: string) => {
  const file = await prisma.fileObject.findUnique({ where: { id: fileId } })
  if (!file) return null
  const stream = await minio.getObject(file.bucket, file.objectKey)
  return { file, stream }
}
