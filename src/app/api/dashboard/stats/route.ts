/**
 * Dashboard Stats API
 *
 * GET /api/dashboard/stats - Get dashboard statistics
 */

import { prisma } from '@/lib/prisma';
import { requireAuth, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userId = session.user.id;

    const [customerCount, dealCount, documentCount, deals, recentActivity] =
      await Promise.all([
        prisma.customer.count({
          where: {
            OR: [{ createdById: userId }, { assignedToId: userId }],
          },
        }),
        prisma.deal.count({
          where: {
            OR: [{ createdById: userId }, { assignedToId: userId }],
          },
        }),
        prisma.document.count({
          where: {
            customer: {
              OR: [{ createdById: userId }, { assignedToId: userId }],
            },
          },
        }),
        prisma.deal.findMany({
          where: {
            OR: [{ createdById: userId }, { assignedToId: userId }],
          },
          select: {
            stage: true,
            value: true,
          },
        }),
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            details: true,
            createdAt: true,
            user: {
              select: { name: true, email: true },
            },
          },
        }),
      ]);

    // Aggregate pipeline stages
    const stageMap: Record<string, { count: number; value: number }> = {};
    for (const deal of deals) {
      if (!stageMap[deal.stage]) {
        stageMap[deal.stage] = { count: 0, value: 0 };
      }
      stageMap[deal.stage].count += 1;
      stageMap[deal.stage].value += deal.value ?? 0;
    }

    const pipelineStages = Object.entries(stageMap).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    }));

    const totalRevenue = deals
      .filter((d) => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (d.value ?? 0), 0);

    return successResponse({
      customerCount,
      dealCount,
      documentCount,
      totalRevenue,
      pipelineStages,
      recentActivity,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return errorResponse('INTERNAL_ERROR', '無法取得儀表板統計資料', 500);
  }
}
