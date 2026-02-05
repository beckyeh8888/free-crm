/**
 * Sales Pipeline Report API Integration Tests
 * GET /api/reports/sales-pipeline
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/reports/sales-pipeline/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createDeal } from '@tests/factories/deal.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

interface PipelineResponse {
  readonly success: boolean;
  readonly data: {
    readonly funnel: readonly { readonly stage: string; readonly count: number; readonly value: number }[];
    readonly conversionRates: readonly { readonly from: string; readonly to: string; readonly rate: number }[];
    readonly summary: {
      readonly totalDeals: number;
      readonly totalValue: number;
      readonly winRate: number;
      readonly avgDealValue: number;
      readonly avgDaysToClose: number;
    };
  };
}

describe('Sales Pipeline Report API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'pipeline-test@example.com' });
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

  describe('GET /api/reports/sales-pipeline', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return pipeline data for authenticated user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('funnel');
      expect(body.data).toHaveProperty('conversionRates');
      expect(body.data).toHaveProperty('summary');
    });

    it('should return funnel with all 6 stages', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      expect(body.data.funnel).toHaveLength(6);
      const stages = body.data.funnel.map((f) => f.stage);
      expect(stages).toContain('lead');
      expect(stages).toContain('qualified');
      expect(stages).toContain('proposal');
      expect(stages).toContain('negotiation');
      expect(stages).toContain('closed_won');
      expect(stages).toContain('closed_lost');
    });

    it('should aggregate deals correctly by stage', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Pipeline Customer',
      });

      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'lead', value: 100000 });
      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'lead', value: 200000 });
      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'proposal', value: 300000 });

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      const leadStage = body.data.funnel.find((f) => f.stage === 'lead');
      expect(leadStage?.count).toBe(2);
      expect(leadStage?.value).toBe(300000);

      const proposalStage = body.data.funnel.find((f) => f.stage === 'proposal');
      expect(proposalStage?.count).toBe(1);
      expect(proposalStage?.value).toBe(300000);
    });

    it('should calculate conversion rates', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      expect(body.data.conversionRates).toHaveLength(4);
      expect(body.data.conversionRates[0]).toHaveProperty('from');
      expect(body.data.conversionRates[0]).toHaveProperty('to');
      expect(body.data.conversionRates[0]).toHaveProperty('rate');
    });

    it('should calculate win rate from closed deals', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Win Rate Customer',
      });

      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'closed_won', value: 100000 });
      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'closed_won', value: 200000 });
      await createDeal({ customerId: customer.id, createdById: testCtx.user.id, stage: 'closed_lost', value: 50000 });

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      // 2 won / 3 closed = 67%
      expect(body.data.summary.winRate).toBe(67);
    });

    it('should return empty stats for new user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      expect(body.data.summary.totalDeals).toBe(0);
      expect(body.data.summary.totalValue).toBe(0);
      expect(body.data.summary.winRate).toBe(0);
    });

    it('should not include other organization data', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-pipeline@example.com' });
      const otherCustomer = await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
        name: 'Other Org Customer',
      });
      await createDeal({ customerId: otherCustomer.id, createdById: otherCtx.user.id, stage: 'lead', value: 999999 });

      const request = createMockRequest('/api/reports/sales-pipeline');
      const response = await GET(request);
      const body = await parseResponse<PipelineResponse>(response);

      expect(body.data.summary.totalDeals).toBe(0);
    });
  });
});
