/**
 * useCalendar Hook Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useCalendarTasks,
  getMonthRange,
  getWeekRange,
  getDayRange,
  getEventsForDay,
  getTaskTypeColor,
  getTaskPriorityColor,
  getTaskStatusColor,
  type CalendarEvent,
} from '@/hooks/useCalendar';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: '會議一',
    type: 'meeting',
    priority: 'high',
    status: 'pending',
    start: '2026-02-05T10:00:00Z',
    end: '2026-02-05T11:00:00Z',
    time: '10:00',
    isAllDay: false,
    progress: 0,
    isCompleted: false,
    color: '#8B5CF6',
    assignee: { id: 'user-1', name: '測試用戶', image: null },
    project: { id: 'proj-1', name: '專案一', color: '#3B82F6' },
    customer: { id: 'cust-1', name: '客戶一' },
  },
  {
    id: 'event-2',
    title: '任務二',
    type: 'task',
    priority: 'medium',
    status: 'in_progress',
    start: '2026-02-01T00:00:00Z',
    end: '2026-02-10T23:59:59Z',
    time: null,
    isAllDay: true,
    progress: 50,
    isCompleted: false,
    color: '#3B82F6',
    assignee: null,
    project: null,
    customer: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useCalendar Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCalendarTasks', () => {
    it('fetches calendar tasks with date range', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          events: mockEvents,
          totalCount: 2,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const { result } = renderHook(
        () => useCalendarTasks({
          start: '2026-02-01',
          end: '2026-02-28',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/calendar', {
        start: '2026-02-01',
        end: '2026-02-28',
      });
      expect(result.current.data?.data.events).toHaveLength(2);
    });

    it('fetches calendar tasks with Date objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          events: mockEvents,
          totalCount: 2,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      const { result } = renderHook(
        () => useCalendarTasks({
          start: startDate,
          end: endDate,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/calendar', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    });

    it('fetches calendar tasks with type filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          events: [mockEvents[0]],
          totalCount: 1,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const { result } = renderHook(
        () => useCalendarTasks({
          start: '2026-02-01',
          end: '2026-02-28',
          type: 'meeting',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/calendar', {
        start: '2026-02-01',
        end: '2026-02-28',
        type: 'meeting',
      });
    });
  });

  describe('getMonthRange', () => {
    it('returns correct month range', () => {
      const date = new Date('2026-02-15');
      const { start, end } = getMonthRange(date);

      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(1); // February (0-indexed)
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(1);
      expect(end.getDate()).toBe(28); // February 2026 has 28 days
    });

    it('handles month with 31 days', () => {
      const date = new Date('2026-01-15');
      const { start, end } = getMonthRange(date);

      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getWeekRange', () => {
    it('returns Monday to Sunday range', () => {
      // 2026-02-11 is a Wednesday
      const date = new Date('2026-02-11');
      const { start, end } = getWeekRange(date);

      expect(start.getDay()).toBe(1); // Monday
      expect(start.getDate()).toBe(9); // Feb 9, 2026
      expect(end.getDay()).toBe(0); // Sunday
      expect(end.getDate()).toBe(15); // Feb 15, 2026
    });

    it('handles Sunday as start day', () => {
      // 2026-02-15 is a Sunday
      const date = new Date('2026-02-15');
      const { start, end } = getWeekRange(date);

      expect(start.getDay()).toBe(1); // Monday
      expect(start.getDate()).toBe(9); // Previous Monday
    });
  });

  describe('getDayRange', () => {
    it('returns start and end of day', () => {
      const date = new Date('2026-02-15T14:30:00');
      const { start, end } = getDayRange(date);

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe('getEventsForDay', () => {
    it('returns events that start on the day', () => {
      const date = new Date('2026-02-05');
      const events = getEventsForDay(mockEvents, date);

      expect(events).toHaveLength(2); // Both events include Feb 5
      expect(events.map(e => e.id)).toContain('event-1');
    });

    it('returns events that span the day', () => {
      const date = new Date('2026-02-03');
      const events = getEventsForDay(mockEvents, date);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-2'); // Spans Feb 1-10
    });

    it('returns empty array for day without events', () => {
      const date = new Date('2026-02-20');
      const events = getEventsForDay(mockEvents, date);

      expect(events).toHaveLength(0);
    });

    it('handles events with null dates', () => {
      const eventsWithNullDates: CalendarEvent[] = [
        {
          ...mockEvents[0],
          start: null,
          end: null,
        },
      ];
      const date = new Date('2026-02-05');
      const events = getEventsForDay(eventsWithNullDates, date);

      expect(events).toHaveLength(0);
    });
  });

  describe('getTaskTypeColor', () => {
    it('returns correct color for task type', () => {
      expect(getTaskTypeColor('task')).toBe('#3B82F6');
      expect(getTaskTypeColor('call')).toBe('#22C55E');
      expect(getTaskTypeColor('meeting')).toBe('#8B5CF6');
      expect(getTaskTypeColor('email')).toBe('#F97316');
      expect(getTaskTypeColor('follow_up')).toBe('#06B6D4');
      expect(getTaskTypeColor('milestone')).toBe('#EC4899');
    });

    it('returns gray for unknown type', () => {
      // @ts-expect-error Testing unknown type
      expect(getTaskTypeColor('unknown')).toBe('#6B7280');
    });
  });

  describe('getTaskPriorityColor', () => {
    it('returns correct color for priority', () => {
      expect(getTaskPriorityColor('low')).toBe('#6B7280');
      expect(getTaskPriorityColor('medium')).toBe('#3B82F6');
      expect(getTaskPriorityColor('high')).toBe('#F97316');
      expect(getTaskPriorityColor('urgent')).toBe('#EF4444');
    });

    it('returns gray for unknown priority', () => {
      // @ts-expect-error Testing unknown priority
      expect(getTaskPriorityColor('unknown')).toBe('#6B7280');
    });
  });

  describe('getTaskStatusColor', () => {
    it('returns correct color for status', () => {
      expect(getTaskStatusColor('pending')).toBe('#6B7280');
      expect(getTaskStatusColor('in_progress')).toBe('#3B82F6');
      expect(getTaskStatusColor('completed')).toBe('#22C55E');
      expect(getTaskStatusColor('cancelled')).toBe('#EF4444');
    });

    it('returns gray for unknown status', () => {
      // @ts-expect-error Testing unknown status
      expect(getTaskStatusColor('unknown')).toBe('#6B7280');
    });
  });
});
