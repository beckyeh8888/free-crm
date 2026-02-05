/**
 * Task Activity Report API Integration Tests
 * GET /api/reports/tasks
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/reports/tasks/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createTask } from '@tests/factories/task.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

interface TaskActivityResponse {
  readonly success: boolean;
  readonly data: {
    readonly completionTrend: readonly {
      readonly period: string;
      readonly completed: number;
      readonly created: number;
    }[];
    readonly statusDistribution: readonly {
      readonly label: string;
      readonly value: number;
    }[];
    readonly priorityDistribution: readonly {
      readonly label: string;
      readonly value: number;
    }[];
    readonly typeDistribution: readonly {
      readonly label: string;
      readonly value: number;
    }[];
    readonly summary: {
      readonly totalTasks: number;
      readonly completedTasks: number;
      readonly completionRate: number;
      readonly overdueTasks: number;
      readonly avgCompletionDays: number;
    };
  };
}

describe('Task Activity Report API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'task-report-test@example.com' });
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

  describe('GET /api/reports/tasks', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return task activity for authenticated user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('completionTrend');
      expect(body.data).toHaveProperty('statusDistribution');
      expect(body.data).toHaveProperty('priorityDistribution');
      expect(body.data).toHaveProperty('typeDistribution');
      expect(body.data).toHaveProperty('summary');
    });

    it('should count tasks correctly', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        status: 'pending',
        priority: 'high',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        status: 'completed',
        priority: 'medium',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        status: 'completed',
        priority: 'low',
      });

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.summary.totalTasks).toBe(3);
      expect(body.data.summary.completedTasks).toBe(2);
      expect(body.data.summary.completionRate).toBe(67);
    });

    it('should include status distribution', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        status: 'pending',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        status: 'in_progress',
      });

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.statusDistribution.length).toBeGreaterThanOrEqual(2);
    });

    it('should include priority distribution', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        priority: 'high',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        priority: 'low',
      });

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.priorityDistribution.length).toBeGreaterThanOrEqual(2);
    });

    it('should return completion trend with period labels', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.completionTrend.length).toBeGreaterThan(0);
      expect(body.data.completionTrend[0]).toHaveProperty('period');
      expect(body.data.completionTrend[0]).toHaveProperty('completed');
      expect(body.data.completionTrend[0]).toHaveProperty('created');
    });

    it('should return empty data for new user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.summary.totalTasks).toBe(0);
      expect(body.data.summary.completedTasks).toBe(0);
      expect(body.data.summary.completionRate).toBe(0);
    });

    it('should not include other organization data', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-task-report@example.com' });
      await createTask({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
        status: 'pending',
      });

      const request = createMockRequest('/api/reports/tasks');
      const response = await GET(request);
      const body = await parseResponse<TaskActivityResponse>(response);

      expect(body.data.summary.totalTasks).toBe(0);
    });
  });
});
