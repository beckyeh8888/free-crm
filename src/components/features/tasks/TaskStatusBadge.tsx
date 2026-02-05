'use client';

/**
 * TaskStatusBadge - Displays badge for task status
 * Sprint 5: Calendar & Gantt Chart
 */

import { taskStatusColors, taskStatusLabels } from '@/lib/design-tokens';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface TaskStatusBadgeProps {
  readonly status: TaskStatus;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

export function TaskStatusBadge({
  status,
  size = 'md',
  className = '',
}: TaskStatusBadgeProps) {
  const color = taskStatusColors[status] || taskStatusColors.pending;
  const label = taskStatusLabels[status] || '待處理';

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-1 text-sm';

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses}
        ${className}
      `}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
