import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import type { PoolConfig } from 'mariadb'
import { PrismaClient } from '../generated/prisma/client.js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

/** MySQL 8 default `caching_sha2_password` needs this for local TCP unless using TLS or a server RSA key file. */
function poolConfigFromDatabaseUrl(urlString: string): PoolConfig {
  const url = new URL(urlString)
  const database = url.pathname.replace(/^\//, '') || undefined
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ...(database ? { database } : {}),
    allowPublicKeyRetrieval: true,
  }
}

const adapter = new PrismaMariaDb(poolConfigFromDatabaseUrl(databaseUrl))

export const prisma = new PrismaClient({ adapter })
