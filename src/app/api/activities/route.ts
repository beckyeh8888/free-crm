/**
 * Activities API - User Activity Feed
 * GET /api/activities - List user's activities
 *
 * Shows activities where:
 * - User performed the action (userId = currentUser)
 * - OR action was performed on entities user owns/is assigned to
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

import {
  requireAuth,
  getOrganizationId,
  errorResponse,
  getPaginationParams,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { getUserDefaultOrganization } from '@/lib/rbac';

// ============================================
// Helper Functions
// ============================================

/**
 * Build date range filter for createdAt
 */
function buildDateFilter(
  startDate: string | null,
  endDate: string | null
): Record<string, Date> | undefined {
  if (!startDate && !endDate) return undefined;

  const filter: Record<string, Date> = {};

  if (startDate) {
    filter.gte = new Date(startDate);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    filter.lt = end;
  }

  return filter;
}

// ============================================
// GET /api/activities - List user's activities
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // 2. Get organization ID (optional)
    let organizationId = getOrganizationId(request);

    if (!organizationId) {
      const defaultOrg = await getUserDefaultOrganization(userId);
      if (defaultOrg) {
        organizationId = defaultOrg.organization.id;
      }
    }

    // 3. Parse query parameters
    const url = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(url.searchParams);

    // Filter parameters
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // 4. Get user's entity IDs for multi-tenant access
    // User can see activities on their own entities
    const [userCustomerIds, userDealIds, userDocumentIds] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          ...(organizationId && { organizationId }),
        },
        select: { id: true },
      }),
      prisma.deal.findMany({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
        select: { id: true },
      }),
      prisma.document.findMany({
        where: {
          OR: [
            // Documents in user's organization
            ...(organizationId ? [{ organizationId }] : []),
            // Documents associated with user's customers
            {
              customer: {
                OR: [{ createdById: userId }, { assignedToId: userId }],
              },
            },
          ],
        },
        select: { id: true },
      }),
    ]);

    const customerIds = userCustomerIds.map((c) => c.id);
    const dealIds = userDealIds.map((d) => d.id);
    const documentIds = userDocumentIds.map((d) => d.id);

    // 5. Build filter conditions
    // User sees activities where:
    // - They performed the action
    // - OR the action was on their entities
    const where: Record<string, unknown> = {
      OR: [
        { userId },
        { entity: 'customer', entityId: { in: customerIds } },
        { entity: 'deal', entityId: { in: dealIds } },
        { entity: 'document', entityId: { in: documentIds } },
      ],
      ...(organizationId && { organizationId }),
    };

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    // 6. Query activities
    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 7. Get unique values for filter dropdowns
    const baseFilterWhere = {
      OR: [
        { userId },
        { entity: 'customer', entityId: { in: customerIds } },
        { entity: 'deal', entityId: { in: dealIds } },
        { entity: 'document', entityId: { in: documentIds } },
      ],
      ...(organizationId && { organizationId }),
    };

    const [actions, entities] = await Promise.all([
      prisma.auditLog.findMany({
        where: baseFilterWhere,
        select: { action: true },
        distinct: ['action'],
      }),
      prisma.auditLog.findMany({
        where: baseFilterWhere,
        select: { entity: true },
        distinct: ['entity'],
      }),
    ]);

    // 8. Transform response
    const transformedActivities = activities.map((activity) => {
      let parsedDetails = null;

      try {
        if (activity.details) {
          parsedDetails = JSON.parse(activity.details);
        }
      } catch {
        parsedDetails = activity.details;
      }

      return {
        id: activity.id,
        action: activity.action,
        entity: activity.entity,
        entityId: activity.entityId,
        user: activity.user,
        details: parsedDetails,
        createdAt: activity.createdAt,
      };
    });

    // 9. Build response
    const response = {
      success: true,
      data: transformedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filterOptions: {
        actions: actions.map((a) => a.action).sort((a, b) => a.localeCompare(b)),
        entities: entities.map((e) => e.entity).sort((a, b) => a.localeCompare(b)),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('List activities error:', error);
    return errorResponse('INTERNAL_ERROR', '取得活動記錄失敗');
  }
}
