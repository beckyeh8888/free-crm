/**
 * Mark Notifications Read API
 *
 * PATCH /api/notifications/read - Mark specific or all notifications as read
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { markNotificationsReadSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is valid — means "mark all as read"
  }

  const parseResult = markNotificationsReadSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const { notificationIds } = parseResult.data;
  const now = new Date();

  const where = {
    userId: session.user.id,
    isRead: false,
    ...(notificationIds?.length ? { id: { in: notificationIds } } : {}),
  };

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: now },
  });

  await logAudit({
    action: 'update',
    entity: 'notification',
    userId: session.user.id,
    details: {
      action: 'mark_read',
      scope: notificationIds?.length ? 'specific' : 'all',
      updatedCount: result.count,
    },
    request,
  });

  return successResponse({ updatedCount: result.count });
}
