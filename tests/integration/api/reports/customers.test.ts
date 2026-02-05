/**
 * Customer Analytics Report API Integration Tests
 * GET /api/reports/customers
 */

import { vi } from 'vitest';
import { GET } from '@/app/api/reports/customers/route';
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

interface CustomerAnalyticsResponse {
  readonly success: boolean;
  readonly data: {
    readonly growth: readonly {
      readonly period: string;
      readonly newCustomers: number;
      readonly totalCustomers: number;
    }[];
    readonly statusDistribution: readonly {
      readonly status: string;
      readonly count: number;
    }[];
    readonly topCustomersByRevenue: readonly {
      readonly id: string;
      readonly name: string;
      readonly revenue: number;
      readonly dealCount: number;
    }[];
    readonly summary: {
      readonly totalCustomers: number;
      readonly activeCustomers: number;
      readonly newCustomersThisPeriod: number;
      readonly avgRevenuePerCustomer: number;
    };
  };
}

describe('Customer Analytics Report API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'customer-report-test@example.com' });
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

  describe('GET /api/reports/customers', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return customer analytics for authenticated user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('growth');
      expect(body.data).toHaveProperty('statusDistribution');
      expect(body.data).toHaveProperty('topCustomersByRevenue');
      expect(body.data).toHaveProperty('summary');
    });

    it('should count customers correctly', async () => {
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

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(body.data.summary.totalCustomers).toBe(2);
    });

    it('should compute top customers by revenue', async () => {
      mockAuth(testCtx);

      const customerA = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Top Customer',
      });
      const customerB = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Other Customer',
      });

      await createDeal({ customerId: customerA.id, createdById: testCtx.user.id, stage: 'closed_won', value: 500000 });
      await createDeal({ customerId: customerA.id, createdById: testCtx.user.id, stage: 'closed_won', value: 300000 });
      await createDeal({ customerId: customerB.id, createdById: testCtx.user.id, stage: 'closed_won', value: 100000 });

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(body.data.topCustomersByRevenue.length).toBeGreaterThanOrEqual(2);
      // First customer should be the top one
      expect(body.data.topCustomersByRevenue[0].name).toBe('Top Customer');
      expect(body.data.topCustomersByRevenue[0].revenue).toBe(800000);
      expect(body.data.topCustomersByRevenue[0].dealCount).toBe(2);
    });

    it('should return growth data with period labels', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(body.data.growth.length).toBeGreaterThan(0);
      expect(body.data.growth[0]).toHaveProperty('period');
      expect(body.data.growth[0]).toHaveProperty('newCustomers');
      expect(body.data.growth[0]).toHaveProperty('totalCustomers');
    });

    it('should return empty data for new user', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(body.data.summary.totalCustomers).toBe(0);
      expect(body.data.summary.activeCustomers).toBe(0);
      expect(body.data.topCustomersByRevenue).toHaveLength(0);
    });

    it('should not include other organization data', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-cust-report@example.com' });
      await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
        name: 'Other Org Customer',
      });

      const request = createMockRequest('/api/reports/customers');
      const response = await GET(request);
      const body = await parseResponse<CustomerAnalyticsResponse>(response);

      expect(body.data.summary.totalCustomers).toBe(0);
    });
  });
});
