/**
 * RBAC (Role-Based Access Control) Unit Tests
 * Tests for permission checking and caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PERMISSIONS } from '@/lib/permissions';

// Mock Prisma before importing rbac
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organizationMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
    },
    deal: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  clearPermissionCache,
  getUserPermissions,
  getUserPermissionContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkPermission,
  isOrganizationMember,
  getUserRole,
  hasRole,
  isAdmin,
  isSuperAdmin,
} from '@/lib/rbac';

const mockPrisma = prisma as unknown as {
  organizationMember: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  customer: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  deal: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

describe('RBAC Module', () => {
  const testUserId = 'user-123';
  const testOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear permission cache before each test
    clearPermissionCache(testUserId);
  });

  afterEach(() => {
    clearPermissionCache(testUserId);
  });

  describe('clearPermissionCache', () => {
    it('clears cache for specific user and organization', async () => {
      // Setup mock to return permissions
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
          ],
        },
      });

      // First call - should query database
      await getUserPermissions(testUserId, testOrgId);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await getUserPermissions(testUserId, testOrgId);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(1);

      // Clear cache
      clearPermissionCache(testUserId, testOrgId);

      // Third call - should query database again
      await getUserPermissions(testUserId, testOrgId);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(2);
    });

    it('clears all caches for user when no orgId specified', async () => {
      const orgId1 = 'org-1';
      const orgId2 = 'org-2';

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: { permissions: [] },
      });

      await getUserPermissions(testUserId, orgId1);
      await getUserPermissions(testUserId, orgId2);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(2);

      // Clear all caches for this user
      clearPermissionCache(testUserId);

      await getUserPermissions(testUserId, orgId1);
      await getUserPermissions(testUserId, orgId2);
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(4);
    });
  });

  describe('getUserPermissions', () => {
    it('returns permissions for active member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
            { permission: { code: PERMISSIONS.CUSTOMERS_CREATE } },
          ],
        },
      });

      const permissions = await getUserPermissions(testUserId, testOrgId);

      expect(permissions.has(PERMISSIONS.CUSTOMERS_READ)).toBe(true);
      expect(permissions.has(PERMISSIONS.CUSTOMERS_CREATE)).toBe(true);
      expect(permissions.has(PERMISSIONS.CUSTOMERS_DELETE)).toBe(false);
    });

    it('returns empty set for inactive member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'suspended',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.CUSTOMERS_READ } }],
        },
      });

      const permissions = await getUserPermissions(testUserId, testOrgId);

      expect(permissions.size).toBe(0);
    });

    it('returns empty set for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const permissions = await getUserPermissions(testUserId, testOrgId);

      expect(permissions.size).toBe(0);
    });

    it('filters out invalid permission codes', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
            { permission: { code: 'invalid:permission' } },
          ],
        },
      });

      const permissions = await getUserPermissions(testUserId, testOrgId);

      expect(permissions.size).toBe(1);
      expect(permissions.has(PERMISSIONS.CUSTOMERS_READ)).toBe(true);
    });

    it('uses cache on subsequent calls', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.DEALS_READ } }],
        },
      });

      await getUserPermissions(testUserId, testOrgId);
      await getUserPermissions(testUserId, testOrgId);
      await getUserPermissions(testUserId, testOrgId);

      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserPermissionContext', () => {
    it('returns full context for member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          id: 'role-1',
          name: 'Sales',
          isSystem: true,
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
          ],
        },
      });

      const context = await getUserPermissionContext(testUserId, testOrgId);

      expect(context).not.toBeNull();
      expect(context?.userId).toBe(testUserId);
      expect(context?.organizationId).toBe(testOrgId);
      expect(context?.role.name).toBe('Sales');
      expect(context?.role.isSystem).toBe(true);
      expect(context?.permissions.has(PERMISSIONS.CUSTOMERS_READ)).toBe(true);
    });

    it('returns null for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const context = await getUserPermissionContext(testUserId, testOrgId);

      expect(context).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('returns true when user has permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.DEALS_CREATE } }],
        },
      });

      const result = await hasPermission(testUserId, testOrgId, PERMISSIONS.DEALS_CREATE);

      expect(result).toBe(true);
    });

    it('returns false when user lacks permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.DEALS_READ } }],
        },
      });

      const result = await hasPermission(testUserId, testOrgId, PERMISSIONS.DEALS_DELETE);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
            { permission: { code: PERMISSIONS.DEALS_READ } },
          ],
        },
      });
    });

    it('returns true when user has one of the permissions', async () => {
      const result = await hasAnyPermission(testUserId, testOrgId, [
        PERMISSIONS.CUSTOMERS_DELETE,
        PERMISSIONS.CUSTOMERS_READ,
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user has none of the permissions', async () => {
      const result = await hasAnyPermission(testUserId, testOrgId, [
        PERMISSIONS.ADMIN_USERS,
        PERMISSIONS.ADMIN_ROLES,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(() => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [
            { permission: { code: PERMISSIONS.CUSTOMERS_READ } },
            { permission: { code: PERMISSIONS.CUSTOMERS_CREATE } },
            { permission: { code: PERMISSIONS.CUSTOMERS_UPDATE } },
          ],
        },
      });
    });

    it('returns true when user has all permissions', async () => {
      const result = await hasAllPermissions(testUserId, testOrgId, [
        PERMISSIONS.CUSTOMERS_READ,
        PERMISSIONS.CUSTOMERS_CREATE,
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user lacks some permissions', async () => {
      const result = await hasAllPermissions(testUserId, testOrgId, [
        PERMISSIONS.CUSTOMERS_READ,
        PERMISSIONS.CUSTOMERS_DELETE,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('returns allowed for active member with permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.CONTACTS_READ } }],
        },
      });

      const result = await checkPermission(testUserId, testOrgId, PERMISSIONS.CONTACTS_READ);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('returns not allowed for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const result = await checkPermission(testUserId, testOrgId, PERMISSIONS.CONTACTS_READ);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not a member');
    });

    it('returns not allowed for suspended member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'suspended',
        role: { permissions: [] },
      });

      const result = await checkPermission(testUserId, testOrgId, PERMISSIONS.CONTACTS_READ);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('suspended');
    });

    it('returns not allowed for invited member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'invited',
        role: { permissions: [] },
      });

      const result = await checkPermission(testUserId, testOrgId, PERMISSIONS.CONTACTS_READ);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('invitation');
    });

    it('returns not allowed when lacking permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: { permissions: [] },
      });

      const result = await checkPermission(testUserId, testOrgId, PERMISSIONS.ADMIN_USERS);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('admin:users');
    });
  });

  describe('isOrganizationMember', () => {
    it('returns true for active member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
      });

      const result = await isOrganizationMember(testUserId, testOrgId);

      expect(result).toBe(true);
    });

    it('returns false for inactive member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'suspended',
      });

      const result = await isOrganizationMember(testUserId, testOrgId);

      expect(result).toBe(false);
    });

    it('returns false for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const result = await isOrganizationMember(testUserId, testOrgId);

      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('returns role for member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: {
          id: 'role-123',
          name: 'Manager',
          isSystem: true,
        },
      });

      const role = await getUserRole(testUserId, testOrgId);

      expect(role).not.toBeNull();
      expect(role?.name).toBe('Manager');
    });

    it('returns null for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const role = await getUserRole(testUserId, testOrgId);

      expect(role).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('returns true when user has matching role', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: { name: 'Admin' },
      });

      const result = await hasRole(testUserId, testOrgId, 'Admin');

      expect(result).toBe(true);
    });

    it('returns false when role does not match', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: { name: 'Sales' },
      });

      const result = await hasRole(testUserId, testOrgId, 'Admin');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true when user has admin:users permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.ADMIN_USERS } }],
        },
      });

      const result = await isAdmin(testUserId, testOrgId);

      expect(result).toBe(true);
    });

    it('returns false when user lacks admin:users permission', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        status: 'active',
        role: {
          permissions: [{ permission: { code: PERMISSIONS.CUSTOMERS_READ } }],
        },
      });

      const result = await isAdmin(testUserId, testOrgId);

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for Super Admin role', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: { name: 'Super Admin' },
      });

      const result = await isSuperAdmin(testUserId, testOrgId);

      expect(result).toBe(true);
    });

    it('returns false for other roles', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: { name: 'Admin' },
      });

      const result = await isSuperAdmin(testUserId, testOrgId);

      expect(result).toBe(false);
    });

    it('returns false for non-member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const result = await isSuperAdmin(testUserId, testOrgId);

      expect(result).toBe(false);
    });
  });
});
