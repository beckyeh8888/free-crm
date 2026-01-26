/**
 * Authentication Test Helpers
 * Utilities for testing authenticated API routes
 */

import { vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Type for mock session
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  expires: string;
}

/**
 * Create a test user with hashed password
 */
export async function createTestUser(overrides: {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
} = {}) {
  const password = overrides.password || 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || `test-${Date.now()}@example.com`,
      password: hashedPassword,
      role: overrides.role || 'user',
    },
  });

  return {
    ...user,
    plainPassword: password, // Keep original password for login tests
  };
}

/**
 * Create a mock session object
 */
export function createMockSession(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}): MockSession {
  return {
    user: {
      id: user.id,
      name: user.name || 'Test User',
      email: user.email || 'test@example.com',
      role: user.role || 'user',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Mock getServerSession to return a specific session
 */
export function mockAuthSession(session: MockSession | null) {
  vi.mock('next-auth', async () => {
    const actual = await vi.importActual('next-auth');
    return {
      ...actual,
      getServerSession: vi.fn().mockResolvedValue(session),
    };
  });
}

/**
 * Reset auth mocks
 */
export function resetAuthMocks() {
  vi.resetModules();
  vi.clearAllMocks();
}
