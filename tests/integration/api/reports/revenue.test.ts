/**
 * Revenue Report API Integration Tests
 * GET /api/reports/revenue
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/reports/revenue/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createDeal } from '@tests/factories/deal.factory';
import { prisma } from '@tests/helpers/test-db';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

interface RevenueResponse {
  readonly success: boolean;
  readonly data: {
    readonly trends: readonly {
      readonly period: string;
      readonly wonValue: number;
      readonly lostValue: number;
      readonly dealCount: number;
    }[];
    readonly summary: {
      readonly totalRevenue: number;
      readonly totalLost: number;
      readonly growthRate: number;
      readonly avgDealSize: number;
      readonly periodCount: number;
    };
  };
}

describe('Revenue Report API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'revenue-test@example.com' });
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

  describe('GET /api/reports/revenue', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return revenue data for authenticated user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('trends');
      expect(body.data).toHaveProperty('summary');
    });

    it('should group by month by default', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      // Default is 12 months of labels
      expect(body.data.trends.length).toBeGreaterThan(0);
      // Each trend item should have a month-formatted period
      expect(body.data.trends[0].period).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should aggregate won and lost values', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Revenue Customer',
      });

      const now = new Date();
      const wonDeal = await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        stage: 'closed_won',
        value: 500000,
      });
      await prisma.deal.update({ where: { id: wonDeal.id }, data: { closedAt: now } });

      const lostDeal = await createDeal({
        customerId: customer.id,
        createdById: testCtx.user.id,
        stage: 'closed_lost',
        value: 200000,
      });
      await prisma.deal.update({ where: { id: lostDeal.id }, data: { closedAt: now } });

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      expect(body.data.summary.totalRevenue).toBe(500000);
      expect(body.data.summary.totalLost).toBe(200000);
    });

    it('should return empty data for new user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      expect(body.data.summary.totalRevenue).toBe(0);
      expect(body.data.summary.totalLost).toBe(0);
      expect(body.data.summary.avgDealSize).toBe(0);
    });

    it('should support groupBy=quarter parameter', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/revenue', {
        searchParams: { groupBy: 'quarter' },
      });
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      expect(response.status).toBe(200);
      // Quarter periods should match Q format
      if (body.data.trends.length > 0) {
        expect(body.data.trends[0].period).toMatch(/^\d{4}-Q\d$/);
      }
    });

    it('should not include other organization data', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-revenue@example.com' });
      const otherCustomer = await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
        name: 'Other Revenue Customer',
      });
      const otherDeal = await createDeal({
        customerId: otherCustomer.id,
        createdById: otherCtx.user.id,
        stage: 'closed_won',
        value: 999999,
      });
      await prisma.deal.update({ where: { id: otherDeal.id }, data: { closedAt: new Date() } });

      const request = createMockRequest('/api/reports/revenue');
      const response = await GET(request);
      const body = await parseResponse<RevenueResponse>(response);

      expect(body.data.summary.totalRevenue).toBe(0);
    });
  });
});
