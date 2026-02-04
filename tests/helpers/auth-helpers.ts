/**
 * Authentication Test Helpers
 * Utilities for testing authenticated API routes
 * Updated for multi-tenant schema (Sprint 2)
 */

import { vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS } from '@/lib/permissions';

// Type for mock session (simplified - role is now via organization membership)
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
  expires: string;
}

// Type for full test context with organization
export interface TestContext {
  user: {
    id: string;
    name: string | null;
    email: string;
    plainPassword: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    status: string;
  };
}

/**
 * Create a test user with hashed password
 */
export async function createTestUser(overrides: {
  name?: string;
  email?: string;
  password?: string;
  status?: 'active' | 'suspended' | 'pending';
} = {}) {
  const password = overrides.password || 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || `test-${Date.now()}@example.com`,
      password: hashedPassword,
      status: overrides.status || 'active',
    },
  });

  return {
    ...user,
    plainPassword: password, // Keep original password for login tests
  };
}

/**
 * Create a complete test context with user, organization, role, and membership
 * This is the recommended way to set up tests for multi-tenant functionality
 */
export async function createTestContext(overrides: {
  userName?: string;
  userEmail?: string;
  userPassword?: string;
  orgName?: string;
  roleName?: string;
  permissions?: string[];
} = {}): Promise<TestContext> {
  const password = overrides.userPassword || 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  const timestamp = Date.now();

  // Create user
  const user = await prisma.user.create({
    data: {
      name: overrides.userName || 'Test User',
      email: overrides.userEmail || `test-${timestamp}@example.com`,
      password: hashedPassword,
      status: 'active',
    },
  });

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: overrides.orgName || 'Test Organization',
      slug: `test-org-${timestamp}`,
      plan: 'free',
    },
  });

  // Create role with permissions
  const roleName = overrides.roleName || 'Admin';
  const permissions = overrides.permissions || [
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.DEALS_READ,
    PERMISSIONS.DEALS_CREATE,
    PERMISSIONS.DEALS_UPDATE,
    PERMISSIONS.DEALS_DELETE,
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_UPDATE,
    PERMISSIONS.CONTACTS_DELETE,
    // Sprint 5: Project & Task permissions
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_MANAGE,
  ];

  const role = await prisma.role.create({
    data: {
      name: roleName,
      description: 'Test role',
      organizationId: organization.id,
      isSystem: false,
      isDefault: true,
    },
  });

  // Create permissions if they don't exist and link to role
  for (const permCode of permissions) {
    let permission = await prisma.permission.findUnique({
      where: { code: permCode },
    });

    if (!permission) {
      const [category] = permCode.split(':');
      permission = await prisma.permission.create({
        data: {
          code: permCode,
          name: permCode,
          category,
        },
      });
    }

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  // Create organization membership
  const member = await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      roleId: role.id,
      status: 'active',
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plainPassword: password,
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    role: {
      id: role.id,
      name: role.name,
    },
    member: {
      id: member.id,
      status: member.status,
    },
  };
}

/**
 * Create a mock session object (simplified for multi-tenant)
 */
export function createMockSession(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): MockSession {
  return {
    user: {
      id: user.id,
      name: user.name || 'Test User',
      email: user.email || 'test@example.com',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Note: For mocking auth session in tests, use vi.mock at the top of your test file:
// vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
// Then use: vi.mocked(getServerSession).mockResolvedValue(session);

/**
 * Reset auth mocks
 */
export function resetAuthMocks() {
  vi.resetModules();
  vi.clearAllMocks();
}
