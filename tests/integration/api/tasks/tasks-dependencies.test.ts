/**
 * Task Dependencies API Integration Tests
 * GET/POST/DELETE /api/tasks/[id]/dependencies
 *
 * Sprint 5: Calendar & Gantt Chart
 */

import { vi } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/tasks/[id]/dependencies/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createTask } from '@tests/factories/task.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Task Dependencies API', () => {
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

  describe('GET /api/tasks/[id]/dependencies', () => {
    it('should return task dependencies', async () => {
      mockAuth(testCtx);

      const task1 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Prerequisite Task',
      });

      const task2 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Dependent Task',
      });

      await prisma.taskDependency.create({
        data: {
          prerequisiteId: task1.id,
          dependentId: task2.id,
          type: 'finish_to_start',
        },
      });

      const request = createMockRequest(`/api/tasks/${task2.id}/dependencies`);
      const response = await GET(request, { params: Promise.resolve({ id: task2.id }) });
      const data = await parseResponse<{
        data: {
          taskId: string;
          dependencies: { task: { id: string; title: string } }[];
          dependents: { task: { id: string; title: string } }[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.taskId).toBe(task2.id);
      expect(data.data.dependencies.length).toBe(1);
      expect(data.data.dependencies[0].task.id).toBe(task1.id);
      expect(data.data.dependents.length).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks/non-existent-id/dependencies');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tasks/[id]/dependencies', () => {
    it('should create a dependency', async () => {
      mockAuth(testCtx);

      const prerequisite = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Prerequisite Task',
      });

      const dependent = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Dependent Task',
      });

      const request = createMockRequest(`/api/tasks/${dependent.id}/dependencies`, {
        method: 'POST',
        body: ({
          prerequisiteId: prerequisite.id,
          type: 'finish_to_start',
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: dependent.id }) });
      const data = await parseResponse<{
        data: {
          id: string;
          type: string;
          prerequisite: { id: string };
          dependent: { id: string };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data.type).toBe('finish_to_start');
      expect(data.data.prerequisite.id).toBe(prerequisite.id);
      expect(data.data.dependent.id).toBe(dependent.id);
    });

    it('should prevent self-dependency', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Test Task',
      });

      const request = createMockRequest(`/api/tasks/${task.id}/dependencies`, {
        method: 'POST',
        body: ({
          prerequisiteId: task.id,
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: task.id }) });

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate dependency', async () => {
      mockAuth(testCtx);

      const prerequisite = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Prerequisite Task',
      });

      const dependent = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Dependent Task',
      });

      // Create first dependency
      await prisma.taskDependency.create({
        data: {
          prerequisiteId: prerequisite.id,
          dependentId: dependent.id,
          type: 'finish_to_start',
        },
      });

      // Try to create duplicate
      const request = createMockRequest(`/api/tasks/${dependent.id}/dependencies`, {
        method: 'POST',
        body: ({
          prerequisiteId: prerequisite.id,
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: dependent.id }) });

      expect(response.status).toBe(400);
    });

    it('should prevent circular dependency', async () => {
      mockAuth(testCtx);

      const task1 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 1',
      });

      const task2 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 2',
      });

      const task3 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 3',
      });

      // Create chain: task1 -> task2 -> task3
      await prisma.taskDependency.create({
        data: {
          prerequisiteId: task1.id,
          dependentId: task2.id,
          type: 'finish_to_start',
        },
      });

      await prisma.taskDependency.create({
        data: {
          prerequisiteId: task2.id,
          dependentId: task3.id,
          type: 'finish_to_start',
        },
      });

      // Try to create circular: task3 -> task1 (would create task1 -> task2 -> task3 -> task1)
      const request = createMockRequest(`/api/tasks/${task1.id}/dependencies`, {
        method: 'POST',
        body: ({
          prerequisiteId: task3.id,
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: task1.id }) });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/[id]/dependencies', () => {
    it('should delete a dependency by dependencyId', async () => {
      mockAuth(testCtx);

      const prerequisite = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Prerequisite Task',
      });

      const dependent = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Dependent Task',
      });

      const dependency = await prisma.taskDependency.create({
        data: {
          prerequisiteId: prerequisite.id,
          dependentId: dependent.id,
          type: 'finish_to_start',
        },
      });

      const request = createMockRequest(`/api/tasks/${dependent.id}/dependencies?dependencyId=${dependency.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: dependent.id }) });

      expect(response.status).toBe(200);

      // Verify deletion
      const deleted = await prisma.taskDependency.findUnique({
        where: { id: dependency.id },
      });
      expect(deleted).toBeNull();
    });

    it('should delete a dependency by prerequisiteId', async () => {
      mockAuth(testCtx);

      const prerequisite = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Prerequisite Task',
      });

      const dependent = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Dependent Task',
      });

      await prisma.taskDependency.create({
        data: {
          prerequisiteId: prerequisite.id,
          dependentId: dependent.id,
          type: 'finish_to_start',
        },
      });

      const request = createMockRequest(`/api/tasks/${dependent.id}/dependencies?prerequisiteId=${prerequisite.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: dependent.id }) });

      expect(response.status).toBe(200);

      // Verify deletion
      const remaining = await prisma.taskDependency.findMany({
        where: { dependentId: dependent.id },
      });
      expect(remaining.length).toBe(0);
    });

    it('should return 400 when no identifier is provided', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Test Task',
      });

      const request = createMockRequest(`/api/tasks/${task.id}/dependencies`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent dependency', async () => {
      mockAuth(testCtx);

      const task = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Test Task',
      });

      const request = createMockRequest(`/api/tasks/${task.id}/dependencies?dependencyId=non-existent-id`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) });

      expect(response.status).toBe(404);
    });
  });
});
