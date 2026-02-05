/**
 * Gantt hooks - TanStack Query hooks for Gantt chart view
 * Sprint 5: Calendar & Gantt Chart
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { TaskType, TaskPriority, TaskStatus } from './useTasks';

// ============================================
// Types
// ============================================

export interface GanttTask {
  readonly id: string;
  readonly title: string;
  readonly type: TaskType;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly progress: number;
  readonly isCompleted: boolean;
  readonly color: string;
  readonly assignee?: {
    readonly id: string;
    readonly name: string | null;
    readonly image: string | null;
  } | null;
  readonly project?: {
    readonly id: string;
    readonly name: string;
    readonly color: string | null;
    readonly status: string;
  } | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
  } | null;
  readonly deal?: {
    readonly id: string;
    readonly title: string;
  } | null;
  readonly dependencies: readonly {
    readonly id: string;
    readonly type: string;
    readonly taskId: string;
  }[];
  readonly dependents: readonly {
    readonly id: string;
    readonly type: string;
    readonly taskId: string;
  }[];
}

export interface GanttLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface GanttGrouped {
  readonly byProject: readonly {
    readonly id: string;
    readonly name: string;
    readonly tasks: readonly string[];
  }[];
  readonly byCustomer: readonly {
    readonly id: string;
    readonly name: string;
    readonly tasks: readonly string[];
  }[];
  readonly ungrouped: readonly string[];
}

interface GanttResponse {
  readonly success: boolean;
  readonly data: {
    readonly tasks: readonly GanttTask[];
    readonly links: readonly GanttLink[];
    readonly grouped: GanttGrouped | null;
    readonly totalCount: number;
    readonly dateRange: {
      readonly start: string;
      readonly end: string;
    };
  };
}

export interface GanttParams {
  readonly start: string | Date;
  readonly end: string | Date;
  readonly projectId?: string;
  readonly customerId?: string;
  readonly dealId?: string;
  readonly assignedToId?: string;
  readonly includeDependencies?: boolean;
}

export type GanttViewScale = 'week' | 'month' | 'quarter' | 'year';

// ============================================
// Query Hooks
// ============================================

export function useGanttData(params: GanttParams) {
  const start = typeof params.start === 'string' ? params.start : params.start.toISOString();
  const end = typeof params.end === 'string' ? params.end : params.end.toISOString();

  const queryParams: Record<string, string> = {
    start,
    end,
  };
  if (params.projectId) queryParams.projectId = params.projectId;
  if (params.customerId) queryParams.customerId = params.customerId;
  if (params.dealId) queryParams.dealId = params.dealId;
  if (params.assignedToId) queryParams.assignedToId = params.assignedToId;
  if (params.includeDependencies !== undefined) {
    queryParams.includeDependencies = String(params.includeDependencies);
  }

  return useQuery({
    queryKey: ['gantt-tasks', queryParams],
    queryFn: () => apiClient.get<GanttResponse>('/api/tasks/gantt', queryParams),
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get date range for different view scales
 */
