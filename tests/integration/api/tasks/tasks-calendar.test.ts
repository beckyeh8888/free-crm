/**
 * Task Calendar API Integration Tests
 * GET /api/tasks/calendar
 *
 * Sprint 5: Calendar & Gantt Chart
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/tasks/calendar/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createTask } from '@tests/factories/task.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Task Calendar API', () => {
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

  describe('GET /api/tasks/calendar', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const start = new Date().toISOString();
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/calendar?start=${start}&end=${end}`);
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when start/end params are missing', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/tasks/calendar');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return tasks within date range', async () => {
      mockAuth(testCtx);

      const now = new Date();
      const inRange = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const outOfRange = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days later

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'In Range Task',
        dueDate: inRange,
      });

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Out of Range Task',
        startDate: outOfRange, // Also set startDate out of range
        dueDate: outOfRange,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/calendar?start=${start}&end=${end}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          events: { title: string }[];
          totalCount: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.totalCount).toBe(1);
      expect(data.data.events[0].title).toBe('In Range Task');
    });

    it('should filter by task type', async () => {
      mockAuth(testCtx);

      const now = new Date();
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Meeting',
        type: 'meeting',
        dueDate,
      });

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Call',
        type: 'call',
        dueDate,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/calendar?start=${start}&end=${end}&type=meeting`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          events: { title: string; type: string }[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.events.length).toBe(1);
      expect(data.data.events[0].type).toBe('meeting');
    });

    it('should include tasks that span the date range', async () => {
      mockAuth(testCtx);

      const now = new Date();
      // Task that starts before and ends after the query range
      const taskStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const taskEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days later

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Spanning Task',
        startDate: taskStart,
        dueDate: taskEnd,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/calendar?start=${start}&end=${end}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          events: { title: string }[];
          totalCount: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.totalCount).toBe(1);
      expect(data.data.events[0].title).toBe('Spanning Task');
    });

    it('should return events with color based on type', async () => {
      mockAuth(testCtx);

      const now = new Date();
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        title: 'Meeting Task',
        type: 'meeting',
        dueDate,
      });

      const start = now.toISOString();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const request = createMockRequest(`/api/tasks/calendar?start=${start}&end=${end}`);
      const response = await GET(request);
      const data = await parseResponse<{
        data: {
          events: { color: string }[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.events[0].color).toBe('#8B5CF6'); // Purple for meeting
    });
  });
});
