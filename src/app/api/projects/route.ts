/**
 * Project API - List & Create
 *
 * GET  /api/projects - List projects (paginated, filterable)
 * POST /api/projects - Create a new project
 *
 * Multi-tenant: Requires organizationId in header or query param
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  listResponse,
  errorResponse,
  logAudit,
  getPaginationParams,
  getOrganizationId,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import {
  createProjectSchema,
  projectFilterSchema,
} from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

/**
 * GET /api/projects
 * List all projects for the organization
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search by name)
 * - status: 'active' | 'completed' | 'on_hold' | 'cancelled'
 * - customerId: string (filter by customer)
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

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

  // Parse filters
  const filterResult = projectFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    customerId: searchParams.get('customerId') || undefined,
  });

  const filters = filterResult.success ? filterResult.data : {};

  // Build where clause
  const where = {
    organizationId,
    ...(filters.status && { status: filters.status }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    }),
  };

  // Execute queries in parallel
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'project',
    userId: session.user.id,
    organizationId,
    details: { count: projects.length, filters },
    request,
  });

  return listResponse(projects, { page, limit, total });
}

/**
 * POST /api/projects
 * Create a new project
 *
 * Requires: projects:write permission
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

    // Get organization ID
    let organizationId = result.data.organizationId || getOrganizationId(request);

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

    // Create project
    const project = await prisma.project.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        status: result.data.status,
        startDate: result.data.startDate ? new Date(result.data.startDate) : null,
        endDate: result.data.endDate ? new Date(result.data.endDate) : null,
        color: result.data.color,
        customerId: result.data.customerId || null,
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
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'project',
      entityId: project.id,
      userId: session.user.id,
      organizationId,
      details: { project },
      request,
    });

    return successResponse(project, 201);
  } catch (err) {
    console.error('Create project error:', err);
    return errorResponse('INTERNAL_ERROR', '建立專案失敗');
  }
}
