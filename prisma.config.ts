import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

// Prisma config 存在时不会自动加载 .env，需要手动加载
dotenv.config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  seed: {
    run: 'tsx src/seed.ts'
  }
})
