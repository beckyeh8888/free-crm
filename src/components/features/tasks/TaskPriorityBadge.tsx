'use client';

/**
 * TaskPriorityBadge - Displays badge for task priority
 * Sprint 5: Calendar & Gantt Chart
 */

import { taskPriorityColors, taskPriorityLabels } from '@/lib/design-tokens';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskPriorityBadgeProps {
  readonly priority: TaskPriority;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

export function TaskPriorityBadge({
  priority,
  size = 'md',
  className = '',
}: TaskPriorityBadgeProps) {
  const color = taskPriorityColors[priority] || taskPriorityColors.medium;
  const label = taskPriorityLabels[priority] || '中';

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-1 text-sm';

  return (
    <span
      className={`
        inline-flex items-center rounded-md font-medium
        ${sizeClasses}
        ${className}
      `}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
