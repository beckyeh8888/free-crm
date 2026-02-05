/**
 * Calendar hooks - TanStack Query hooks for calendar view
 * Sprint 5: Calendar & Gantt Chart
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { TaskType, TaskPriority, TaskStatus } from './useTasks';

// ============================================
// Types
// ============================================

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly type: TaskType;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly start: string | null;
  readonly end: string | null;
  readonly time: string | null;
  readonly isAllDay: boolean;
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
  } | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
  } | null;
}

interface CalendarResponse {
  readonly success: boolean;
  readonly data: {
    readonly events: readonly CalendarEvent[];
    readonly totalCount: number;
    readonly dateRange: {
      readonly start: string;
      readonly end: string;
    };
  };
}

export interface CalendarParams {
  readonly start: string | Date;
  readonly end: string | Date;
  readonly type?: TaskType;
}

// ============================================
// Query Hooks
// ============================================

export function useCalendarTasks(params: CalendarParams) {
  const start = typeof params.start === 'string' ? params.start : params.start.toISOString();
  const end = typeof params.end === 'string' ? params.end : params.end.toISOString();

  const queryParams: Record<string, string> = {
    start,
    end,
  };
  if (params.type) queryParams.type = params.type;

  return useQuery({
    queryKey: ['calendar-tasks', { start, end, type: params.type }],
    queryFn: () => apiClient.get<CalendarResponse>('/api/tasks/calendar', queryParams),
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the start and end of a month
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the start and end of a week (Monday to Sunday)
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const start = new Date(date.getFullYear(), date.getMonth(), diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the start and end of a day
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get events for a specific day from calendar events
 */
export function getEventsForDay(events: readonly CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();

  return events.filter((event) => {
    const eventStart = event.start ? new Date(event.start).getTime() : null;
    const eventEnd = event.end ? new Date(event.end).getTime() : null;

    // Event starts on this day
    if (eventStart && eventStart >= dayStart && eventStart <= dayEnd) {
      return true;
    }
    // Event ends on this day
    if (eventEnd && eventEnd >= dayStart && eventEnd <= dayEnd) {
      return true;
    }
    // Event spans this day
    if (eventStart && eventEnd && eventStart < dayStart && eventEnd > dayEnd) {
      return true;
    }

    return false;
  });
}

/**
 * Get task type color
 */
export function getTaskTypeColor(type: TaskType): string {
  const colors: Record<TaskType, string> = {
    task: '#3B82F6',      // Blue
    call: '#22C55E',      // Green
    meeting: '#8B5CF6',   // Purple
    email: '#F97316',     // Orange
    follow_up: '#06B6D4', // Cyan
    milestone: '#EC4899', // Pink
  };
  return colors[type] || '#6B7280';
}

/**
 * Get task priority color
 */
export function getTaskPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: '#6B7280',       // Gray
    medium: '#3B82F6',    // Blue
    high: '#F97316',      // Orange
    urgent: '#EF4444',    // Red
  };
  return colors[priority] || '#6B7280';
}

/**
 * Get task status color
 */
export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    pending: '#6B7280',       // Gray
    in_progress: '#3B82F6',   // Blue
    completed: '#22C55E',     // Green
    cancelled: '#EF4444',     // Red
  };
  return colors[status] || '#6B7280';
}
