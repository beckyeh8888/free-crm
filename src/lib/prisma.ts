/**
 * Prisma Client Singleton
 * 避免開發環境中建立過多連線
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use ?? instead of || for nullish coalescing
  let databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';

  // For local file URLs with libsql adapter, resolve to absolute path
  if (databaseUrl.startsWith('file:./') || databaseUrl.startsWith('file:dev.db')) {
    const relativePath = databaseUrl.replace('file:./', '').replace('file:', '');
    // Use path module for proper cross-platform path handling
    const absolutePath = path.resolve(process.cwd(), relativePath);
    databaseUrl = `file:${absolutePath.replaceAll('\\', '/')}`;
  }

  // Debug: log the database URL being used (only in development)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PRISMA) {
    console.log('[Prisma] Database URL:', databaseUrl);
    console.log('[Prisma] CWD:', process.cwd());
  }

  const adapter = new PrismaLibSql({ url: databaseUrl });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
