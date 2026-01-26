/**
 * Vitest Test Setup
 * ISO 27001 Compliant Test Environment
 *
 * This file runs before each test file.
 * Global hooks (beforeAll, afterAll) should be in test files, not here.
 */

// Set test environment variables
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
