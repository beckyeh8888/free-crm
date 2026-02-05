/**
 * Team Performance Report API
 * GET /api/reports/team
 *
 * Returns individual member metrics and team summary.
 * Permission: REPORTS_ADVANCED
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
import type {
  TeamPerformanceReport,
  TeamMemberPerformance,
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
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const parsed = reportQuerySchema.safeParse({
      startDate: url.searchParams.get('startDate') ?? defaultStart.toISOString(),
      endDate: url.searchParams.get('endDate') ?? now.toISOString(),
    });

    const start = parsed.success ? new Date(parsed.data.startDate) : defaultStart;
    const end = parsed.success ? new Date(parsed.data.endDate) : now;

    // 4. Get organization members
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 5. Get deals and tasks for the period
    const deals = await prisma.deal.findMany({
      where: {
        customer: { organizationId },
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        stage: true,
        value: true,
        assignedToId: true,
      },
    });

    const tasks = await prisma.task.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        status: true,
        assignedToId: true,
      },
    });

    // 6. Calculate per-member metrics
    const memberMetrics: TeamMemberPerformance[] = members.map((member) => {
      const userId = member.user.id;
      const memberDeals = deals.filter((d) => d.assignedToId === userId);
      const memberWonDeals = memberDeals.filter((d) => d.stage === 'closed_won');
      const memberLostDeals = memberDeals.filter((d) => d.stage === 'closed_lost');
      const closedCount = memberWonDeals.length + memberLostDeals.length;

      const memberTasks = tasks.filter((t) => t.assignedToId === userId);
      const completedTasks = memberTasks.filter((t) => t.status === 'completed');

      const revenue = memberWonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

      return {
        userId,
        name: member.user.name ?? '未命名',
        image: member.user.image,
        metrics: {
          deals: memberDeals.length,
          wonDeals: memberWonDeals.length,
          winRate: closedCount > 0 ? Math.round((memberWonDeals.length / closedCount) * 100) : 0,
          revenue,
          tasks: memberTasks.length,
          completedTasks: completedTasks.length,
        },
      };
    });

    // Sort by revenue descending
    memberMetrics.sort((a, b) => b.metrics.revenue - a.metrics.revenue);

    // 7. Team summary
    const totalRevenue = memberMetrics.reduce((sum, m) => sum + m.metrics.revenue, 0);
    const totalDeals = memberMetrics.reduce((sum, m) => sum + m.metrics.deals, 0);
    const winRates = memberMetrics
      .filter((m) => m.metrics.deals > 0)
      .map((m) => m.metrics.winRate);
    const avgWinRate = winRates.length > 0
      ? Math.round(winRates.reduce((a, b) => a + b, 0) / winRates.length)
      : 0;

    const report: TeamPerformanceReport = {
      members: memberMetrics,
      summary: {
        totalMembers: members.length,
        totalRevenue,
        totalDeals,
        avgWinRate,
        topPerformer: memberMetrics.length > 0 ? memberMetrics[0].name : null,
      },
    };

    // 8. Audit log
    await logAudit({
      action: 'read',
      entity: 'report',
      userId: session.user.id,
      organizationId,
      details: { reportType: 'team' },
      request,
    });

    return successResponse(report);
  } catch (error) {
    console.error('Team performance report error:', error);
    return errorResponse('INTERNAL_ERROR', '無法取得團隊績效報表');
  }
}
