/**
 * Task Gantt API
 *
 * GET /api/tasks/gantt - Get tasks for Gantt chart view (with dependencies)
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
  getOrganizationId,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import { ganttQuerySchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

/**
 * GET /api/tasks/gantt
 * Get tasks for Gantt chart view within a date range
 *
 * Query params:
 * - start: ISO datetime (required)
 * - end: ISO datetime (required)
 * - projectId: filter by project (optional)
 * - customerId: filter by customer (optional)
 * - dealId: filter by deal (optional)
 * - assignedToId: filter by assignee (optional)
 * - includeDependencies: include task dependencies (default: true)
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;

  // Get organization ID
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

  // Check permission
  const { error: permError } = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_READ
  );
  if (permError) return permError;

  // Parse and validate query params
  const queryResult = ganttQuerySchema.safeParse({
    start: searchParams.get('start'),
    end: searchParams.get('end'),
    projectId: searchParams.get('projectId') || undefined,
    customerId: searchParams.get('customerId') || undefined,
    dealId: searchParams.get('dealId') || undefined,
    assignedToId: searchParams.get('assignedToId') || undefined,
    includeDependencies: searchParams.get('includeDependencies') ?? 'true',
  });

  if (!queryResult.success) {
    return errorResponse('VALIDATION_ERROR', '請提供有效的日期範圍 (start, end)');
  }

  const { start, end, projectId, customerId, dealId, assignedToId, includeDependencies } = queryResult.data;

  // Check if user can see all tasks
  const hasManagePermission = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_MANAGE
  );

  // Build where clause - tasks that overlap with the date range
  const where: Record<string, unknown> = {
    organizationId,
    // Must have either startDate or dueDate
    OR: [
      { startDate: { not: null } },
      { dueDate: { not: null } },
    ],
    // Filter by entities
    ...(projectId && { projectId }),
    ...(customerId && { customerId }),
    ...(dealId && { dealId }),
    ...(assignedToId && { assignedToId }),
  };

  // Date range filter - tasks that overlap with the range
  where.AND = [
    {
      OR: [
        // Tasks with startDate in range
        {
          startDate: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        // Tasks with dueDate in range
        {
          dueDate: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        // Tasks spanning the range
        {
          AND: [
            { startDate: { lte: new Date(start) } },
            { dueDate: { gte: new Date(end) } },
          ],
        },
      ],
    },
  ];

  // If user doesn't have manage permission, only show their tasks
  if (hasManagePermission.error) {
    (where.AND as unknown[]).push({
      OR: [
        { createdById: session.user.id },
        { assignedToId: session.user.id },
      ],
    });
  }

  // Get tasks with optional dependencies
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ startDate: 'asc' }, { dueDate: 'asc' }],
    select: {
      id: true,
      title: true,
      type: true,
      priority: true,
      status: true,
      startDate: true,
      dueDate: true,
      progress: true,
      completedAt: true,
      createdAt: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          status: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      deal: {
        select: {
          id: true,
          title: true,
        },
      },
      ...(includeDependencies && {
        dependencies: {
          select: {
            id: true,
            type: true,
            prerequisiteId: true,
            prerequisite: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
        dependents: {
          select: {
            id: true,
            type: true,
            dependentId: true,
            dependent: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
              },
            },
          },
        },
      }),
    },
  });

  // Transform tasks into Gantt items
  const ganttTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    status: task.status,
    startDate: task.startDate,
    endDate: task.dueDate,
    progress: task.progress,
    isCompleted: task.status === 'completed',
    assignee: task.assignedTo,
    project: task.project,
    customer: task.customer,
    deal: task.deal,
    // Color based on project or type
    color: task.project?.color || getTypeColor(task.type),
    // Dependencies (tasks this task depends on)
    dependencies: includeDependencies
      ? (task as unknown as { dependencies: Array<{ id: string; type: string; prerequisiteId: string }> }).dependencies?.map((dep) => ({
          id: dep.id,
          type: dep.type,
          taskId: dep.prerequisiteId,
        })) || []
      : [],
    // Dependents (tasks that depend on this task)
    dependents: includeDependencies
      ? (task as unknown as { dependents: Array<{ id: string; type: string; dependentId: string }> }).dependents?.map((dep) => ({
          id: dep.id,
          type: dep.type,
          taskId: dep.dependentId,
        })) || []
      : [],
  }));

  // Group tasks by project/customer/deal if requested
  const grouped = groupTasks(ganttTasks, { projectId, customerId, dealId });

  // Extract all dependency links for Gantt chart arrows
  const links = includeDependencies
    ? tasks.flatMap((task) => {
        const deps = (task as unknown as { dependencies: Array<{ id: string; type: string; prerequisiteId: string }> }).dependencies || [];
        return deps.map((dep) => ({
          id: dep.id,
          source: dep.prerequisiteId,
          target: task.id,
          type: dep.type,
        }));
      })
    : [];

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'task',
    userId: session.user.id,
    organizationId,
    details: { view: 'gantt', start, end, count: ganttTasks.length, filters: { projectId, customerId, dealId, assignedToId } },
    request,
  });

  return successResponse({
    tasks: ganttTasks,
    links,
    grouped,
    totalCount: ganttTasks.length,
    dateRange: { start, end },
  });
}

// Helper function to get default color for task type
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    task: '#3B82F6',      // Blue
    call: '#22C55E',      // Green
    meeting: '#8B5CF6',   // Purple
    email: '#F97316',     // Orange
    follow_up: '#06B6D4', // Cyan
    milestone: '#EC4899', // Pink
  };
  return colors[type] || '#6B7280'; // Gray default
}

// Helper function to group tasks
function groupTasks(
  tasks: Array<{
    id: string;
    project?: { id: string; name: string } | null;
    customer?: { id: string; name: string } | null;
    deal?: { id: string; title: string } | null;
  }>,
  filters: { projectId?: string; customerId?: string; dealId?: string }
) {
  // If filtering by specific entity, no grouping needed
  if (filters.projectId || filters.customerId || filters.dealId) {
    return null;
  }

  // Group by project
  const byProject: Record<string, { id: string; name: string; tasks: string[] }> = {};
  const byCustomer: Record<string, { id: string; name: string; tasks: string[] }> = {};
  const noGroup: string[] = [];

  for (const task of tasks) {
    if (task.project) {
      if (!byProject[task.project.id]) {
        byProject[task.project.id] = { id: task.project.id, name: task.project.name, tasks: [] };
      }
      byProject[task.project.id].tasks.push(task.id);
    } else if (task.customer) {
      if (!byCustomer[task.customer.id]) {
        byCustomer[task.customer.id] = { id: task.customer.id, name: task.customer.name, tasks: [] };
      }
      byCustomer[task.customer.id].tasks.push(task.id);
    } else {
      noGroup.push(task.id);
    }
  }

  return {
    byProject: Object.values(byProject),
    byCustomer: Object.values(byCustomer),
    ungrouped: noGroup,
  };
}
