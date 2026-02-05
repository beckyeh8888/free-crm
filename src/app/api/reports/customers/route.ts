/**
 * Customer Analytics Report API
 * GET /api/reports/customers
 *
 * Returns customer growth, status distribution, top customers.
 * Permission: REPORTS_VIEW
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

import {
  requireAuth,
  getOrganizationId,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { getUserDefaultOrganization } from '@/lib/rbac';
import { reportQuerySchema } from '@/lib/validation';
import { dateToPeriod, generatePeriodLabels } from '@/lib/report-utils';
import type {
  CustomerAnalyticsReport,
  CustomerGrowthItem,
  CustomerStatusItem,
  TopCustomerItem,
} from '@/types/reports';

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Get organization
    let organizationId = getOrganizationId(request);
    if (!organizationId) {
      const defaultOrg = await getUserDefaultOrganization(session.user.id);
      if (defaultOrg) {
        organizationId = defaultOrg.organization.id;
      }
    }

    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    // 3. Parse query params
    const url = new URL(request.url);
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const parsed = reportQuerySchema.safeParse({
      startDate: url.searchParams.get('startDate') ?? defaultStart.toISOString(),
      endDate: url.searchParams.get('endDate') ?? now.toISOString(),
    });

    const start = parsed.success ? new Date(parsed.data.startDate) : defaultStart;
    const end = parsed.success ? new Date(parsed.data.endDate) : now;

    // 4. Query all customers in the org
    const allCustomers = await prisma.customer.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        company: true,
        status: true,
        createdAt: true,
      },
    });

    // 5. Customer growth by month
    const periodLabels = generatePeriodLabels(start, end, 'month');
    const growthMap = new Map<string, number>();
    for (const label of periodLabels) {
      growthMap.set(label, 0);
    }

    for (const customer of allCustomers) {
      const period = dateToPeriod(new Date(customer.createdAt), 'month');
      const current = growthMap.get(period);
      if (current !== undefined) {
        growthMap.set(period, current + 1);
      }
    }

    let runningTotal = allCustomers.filter(
      (c) => new Date(c.createdAt) < start
    ).length;

    const growth: CustomerGrowthItem[] = periodLabels.map((period) => {
      const newCustomers = growthMap.get(period) ?? 0;
      runningTotal += newCustomers;
      return {
        period,
        newCustomers,
        totalCustomers: runningTotal,
      };
    });

    // 6. Status distribution
    const statusMap = new Map<string, number>();
    for (const customer of allCustomers) {
      statusMap.set(customer.status, (statusMap.get(customer.status) ?? 0) + 1);
    }

    const statusDistribution: CustomerStatusItem[] = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count })
    );

    // 7. Top customers by revenue
    const wonDeals = await prisma.deal.findMany({
      where: {
        customer: { organizationId },
        stage: 'closed_won',
      },
      select: {
        customerId: true,
        value: true,
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    const customerRevenue = new Map<string, { name: string; company: string | null; revenue: number; dealCount: number }>();
    for (const deal of wonDeals) {
      const existing = customerRevenue.get(deal.customerId);
      if (existing) {
        existing.revenue += deal.value ?? 0;
        existing.dealCount += 1;
      } else {
        customerRevenue.set(deal.customerId, {
          name: deal.customer.name,
          company: deal.customer.company,
          revenue: deal.value ?? 0,
          dealCount: 1,
        });
      }
    }

    const topCustomersByRevenue: TopCustomerItem[] = Array.from(customerRevenue.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        name: data.name,
        company: data.company,
        revenue: data.revenue,
        dealCount: data.dealCount,
      }));

    // 8. Summary
    const newCustomersThisPeriod = allCustomers.filter(
      (c) => new Date(c.createdAt) >= start && new Date(c.createdAt) <= end
    ).length;

    const totalRevenue = Array.from(customerRevenue.values()).reduce(
      (sum, c) => sum + c.revenue, 0
    );

    const report: CustomerAnalyticsReport = {
      growth,
      statusDistribution,
      topCustomersByRevenue,
      summary: {
        totalCustomers: allCustomers.length,
        activeCustomers: allCustomers.filter((c) => c.status === 'active').length,
        newCustomersThisPeriod,
        avgRevenuePerCustomer:
          customerRevenue.size > 0
            ? Math.round(totalRevenue / customerRevenue.size)
            : 0,
      },
    };

    // 9. Audit log
    await logAudit({
      action: 'read',
      entity: 'report',
      userId: session.user.id,
      organizationId,
      details: { reportType: 'customers' },
      request,
    });

    return successResponse(report);
  } catch (error) {
    console.error('Customer analytics report error:', error);
    return errorResponse('INTERNAL_ERROR', '無法取得客戶分析報表');
  }
}
