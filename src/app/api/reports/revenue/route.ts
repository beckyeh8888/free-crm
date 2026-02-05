/**
 * Revenue Report API
 * GET /api/reports/revenue
 *
 * Returns revenue trends (won/lost by period) and summary.
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
import { revenueQuerySchema } from '@/lib/validation';
import {
  dateToPeriod,
  generatePeriodLabels,
  calculateRevenueGrowth,
} from '@/lib/report-utils';
import type { RevenueReport, RevenueTrendItem } from '@/types/reports';

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

    const parsed = revenueQuerySchema.safeParse({
      startDate: url.searchParams.get('startDate') ?? defaultStart.toISOString(),
      endDate: url.searchParams.get('endDate') ?? now.toISOString(),
      groupBy: url.searchParams.get('groupBy') ?? 'month',
    });

    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', '查詢參數無效');
    }

    const { startDate, endDate, groupBy } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 4. Query closed deals within range
    const closedDeals = await prisma.deal.findMany({
      where: {
        customer: { organizationId },
        closedAt: { gte: start, lte: end },
        stage: { in: ['closed_won', 'closed_lost'] },
      },
      select: {
        id: true,
        value: true,
        stage: true,
        closedAt: true,
      },
    });

    // 5. Group by period
    const periodLabels = generatePeriodLabels(start, end, groupBy);
    const periodMap = new Map<string, { wonValue: number; lostValue: number; dealCount: number }>();

    for (const label of periodLabels) {
      periodMap.set(label, { wonValue: 0, lostValue: 0, dealCount: 0 });
    }

    for (const deal of closedDeals) {
      if (!deal.closedAt) continue;
      const period = dateToPeriod(new Date(deal.closedAt), groupBy);
      const bucket = periodMap.get(period);
      if (!bucket) continue;

      bucket.dealCount += 1;
      if (deal.stage === 'closed_won') {
        bucket.wonValue += deal.value ?? 0;
      } else {
        bucket.lostValue += deal.value ?? 0;
      }
    }

    const trends: RevenueTrendItem[] = periodLabels.map((period) => {
      const data = periodMap.get(period);
      return {
        period,
        wonValue: data?.wonValue ?? 0,
        lostValue: data?.lostValue ?? 0,
        dealCount: data?.dealCount ?? 0,
      };
    });

    // 6. Summary
    const totalRevenue = closedDeals
      .filter((d) => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (d.value ?? 0), 0);
    const totalLost = closedDeals
      .filter((d) => d.stage === 'closed_lost')
      .reduce((sum, d) => sum + (d.value ?? 0), 0);
    const wonCount = closedDeals.filter((d) => d.stage === 'closed_won').length;

    const report: RevenueReport = {
      trends,
      summary: {
        totalRevenue,
        totalLost,
        growthRate: calculateRevenueGrowth(trends),
        avgDealSize: wonCount > 0 ? Math.round(totalRevenue / wonCount) : 0,
        periodCount: periodLabels.length,
      },
    };

    // 7. Audit log
    await logAudit({
      action: 'read',
      entity: 'report',
      userId: session.user.id,
      organizationId,
      details: { reportType: 'revenue', groupBy },
      request,
    });

    return successResponse(report);
  } catch (error) {
    console.error('Revenue report error:', error);
    return errorResponse('INTERNAL_ERROR', '無法取得營收報表');
  }
}
