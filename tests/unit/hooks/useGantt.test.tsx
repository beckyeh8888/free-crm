/**
 * useGantt Hook Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useGanttData,
  getGanttDateRange,
  getGanttColumns,
  calculateTaskBarPosition,
  getDependencyPath,
  wouldCreateCycle,
  type GanttTask,
} from '@/hooks/useGantt';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockGanttTasks: GanttTask[] = [
  {
    id: 'task-1',
    title: '任務一',
    type: 'task',
    priority: 'high',
    status: 'in_progress',
    startDate: '2026-02-01',
    endDate: '2026-02-10',
    progress: 50,
    isCompleted: false,
    color: '#3B82F6',
    assignee: { id: 'user-1', name: '測試用戶', image: null },
    project: { id: 'proj-1', name: '專案一', color: '#3B82F6', status: 'active' },
    customer: { id: 'cust-1', name: '客戶一' },
    deal: null,
    dependencies: [],
    dependents: [{ id: 'dep-1', type: 'finish_to_start', taskId: 'task-2' }],
  },
  {
    id: 'task-2',
    title: '任務二',
    type: 'milestone',
    priority: 'medium',
    status: 'pending',
    startDate: '2026-02-11',
    endDate: '2026-02-15',
    progress: 0,
    isCompleted: false,
    color: '#EC4899',
    assignee: null,
    project: null,
    customer: null,
    deal: { id: 'deal-1', title: '交易一' },
    dependencies: [{ id: 'dep-1', type: 'finish_to_start', taskId: 'task-1' }],
    dependents: [],
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

describe('useGantt Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGanttData', () => {
    it('fetches gantt data with date range', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          tasks: mockGanttTasks,
          links: [{ id: 'link-1', source: 'task-1', target: 'task-2', type: 'finish_to_start' }],
          grouped: null,
          totalCount: 2,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const { result } = renderHook(
        () => useGanttData({
          start: '2026-02-01',
          end: '2026-02-28',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/gantt', {
        start: '2026-02-01',
        end: '2026-02-28',
      });
      expect(result.current.data?.data.tasks).toHaveLength(2);
    });

    it('fetches gantt data with Date objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          tasks: mockGanttTasks,
          links: [],
          grouped: null,
          totalCount: 2,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      const { result } = renderHook(
        () => useGanttData({
          start: startDate,
          end: endDate,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/gantt', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    });

    it('fetches gantt data with filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          tasks: [mockGanttTasks[0]],
          links: [],
          grouped: null,
          totalCount: 1,
          dateRange: { start: '2026-02-01', end: '2026-02-28' },
        },
      });

      const { result } = renderHook(
        () => useGanttData({
          start: '2026-02-01',
          end: '2026-02-28',
          projectId: 'proj-1',
          customerId: 'cust-1',
          assignedToId: 'user-1',
          includeDependencies: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/gantt', {
        start: '2026-02-01',
        end: '2026-02-28',
        projectId: 'proj-1',
        customerId: 'cust-1',
        assignedToId: 'user-1',
        includeDependencies: 'true',
      });
    });
  });

  describe('getGanttDateRange', () => {
    it('returns week scale range (5 weeks)', () => {
      // Use a fixed date for testing: 2026-02-11 (Wednesday)
      const refDate = new Date('2026-02-11');
      const { start, end } = getGanttDateRange('week', refDate);

      // Should start from Monday of current week
      expect(start.getDay()).toBe(1); // Monday
      // End should be 5 weeks later
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(30); // At least 5 weeks
    });

    it('returns month scale range (3 months)', () => {
      const refDate = new Date('2026-02-15');
      const { start, end } = getGanttDateRange('month', refDate);

      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(1); // February
      // End should be around 3 months later (last day of April = month 3)
      expect(end.getMonth()).toBe(3); // April (month 3, since end is last day of April)
    });

    it('returns quarter scale range (9 months)', () => {
      const refDate = new Date('2026-02-15');
      const { start, end } = getGanttDateRange('quarter', refDate);

      // Feb is in Q1 (months 0,1,2)
      expect(start.getMonth()).toBe(0); // January (Q1 start)
      // End should be around 9 months later
      const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
      expect(monthDiff).toBeGreaterThanOrEqual(8); // About 9 months
    });

    it('returns year scale range (2 years)', () => {
      const refDate = new Date('2026-02-15');
      const { start, end } = getGanttDateRange('year', refDate);

      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(start.getFullYear() + 1);
      expect(end.getMonth()).toBe(11); // December
    });
  });

  describe('getGanttColumns', () => {
    it('returns daily columns for week scale', () => {
      const start = new Date('2026-02-09'); // Monday
      const end = new Date('2026-02-15'); // Sunday
      const columns = getGanttColumns('week', start, end);

      expect(columns.length).toBe(7); // 7 days
      expect(columns[0].label).toBe('2/9');
      expect(columns[6].label).toBe('2/15');
    });

    it('returns weekly columns for month scale', () => {
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');
      const columns = getGanttColumns('month', start, end);

      // Should have about 4 weeks
      expect(columns.length).toBeGreaterThanOrEqual(4);
    });

    it('returns monthly columns for quarter scale', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-09-30');
      const columns = getGanttColumns('quarter', start, end);

      // Should have 9 months
      expect(columns.length).toBe(9);
      expect(columns[0].label).toBe('2026/1');
    });

    it('returns monthly columns for year scale', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-12-31');
      const columns = getGanttColumns('year', start, end);

      expect(columns.length).toBe(12);
    });
  });

  describe('calculateTaskBarPosition', () => {
    it('calculates position for task within range', () => {
      const task: GanttTask = {
        ...mockGanttTasks[0],
        startDate: '2026-02-05',
        endDate: '2026-02-15',
      };
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');

      const position = calculateTaskBarPosition(task, start, end);

      expect(position).not.toBeNull();
      expect(position!.left).toBeGreaterThan(0);
      expect(position!.width).toBeGreaterThan(0);
      expect(position!.left + position!.width).toBeLessThanOrEqual(100);
    });

    it('returns null for task outside range', () => {
      const task: GanttTask = {
        ...mockGanttTasks[0],
        startDate: '2026-03-01',
        endDate: '2026-03-10',
      };
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');

      const position = calculateTaskBarPosition(task, start, end);

      expect(position).toBeNull();
    });

    it('returns null for task with no dates', () => {
      const task: GanttTask = {
        ...mockGanttTasks[0],
        startDate: null,
        endDate: null,
      };
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');

      const position = calculateTaskBarPosition(task, start, end);

      expect(position).toBeNull();
    });

    it('clamps task to visible range', () => {
      const task: GanttTask = {
        ...mockGanttTasks[0],
        startDate: '2026-01-15', // Before range start
        endDate: '2026-03-15', // After range end
      };
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');

      const position = calculateTaskBarPosition(task, start, end);

      expect(position).not.toBeNull();
      expect(position!.left).toBe(0); // Clamped to start
      expect(position!.width).toBe(100); // Full width
    });

    it('handles task with only startDate', () => {
      const task: GanttTask = {
        ...mockGanttTasks[0],
        startDate: '2026-02-10',
        endDate: null,
      };
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-28');

      const position = calculateTaskBarPosition(task, start, end);

      expect(position).not.toBeNull();
      expect(position!.width).toBeGreaterThanOrEqual(1); // Minimum width
    });
  });

  describe('getDependencyPath', () => {
    it('returns SVG path for dependency', () => {
      const sourceTask = mockGanttTasks[0];
      const targetTask = mockGanttTasks[1];
      const sourcePosition = { left: 10, width: 30 };
      const targetPosition = { left: 50, width: 20 };

      const path = getDependencyPath(
        sourceTask,
        targetTask,
        sourcePosition,
        targetPosition,
        0,
        1,
        40
      );

      expect(path).not.toBeNull();
      expect(path).toContain('M'); // MoveTo command
      expect(path).toContain('C'); // Bezier curve command
    });

    it('returns null when positions are missing', () => {
      const sourceTask = mockGanttTasks[0];
      const targetTask = mockGanttTasks[1];

      // @ts-expect-error Testing null position
      const path = getDependencyPath(sourceTask, targetTask, null, { left: 50, width: 20 }, 0, 1);

      expect(path).toBeNull();
    });
  });

  describe('wouldCreateCycle', () => {
    it('returns false for valid dependency', () => {
      const tasks: GanttTask[] = [
        { ...mockGanttTasks[0], dependencies: [] },
        { ...mockGanttTasks[1], dependencies: [] },
      ];

      const wouldCycle = wouldCreateCycle(tasks, 'task-1', 'task-2');

      expect(wouldCycle).toBe(false);
    });

    it('returns true for self-reference', () => {
      const tasks: GanttTask[] = [
        { ...mockGanttTasks[0], dependencies: [] },
      ];

      const wouldCycle = wouldCreateCycle(tasks, 'task-1', 'task-1');

      expect(wouldCycle).toBe(true);
    });

    it('detects circular dependency', () => {
      const tasks: GanttTask[] = [
        {
          ...mockGanttTasks[0],
          id: 'task-a',
          dependencies: [{ id: 'dep-1', type: 'finish_to_start', taskId: 'task-b' }],
        },
        {
          ...mockGanttTasks[1],
          id: 'task-b',
          dependencies: [{ id: 'dep-2', type: 'finish_to_start', taskId: 'task-c' }],
        },
        {
          ...mockGanttTasks[0],
          id: 'task-c',
          dependencies: [],
        },
      ];

      // Adding task-c -> task-a would create: A -> B -> C -> A
      const wouldCycle = wouldCreateCycle(tasks, 'task-c', 'task-a');

      expect(wouldCycle).toBe(true);
    });

    it('handles missing task in map', () => {
      const tasks: GanttTask[] = [
        { ...mockGanttTasks[0], dependencies: [{ id: 'dep-1', type: 'finish_to_start', taskId: 'non-existent' }] },
      ];

      const wouldCycle = wouldCreateCycle(tasks, 'task-1', 'task-2');

      expect(wouldCycle).toBe(false);
    });
  });
});
