/**
 * Notification hooks - TanStack Query hooks for in-app notifications
 * Sprint 8: Notification Bell
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Notification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly linkUrl: string | null;
  readonly isRead: boolean;
  readonly readAt: string | null;
  readonly metadata: string | null;
  readonly createdAt: string;
}

interface NotificationListResponse {
  readonly success: boolean;
  readonly data: readonly Notification[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
  readonly unreadCount: number;
}

interface UnreadCountResponse {
  readonly success: boolean;
  readonly data: {
    readonly count: number;
  };
}

interface MarkReadResponse {
  readonly success: boolean;
  readonly data: {
    readonly updatedCount: number;
  };
}

// ============================================
// Query Key Factory
// ============================================

const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...notificationKeys.all, 'list', params] as const,
  unreadCount: ['notifications-unread-count'] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Lightweight unread count for badge polling.
 * Polls every 60 seconds + refetches on window focus.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () =>
      apiClient.get<UnreadCountResponse>('/api/notifications/unread-count'),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch notification list (used when dropdown is open).
 */
export function useNotifications(params: {
  readonly page?: number;
  readonly limit?: number;
  readonly enabled?: boolean;
} = {}) {
  const { page = 1, limit = 20, enabled = true } = params;

  return useQuery({
    queryKey: notificationKeys.list({ page, limit }),
    queryFn: () =>
      apiClient.get<NotificationListResponse>('/api/notifications', {
        page: String(page),
        limit: String(limit),
      }),
    enabled,
  });
}

/**
 * Mark notifications as read.
 * Pass notificationIds for specific ones, or omit to mark all.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { notificationIds?: string[] }) =>
      apiClient.patch<MarkReadResponse>('/api/notifications/read', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}
