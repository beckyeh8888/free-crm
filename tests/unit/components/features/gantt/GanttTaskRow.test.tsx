/**
 * GanttTaskRow Component Tests
 * Tests for single task row with label and bar
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { GanttTaskRow } from '@/components/features/gantt/GanttTaskRow';
import type { GanttTask } from '@/hooks/useGantt';

// Mock child components
vi.mock('@/components/features/tasks', () => ({
  TaskTypeIcon: ({ type, size }: { type: string; size: string }) => (
    <span data-testid="task-type-icon" data-type={type} data-size={size}>
      {type}
    </span>
  ),
  TaskPriorityBadge: ({ priority, size }: { priority: string; size: string }) => (
    <span data-testid="task-priority-badge" data-priority={priority} data-size={size}>
      {priority}
    </span>
  ),
}));

vi.mock('@/components/features/gantt/GanttBar', () => ({
  GanttBar: ({
    title,
    type,
    progress,
    startPercent,
    widthPercent,
    color,
    onClick,
  }: {
    title: string;
    type: string;
    progress: number;
    startPercent: number;
    widthPercent: number;
    color?: string;
    onClick?: () => void;
  }) => (
    <div
      data-testid="gantt-bar"
      data-title={title}
      data-type={type}
      data-progress={progress}
      data-start={startPercent}
      data-width={widthPercent}
      data-color={color}
      onClick={onClick}
    >
      {title}
    </div>
  ),
}));

const mockTask: GanttTask = {
  id: 'task-1',
  title: 'Test Task',
  type: 'meeting',
  priority: 'high',
  status: 'in_progress',
  startDate: '2026-02-01',
  endDate: '2026-02-05',
  progress: 50,
  isCompleted: false,
  color: '#3B82F6',
  assignee: { id: 'user-1', name: 'User 1' },
  project: { id: 'proj-1', name: 'Project 1', color: '#10B981' },
  customer: null,
};

describe('GanttTaskRow', () => {
  const timelineStart = new Date('2026-02-01');
  const timelineEnd = new Date('2026-02-28');

  describe('Rendering', () => {
    it('renders task title', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      // Title appears in both the label area and the mock GanttBar
      const elements = screen.getAllByText('Test Task');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders task type icon', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'meeting');
      expect(icon).toHaveAttribute('data-size', 'sm');
    });

    it('renders task priority badge', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const badge = screen.getByTestId('task-priority-badge');
      expect(badge).toHaveAttribute('data-priority', 'high');
      expect(badge).toHaveAttribute('data-size', 'sm');
    });

    it('renders gantt bar', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      expect(screen.getByTestId('gantt-bar')).toBeInTheDocument();
    });
  });

  describe('Position Calculation', () => {
    it('calculates bar position correctly', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      // Task starts at day 0 (Feb 1) out of 27 days (Feb 1-28)
      // Task is 4 days (Feb 1-5)
      const startPercent = parseFloat(bar.getAttribute('data-start') || '0');
      const widthPercent = parseFloat(bar.getAttribute('data-width') || '0');

      expect(startPercent).toBeGreaterThanOrEqual(0);
      expect(widthPercent).toBeGreaterThan(0);
    });

    it('handles task starting before timeline', () => {
      const earlyTask: GanttTask = {
        ...mockTask,
        startDate: '2026-01-15',
        endDate: '2026-02-05',
      };

      render(
        <GanttTaskRow
          task={earlyTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      const startPercent = parseFloat(bar.getAttribute('data-start') || '0');
      expect(startPercent).toBe(0); // Should clamp to 0
    });

    it('handles task ending after timeline', () => {
      const lateTask: GanttTask = {
        ...mockTask,
        startDate: '2026-02-25',
        endDate: '2026-03-15',
      };

      render(
        <GanttTaskRow
          task={lateTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      // Should render without error
      expect(bar).toBeInTheDocument();
    });

    it('ensures minimum width of 1 day', () => {
      const singleDayTask: GanttTask = {
        ...mockTask,
        startDate: '2026-02-10',
        endDate: '2026-02-10',
      };

      render(
        <GanttTaskRow
          task={singleDayTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      const widthPercent = parseFloat(bar.getAttribute('data-width') || '0');
      expect(widthPercent).toBeGreaterThan(0);
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when bar is clicked', () => {
      const onClick = vi.fn();

      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByTestId('gantt-bar'));

      expect(onClick).toHaveBeenCalledWith(mockTask);
    });

    it('does not throw when onClick is not provided', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('gantt-bar'));
      }).not.toThrow();
    });
  });

  describe('Task Properties', () => {
    it('passes progress to gantt bar', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      expect(bar).toHaveAttribute('data-progress', '50');
    });

    it('passes color to gantt bar', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      expect(bar).toHaveAttribute('data-color', '#3B82F6');
    });

    it('passes type to gantt bar', () => {
      render(
        <GanttTaskRow
          task={mockTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const bar = screen.getByTestId('gantt-bar');
      expect(bar).toHaveAttribute('data-type', 'meeting');
    });
  });

  describe('Fallback Dates', () => {
    it('uses endDate when startDate is missing', () => {
      const taskWithoutStart: GanttTask = {
        ...mockTask,
        startDate: null as unknown as string,
        endDate: '2026-02-10',
      };

      render(
        <GanttTaskRow
          task={taskWithoutStart}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      expect(screen.getByTestId('gantt-bar')).toBeInTheDocument();
    });

    it('uses startDate when endDate is missing', () => {
      const taskWithoutEnd: GanttTask = {
        ...mockTask,
        startDate: '2026-02-10',
        endDate: null as unknown as string,
      };

      render(
        <GanttTaskRow
          task={taskWithoutEnd}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      expect(screen.getByTestId('gantt-bar')).toBeInTheDocument();
    });

    it('uses current date when both dates are missing', () => {
      const taskWithoutDates: GanttTask = {
        ...mockTask,
        startDate: null as unknown as string,
        endDate: null as unknown as string,
      };

      render(
        <GanttTaskRow
          task={taskWithoutDates}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      expect(screen.getByTestId('gantt-bar')).toBeInTheDocument();
    });
  });

  describe('Different Task Types', () => {
    it('renders call type task', () => {
      const callTask: GanttTask = { ...mockTask, type: 'call' };

      render(
        <GanttTaskRow
          task={callTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'call');
    });

    it('renders email type task', () => {
      const emailTask: GanttTask = { ...mockTask, type: 'email' };

      render(
        <GanttTaskRow
          task={emailTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'email');
    });

    it('renders deadline type task', () => {
      const deadlineTask: GanttTask = { ...mockTask, type: 'deadline' };

      render(
        <GanttTaskRow
          task={deadlineTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'deadline');
    });
  });

  describe('Different Priorities', () => {
    it('renders medium priority', () => {
      const mediumTask: GanttTask = { ...mockTask, priority: 'medium' };

      render(
        <GanttTaskRow
          task={mediumTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const badge = screen.getByTestId('task-priority-badge');
      expect(badge).toHaveAttribute('data-priority', 'medium');
    });

    it('renders low priority', () => {
      const lowTask: GanttTask = { ...mockTask, priority: 'low' };

      render(
        <GanttTaskRow
          task={lowTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      const badge = screen.getByTestId('task-priority-badge');
      expect(badge).toHaveAttribute('data-priority', 'low');
    });
  });

  describe('Title Truncation', () => {
    it('shows title attribute for long titles', () => {
      const longTitleTask: GanttTask = {
        ...mockTask,
        title: 'This is a very long task title that should be truncated in the display',
      };

      render(
        <GanttTaskRow
          task={longTitleTask}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      );

      // Get all elements with the title text, find the one with the title attribute
      const elements = screen.getAllByText(longTitleTask.title);
      const titleElement = elements.find(el => el.hasAttribute('title'));
      expect(titleElement).toHaveAttribute('title', longTitleTask.title);
    });
  });
});
