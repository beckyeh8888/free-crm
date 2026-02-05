/**
 * Task Calendar API
 *
 * GET /api/tasks/calendar - Get tasks for calendar view (by date range)
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
import { calendarQuerySchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

/**
 * GET /api/tasks/calendar
 * Get tasks for calendar view within a date range
 *
 * Query params:
 * - start: ISO datetime (required)
 * - end: ISO datetime (required)
 * - type: task type filter (optional)
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
  const queryResult = calendarQuerySchema.safeParse({
    start: searchParams.get('start'),
    end: searchParams.get('end'),
    type: searchParams.get('type') || undefined,
  });

  if (!queryResult.success) {
    return errorResponse('VALIDATION_ERROR', '請提供有效的日期範圍 (start, end)');
  }

  const { start, end, type } = queryResult.data;

  // Check if user can see all tasks (tasks:manage) or only their own
  const hasManagePermission = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_MANAGE
  );

  // Build where clause - tasks within the date range
  const where: Record<string, unknown> = {
    organizationId,
    OR: [
      // Tasks with dueDate in range
      {
        dueDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      // Tasks with startDate in range
      {
        startDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      // Tasks spanning the range (startDate before and dueDate after)
      {
        AND: [
          { startDate: { lte: new Date(start) } },
          { dueDate: { gte: new Date(end) } },
        ],
      },
    ],
    ...(type && { type }),
  };

  // If user doesn't have manage permission, only show their tasks
  if (hasManagePermission.error) {
    where.AND = [
      {
        OR: [
          { createdById: session.user.id },
          { assignedToId: session.user.id },
        ],
      },
    ];
  }

  // Get tasks
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { dueTime: 'asc' }],
    select: {
      id: true,
      title: true,
      type: true,
      priority: true,
      status: true,
      startDate: true,
      dueDate: true,
      dueTime: true,
      isAllDay: true,
      progress: true,
      completedAt: true,
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
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Transform tasks into calendar events
  const events = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    status: task.status,
    start: task.startDate || task.dueDate,
    end: task.dueDate || task.startDate,
    time: task.dueTime,
    isAllDay: task.isAllDay,
    progress: task.progress,
    isCompleted: task.status === 'completed',
    assignee: task.assignedTo,
    project: task.project,
    customer: task.customer,
    // Color based on project or type
    color: task.project?.color || getTypeColor(task.type),
  }));

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'task',
    userId: session.user.id,
    organizationId,
    details: { view: 'calendar', start, end, count: events.length },
    request,
  });

  return successResponse({
    events,
    totalCount: events.length,
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
