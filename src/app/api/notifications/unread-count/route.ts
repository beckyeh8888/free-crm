/**
 * Notification Unread Count API
 *
 * GET /api/notifications/unread-count - Lightweight unread count for badge polling
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { prisma } from '@/lib/prisma';
import { requireAuth, successResponse } from '@/lib/api-utils';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return successResponse({ count });
}
