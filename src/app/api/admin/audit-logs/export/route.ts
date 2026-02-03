/**
 * Admin Audit Log Export API
 * POST /api/admin/audit-logs/export - Export audit logs to CSV
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 * ISO 27001 A.12.4.2 (Protection of Log Information)
 */

import { z } from 'zod';
import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  errorResponse,
  logAdminAction,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// Validation Schema
// ============================================

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().max(10000).default(1000),
});

// ============================================
// Helper Functions
// ============================================

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle objects and arrays by converting to JSON
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Escape double quotes and wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function generateCSV(
  logs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>
): string {
  const headers = [
    '日期時間',
    '動作',
    '實體類型',
    '實體 ID',
    '用戶 ID',
    '用戶姓名',
    '用戶信箱',
    'IP 位址',
    '瀏覽器',
    '詳細資訊',
  ];

  const rows = logs.map((log) => [
    escapeCSV(formatDate(log.createdAt)),
    escapeCSV(log.action),
    escapeCSV(log.entity),
    escapeCSV(log.entityId),
    escapeCSV(log.userId),
    escapeCSV(log.userName),
    escapeCSV(log.userEmail),
    escapeCSV(log.ipAddress),
    escapeCSV(log.userAgent?.substring(0, 100)), // Truncate user agent
    escapeCSV(log.details?.substring(0, 500)), // Truncate details
  ]);

  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  return bom + headers.join(',') + '\n' + rows.map((row) => row.join(',')).join('\n');
}

// ============================================
// POST /api/admin/audit-logs/export
// ============================================

export async function POST(request: Request) {
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
      PERMISSIONS.ADMIN_AUDIT_EXPORT
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = exportSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { format, action, entity, userId, startDate, endDate, limit } =
      validatedData.data;

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

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        (where.createdAt as Record<string, unknown>).lt = end;
      }
    }

    // 6. Query audit logs
    const logs = await prisma.auditLog.findMany({
      where,
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
    });

    // 7. Transform logs for export
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.user?.name ?? null,
      userEmail: log.user?.email ?? null,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    // 8. Log the export action
    await logAdminAction({
      action: 'read',
      entity: 'audit_log_export',
      userId: session.user.id,
      organizationId,
      after: {
        format,
        filters: { action, entity, userId, startDate, endDate },
        recordCount: transformedLogs.length,
      },
      request,
    });

    // 9. Generate response based on format
    if (format === 'json') {
      return new Response(JSON.stringify({ data: transformedLogs }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      // CSV format
      const csv = generateCSV(transformedLogs);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    return errorResponse('INTERNAL_ERROR', '匯出稽核日誌失敗');
  }
}
