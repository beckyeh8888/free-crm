'use client';

/**
 * GanttTaskRow - Single task row with label and bar
 * Sprint 5: Calendar & Gantt Chart
 */

import { TaskTypeIcon, TaskPriorityBadge, type TaskType, type TaskPriority } from '@/components/features/tasks';
import { GanttBar } from './GanttBar';
import type { GanttTask } from '@/hooks/useGantt';

interface GanttTaskRowProps {
  readonly task: GanttTask;
  readonly timelineStart: Date;
  readonly timelineEnd: Date;
  readonly onClick?: (task: GanttTask) => void;
}

function calculatePosition(
  taskStart: Date,
  taskEnd: Date,
  timelineStart: Date,
  timelineEnd: Date
): { startPercent: number; widthPercent: number } {
  const totalDays = Math.ceil(
    (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const startDays = Math.max(
    0,
    Math.ceil((taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  );

  const endDays = Math.min(
    totalDays,
    Math.ceil((taskEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  );

  const durationDays = Math.max(1, endDays - startDays);

  return {
    startPercent: (startDays / totalDays) * 100,
    widthPercent: (durationDays / totalDays) * 100,
  };
}

export function GanttTaskRow({
  task,
  timelineStart,
  timelineEnd,
  onClick,
}: GanttTaskRowProps) {
  const taskStart = new Date(task.startDate || task.endDate || new Date());
  const taskEnd = new Date(task.endDate || task.startDate || new Date());

  const { startPercent, widthPercent } = calculatePosition(
    taskStart,
    taskEnd,
    timelineStart,
    timelineEnd
  );

  return (
    <div className="flex h-10 border-b border-border hover:bg-background-hover transition-colors">
      {/* Task Info (Left Side) */}
      <div className="w-64 flex-shrink-0 flex items-center gap-2 px-3 border-r border-border">
        <TaskTypeIcon type={task.type as TaskType} size="sm" />
        <span className="flex-1 text-sm text-text-primary truncate" title={task.title}>
          {task.title}
        </span>
        <TaskPriorityBadge priority={task.priority as TaskPriority} size="sm" />
      </div>

      {/* Timeline Area (Right Side) */}
      <div className="flex-1 relative">
        <GanttBar
          title={task.title}
          type={task.type}
          progress={task.progress}
          startPercent={startPercent}
          widthPercent={widthPercent}
          color={task.color}
          onClick={() => onClick?.(task)}
        />
      </div>
    </div>
  );
}
