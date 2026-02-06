/**
 * Notification Preferences API
 *
 * GET - Fetch user's notification preferences (with defaults)
 * PATCH - Update notification preferences (upsert)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateNotificationPreferencesSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/api-utils';

// Default notification preferences
const DEFAULT_PREFERENCES = [
  { channel: 'email', eventType: 'deal_stage_change', enabled: true },
  { channel: 'email', eventType: 'task_reminder', enabled: true },
  { channel: 'email', eventType: 'customer_assign', enabled: true },
  { channel: 'email', eventType: 'new_document', enabled: false },
  { channel: 'in_app', eventType: 'deal_stage_change', enabled: true },
  { channel: 'in_app', eventType: 'task_reminder', enabled: true },
  { channel: 'in_app', eventType: 'customer_assign', enabled: true },
  { channel: 'in_app', eventType: 'new_document', enabled: true },
] as const;

/**
 * GET /api/account/notifications
 * Returns user's notification preferences with defaults applied
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', '請先登入'),
        { status: 401 }
      );
    }

    // Fetch existing preferences
    const existingPrefs = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
      select: {
        channel: true,
        eventType: true,
        enabled: true,
      },
    });

    // Build preference map from existing
    const prefMap = new Map<string, boolean>();
    for (const pref of existingPrefs) {
      prefMap.set(`${pref.channel}:${pref.eventType}`, pref.enabled);
    }

    // Merge with defaults
    const preferences = DEFAULT_PREFERENCES.map((def) => ({
      channel: def.channel,
      eventType: def.eventType,
      enabled: prefMap.get(`${def.channel}:${def.eventType}`) ?? def.enabled,
    }));

    return NextResponse.json(
      successResponse({ preferences })
    );
  } catch (error) {
    console.error('[Notifications GET] Error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', '無法取得通知偏好'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/account/notifications
 * Update notification preferences (upsert)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', '請先登入'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateNotificationPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', '無效的請求資料'),
        { status: 400 }
      );
    }

    const { preferences } = parsed.data;

    // Upsert each preference
    await prisma.$transaction(
      preferences.map((pref) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_channel_eventType: {
              userId: session.user.id,
              channel: pref.channel,
              eventType: pref.eventType,
            },
          },
          update: {
            enabled: pref.enabled,
          },
          create: {
            userId: session.user.id,
            channel: pref.channel,
            eventType: pref.eventType,
            enabled: pref.enabled,
          },
        })
      )
    );

    // Fetch updated preferences
    const updatedPrefs = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
      select: {
        channel: true,
        eventType: true,
        enabled: true,
      },
    });

    // Build preference map
    const prefMap = new Map<string, boolean>();
    for (const pref of updatedPrefs) {
      prefMap.set(`${pref.channel}:${pref.eventType}`, pref.enabled);
    }

    // Merge with defaults
    const allPreferences = DEFAULT_PREFERENCES.map((def) => ({
      channel: def.channel,
      eventType: def.eventType,
      enabled: prefMap.get(`${def.channel}:${def.eventType}`) ?? def.enabled,
    }));

    return NextResponse.json(
      successResponse({ preferences: allPreferences })
    );
  } catch (error) {
    console.error('[Notifications PATCH] Error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', '無法更新通知偏好'),
      { status: 500 }
    );
  }
}
