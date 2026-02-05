/**
 * Task Complete API
 *
 * POST /api/tasks/[id]/complete - Mark a task as completed
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
import { getUserDefaultOrganization } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as completed (or toggle completion)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

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
    PERMISSIONS.TASKS_WRITE
  );
  if (permError) return permError;

  // Get existing task
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingTask) {
    return errorResponse('NOT_FOUND', '找不到指定的任務');
  }

  // Check if user can complete this task
  const hasManagePermission = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_MANAGE
  );

  if (hasManagePermission.error) {
    if (existingTask.createdById !== session.user.id && existingTask.assignedToId !== session.user.id) {
      return errorResponse('FORBIDDEN', '您沒有完成此任務的權限');
    }
  }

  // Toggle completion status
  const isCompleting = existingTask.status !== 'completed';

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: isCompleting ? 'completed' : 'pending',
      completedAt: isCompleting ? new Date() : null,
      progress: isCompleting ? 100 : existingTask.progress,
    },
    select: {
      id: true,
      title: true,
      status: true,
      completedAt: true,
      progress: true,
      updatedAt: true,
    },
  });

  // Log audit event
  await logAudit({
    action: 'update',
    entity: 'task',
    entityId: id,
    userId: session.user.id,
    organizationId,
    details: {
      action: isCompleting ? 'completed' : 'reopened',
      before: { status: existingTask.status },
      after: { status: task.status },
    },
    request,
  });

  return successResponse({
    ...task,
    message: isCompleting ? '任務已完成' : '任務已重新開啟',
  });
}
