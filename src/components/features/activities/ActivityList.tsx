'use client';

/**
 * ActivityList - Timeline list of activities
 * WCAG 2.2 AAA Compliant
 */

import { ActivityItem } from './ActivityItem';
import type { Activity } from '@/hooks/useActivities';

// ============================================
// Types
// ============================================

interface ActivityListProps {
  readonly activities: readonly Activity[];
  readonly isLoading: boolean;
  readonly onNavigateToEntity: (entity: string, entityId: string) => void;
}

// ============================================
// Skeleton
// ============================================

const SKELETON_IDS = ['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5'] as const;

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {SKELETON_IDS.map((id) => (
        <div key={id} className="flex items-start gap-3 p-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-background-hover flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-background-hover rounded w-3/4" />
            <div className="h-3 bg-background-hover rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-text-muted text-sm">尚無活動記錄</p>
      <p className="text-text-muted text-xs mt-1">
        當您或其他人對您的資料進行操作時，活動會顯示在這裡
      </p>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function ActivityList({
  activities,
  isLoading,
  onNavigateToEntity,
}: ActivityListProps) {
  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (activities.length === 0) {
    return <EmptyState />;
  }

  return (
    <section
      aria-label="活動列表"
      className="divide-y divide-border"
    >
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onNavigate={onNavigateToEntity}
        />
      ))}
    </section>
  );
}

export type { ActivityListProps };