export function getGanttDateRange(
  scale: GanttViewScale,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (scale) {
    case 'week': {
      // Current week + next 4 weeks (5 weeks total)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
      end.setDate(start.getDate() + 34); // 5 weeks
      break;
    }

    case 'month':
      // Current month + next 2 months (3 months total)
      start.setDate(1);
      end.setMonth(start.getMonth() + 3);
      end.setDate(0); // Last day of the month
      break;

    case 'quarter': {
      // Current quarter + next 2 quarters (3 quarters total = 9 months)
      const currentQuarter = Math.floor(start.getMonth() / 3);
      start.setMonth(currentQuarter * 3, 1);
      end.setMonth(start.getMonth() + 9);
      end.setDate(0);
      break;
    }

    case 'year':
      // Current year + next year
      start.setMonth(0, 1);
      end.setFullYear(start.getFullYear() + 1);
      end.setMonth(11, 31);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get column headers for different view scales
 */
export function getGanttColumns(
  scale: GanttViewScale,
  start: Date,
  end: Date
): { date: Date; label: string; isToday?: boolean }[] {
  const columns: { date: Date; label: string; isToday?: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = new Date(start);

  while (current <= end) {
    const isToday = current.getTime() === today.getTime();

    switch (scale) {
      case 'week':
        // Daily columns
        columns.push({
          date: new Date(current),
          label: `${current.getMonth() + 1}/${current.getDate()}`,
          isToday,
        });
        current.setDate(current.getDate() + 1);
        break;

      case 'month':
        // Weekly columns (week of month)
        columns.push({
          date: new Date(current),
          label: `${current.getMonth() + 1}/${current.getDate()}`,
          isToday: current <= today && new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000) >= today,
        });
        current.setDate(current.getDate() + 7);
        break;

      case 'quarter':
      case 'year':
        // Monthly columns
        columns.push({
          date: new Date(current),
          label: `${current.getFullYear()}/${current.getMonth() + 1}`,
          isToday: current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear(),
        });
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return columns;
}

/**
 * Calculate task bar position and width as percentages
 */
export function calculateTaskBarPosition(
  task: GanttTask,
  start: Date,
  end: Date
): { left: number; width: number } | null {
  const taskStart = task.startDate ? new Date(task.startDate) : null;
  const taskEnd = task.endDate ? new Date(task.endDate) : null;

  if (!taskStart && !taskEnd) return null;

  const rangeStart = start.getTime();
  const rangeEnd = end.getTime();
  const totalDuration = rangeEnd - rangeStart;

  // Use startDate or endDate as fallback
  const barStart = taskStart || taskEnd!;
  const barEnd = taskEnd || taskStart!;

  // Clamp to visible range
  const visibleStart = Math.max(barStart.getTime(), rangeStart);
  const visibleEnd = Math.min(barEnd.getTime(), rangeEnd);

  if (visibleStart > rangeEnd || visibleEnd < rangeStart) {
    return null; // Task is outside visible range
  }

  const left = ((visibleStart - rangeStart) / totalDuration) * 100;
  const width = Math.max(((visibleEnd - visibleStart) / totalDuration) * 100, 1); // Minimum 1% width

  return { left, width };
}

/**
 * Get dependency line path (for SVG)
 * Returns a bezier curve path from source task to target task
 */
export function getDependencyPath(
  _sourceTask: GanttTask,
  _targetTask: GanttTask,
  sourcePosition: { left: number; width: number },
  targetPosition: { left: number; width: number },
  sourceRowIndex: number,
  targetRowIndex: number,
  rowHeight: number = 40
): string | null {
  if (!sourcePosition || !targetPosition) return null;

  // Calculate source point (right side of source bar)
  const sourceX = sourcePosition.left + sourcePosition.width;
  const sourceY = (sourceRowIndex + 0.5) * rowHeight;

  // Calculate target point (left side of target bar)
  const targetX = targetPosition.left;
  const targetY = (targetRowIndex + 0.5) * rowHeight;

  // Create a bezier curve
  const controlOffset = Math.abs(targetX - sourceX) * 0.3;

  return `M ${sourceX}% ${sourceY}
          C ${sourceX + controlOffset}% ${sourceY},
            ${targetX - controlOffset}% ${targetY},
            ${targetX}% ${targetY}`;
}

/**
 * Check if adding a dependency would create a circular reference
 */
export function wouldCreateCycle(
  tasks: readonly GanttTask[],
  newSourceId: string,
  newTargetId: string
): boolean {
  const visited = new Set<string>();
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  function hasCycle(taskId: string, target: string): boolean {
    if (taskId === target) return true;
    if (visited.has(taskId)) return false;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (!task) return false;

    for (const dep of task.dependencies) {
      if (hasCycle(dep.taskId, target)) {
        return true;
      }
    }

    return false;
  }

  // Check if there's already a path from target to source
  return hasCycle(newTargetId, newSourceId);
}
