/**
 * In-App Notification Service
 *
 * Creates in-app notifications with user preference checking.
 * Safe to call fire-and-forget — never throws.
 */

import { prisma } from './prisma';

interface CreateNotificationParams {
  readonly userId: string;
  readonly type: 'deal_stage_change' | 'task_reminder' | 'customer_assign' | 'new_document';
  readonly title: string;
  readonly message: string;
  readonly linkUrl?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Create an in-app notification if user preferences allow it.
 */
export async function createInAppNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
  metadata,
}: CreateNotificationParams): Promise<void> {
  try {
    // Check user preference for in_app channel
    const pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_channel_eventType: {
          userId,
          channel: 'in_app',
          eventType: type,
        },
      },
    });

    // Default to enabled if no preference record exists
    const isEnabled = pref?.enabled ?? true;
    if (!isEnabled) return;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('[Notification] Failed to create in-app notification:', error);
  }
}
