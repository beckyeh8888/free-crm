/**
 * Vitest Test Setup
 * ISO 27001 Compliant Test Environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Note: beforeAll, afterAll, afterEach are available as globals
// when vitest.config.ts has globals: true
