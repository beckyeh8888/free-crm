'use client';

/**
 * ActivityItem - Single activity entry with navigation
 * WCAG 2.2 AAA Compliant
 */

import { Plus, Pencil, Trash2, Eye, Download, LogIn, LogOut } from 'lucide-react';
import type { Activity } from '@/hooks/useActivities';

// ============================================
// Types
// ============================================

interface ActivityItemProps {
  readonly activity: Activity;
  readonly onNavigate?: (entity: string, entityId: string) => void;
}

// ============================================
// Labels
// ============================================

const actionLabels: Record<string, string> = {
  create: '新增了',
  update: '更新了',
  delete: '刪除了',
  read: '查看了',
  export: '匯出了',
  login: '登入了',
  logout: '登出了',
};

const entityLabels: Record<string, string> = {
  customer: '客戶',
  contact: '聯絡人',
  deal: '商機',
  document: '文件',
  user: '使用者',
  role: '角色',
  organization: '組織',
  report: '報表',
};

// ============================================
// Icon mapping
// ============================================

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  read: Eye,
  export: Download,
  login: LogIn,
  logout: LogOut,
};

const actionColors: Record<string, string> = {
  create: 'bg-success',
  update: 'bg-accent-600',
  delete: 'bg-error',
  read: 'bg-text-muted',
  export: 'bg-warning',
  login: 'bg-success',
  logout: 'bg-text-muted',
};

// ============================================
// Helpers
// ============================================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '剛剛';
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================
// Component
// ============================================

export function ActivityItem({ activity, onNavigate }: ActivityItemProps) {
  const userName = activity.user?.name ?? activity.user?.email ?? '系統';
  const actionLabel = actionLabels[activity.action] ?? activity.action;
  const entityLabel = entityLabels[activity.entity] ?? activity.entity;
  const timeStr = formatRelativeTime(activity.createdAt);

  const IconComponent = actionIcons[activity.action] ?? Eye;
  const dotColor = actionColors[activity.action] ?? 'bg-text-muted';

  const canNavigate = activity.entityId && onNavigate && activity.entity !== 'user';

  const handleClick = () => {
    if (canNavigate && activity.entityId) {
      onNavigate(activity.entity, activity.entityId);
    }
  };

  // Use button element when navigable, div otherwise
  const Wrapper = canNavigate ? 'button' : 'div';
  const wrapperProps = canNavigate
    ? {
        type: 'button' as const,
        onClick: handleClick,
        className: `flex items-start gap-3 p-3 rounded-lg transition-colors w-full text-left cursor-pointer hover:bg-background-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600`,
        'aria-label': `前往${entityLabel}詳情`,
      }
    : {
        className: 'flex items-start gap-3 p-3 rounded-lg',
      };

  return (
    <Wrapper {...wrapperProps}>
      {/* Icon with colored background */}
      <div
        className={`mt-0.5 w-8 h-8 rounded-full ${dotColor} flex items-center justify-center flex-shrink-0`}
        aria-hidden="true"
      >
        <IconComponent className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary">
          <span className="text-text-primary font-medium">{userName}</span>
          {' '}{actionLabel}{' '}
          <span className="text-text-primary">{entityLabel}</span>
          {activity.entityId && activity.details && (
            <span className="text-text-muted">
              {' '}
              {getEntityTitle(activity)}
            </span>
          )}
        </p>
        <time
          className="text-xs text-text-muted mt-0.5 block"
          dateTime={activity.createdAt}
        >
          {timeStr}
        </time>
      </div>

      {/* Navigation indicator */}
      {canNavigate && (
        <span className="text-text-muted text-xs self-center" aria-hidden="true">
          →
        </span>
      )}
    </Wrapper>
  );
}

/**
 * Extract entity title from activity details
 */
function getEntityTitle(activity: Activity): string {
  if (!activity.details) return '';

  const details = activity.details;

  // Try common title fields
  if (typeof details.title === 'string') return details.title;
  if (typeof details.name === 'string') return details.name;
  if (typeof details.filename === 'string') return details.filename;

  return '';
}

export type { ActivityItemProps };
