/**
 * API Utilities Tests
 * Tests for ISO 27001 compliant API utilities
 *
 * @vitest-environment node
 */

import { vi } from 'vitest';

// Mock next/server before imports
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, options) => ({
      body,
      status: options?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
    deal: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock rbac
vi.mock('@/lib/rbac', () => ({
  getUserPermissionContext: vi.fn(),
  canAccessCustomer: vi.fn(),
  canAccessDeal: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getUserPermissionContext, canAccessCustomer, canAccessDeal } from '@/lib/rbac';
import {
  successResponse,
  listResponse,
  errorResponse,
  getSession,
  requireAuth,
  requireOrgMember,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireCustomerAccess,
  requireDealAccess,
  getOrganizationId,
  logAudit,
  logAdminAction,
  getPaginationParams,
  checkCustomerOwnership,
  checkDealOwnership,
} from '@/lib/api-utils';
import type { UserPermissionContext } from '@/lib/rbac';
import type { Session } from 'next-auth';

describe('api-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Response Helpers
  // ============================================

  describe('successResponse', () => {
    it('returns success response with data', () => {
      const data = { id: '1', name: 'Test' };
      const response = successResponse(data);

      expect(response.body).toEqual({
        success: true,
        data,
      });
      expect(response.status).toBe(200);
    });

    it('allows custom status code', () => {
      const data = { id: '1' };
      const response = successResponse(data, 201);

      expect(response.status).toBe(201);
    });

    it('handles array data', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = successResponse(data);

      expect(response.body.data).toEqual(data);
    });

    it('handles null data', () => {
      const response = successResponse(null);

      expect(response.body.data).toBeNull();
    });
  });

  describe('listResponse', () => {
    it('returns list response with pagination', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = { page: 1, limit: 10, total: 50 };
      const response = listResponse(data, pagination);

      expect(response.body).toEqual({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      });
    });

    it('calculates totalPages correctly', () => {
      const data: unknown[] = [];
      const pagination = { page: 1, limit: 20, total: 45 };
      const response = listResponse(data, pagination);

      expect(response.body.pagination.totalPages).toBe(3); // ceil(45/20) = 3
    });

    it('handles empty data', () => {
      const response = listResponse([], { page: 1, limit: 10, total: 0 });

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalPages).toBe(0);
    });
  });

  describe('errorResponse', () => {
    it('returns error response with correct status for VALIDATION_ERROR', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input');

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      });
      expect(response.status).toBe(400);
    });

    it('returns correct status for NOT_FOUND', () => {
      const response = errorResponse('NOT_FOUND', 'Resource not found');

      expect(response.status).toBe(404);
    });

    it('returns correct status for UNAUTHORIZED', () => {
      const response = errorResponse('UNAUTHORIZED', 'Not authenticated');

      expect(response.status).toBe(401);
    });

    it('returns correct status for FORBIDDEN', () => {
      const response = errorResponse('FORBIDDEN', 'Access denied');

      expect(response.status).toBe(403);
    });

    it('returns correct status for CONFLICT', () => {
      const response = errorResponse('CONFLICT', 'Resource conflict');

      expect(response.status).toBe(409);
    });

    it('returns correct status for INTERNAL_ERROR', () => {
      const response = errorResponse('INTERNAL_ERROR', 'Server error');

      expect(response.status).toBe(500);
    });

    it('allows custom status override', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Custom error', 422);

      expect(response.status).toBe(422);
    });
  });

  // ============================================
  // Auth Helpers
  // ============================================

  describe('getSession', () => {
    it('calls getServerSession with authOptions', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await getSession();

      expect(getServerSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe('requireAuth', () => {
    it('returns session when authenticated', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('returns error when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when session has no user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({} as Session);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('returns error when user has no id', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: {} } as Session);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================
  // Organization & Permission Helpers
  // ============================================

  describe('requireOrgMember', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['customers:read']),
    };

    it('returns context when user is active member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requireOrgMember(mockSession, 'org-1');

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when session has no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requireOrgMember(sessionWithoutId, 'org-1');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requireOrgMember(mockSession, 'org-1');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member status is not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'suspended',
      });

      const result = await requireOrgMember(mockSession, 'org-1');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('requirePermission', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['customers:read', 'customers:write']),
    };

    it('returns context when user has permission', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requirePermission(mockSession, 'org-1', 'customers:read');

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when user lacks permission', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requirePermission(mockSession, 'org-1', 'admin:settings');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requirePermission(sessionWithoutId, 'org-1', 'customers:read');

      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requirePermission(mockSession, 'org-1', 'customers:read');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'pending',
      });

      const result = await requirePermission(mockSession, 'org-1', 'customers:read');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('requireAnyPermission', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['customers:read']),
    };

    it('returns context when user has any of the permissions', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requireAnyPermission(mockSession, 'org-1', [
        'customers:read',
        'customers:write',
      ]);

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when user has none of the permissions', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requireAnyPermission(mockSession, 'org-1', [
        'deals:read',
        'deals:write',
      ]);

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requireAnyPermission(sessionWithoutId, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requireAnyPermission(mockSession, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'suspended',
      });

      const result = await requireAnyPermission(mockSession, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('requireAllPermissions', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['customers:read', 'customers:write', 'deals:read']),
    };

    it('returns context when user has all permissions', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requireAllPermissions(mockSession, 'org-1', [
        'customers:read',
        'customers:write',
      ]);

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when user lacks some permissions', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);

      const result = await requireAllPermissions(mockSession, 'org-1', [
        'customers:read',
        'admin:settings',
      ]);

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
      expect(result.error?.body.error.message).toContain('admin:settings');
    });

    it('returns error when no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requireAllPermissions(sessionWithoutId, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requireAllPermissions(mockSession, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'pending',
      });

      const result = await requireAllPermissions(mockSession, 'org-1', ['customers:read']);

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================
  // Access Helpers
  // ============================================

  describe('requireCustomerAccess', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['customers:read']),
    };

    it('returns context when user can access customer', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);
      vi.mocked(canAccessCustomer).mockResolvedValue(true);

      const result = await requireCustomerAccess(mockSession, 'org-1', 'customer-1');

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when user cannot access customer', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);
      vi.mocked(canAccessCustomer).mockResolvedValue(false);

      const result = await requireCustomerAccess(mockSession, 'org-1', 'customer-1');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requireCustomerAccess(sessionWithoutId, 'org-1', 'customer-1');

      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requireCustomerAccess(mockSession, 'org-1', 'customer-1');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'suspended',
      });

      const result = await requireCustomerAccess(mockSession, 'org-1', 'customer-1');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('requireDealAccess', () => {
    const mockSession = { user: { id: 'user-1' } } as Session;
    const mockContext: UserPermissionContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      memberStatus: 'active',
      roleId: 'role-1',
      roleName: 'member',
      permissions: new Set(['deals:read']),
    };

    it('returns context when user can access deal', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);
      vi.mocked(canAccessDeal).mockResolvedValue(true);

      const result = await requireDealAccess(mockSession, 'org-1', 'deal-1');

      expect(result.context).toEqual(mockContext);
      expect(result.error).toBeNull();
    });

    it('returns error when user cannot access deal', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(mockContext);
      vi.mocked(canAccessDeal).mockResolvedValue(false);

      const result = await requireDealAccess(mockSession, 'org-1', 'deal-1');

      expect(result.context).toBeNull();
      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when no user id', async () => {
      const sessionWithoutId = { user: {} } as Session;

      const result = await requireDealAccess(sessionWithoutId, 'org-1', 'deal-1');

      expect(result.error?.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns error when not a member', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue(null);

      const result = await requireDealAccess(mockSession, 'org-1', 'deal-1');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });

    it('returns error when member not active', async () => {
      vi.mocked(getUserPermissionContext).mockResolvedValue({
        ...mockContext,
        memberStatus: 'pending',
      });

      const result = await requireDealAccess(mockSession, 'org-1', 'deal-1');

      expect(result.error?.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('getOrganizationId', () => {
    it('returns organization ID from header', () => {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-organization-id': 'org-from-header' },
      });

      const result = getOrganizationId(request);

      expect(result).toBe('org-from-header');
    });

    it('returns organization ID from query param when no header', () => {
      const request = new Request('http://localhost/api/test?organizationId=org-from-query');

      const result = getOrganizationId(request);

      expect(result).toBe('org-from-query');
    });

    it('prefers header over query param', () => {
      const request = new Request(
        'http://localhost/api/test?organizationId=org-from-query',
        { headers: { 'x-organization-id': 'org-from-header' } }
      );

      const result = getOrganizationId(request);

      expect(result).toBe('org-from-header');
    });

    it('returns null when no organization ID', () => {
      const request = new Request('http://localhost/api/test');

      const result = getOrganizationId(request);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // Audit Log Helpers
  // ============================================

  describe('logAudit', () => {
    it('creates audit log entry', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValue({} as never);

      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
        },
      });

      await logAudit({
        action: 'create',
        entity: 'customer',
        entityId: 'cust-1',
        userId: 'user-1',
        organizationId: 'org-1',
        details: { name: 'Test' },
        metadata: { source: 'api' },
        request,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: 'create',
          entity: 'customer',
          entityId: 'cust-1',
          userId: 'user-1',
          organizationId: 'org-1',
          details: JSON.stringify({ name: 'Test' }),
          metadata: JSON.stringify({ source: 'api' }),
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
        },
      });
    });

    it('uses x-real-ip when x-forwarded-for is not available', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValue({} as never);

      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-real-ip': '10.0.0.1',
          'user-agent': 'test-agent',
        },
      });

      await logAudit({
        action: 'read',
        entity: 'deal',
        request,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress: '10.0.0.1',
          }),
        })
      );
    });

    it('uses unknown when no IP headers', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValue({} as never);

      const request = new Request('http://localhost/api/test');

      await logAudit({
        action: 'delete',
        entity: 'contact',
        request,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress: 'unknown',
            userAgent: 'unknown',
          }),
        })
      );
    });

    it('handles null details and metadata', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValue({} as never);

      await logAudit({
        action: 'login',
        entity: 'session',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: null,
            metadata: null,
          }),
        })
      );
    });

    it('does not throw on error', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        logAudit({
          action: 'update',
          entity: 'customer',
        })
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Audit log error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('logAdminAction', () => {
    it('calls logAudit with admin-specific metadata', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValue({} as never);

      await logAdminAction({
        action: 'role_change',
        entity: 'organizationMember',
        entityId: 'member-1',
        userId: 'admin-1',
        organizationId: 'org-1',
        targetUserId: 'user-2',
        before: { role: 'member' },
        after: { role: 'admin' },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'role_change',
          entity: 'organizationMember',
          entityId: 'member-1',
          userId: 'admin-1',
          organizationId: 'org-1',
          details: JSON.stringify({
            before: { role: 'member' },
            after: { role: 'admin' },
          }),
          metadata: JSON.stringify({
            targetUserId: 'user-2',
            adminAction: true,
          }),
        }),
      });
    });
  });

  // ============================================
  // Pagination Helpers
  // ============================================

  describe('getPaginationParams', () => {
    it('returns default values for empty params', () => {
      const searchParams = new URLSearchParams();

      const result = getPaginationParams(searchParams);

      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('parses page and limit from params', () => {
      const searchParams = new URLSearchParams('page=3&limit=50');

      const result = getPaginationParams(searchParams);

      expect(result).toEqual({
        page: 3,
        limit: 50,
        skip: 100, // (3-1) * 50
      });
    });

    it('enforces minimum page of 1', () => {
      const searchParams = new URLSearchParams('page=-5&limit=10');

      const result = getPaginationParams(searchParams);

      expect(result.page).toBe(1);
    });

    it('enforces minimum limit of 1', () => {
      const searchParams = new URLSearchParams('page=1&limit=0');

      const result = getPaginationParams(searchParams);

      expect(result.limit).toBe(1);
    });

    it('enforces maximum limit of 100', () => {
      const searchParams = new URLSearchParams('page=1&limit=500');

      const result = getPaginationParams(searchParams);

      expect(result.limit).toBe(100);
    });

    it('calculates skip correctly', () => {
      const searchParams = new URLSearchParams('page=5&limit=25');

      const result = getPaginationParams(searchParams);

      expect(result.skip).toBe(100); // (5-1) * 25
    });
  });

  // ============================================
  // Ownership Helpers
  // ============================================

  describe('checkCustomerOwnership', () => {
    it('returns exists false when customer not found', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      const result = await checkCustomerOwnership('cust-1', 'user-1', 'org-1');

      expect(result).toEqual({
        exists: false,
        isOwner: false,
        isAssigned: false,
        belongsToOrg: false,
      });
    });

    it('returns ownership info when customer exists', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: 'user-2',
        organizationId: 'org-1',
      } as never);

      const result = await checkCustomerOwnership('cust-1', 'user-1', 'org-1');

      expect(result).toEqual({
        exists: true,
        isOwner: true,
        isAssigned: false,
        belongsToOrg: true,
        hasAccess: true,
      });
    });

    it('returns isAssigned true when user is assigned', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        createdById: 'other-user',
        assignedToId: 'user-1',
        organizationId: 'org-1',
      } as never);

      const result = await checkCustomerOwnership('cust-1', 'user-1', 'org-1');

      expect(result.isAssigned).toBe(true);
      expect(result.hasAccess).toBe(true);
    });

    it('returns belongsToOrg false when org mismatch', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: null,
        organizationId: 'org-2',
      } as never);

      const result = await checkCustomerOwnership('cust-1', 'user-1', 'org-1');

      expect(result.belongsToOrg).toBe(false);
      expect(result.hasAccess).toBe(false);
    });

    it('returns belongsToOrg true when no org specified', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: null,
        organizationId: 'org-2',
      } as never);

      const result = await checkCustomerOwnership('cust-1', 'user-1');

      expect(result.belongsToOrg).toBe(true);
    });
  });

  describe('checkDealOwnership', () => {
    it('returns exists false when deal not found', async () => {
      vi.mocked(prisma.deal.findUnique).mockResolvedValue(null);

      const result = await checkDealOwnership('deal-1', 'user-1', 'org-1');

      expect(result).toEqual({
        exists: false,
        isOwner: false,
        isAssigned: false,
        belongsToOrg: false,
      });
    });

    it('returns ownership info when deal exists', async () => {
      vi.mocked(prisma.deal.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: 'user-2',
        customer: { organizationId: 'org-1' },
      } as never);

      const result = await checkDealOwnership('deal-1', 'user-1', 'org-1');

      expect(result).toEqual({
        exists: true,
        isOwner: true,
        isAssigned: false,
        belongsToOrg: true,
        hasAccess: true,
      });
    });

    it('returns isAssigned true when user is assigned', async () => {
      vi.mocked(prisma.deal.findUnique).mockResolvedValue({
        createdById: 'other-user',
        assignedToId: 'user-1',
        customer: { organizationId: 'org-1' },
      } as never);

      const result = await checkDealOwnership('deal-1', 'user-1', 'org-1');

      expect(result.isAssigned).toBe(true);
      expect(result.hasAccess).toBe(true);
    });

    it('returns belongsToOrg false when org mismatch', async () => {
      vi.mocked(prisma.deal.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: null,
        customer: { organizationId: 'org-2' },
      } as never);

      const result = await checkDealOwnership('deal-1', 'user-1', 'org-1');

      expect(result.belongsToOrg).toBe(false);
      expect(result.hasAccess).toBe(false);
    });

    it('returns belongsToOrg true when no org specified', async () => {
      vi.mocked(prisma.deal.findUnique).mockResolvedValue({
        createdById: 'user-1',
        assignedToId: null,
        customer: { organizationId: 'org-2' },
      } as never);

      const result = await checkDealOwnership('deal-1', 'user-1');

      expect(result.belongsToOrg).toBe(true);
    });
  });
});
