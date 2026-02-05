/**
 * Task Gantt API Integration Tests
 * GET /api/tasks/gantt
 *
 * Sprint 5: Calendar & Gantt Chart
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/tasks/gantt/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createTask } from '@tests/factories/task.factory';
import { createProject } from '@tests/factories/project.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Task Gantt API', () => {
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

  describe('GET /api/tasks/gantt', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const start = new Date().toISOString();
      const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}`);
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when start/end params are missing', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks/gantt');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return tasks within date range', async () => {
      mockAuth(testCtx);

      const now = new Date();
      const inRangeStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const inRangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Gantt Task',
        startDate: inRangeStart,
        dueDate: inRangeEnd,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          tasks: { title: string }[];
          totalCount: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.totalCount).toBe(1);
      expect(data.data.tasks[0].title).toBe('Gantt Task');
    });

    it('should filter by project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Project Task',
        projectId: project.id,
        startDate: now,
        dueDate,
      });

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Other Task',
        startDate: now,
        dueDate,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}&projectId=${project.id}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          tasks: { title: string }[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.tasks.length).toBe(1);
      expect(data.data.tasks[0].title).toBe('Project Task');
    });

    it('should include dependencies when requested', async () => {
      mockAuth(testCtx);

      const now = new Date();
      const task1Start = now;
      const task1End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const task2Start = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
      const task2End = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const task1 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 1',
        startDate: task1Start,
        dueDate: task1End,
      });

      const task2 = await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Task 2',
        startDate: task2Start,
        dueDate: task2End,
      });

      // Create dependency: Task 2 depends on Task 1
      await prisma.taskDependency.create({
        data: {
          prerequisiteId: task1.id,
          dependentId: task2.id,
          type: 'finish_to_start',
        },
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}&includeDependencies=true`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          tasks: { title: string; dependencies: { taskId: string }[] }[];
          links: { source: string; target: string; type: string }[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.links.length).toBe(1);
      expect(data.data.links[0].source).toBe(task1.id);
      expect(data.data.links[0].target).toBe(task2.id);
      expect(data.data.links[0].type).toBe('finish_to_start');
    });

    it('should group tasks by project when no filter is applied', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Project Task',
        projectId: project.id,
        startDate: now,
        dueDate,
      });

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Ungrouped Task',
        startDate: now,
        dueDate,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          grouped: {
            byProject: { id: string; name: string; tasks: string[] }[];
            ungrouped: string[];
          } | null;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.grouped).not.toBeNull();
      expect(data.data.grouped?.byProject.length).toBe(1);
      expect(data.data.grouped?.byProject[0].name).toBe('Test Project');
      expect(data.data.grouped?.ungrouped.length).toBe(1);
    });

    it('should not group tasks when filtering by project', async () => {
      mockAuth(testCtx);

      const project = await createProject({
        organizationId: testCtx.organization.id,
        name: 'Test Project',
      });

      const now = new Date();
      const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Project Task',
        projectId: project.id,
        startDate: now,
        dueDate,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/gantt?start=${start}&end=${end}&projectId=${project.id}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          grouped: unknown;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.grouped).toBeNull();
    });
  });
});
