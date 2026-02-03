/**
 * Account Login History API
 * GET /api/account/login-history - Get current user's login history
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

import {
  requireAuth,
  errorResponse,
  getPaginationParams,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/account/login-history
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // 2. Parse query parameters
    const url = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(url.searchParams);
    const status = url.searchParams.get('status'); // success, failed, blocked

    // 3. Build filter conditions
    const where: Record<string, unknown> = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    // 4. Query login history
    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ip: true,
          userAgent: true,
          location: true,
          device: true,
          browser: true,
          status: true,
          failReason: true,
          createdAt: true,
        },
      }),
      prisma.loginHistory.count({ where }),
    ]);

    // 5. Get summary statistics
    const [successCount, failedCount, lastSuccessfulLogin] = await Promise.all([
      prisma.loginHistory.count({
        where: { userId, status: 'success' },
      }),
      prisma.loginHistory.count({
        where: { userId, status: { in: ['failed', 'blocked'] } },
      }),
      prisma.loginHistory.findFirst({
        where: { userId, status: 'success' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // 6. Transform response
    const transformedHistory = history.map((entry) => ({
      id: entry.id,
      ip: entry.ip || '未知',
      location: entry.location || '未知',
      device: entry.device || '未知',
      browser: entry.browser || '未知',
      userAgent: entry.userAgent,
      status: entry.status,
      failReason: entry.failReason,
      createdAt: entry.createdAt,
      statusLabel: getStatusLabel(entry.status),
    }));

    // Create response with summary
    const response = {
      success: true,
      data: transformedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalLogins: successCount + failedCount,
        successfulLogins: successCount,
        failedAttempts: failedCount,
        lastSuccessfulLogin: lastSuccessfulLogin?.createdAt ?? null,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get login history error:', error);
    return errorResponse('INTERNAL_ERROR', '取得登入記錄失敗');
  }
}

// ============================================
// Helper Functions
// ============================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    success: '登入成功',
    failed: '登入失敗',
    blocked: '已被封鎖',
    '2fa_required': '需要 2FA 驗證',
  };
  return labels[status] || status;
}
