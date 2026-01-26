/**
 * User Test Data Factory
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface UserFactoryData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
}

let userCounter = 0;

/**
 * Build user data without creating in database
 */
export function buildUser(overrides: UserFactoryData = {}) {
  userCounter++;
  return {
    name: overrides.name ?? `Test User ${userCounter}`,
    email: overrides.email ?? `test-user-${userCounter}-${Date.now()}@example.com`,
    password: overrides.password ?? 'TestPass123!',
    role: overrides.role ?? 'user',
  };
}

/**
 * Create user in database with hashed password
 */
export async function createUser(overrides: UserFactoryData = {}) {
  const data = buildUser(overrides);
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  return {
    ...user,
    plainPassword: data.password,
  };
}

/**
 * Reset factory counter (call in beforeEach)
 */
export function resetUserFactory() {
  userCounter = 0;
}
