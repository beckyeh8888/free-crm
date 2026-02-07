'use client';

/**
 * NotificationItem - Individual notification row in dropdown
 * WCAG 2.2 AAA Compliant
 */

import { TrendingUp, Clock, UserPlus, FileText, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-utils';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  readonly notification: Notification;
  readonly onClick: (notification: Notification) => void;
}

const iconMap: Record<string, LucideIcon> = {
  deal_stage_change: TrendingUp,
  task_reminder: Clock,
  customer_assign: UserPlus,
  new_document: FileText,
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = iconMap[notification.type] ?? Bell;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        min-h-[48px] transition-colors
        hover:bg-background-hover
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
        ${!notification.isRead ? 'bg-accent-600/5' : ''}
      `}
      aria-label={`${notification.title}: ${notification.message}`}
    >
      {/* Unread indicator */}
      <div className="w-2 flex-shrink-0 mt-2">
        {!notification.isRead && (
          <span
            className="block w-2 h-2 rounded-full bg-accent-600"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Icon */}
      <Icon className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {notification.title}
        </p>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <time
          className="text-xs text-text-muted mt-1 block"
          dateTime={notification.createdAt}
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>
    </button>
  );
}
