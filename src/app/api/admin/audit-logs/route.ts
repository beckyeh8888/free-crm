/**
 * Admin Audit Log API
 * GET /api/admin/audit-logs - List audit logs with filters
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 * ISO 27001 A.12.4.2 (Protection of Log Information)
 * ISO 27001 A.12.4.3 (Administrator and Operator Logs)
 */

import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  errorResponse,
  getPaginationParams,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/audit-logs - List audit logs
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Get organization ID
    const organizationId =
      getOrganizationId(request) || session.user.defaultOrganizationId;
    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    // 3. Check permission
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_AUDIT
    );
    if (permError) return permError;

    // 4. Parse query parameters
    const url = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(url.searchParams);

    // Filter parameters
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const userId = url.searchParams.get('userId');
    const entityId = url.searchParams.get('entityId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    // Sort parameters
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as
      | 'asc'
      | 'desc';

    // 5. Build filter conditions
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        (where.createdAt as Record<string, unknown>).lt = end;
      }
    }

    if (search) {
      where.OR = [
        { entity: { contains: search } },
        { entityId: { contains: search } },
        { details: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    // 6. Query audit logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 7. Get unique values for filters
    const [actions, entities, users] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId },
        select: { action: true },
        distinct: ['action'],
      }),
      prisma.auditLog.findMany({
        where: { organizationId },
        select: { entity: true },
        distinct: ['entity'],
      }),
      prisma.auditLog.findMany({
        where: { organizationId, userId: { not: null } },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        distinct: ['userId'],
      }),
    ]);

    // 8. Transform response
    const transformedLogs = logs.map((log) => {
      let parsedDetails = null;
      let parsedMetadata = null;

      try {
        if (log.details) {
          parsedDetails = JSON.parse(log.details);
        }
      } catch {
        parsedDetails = log.details;
      }

      try {
        if (log.metadata) {
          parsedMetadata = JSON.parse(log.metadata);
        }
      } catch {
        parsedMetadata = log.metadata;
      }

      return {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        user: log.user,
        details: parsedDetails,
        metadata: parsedMetadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      };
    });

    // 9. Include filter options in response metadata
    const filterOptions = {
      actions: actions.map((a) => a.action).sort(),
      entities: entities.map((e) => e.entity).sort(),
      users: users
        .filter((u): u is typeof u & { user: NonNullable<typeof u.user> } => u.user !== null)
        .map((u) => ({
          id: u.user.id,
          name: u.user.name,
          email: u.user.email,
        })),
    };

    // Create response with additional metadata
    const response = {
      success: true,
      data: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filterOptions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    return errorResponse('INTERNAL_ERROR', '取得稽核日誌失敗');
  }
}
