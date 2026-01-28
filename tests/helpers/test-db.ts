/**
 * Test Database Utilities
 * Provides database setup, cleanup, and isolation for tests
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { prisma } from '@/lib/prisma';

/**
 * Helper to retry database operations that may fail due to SQLite locking
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Clear all data from the test database
 * Tables are deleted in reverse dependency order
 */
export async function clearDatabase() {
  // Delete in reverse dependency order to avoid foreign key constraints
  // Using sequential deletes with retry to handle SQLite SQLITE_BUSY errors

  // Document related
  await withRetry(() => prisma.documentAnalysis.deleteMany());
  await withRetry(() => prisma.document.deleteMany());

  // Audit and security
  await withRetry(() => prisma.auditLog.deleteMany());
  await withRetry(() => prisma.loginHistory.deleteMany());
  await withRetry(() => prisma.twoFactorAuth.deleteMany());

  // Business entities
  await withRetry(() => prisma.deal.deleteMany());
  await withRetry(() => prisma.contact.deleteMany());
  await withRetry(() => prisma.customer.deleteMany());

  // RBAC and multi-tenant (in reverse order)
  await withRetry(() => prisma.rolePermission.deleteMany());
  await withRetry(() => prisma.permission.deleteMany());
  await withRetry(() => prisma.organizationMember.deleteMany());
  await withRetry(() => prisma.role.deleteMany());
  await withRetry(() => prisma.organization.deleteMany());

  // Auth related
  await withRetry(() => prisma.session.deleteMany());
  await withRetry(() => prisma.account.deleteMany());
  await withRetry(() => prisma.verificationToken.deleteMany());

  // Users last
  await withRetry(() => prisma.user.deleteMany());
}

/**
 * Setup test database with migrations
 * Run this once before all tests
 */
export async function setupTestDatabase() {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Not using test database! Check DATABASE_URL');
  }

  // Clear all existing data
  await clearDatabase();
}

/**
 * Disconnect from database
 * Run this after all tests
 */
export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

/**
 * Get Prisma client for direct database operations in tests
 */
export { prisma };
