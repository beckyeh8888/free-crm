/**
 * Task CRUD API Integration Tests
 * GET/POST /api/tasks
 * GET/PATCH/DELETE /api/tasks/[id]
 * POST /api/tasks/[id]/complete
 *
 * Sprint 5: Calendar & Gantt Chart
 */

import { vi } from 'vitest';
import { GET, POST } from '@/app/api/tasks/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/tasks/[id]/route';
import { POST as COMPLETE } from '@/app/api/tasks/[id]/complete/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createTask } from '@tests/factories/task.factory';
import { createProject } from '@tests/factories/project.factory';
import { createCustomer } from '@tests/factories/customer.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Task API', () => {
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

  describe('GET /api/tasks', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/tasks');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return tasks for authenticated user', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 1',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 2',
      });

      const request = createMockRequest('/api/tasks');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { title: string }[];
        pagination: { total: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should filter tasks by status', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Pending Task',
        status: 'pending',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Completed Task',
        status: 'completed',
      });

      const request = createMockRequest('/api/tasks?status=pending');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { title: string; status: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Pending Task');
    });

    it('should filter tasks by type', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Meeting Task',
        type: 'meeting',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Call Task',
        type: 'call',
      });

      const request = createMockRequest('/api/tasks?type=meeting');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { title: string; type: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Meeting Task');
    });

    it('should filter tasks by priority', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Urgent Task',
        priority: 'urgent',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Low Task',
        priority: 'low',
      });

      const request = createMockRequest('/api/tasks?priority=urgent');
      const response = await GET(request);
      const data = await parseResponse<{
        data: { title: string; priority: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Urgent Task');
    });

    it('should filter tasks by project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Project Task',
        projectId: project.id,
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'No Project Task',
      });

      const request = createMockRequest(`/api/tasks?projectId=${project.id}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: { title: string }[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Project Task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks', {
        method: 'POST',
        body: ({
          title: 'New Task',
          description: 'Task description',
          type: 'task',
          priority: 'high',
          status: 'pending',
        }),
      });
      const response = await POST(request);
      const data = await parseResponse<{
        data: { id: string; title: string; priority: string };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data.title).toBe('New Task');
      expect(data.data.priority).toBe('high');
    });

    it('should create task with project relation', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      const request = createMockRequest('/api/tasks', {
        method: 'POST',
        body: ({
          title: 'Project Task',
          projectId: project.id,
        }),
      });
      const response = await POST(request);
      const data = await parseResponse<{
        data: { id: string; project: { id: string; name: string } | null };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data.project?.id).toBe(project.id);
    });

    it('should create task with customer relation', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Test Customer',
      });

      const request = createMockRequest('/api/tasks', {
        method: 'POST',
        body: ({
          title: 'Customer Task',
          customerId: customer.id,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should reject empty title', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks', {
        method: 'POST',
        body: ({
          title: '',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks/[id]', () => {
    it('should return a single task', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Test Task',
      });

      const request = createMockRequest(`/api/tasks/${task.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: task.id }) });
      const data = await parseResponse<{
        data: { id: string; title: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(task.id);
      expect(data.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks/non-existent-id');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('should update a task', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Original Title',
        priority: 'low',
      });

      const request = createMockRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: ({
          title: 'Updated Title',
          priority: 'high',
        }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: task.id }) });
      const data = await parseResponse<{
        data: { id: string; title: string; priority: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.title).toBe('Updated Title');
      expect(data.data.priority).toBe('high');
    });

    it('should set completedAt when marking as completed', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task to Complete',
        status: 'pending',
      });

      const request = createMockRequest(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: ({
          status: 'completed',
        }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: task.id }) });
      const data = await parseResponse<{
        data: { id: string; status: string; completedAt: string | null };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('completed');
      expect(data.data.completedAt).not.toBeNull();
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'To Delete',
      });

      const request = createMockRequest(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) });

      expect(response.status).toBe(200);

      // Verify task is deleted
      const getRequest = createMockRequest(`/api/tasks/${task.id}`);
      const getResponse = await GET_BY_ID(getRequest, { params: Promise.resolve({ id: task.id }) });
      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST /api/tasks/[id]/complete', () => {
    it('should mark task as completed', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task to Complete',
        status: 'pending',
      });

      const request = createMockRequest(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
      });
      const response = await COMPLETE(request, { params: Promise.resolve({ id: task.id }) });
      const data = await parseResponse<{
        data: { id: string; status: string; progress: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('completed');
      expect(data.data.progress).toBe(100);
    });

    it('should toggle completion (reopen task)', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Completed Task',
        status: 'completed',
      });

      const request = createMockRequest(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
      });
      const response = await COMPLETE(request, { params: Promise.resolve({ id: task.id }) });
      const data = await parseResponse<{
        data: { id: string; status: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('pending');
    });
  });
});
