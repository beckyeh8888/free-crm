'use client';

/**
 * TaskTypeIcon - Displays icon for task type
 * Sprint 5: Calendar & Gantt Chart
 */

import {
  CheckSquare,
  Phone,
  Users,
  Mail,
  RefreshCw,
  Flag,
} from 'lucide-react';
import { taskTypeColors, taskTypeLabels } from '@/lib/design-tokens';

export type TaskType = 'task' | 'call' | 'meeting' | 'email' | 'follow_up' | 'milestone';

interface TaskTypeIconProps {
  readonly type: TaskType;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showLabel?: boolean;
  readonly className?: string;
}

const iconMap = {
  task: CheckSquare,
  call: Phone,
  meeting: Users,
  email: Mail,
  follow_up: RefreshCw,
  milestone: Flag,
};

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TaskTypeIcon({
  type,
  size = 'md',
  showLabel = false,
  className = '',
}: TaskTypeIconProps) {
  const Icon = iconMap[type] || CheckSquare;
  const color = taskTypeColors[type] || taskTypeColors.task;
  const label = taskTypeLabels[type] || '任務';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={label}
    >
      <Icon
        className={sizeMap[size]}
        style={{ color }}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-sm text-text-secondary">{label}</span>
      )}
    </span>
  );
}
