/**
 * Sales Pipeline Report API
 * GET /api/reports/sales-pipeline
 *
 * Returns pipeline funnel data, conversion rates, and summary stats.
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
import { calculateConversionRates } from '@/lib/report-utils';
import type {
  SalesPipelineReport,
  PipelineFunnelItem,
} from '@/types/reports';

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

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
    const parsed = reportQuerySchema.safeParse({
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
    });

    const dateFilter: Record<string, unknown> = {};
    if (parsed.success) {
      dateFilter.createdAt = {
        gte: new Date(parsed.data.startDate),
        lte: new Date(parsed.data.endDate),
      };
    }

    // 4. Query pipeline data
    const deals = await prisma.deal.findMany({
      where: {
        customer: { organizationId },
        ...dateFilter,
      },
      select: {
        id: true,
        stage: true,
        value: true,
        closedAt: true,
        createdAt: true,
      },
    });

    // 5. Build funnel
    const stageMap = new Map<string, { count: number; value: number }>();
    for (const stage of STAGE_ORDER) {
      stageMap.set(stage, { count: 0, value: 0 });
    }

    for (const deal of deals) {
      const existing = stageMap.get(deal.stage);
      if (existing) {
        existing.count += 1;
        existing.value += deal.value ?? 0;
      }
    }

    const funnel: PipelineFunnelItem[] = STAGE_ORDER.map((stage) => ({
      stage,
      count: stageMap.get(stage)?.count ?? 0,
      value: stageMap.get(stage)?.value ?? 0,
    }));

    // 6. Conversion rates
    const conversionRates = calculateConversionRates(funnel);

    // 7. Summary
    const wonDeals = deals.filter((d) => d.stage === 'closed_won');
    const lostDeals = deals.filter((d) => d.stage === 'closed_lost');
    const closedDeals = wonDeals.length + lostDeals.length;

    let avgDaysToClose = 0;
    if (wonDeals.length > 0) {
      const totalDays = wonDeals.reduce((sum, deal) => {
        if (deal.closedAt) {
          const days = Math.ceil(
            (new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      avgDaysToClose = Math.round(totalDays / wonDeals.length);
    }

    const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

    const report: SalesPipelineReport = {
      funnel,
      conversionRates,
      summary: {
        totalDeals: deals.length,
        totalValue,
        winRate: closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0,
        avgDealValue: deals.length > 0 ? Math.round(totalValue / deals.length) : 0,
        avgDaysToClose,
      },
    };

    // 8. Audit log
    await logAudit({
      action: 'read',
      entity: 'report',
      userId: session.user.id,
      organizationId,
      details: { reportType: 'sales-pipeline' },
      request,
    });

    return successResponse(report);
  } catch (error) {
    console.error('Sales pipeline report error:', error);
    return errorResponse('INTERNAL_ERROR', '無法取得銷售管線報表');
  }
}
