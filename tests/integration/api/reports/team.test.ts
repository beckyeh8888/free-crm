/**
 * Team Performance Report API Integration Tests
 * GET /api/reports/team
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/reports/team/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createDeal } from '@tests/factories/deal.factory';
import { createTask } from '@tests/factories/task.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

interface TeamResponse {
  readonly success: boolean;
  readonly data: {
    readonly members: readonly {
      readonly userId: string;
      readonly name: string;
      readonly metrics: {
        readonly deals: number;
        readonly wonDeals: number;
        readonly winRate: number;
        readonly revenue: number;
        readonly tasks: number;
        readonly completedTasks: number;
      };
    }[];
    readonly summary: {
      readonly totalMembers: number;
      readonly totalRevenue: number;
      readonly totalDeals: number;
      readonly avgWinRate: number;
      readonly topPerformer: string | null;
    };
  };
}

describe('Team Performance Report API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'team-report-test@example.com' });
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

  describe('GET /api/reports/team', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return team data for authenticated user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('members');
      expect(body.data).toHaveProperty('summary');
    });

    it('should include current user as a member', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      expect(body.data.summary.totalMembers).toBe(1);
      expect(body.data.members).toHaveLength(1);
      expect(body.data.members[0].userId).toBe(testCtx.user.id);
    });

    it('should calculate member deal metrics', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Team Customer',
      });

      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        assignedToId: testCtx.user.id,
        stage: 'closed_won',
        value: 300000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        assignedToId: testCtx.user.id,
        stage: 'closed_lost',
        value: 100000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        assignedToId: testCtx.user.id,
        stage: 'lead',
        value: 200000,
      });

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      const member = body.data.members[0];
      expect(member.metrics.deals).toBe(3);
      expect(member.metrics.wonDeals).toBe(1);
      expect(member.metrics.revenue).toBe(300000);
      expect(member.metrics.winRate).toBe(50); // 1 won / 2 closed
    });

    it('should calculate member task metrics', async () => {
      mockAuth(testCtx);

      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        assignedToId: testCtx.user.id,
        status: 'completed',
      });
      await createTask({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        assignedToId: testCtx.user.id,
        status: 'pending',
      });

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      const member = body.data.members[0];
      expect(member.metrics.tasks).toBe(2);
      expect(member.metrics.completedTasks).toBe(1);
    });

    it('should return empty metrics for new user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      const member = body.data.members[0];
      expect(member.metrics.deals).toBe(0);
      expect(member.metrics.revenue).toBe(0);
      expect(member.metrics.tasks).toBe(0);
    });

    it('should set top performer', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      // With one member, top performer should be that member
      expect(body.data.summary.topPerformer).toBe(testCtx.user.name);
    });

    it('should not include other organization members', async () => {
      mockAuth(testCtx);

      await createTestContext({ userEmail: 'other-team@example.com' });

      const request = createMockRequest('/api/reports/team');
      const response = await GET(request);
      const body = await parseResponse<TeamResponse>(response);

      // Only our org member
      expect(body.data.summary.totalMembers).toBe(1);
    });
  });
});
