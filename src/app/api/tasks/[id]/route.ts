/**
 * Task API - Single Task Operations
 *
 * GET    /api/tasks/[id] - Get a single task
 * PATCH  /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
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
import { updateTaskSchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    PERMISSIONS.TASKS_READ
  );
  if (permError) return permError;

  // Get task
  const task = await prisma.task.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      priority: true,
      status: true,
      startDate: true,
      dueDate: true,
      dueTime: true,
      completedAt: true,
      isAllDay: true,
      reminderAt: true,
      reminderSent: true,
      progress: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
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
          company: true,
        },
      },
      deal: {
        select: {
          id: true,
          title: true,
          stage: true,
          value: true,
        },
      },
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      dependencies: {
        select: {
          id: true,
          type: true,
          prerequisite: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      dependents: {
        select: {
          id: true,
          type: true,
          dependent: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return errorResponse('NOT_FOUND', '找不到指定的任務');
  }

  // Check if user can view this task (manage permission or own task)
  const hasManagePermission = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_MANAGE
  );

  if (hasManagePermission.error) {
    // User doesn't have manage permission, check if they own/are assigned the task
    if (task.createdBy?.id !== session.user.id && task.assignedTo?.id !== session.user.id) {
      return errorResponse('FORBIDDEN', '您沒有檢視此任務的權限');
    }
  }

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'task',
    entityId: id,
    userId: session.user.id,
    organizationId,
    request,
  });

  return successResponse(task);
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 *
 * Requires: tasks:write permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    // Validate input
    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

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

    // Check if user can edit this task
    const hasManagePermission = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.TASKS_MANAGE
    );

    if (hasManagePermission.error) {
      if (existingTask.createdById !== session.user.id && existingTask.assignedToId !== session.user.id) {
        return errorResponse('FORBIDDEN', '您沒有編輯此任務的權限');
      }
    }

    // If changing assignee, check tasks:assign permission
    if (result.data.assignedToId && result.data.assignedToId !== existingTask.assignedToId) {
      const { error: assignError } = await requirePermission(
        session,
        organizationId,
        PERMISSIONS.TASKS_ASSIGN
      );
      if (assignError) {
        return errorResponse('FORBIDDEN', '您沒有指派任務的權限');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.type !== undefined) updateData.type = result.data.type;
    if (result.data.priority !== undefined) updateData.priority = result.data.priority;
    if (result.data.status !== undefined) {
      updateData.status = result.data.status;
      // Set completedAt when marking as completed
      if (result.data.status === 'completed' && existingTask.status !== 'completed') {
        updateData.completedAt = new Date();
      } else if (result.data.status !== 'completed') {
        updateData.completedAt = null;
      }
    }
    if (result.data.startDate !== undefined) updateData.startDate = result.data.startDate ? new Date(result.data.startDate) : null;
    if (result.data.dueDate !== undefined) updateData.dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
    if (result.data.dueTime !== undefined) updateData.dueTime = result.data.dueTime;
    if (result.data.isAllDay !== undefined) updateData.isAllDay = result.data.isAllDay;
    if (result.data.reminderAt !== undefined) updateData.reminderAt = result.data.reminderAt ? new Date(result.data.reminderAt) : null;
    if (result.data.progress !== undefined) updateData.progress = result.data.progress;
    if (result.data.assignedToId !== undefined) updateData.assignedToId = result.data.assignedToId;
    if (result.data.projectId !== undefined) updateData.projectId = result.data.projectId;
    if (result.data.customerId !== undefined) updateData.customerId = result.data.customerId;
    if (result.data.dealId !== undefined) updateData.dealId = result.data.dealId;
    if (result.data.contactId !== undefined) updateData.contactId = result.data.contactId;

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        priority: true,
        status: true,
        startDate: true,
        dueDate: true,
        dueTime: true,
        completedAt: true,
        isAllDay: true,
        progress: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'update',
      entity: 'task',
      entityId: id,
      userId: session.user.id,
      organizationId,
      details: { before: existingTask, after: task },
      request,
    });

    return successResponse(task);
  } catch (err) {
    console.error('Update task error:', err);
    return errorResponse('INTERNAL_ERROR', '更新任務失敗');
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 *
 * Requires: tasks:write permission
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  // Check if user can delete this task
  const hasManagePermission = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.TASKS_MANAGE
  );

  if (hasManagePermission.error) {
    if (existingTask.createdById !== session.user.id) {
      return errorResponse('FORBIDDEN', '您沒有刪除此任務的權限');
    }
  }

  // Delete task (dependencies will cascade delete)
  await prisma.task.delete({
    where: { id },
  });

  // Log audit event
  await logAudit({
    action: 'delete',
    entity: 'task',
    entityId: id,
    userId: session.user.id,
    organizationId,
    details: { task: existingTask },
    request,
  });

  return successResponse({ message: '任務已刪除', id });
}
