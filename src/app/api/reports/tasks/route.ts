/**
 * Task Activity Report API
 * GET /api/reports/tasks
 *
 * Returns task completion trends, status/priority/type distribution.
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
import { dateToPeriod, generatePeriodLabels, daysBetween } from '@/lib/report-utils';
import { taskStatusLabels, taskPriorityLabels, taskTypeLabels } from '@/lib/design-tokens';
import type {
  TaskActivityReport,
  TaskCompletionItem,
  TaskDistributionItem,
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

    // 4. Query all tasks in org within range
    const tasks = await prisma.task.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        type: true,
        createdAt: true,
        completedAt: true,
        dueDate: true,
      },
    });

    // 5. Completion trend by month
    const periodLabels = generatePeriodLabels(start, end, 'month');
    const completedMap = new Map<string, number>();
    const createdMap = new Map<string, number>();

    for (const label of periodLabels) {
      completedMap.set(label, 0);
      createdMap.set(label, 0);
    }

    for (const task of tasks) {
      const createdPeriod = dateToPeriod(new Date(task.createdAt), 'month');
      createdMap.set(createdPeriod, (createdMap.get(createdPeriod) ?? 0) + 1);

      if (task.completedAt) {
        const completedPeriod = dateToPeriod(new Date(task.completedAt), 'month');
        completedMap.set(completedPeriod, (completedMap.get(completedPeriod) ?? 0) + 1);
      }
    }

    const completionTrend: TaskCompletionItem[] = periodLabels.map((period) => ({
      period,
      completed: completedMap.get(period) ?? 0,
      created: createdMap.get(period) ?? 0,
    }));

    // 6. Status distribution
    const statusCounts = new Map<string, number>();
    for (const task of tasks) {
      statusCounts.set(task.status, (statusCounts.get(task.status) ?? 0) + 1);
    }

    const statusDistribution: TaskDistributionItem[] = Array.from(statusCounts.entries()).map(
      ([key, value]) => ({
        label: taskStatusLabels[key] ?? key,
        value,
      })
    );

    // 7. Priority distribution
    const priorityCounts = new Map<string, number>();
    for (const task of tasks) {
      priorityCounts.set(task.priority, (priorityCounts.get(task.priority) ?? 0) + 1);
    }

    const priorityDistribution: TaskDistributionItem[] = Array.from(priorityCounts.entries()).map(
      ([key, value]) => ({
        label: taskPriorityLabels[key] ?? key,
        value,
      })
    );

    // 8. Type distribution
    const typeCounts = new Map<string, number>();
    for (const task of tasks) {
      typeCounts.set(task.type, (typeCounts.get(task.type) ?? 0) + 1);
    }

    const typeDistribution: TaskDistributionItem[] = Array.from(typeCounts.entries()).map(
      ([key, value]) => ({
        label: taskTypeLabels[key] ?? key,
        value,
      })
    );

    // 9. Summary
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < now
    );

    let avgCompletionDays = 0;
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, task) => {
        if (task.completedAt) {
          return sum + daysBetween(new Date(task.createdAt), new Date(task.completedAt));
        }
        return sum;
      }, 0);
      avgCompletionDays = Math.round(totalDays / completedTasks.length);
    }

    const report: TaskActivityReport = {
      completionTrend,
      statusDistribution,
      priorityDistribution,
      typeDistribution,
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        completionRate: tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
        overdueTasks: overdueTasks.length,
        avgCompletionDays,
      },
    };

    // 10. Audit log
    await logAudit({
      action: 'read',
      entity: 'report',
      userId: session.user.id,
      organizationId,
      details: { reportType: 'tasks' },
      request,
    });

    return successResponse(report);
  } catch (error) {
    console.error('Task activity report error:', error);
    return errorResponse('INTERNAL_ERROR', '無法取得任務活動報表');
  }
}
