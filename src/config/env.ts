import dotenv from 'dotenv'

dotenv.config()

const toBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

const nodeEnv = process.env.NODE_ENV ?? 'development'

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 8080),
  tenantEnable: toBool(process.env.TENANT_ENABLE, true),
  skipAuth: toBool(process.env.SKIP_AUTH, nodeEnv === 'development'),
  externalTokenLogin: toBool(process.env.EXTERNAL_TOKEN_LOGIN, false),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  refreshSecret: process.env.REFRESH_SECRET ?? 'change-me-too',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',
  minio: {
    endPoint: process.env.MINIO_ENDPOINT ?? '127.0.0.1',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: toBool(process.env.MINIO_USE_SSL, false),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'collabedit-files'
  }
}
