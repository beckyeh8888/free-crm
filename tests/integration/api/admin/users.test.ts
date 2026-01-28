/**
 * Admin User Management API Integration Tests
 * GET /api/admin/users - List organization users
 * POST /api/admin/users - Create/invite user
 *
 * ISO 27001 A.9.2.1 (User Registration)
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/admin/users/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Admin Users API', () => {
  let adminCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    // Create admin context with all admin permissions
    adminCtx = await createTestContext({
      userEmail: 'admin@example.com',
      roleName: 'Admin',
      permissions: [
        PERMISSIONS.ADMIN_USERS,
        PERMISSIONS.ADMIN_USERS_CREATE,
        PERMISSIONS.ADMIN_USERS_UPDATE,
        PERMISSIONS.ADMIN_USERS_DELETE,
      ],
    });
  });

  const mockAuth = (ctx: TestContext | null) => {
    vi.mocked(getServerSession).mockResolvedValue(
      ctx
        ? {
            user: {
              id: ctx.user.id,
              name: ctx.user.name,
              email: ctx.user.email,
              defaultOrganizationId: ctx.organization.id,
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : null
    );
  };

  describe('GET /api/admin/users', () => {
    it('returns 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/admin/users');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 for user without admin:users permission', async () => {
      const salesCtx = await createTestContext({
        userEmail: 'sales@example.com',
        roleName: 'Sales',
        permissions: [PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_CREATE],
      });
      mockAuth(salesCtx);

      const request = createMockRequest('/api/admin/users');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('returns list of organization members', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      // Should include at least the admin user
      expect(data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns only members of specified organization', async () => {
      mockAuth(adminCtx);

      // Create another org with a user
      const otherCtx = await createTestContext({
        userEmail: 'other@example.com',
        roleName: 'Admin',
        permissions: [PERMISSIONS.ADMIN_USERS],
      });

      const request = createMockRequest('/api/admin/users');
      const response = await GET(request);
      const data = await parseResponse(response);

      // Should not include users from other organization
      const emails = data.data.map((u: { email: string }) => u.email);
      expect(emails).not.toContain(otherCtx.user.email);
    });

    it('supports pagination', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users?page=1&limit=10');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('supports search by name or email', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users?search=admin');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('supports filtering by status', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users?status=active');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      data.data.forEach((user: { memberStatus: string }) => {
        expect(user.memberStatus).toBe('active');
      });
    });

    it('supports filtering by roleId', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest(
        `/api/admin/users?roleId=${adminCtx.role.id}`
      );
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      data.data.forEach((user: { role: { id: string } }) => {
        expect(user.role.id).toBe(adminCtx.role.id);
      });
    });

    it('returns 2FA status for each user', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      data.data.forEach((user: { has2FA: boolean }) => {
        expect(typeof user.has2FA).toBe('boolean');
      });
    });
  });

  describe('POST /api/admin/users', () => {
    it('returns 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'new@example.com',
          name: 'New User',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 for user without admin:users:create permission', async () => {
      // Admin with only view permission
      const viewerCtx = await createTestContext({
        userEmail: 'viewer@example.com',
        roleName: 'Viewer',
        permissions: [PERMISSIONS.ADMIN_USERS],
      });
      mockAuth(viewerCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'new@example.com',
          name: 'New User',
          roleId: viewerCtx.role.id,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('creates/invites a new user', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          name: 'New User',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('newuser@example.com');
      expect(data.data.name).toBe('New User');
      expect(data.data.isInvite).toBe(true);
    });

    it('creates user with password directly', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'direct@example.com',
          name: 'Direct User',
          password: 'Password123!',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.data.isInvite).toBe(false);
    });

    it('returns validation error for invalid email', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'invalid-email',
          name: 'Test User',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('電子郵件');
    });

    it('returns validation error for empty name', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          name: '',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('姓名');
    });

    it('returns validation error for weak password', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'weak@example.com',
          name: 'Weak Password User',
          password: 'weak',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 404 for non-existent role', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'new@example.com',
          name: 'New User',
          roleId: 'non-existent-role-id',
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error.message).toContain('角色');
    });

    it('returns 409 for duplicate member', async () => {
      mockAuth(adminCtx);

      // First create
      const request1 = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'dup@example.com',
          name: 'Duplicate User',
          roleId: adminCtx.role.id,
        },
      });
      await POST(request1);

      // Try to add same user again
      const request2 = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'dup@example.com',
          name: 'Duplicate User',
          roleId: adminCtx.role.id,
        },
      });
      const response = await POST(request2);
      const data = await parseResponse(response);

      expect(response.status).toBe(409);
      expect(data.error.message).toContain('已是組織成員');
    });

    it('creates audit log for user creation', async () => {
      mockAuth(adminCtx);

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: {
          email: 'audited@example.com',
          name: 'Audited User',
          roleId: adminCtx.role.id,
        },
      });
      await POST(request);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'member_invite',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const latest = logs[0];
      expect(latest.userId).toBe(adminCtx.user.id);
      expect(latest.entity).toBe('organization_member');
    });
  });
});
