/**
 * Sales Insights API
 *
 * GET /api/ai/insights - AI-powered sales analysis and recommendations
 *
 * Aggregates CRM data and sends to AI for analysis.
 *
 * ISO 42001 AI Management System
 */

import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { getAIModel, requireAIFeature } from '@/lib/ai/provider';
import { getSalesInsightsPrompt } from '@/lib/ai/prompts/insights';
import { checkAIInsightsRateLimit } from '@/lib/ai/rate-limit';
import { handleAIError } from '@/lib/ai/errors';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit
  try {
    await checkAIInsightsRateLimit(organizationId);
  } catch {
    return errorResponse('VALIDATION_ERROR', 'AI 請求過於頻繁，請稍後再試。');
  }

  // Check AI feature enabled
  try {
    await requireAIFeature(organizationId, 'insights');
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('VALIDATION_ERROR', aiError.message);
  }

  try {
    // Aggregate CRM data for analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Deal filter: through customer's organizationId
    const orgDealFilter = { customer: { organizationId } };

    // Fetch data in parallel
    const [
      dealsByStage,
      totalDealValue,
      atRiskDeals,
      recentlyClosedWon,
      recentlyClosedLost,
      activeTasks,
      overdueTasks,
    ] = await Promise.all([
      // Deals grouped by stage
      prisma.deal.groupBy({
        by: ['stage'],
        where: {
          ...orgDealFilter,
          stage: { notIn: ['closed_won', 'closed_lost'] },
        },
        _count: true,
      }),

      // Total active deal value
      prisma.deal.aggregate({
        where: {
          ...orgDealFilter,
          stage: { notIn: ['closed_won', 'closed_lost'] },
        },
        _sum: { value: true },
      }),

      // At-risk deals: overdue close date or no update in 14+ days
      prisma.deal.findMany({
        where: {
          ...orgDealFilter,
          stage: { notIn: ['closed_won', 'closed_lost'] },
          OR: [
            { closeDate: { lt: now } },
            { updatedAt: { lt: fourteenDaysAgo } },
          ],
        },
        select: {
          id: true,
          title: true,
          stage: true,
          value: true,
          closeDate: true,
          updatedAt: true,
          customer: { select: { name: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'asc' },
      }),

      // Recently closed won (last 30 days)
      prisma.deal.count({
        where: {
          ...orgDealFilter,
          stage: 'closed_won',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Recently closed lost (last 30 days)
      prisma.deal.count({
        where: {
          ...orgDealFilter,
          stage: 'closed_lost',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Active tasks
      prisma.task.count({
        where: {
          organizationId,
          status: { in: ['pending', 'in_progress'] },
        },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          organizationId,
          status: { in: ['pending', 'in_progress'] },
          dueDate: { lt: now },
        },
      }),
    ]);

    // Transform data for prompt
    const stageMap: Record<string, number> = {};
    for (const entry of dealsByStage) {
      stageMap[entry.stage] = entry._count;
    }

    const riskDeals = atRiskDeals.map((d) => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysOverdue = d.closeDate
        ? Math.max(0, Math.floor((now.getTime() - new Date(d.closeDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        id: d.id,
        title: d.title,
        customerName: d.customer?.name || '未知客戶',
        daysSinceUpdate,
        daysOverdue,
        value: d.value ? Number(d.value) : 0,
        stage: d.stage,
      };
    });

    // Build prompt and call AI
    const model = await getAIModel(organizationId);
    const totalValue = totalDealValue._sum?.value ? Number(totalDealValue._sum.value) : 0;
    const prompt = getSalesInsightsPrompt({
      dealsByStage: stageMap,
      totalDealValue: totalValue,
      atRiskDeals: riskDeals,
      recentlyClosedWon,
      recentlyClosedLost,
      activeTasks,
      overdueTasks,
    });

    const result = await generateText({
      model,
      prompt,
      maxOutputTokens: 2000,
    });

    // Parse AI response
    let insights: {
      summary: string;
      atRiskDeals: Array<{ dealId: string; title: string; reason: string; suggestedAction: string }>;
      keyInsights: string[];
    };

    try {
      insights = JSON.parse(result.text);
    } catch {
      insights = {
        summary: result.text,
        atRiskDeals: [],
        keyInsights: [],
      };
    }

    // Audit log (async)
    logAudit({
      action: 'read',
      entity: 'system_setting',
      userId: session.user.id,
      organizationId,
      details: {
        action: 'ai_insights',
        atRiskCount: riskDeals.length,
      },
      request,
    }).catch(() => {
      // Don't fail the response if audit logging fails
    });

    return successResponse({
      summary: insights.summary || '',
      atRiskDeals: insights.atRiskDeals || [],
      keyInsights: insights.keyInsights || [],
    });
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('INTERNAL_ERROR', aiError.message);
  }
}
