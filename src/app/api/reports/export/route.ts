/**
 * Reports Export API
 * POST /api/reports/export - Export reports to CSV/JSON
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

import { z } from 'zod';
import {
  requireAuth,
  getOrganizationId,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { getUserDefaultOrganization } from '@/lib/rbac';
import {
  generateDealsCSV,
  generateDealsJSON,
  calculateStats,
  type DealExportData,
} from '@/lib/export-utils';

// ============================================
// Validation Schema
// ============================================

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  stage: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().max(10000).default(1000),
});

// ============================================
// POST /api/reports/export
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Get organization ID (optional)
    let organizationId = getOrganizationId(request);

    if (!organizationId) {
      const defaultOrg = await getUserDefaultOrganization(session.user.id);
      if (defaultOrg) {
        organizationId = defaultOrg.organization.id;
      }
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = exportSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { format, stage, startDate, endDate, limit } = validatedData.data;

    // 4. Build filter conditions
    // If user has organization, filter by org; otherwise filter by user access
    const where: Record<string, unknown> = organizationId
      ? {
          customer: {
            organizationId,
          },
        }
      : {
          OR: [
            { createdById: session.user.id },
            { assignedToId: session.user.id },
          ],
        };

    if (stage) {
      where.stage = stage;
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

    // 5. Query deals with customer info
    const deals = await prisma.deal.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        probability: true,
        closeDate: true,
        closedAt: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            company: true,
          },
        },
      },
    });

    // 6. Transform deals for export
    const exportData: DealExportData[] = deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      closeDate: deal.closeDate,
      closedAt: deal.closedAt,
      createdAt: deal.createdAt,
      customerName: deal.customer?.name ?? null,
      customerCompany: deal.customer?.company ?? null,
    }));

    // 7. Calculate statistics
    const stats = calculateStats(exportData);

    // 8. Log the export action
    await logAudit({
      action: 'export',
      entity: 'report',
      userId: session.user.id,
      organizationId: organizationId || undefined,
      details: {
        format,
        filters: { stage, startDate, endDate },
        recordCount: exportData.length,
        stats,
      },
      request,
    });

    // 9. Generate response based on format
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const json = generateDealsJSON(exportData, stats);
      return new Response(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="deals-report-${dateStr}.json"`,
        },
      });
    } else {
      // CSV format
      const csv = generateDealsCSV(exportData, stats);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="deals-report-${dateStr}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Export report error:', error);
    return errorResponse('INTERNAL_ERROR', '匯出報表失敗');
  }
}
