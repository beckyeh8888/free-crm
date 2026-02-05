/**
 * Task Dependencies API
 *
 * GET    /api/tasks/[id]/dependencies - Get task dependencies
 * POST   /api/tasks/[id]/dependencies - Add a dependency
 * DELETE /api/tasks/[id]/dependencies - Remove a dependency
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
import { createDependencySchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/dependencies
 * Get all dependencies for a task
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

  // Check task exists
  const task = await prisma.task.findFirst({
    where: { id, organizationId },
  });

  if (!task) {
    return errorResponse('NOT_FOUND', '找不到指定的任務');
  }

  // Get dependencies (tasks this task depends on)
  const dependencies = await prisma.taskDependency.findMany({
    where: { dependentId: id },
    select: {
      id: true,
      type: true,
      createdAt: true,
      prerequisite: {
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          dueDate: true,
          progress: true,
        },
      },
    },
  });

  // Get dependents (tasks that depend on this task)
  const dependents = await prisma.taskDependency.findMany({
    where: { prerequisiteId: id },
    select: {
      id: true,
      type: true,
      createdAt: true,
      dependent: {
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          dueDate: true,
          progress: true,
        },
      },
    },
  });

  return successResponse({
    taskId: id,
    // Tasks this task depends on (must complete before this task)
    dependencies: dependencies.map((d) => ({
      id: d.id,
      type: d.type,
      task: d.prerequisite,
      createdAt: d.createdAt,
    })),
    // Tasks that depend on this task (wait for this task)
    dependents: dependents.map((d) => ({
      id: d.id,
      type: d.type,
      task: d.dependent,
      createdAt: d.createdAt,
    })),
  });
}

/**
 * POST /api/tasks/[id]/dependencies
 * Add a dependency to a task
 *
 * Body: { prerequisiteId: string, type?: string }
 *
 * This makes the current task depend on the prerequisite task.
 * The prerequisite must complete before this task can start.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: dependentId } = await params;

  try {
    const body = await request.json();

    // Validate input
    const result = createDependencySchema.safeParse(body);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0].message);
    }

    const { prerequisiteId, type } = result.data;

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

    // Prevent self-dependency
    if (dependentId === prerequisiteId) {
      return errorResponse('VALIDATION_ERROR', '任務不能依賴自己');
    }

    // Check both tasks exist and belong to same organization
    const [dependentTask, prerequisiteTask] = await Promise.all([
      prisma.task.findFirst({ where: { id: dependentId, organizationId } }),
      prisma.task.findFirst({ where: { id: prerequisiteId, organizationId } }),
    ]);

    if (!dependentTask) {
      return errorResponse('NOT_FOUND', '找不到指定的任務');
    }

    if (!prerequisiteTask) {
      return errorResponse('NOT_FOUND', '找不到前置任務');
    }

    // Check for circular dependency
    const hasCircular = await checkCircularDependency(prerequisiteId, dependentId);
    if (hasCircular) {
      return errorResponse('VALIDATION_ERROR', '無法建立循環依賴關係');
    }

    // Check if dependency already exists
    const existingDep = await prisma.taskDependency.findUnique({
      where: {
        prerequisiteId_dependentId: {
          prerequisiteId,
          dependentId,
        },
      },
    });

    if (existingDep) {
      return errorResponse('VALIDATION_ERROR', '此依賴關係已存在');
    }

    // Create dependency
    const dependency = await prisma.taskDependency.create({
      data: {
        prerequisiteId,
        dependentId,
        type,
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        prerequisite: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependent: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'task_dependency',
      entityId: dependency.id,
      userId: session.user.id,
      organizationId,
      details: {
        prerequisiteId,
        dependentId,
        type,
      },
      request,
    });

    return successResponse(dependency, 201);
  } catch (err) {
    console.error('Create dependency error:', err);
    return errorResponse('INTERNAL_ERROR', '建立依賴關係失敗');
  }
}

/**
 * DELETE /api/tasks/[id]/dependencies
 * Remove a dependency from a task
 *
 * Query: ?dependencyId=xxx OR ?prerequisiteId=xxx
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: dependentId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const dependencyId = searchParams.get('dependencyId');
  const prerequisiteId = searchParams.get('prerequisiteId');

  if (!dependencyId && !prerequisiteId) {
    return errorResponse('VALIDATION_ERROR', '請提供 dependencyId 或 prerequisiteId');
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

  // Check task exists
  const task = await prisma.task.findFirst({
    where: { id: dependentId, organizationId },
  });

  if (!task) {
    return errorResponse('NOT_FOUND', '找不到指定的任務');
  }

  // Find and delete the dependency
  let deletedDependency;

  if (dependencyId) {
    deletedDependency = await prisma.taskDependency.findFirst({
      where: { id: dependencyId, dependentId },
    });
  } else if (prerequisiteId) {
    deletedDependency = await prisma.taskDependency.findFirst({
      where: { prerequisiteId, dependentId },
    });
  }

  if (!deletedDependency) {
    return errorResponse('NOT_FOUND', '找不到指定的依賴關係');
  }

  await prisma.taskDependency.delete({
    where: { id: deletedDependency.id },
  });

  // Log audit event
  await logAudit({
    action: 'delete',
    entity: 'task_dependency',
    entityId: deletedDependency.id,
    userId: session.user.id,
    organizationId,
    details: {
      prerequisiteId: deletedDependency.prerequisiteId,
      dependentId: deletedDependency.dependentId,
    },
    request,
  });

  return successResponse({ message: '依賴關係已刪除', id: deletedDependency.id });
}

/**
 * Check for circular dependency
 * Returns true if adding prerequisiteId -> dependentId would create a cycle
 */
async function checkCircularDependency(
  prerequisiteId: string,
  dependentId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  // If we've already visited this node, we have a cycle
  if (visited.has(prerequisiteId)) {
    return false;
  }

  // If the prerequisite depends on the dependent, it's a cycle
  if (prerequisiteId === dependentId) {
    return true;
  }

  visited.add(prerequisiteId);

  // Get all tasks that the prerequisite depends on
  const dependencies = await prisma.taskDependency.findMany({
    where: { dependentId: prerequisiteId },
    select: { prerequisiteId: true },
  });

  // Check each of those dependencies
  for (const dep of dependencies) {
    if (dep.prerequisiteId === dependentId) {
      return true;
    }
    // Recursively check
    const hasCycle = await checkCircularDependency(dep.prerequisiteId, dependentId, visited);
    if (hasCycle) {
      return true;
    }
  }

  return false;
}
