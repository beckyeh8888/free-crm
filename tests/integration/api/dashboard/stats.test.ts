/**
 * Dashboard Stats API Integration Tests
 * GET /api/dashboard/stats
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/dashboard/stats/route';
import { parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createDeal } from '@tests/factories/deal.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

interface StatsResponse {
  readonly success: boolean;
  readonly data: {
    readonly customerCount: number;
    readonly dealCount: number;
    readonly documentCount: number;
    readonly totalRevenue: number;
    readonly pipelineStages: readonly {
      readonly stage: string;
      readonly count: number;
      readonly value: number;
    }[];
    readonly recentActivity: readonly {
      readonly id: string;
      readonly action: string;
      readonly entity: string;
    }[];
  };
}

describe('Dashboard Stats API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'dashboard-test@example.com' });
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

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return stats for authenticated user', async () => {
      mockAuth(testCtx);

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('customerCount');
      expect(body.data).toHaveProperty('dealCount');
      expect(body.data).toHaveProperty('documentCount');
      expect(body.data).toHaveProperty('totalRevenue');
      expect(body.data).toHaveProperty('pipelineStages');
      expect(body.data).toHaveProperty('recentActivity');
    });

    it('should return correct customer count', async () => {
      mockAuth(testCtx);

      await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Customer A',
      });
      await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Customer B',
      });

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.customerCount).toBe(2);
    });

    it('should return correct deal count and pipeline stages', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Deal Customer',
      });

      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Deal 1',
        stage: 'lead',
        value: 100000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Deal 2',
        stage: 'lead',
        value: 200000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Deal 3',
        stage: 'proposal',
        value: 300000,
      });

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.dealCount).toBe(3);
      expect(body.data.pipelineStages.length).toBeGreaterThanOrEqual(2);

      const leadStage = body.data.pipelineStages.find((s) => s.stage === 'lead');
      expect(leadStage?.count).toBe(2);
      expect(leadStage?.value).toBe(300000);

      const proposalStage = body.data.pipelineStages.find((s) => s.stage === 'proposal');
      expect(proposalStage?.count).toBe(1);
      expect(proposalStage?.value).toBe(300000);
    });

    it('should calculate totalRevenue from closed_won deals only', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Revenue Customer',
      });

      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Won Deal',
        stage: 'closed_won',
        value: 500000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Lost Deal',
        stage: 'closed_lost',
        value: 200000,
      });
      await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        title: 'Active Deal',
        stage: 'lead',
        value: 100000,
      });

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.totalRevenue).toBe(500000);
    });

    it('should not include other user data', async () => {
      mockAuth(testCtx);

      // Create data for another user
      const otherCtx = await createTestContext({ userEmail: 'other-dashboard@example.com' });
      await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
        name: 'Other Customer',
      });

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.customerCount).toBe(0);
    });

    it('should return empty stats for new user', async () => {
      mockAuth(testCtx);

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.customerCount).toBe(0);
      expect(body.data.dealCount).toBe(0);
      expect(body.data.documentCount).toBe(0);
      expect(body.data.totalRevenue).toBe(0);
      expect(body.data.pipelineStages).toHaveLength(0);
    });

    it('should include recent activity entries', async () => {
      mockAuth(testCtx);

      // Create an audit log entry
      await prisma.auditLog.create({
        data: {
          userId: testCtx.user.id,
          action: 'create',
          entity: 'customer',
          entityId: 'test-entity-id',
          details: 'Created customer',
          ipAddress: '127.0.0.1',
        },
      });

      const response = await GET();
      const body = await parseResponse<StatsResponse>(response);

      expect(body.data.recentActivity.length).toBeGreaterThanOrEqual(1);
      expect(body.data.recentActivity[0].action).toBe('create');
      expect(body.data.recentActivity[0].entity).toBe('customer');
    });
  });
});
