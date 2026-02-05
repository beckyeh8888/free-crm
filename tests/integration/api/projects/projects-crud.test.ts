/**
 * Project CRUD API Integration Tests
 * GET/POST /api/projects
 * GET/PATCH/DELETE /api/projects/[id]
 *
 * Sprint 5: Calendar & Gantt Chart
 */

import { vi } from 'vitest';
import { GET, POST } from '@/app/api/projects/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/projects/[id]/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createProject } from '@tests/factories/project.factory';
import { createCustomer } from '@tests/factories/customer.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Project API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'test@example.com' });
  });

  const mockAuth = (ctx: TestContext | null) => {
    vi.mocked(getServerSession).mockResolvedValue(
      ctx
        ? {
            user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : null
    );
  };

  describe('GET /api/projects', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/projects');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return projects for authenticated user', async () => {
      mockAuth(testCtx);

      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Project 1',
      });
      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Project 2',
      });

      const request = createMockRequest('/api/projects');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { name: string }[];
        pagination: { total: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should filter projects by status', async () => {
      mockAuth(testCtx);

      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Active Project',
        status: 'active',
      });
      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Completed Project',
        status: 'completed',
      });

      const request = createMockRequest('/api/projects?status=active');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { name: string; status: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Active Project');
    });

    it('should search projects by name', async () => {
      mockAuth(testCtx);

      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Alpha Project',
      });
      await createProject({
        organizationId: testCtx.organization.id,
        name: 'Beta Project',
      });

      const request = createMockRequest('/api/projects?search=Alpha');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { name: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Alpha Project');
    });

    it('should not return projects from other organizations', async () => {
      mockAuth(testCtx);

      await createProject({
        organizationId: testCtx.organization.id,
        name: 'My Project',
      });

      // Create project in another organization
      const otherCtx = await createTestContext({ userEmail: 'other@example.com' });
      await createProject({
        organizationId: otherCtx.organization.id,
        name: 'Other Project',
      });

      const request = createMockRequest('/api/projects');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { name: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('My Project');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/projects', {
        method: 'POST',
        body: ({
          name: 'New Project',
          description: 'Project description',
          status: 'active',
          color: '#3B82F6',
        }),
      });
      const response = await POST(request);
      const data = await parseResponse<{
        data: { id: string; name: string; description: string; status: string; color: string };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data.name).toBe('New Project');
      expect(data.data.description).toBe('Project description');
      expect(data.data.status).toBe('active');
      expect(data.data.color).toBe('#3B82F6');
    });

    it('should create project with customer relation', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Test Customer',
      });

      const request = createMockRequest('/api/projects', {
        method: 'POST',
        body: ({
          name: 'Customer Project',
          customerId: customer.id,
        }),
      });
      const response = await POST(request);
      const data = await parseResponse<{
        data: { id: string; customer: { id: string; name: string } | null };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data.customer?.id).toBe(customer.id);
      expect(data.data.customer?.name).toBe('Test Customer');
    });

    it('should reject invalid project data', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/projects', {
        method: 'POST',
        body: ({
          name: '', // Empty name should be rejected
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/projects/[id]', () => {
    it('should return a single project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      const request = createMockRequest(`/api/projects/${project.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: project.id }) });
      const data = await parseResponse<{
        data: { id: string; name: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(project.id);
      expect(data.data.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/projects/non-existent-id');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/projects/[id]', () => {
    it('should update a project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Original Name',
      });

      const request = createMockRequest(`/api/projects/${project.id}`, {
        method: 'PATCH',
        body: ({
          name: 'Updated Name',
          status: 'completed',
        }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: project.id }) });
      const data = await parseResponse<{
        data: { id: string; name: string; status: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Name');
      expect(data.data.status).toBe('completed');
    });
  });

  describe('DELETE /api/projects/[id]', () => {
    it('should delete a project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'To Delete',
      });

      const request = createMockRequest(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: project.id }) });

      expect(response.status).toBe(200);

      // Verify project is deleted
      const getRequest = createMockRequest(`/api/projects/${project.id}`);
      const getResponse = await GET_BY_ID(getRequest, { params: Promise.resolve({ id: project.id }) });
      expect(getResponse.status).toBe(404);
    });
  });
});
