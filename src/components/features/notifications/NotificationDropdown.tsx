'use client';

/**
 * NotificationDropdown - Notification panel dropdown
 * WCAG 2.2 AAA Compliant
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellOff, Check } from 'lucide-react';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import type { Notification } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly bellRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationDropdown({ isOpen, onClose, bellRef }: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ enabled: isOpen });
  const markReadMutation = useMarkNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        bellRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, bellRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        bellRef.current &&
        !bellRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, bellRef]);

  // Focus first item when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstButton = dropdownRef.current.querySelector<HTMLButtonElement>('button');
      firstButton?.focus();
    }
  }, [isOpen, notifications.length]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markReadMutation.mutate({ notificationIds: [notification.id] });
    }
    // Navigate if link exists
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
    onClose();
  }, [markReadMutation, router, onClose]);

  const handleMarkAllRead = useCallback(() => {
    markReadMutation.mutate({});
  }, [markReadMutation]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="通知"
      aria-modal="false"
      className="
        absolute right-0 top-full mt-2 w-96
        bg-background-tertiary border border-border rounded-xl
        shadow-2xl overflow-hidden z-40
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">
          通知
          {unreadCount > 0 && (
            <span className="ml-2 text-xs text-text-muted">
              ({unreadCount} 則未讀)
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markReadMutation.isPending}
            className="
              flex items-center gap-1 px-2 py-1.5 text-xs
              text-accent-500 hover:text-accent-400
              hover:bg-background-hover rounded-md
              transition-colors
              min-h-[44px] min-w-[44px] justify-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
              disabled:opacity-50
            "
            aria-label="全部標為已讀"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            全部已讀
          </button>
        )}
      </div>

      {/* Notification List */}
      <div
        className="overflow-y-auto max-h-[60vh]"
        role="list"
        aria-label="通知列表"
      >
        {isLoading && (
          <div className="px-4 py-8 text-center">
            <div className="w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted mt-2">載入中...</p>
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center">
            <BellOff className="w-8 h-8 text-text-muted mx-auto" aria-hidden="true" />
            <p className="text-sm text-text-muted mt-2">目前沒有通知</p>
          </div>
        )}

        {!isLoading && notifications.map((notification) => (
          <div key={notification.id} role="listitem">
            <NotificationItem
              notification={notification}
              onClick={handleNotificationClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
