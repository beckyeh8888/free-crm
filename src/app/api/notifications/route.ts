/**
 * Notifications API
 *
 * GET /api/notifications - List in-app notifications (paginated)
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { notificationsQuerySchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;

  const queryResult = notificationsQuerySchema.safeParse({
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    unreadOnly: searchParams.get('unreadOnly') || undefined,
  });

  if (!queryResult.success) {
    return errorResponse('VALIDATION_ERROR', '無效的查詢參數');
  }

  const { page, limit, unreadOnly } = queryResult.data;
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(unreadOnly && { isRead: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  await logAudit({
    action: 'read',
    entity: 'notification',
    userId: session.user.id,
    details: { page, limit, count: notifications.length },
    request,
  });

  return NextResponse.json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  });
}
