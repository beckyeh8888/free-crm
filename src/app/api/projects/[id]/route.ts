/**
 * Project API - Single Project Operations
 *
 * GET    /api/projects/[id] - Get a single project
 * PATCH  /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project
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
import { updateProjectSchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID
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
    PERMISSIONS.PROJECTS_READ
  );
  if (permError) return permError;

  // Get project
  const project = await prisma.project.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      color: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          progress: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse('NOT_FOUND', '找不到指定的專案');
  }

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'project',
    entityId: id,
    userId: session.user.id,
    organizationId,
    request,
  });

  return successResponse(project);
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 *
 * Requires: projects:write permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    // Validate input
    const result = updateProjectSchema.safeParse(body);
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
      PERMISSIONS.PROJECTS_WRITE
    );
    if (permError) return permError;

    // Check project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingProject) {
      return errorResponse('NOT_FOUND', '找不到指定的專案');
    }

    // Validate customer belongs to organization if provided
    if (result.data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: result.data.customerId,
          organizationId,
        },
      });
      if (!customer) {
        return errorResponse('NOT_FOUND', '找不到指定的客戶');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.status !== undefined) updateData.status = result.data.status;
    if (result.data.startDate !== undefined) updateData.startDate = result.data.startDate ? new Date(result.data.startDate) : null;
    if (result.data.endDate !== undefined) updateData.endDate = result.data.endDate ? new Date(result.data.endDate) : null;
    if (result.data.color !== undefined) updateData.color = result.data.color;
    if (result.data.customerId !== undefined) updateData.customerId = result.data.customerId;

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'update',
      entity: 'project',
      entityId: id,
      userId: session.user.id,
      organizationId,
      details: { before: existingProject, after: project },
      request,
    });

    return successResponse(project);
  } catch (err) {
    console.error('Update project error:', err);
    return errorResponse('INTERNAL_ERROR', '更新專案失敗');
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 *
 * Requires: projects:write permission
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
    PERMISSIONS.PROJECTS_WRITE
  );
  if (permError) return permError;

  // Check project exists and belongs to organization
  const existingProject = await prisma.project.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!existingProject) {
    return errorResponse('NOT_FOUND', '找不到指定的專案');
  }

  // Delete project (tasks will be unlinked due to onDelete: SetNull)
  await prisma.project.delete({
    where: { id },
  });

  // Log audit event
  await logAudit({
    action: 'delete',
    entity: 'project',
    entityId: id,
    userId: session.user.id,
    organizationId,
    details: { project: existingProject },
    request,
  });

  return successResponse({ message: '專案已刪除', id });
}
