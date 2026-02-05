'use client';

/**
 * GanttBar - Task bar in timeline
 * Sprint 5: Calendar & Gantt Chart
 */

import { taskTypeColors } from '@/lib/design-tokens';

interface GanttBarProps {
  readonly title: string;
  readonly type: string;
  readonly progress: number;
  readonly startPercent: number;
  readonly widthPercent: number;
  readonly color?: string;
  readonly onClick?: () => void;
}

export function GanttBar({
  title,
  type,
  progress,
  startPercent,
  widthPercent,
  color,
  onClick,
}: GanttBarProps) {
  const barColor = color || taskTypeColors[type as keyof typeof taskTypeColors] || taskTypeColors.task;

  // Ensure minimum visible width
  const minWidth = 2; // 2%
  const displayWidth = Math.max(widthPercent, minWidth);

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 h-6 cursor-pointer group"
      style={{
        left: `${startPercent}%`,
        width: `${displayWidth}%`,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      title={`${title} (${progress}%)`}
    >
      {/* Background bar */}
      <div
        className="absolute inset-0 rounded-md opacity-30 transition-opacity group-hover:opacity-50"
        style={{ backgroundColor: barColor }}
      />

      {/* Progress bar */}
      <div
        className="absolute left-0 top-0 h-full rounded-md transition-all"
        style={{
          backgroundColor: barColor,
          width: `${progress}%`,
        }}
      />

      {/* Label (shown on hover) */}
      <div className="absolute left-0 top-0 h-full flex items-center px-2 overflow-hidden">
        <span className="text-xs font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {title}
        </span>
      </div>

      {/* Progress indicator */}
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-0 h-full border-r-2 border-white/50"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}
