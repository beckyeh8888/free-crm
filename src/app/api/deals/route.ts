/**
 * Deal API - List & Create
 *
 * GET  /api/deals - List deals (paginated, filterable)
 * POST /api/deals - Create a new deal
 *
 * Multi-tenant: Requires proper permissions and organization membership
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
import { createDealSchema, dealFilterSchema } from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

/**
 * GET /api/deals
 * List all deals for the authenticated user
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search by title)
 * - stage: deal stage filter
 * - customerId: filter by customer
 * - minValue / maxValue: value range filter
 * - organizationId: organization filter (optional, uses default org if not provided)
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Get organization ID
  let organizationId = getOrganizationId(request);

  // If no org specified, use user's default organization
  if (!organizationId) {
    const defaultOrg = await getUserDefaultOrganization(session!.user.id);
    if (defaultOrg) {
      organizationId = defaultOrg.organization.id;
    }
  }

  // Parse filters
  const filterResult = dealFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    stage: searchParams.get('stage') || undefined,
    customerId: searchParams.get('customerId') || undefined,
    minValue: searchParams.get('minValue') || undefined,
    maxValue: searchParams.get('maxValue') || undefined,
  });

  const filters = filterResult.success ? filterResult.data : {};

  // Build where clause for multi-tenant
  // Show deals that user created or is assigned to
  const where = {
    OR: [
      { createdById: session!.user.id },
      { assignedToId: session!.user.id },
    ],
    ...(organizationId && {
      customer: {
        organizationId,
      },
    }),
    ...(filters.stage && { stage: filters.stage }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.search && {
      title: { contains: filters.search },
    }),
    ...(filters.minValue !== undefined || filters.maxValue !== undefined
      ? {
          value: {
            ...(filters.minValue !== undefined && { gte: filters.minValue }),
            ...(filters.maxValue !== undefined && { lte: filters.maxValue }),
          },
        }
      : {}),
  };

  // Execute queries in parallel
  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        stage: true,
        probability: true,
        closeDate: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        assignedToId: true,
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            organizationId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.deal.count({ where }),
  ]);

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'deal',
    userId: session!.user.id,
    organizationId: organizationId || undefined,
    details: { count: deals.length, filters },
    request,
  });

  return listResponse(deals, { page, limit, total });
}

/**
 * POST /api/deals
 * Create a new deal
 *
 * Requires: deals:create permission
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const result = createDealSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0].message);
    }

    const data = result.data;

    // Verify customer exists and user has access
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        OR: [
          { createdById: session!.user.id },
          { assignedToId: session!.user.id },
        ],
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!customer) {
      return errorResponse('NOT_FOUND', '找不到此客戶或無權存取');
    }

    // Check permission
    const { error: permError } = await requirePermission(
      session!,
      customer.organizationId,
      PERMISSIONS.DEALS_CREATE
    );
    if (permError) return permError;

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        customerId: data.customerId,
        value: data.value,
        currency: data.currency,
        stage: data.stage,
        probability: data.probability,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        notes: data.notes,
        createdById: session!.user.id,
        assignedToId: data.assignedToId || session!.user.id, // Default to creator
      },
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        stage: true,
        probability: true,
        closeDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        assignedToId: true,
        customer: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'deal',
      entityId: deal.id,
      userId: session!.user.id,
      organizationId: customer.organizationId,
      details: { title: deal.title, customerId: data.customerId, value: deal.value },
      request,
    });

    return successResponse(deal, 201);
  } catch (err) {
    console.error('Create deal error:', err);
    return errorResponse('INTERNAL_ERROR', '建立商機失敗');
  }
}
