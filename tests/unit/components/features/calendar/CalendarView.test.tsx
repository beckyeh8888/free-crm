/**
 * CalendarView Component Tests
 * Tests for monthly calendar view container
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CalendarView } from '@/components/features/calendar/CalendarView';
import type { CalendarEvent } from '@/hooks/useCalendar';

// Mock useCalendar hook
vi.mock('@/hooks/useCalendar', () => ({
  useCalendarTasks: vi.fn(),
  getMonthRange: vi.fn(() => ({
    start: '2026-02-01',
    end: '2026-02-28',
  })),
}));

// Mock useTasks hook
vi.mock('@/hooks/useTasks', () => ({
  useCreateTask: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateTask: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock child components
vi.mock('@/components/features/calendar/CalendarHeader', () => ({
  CalendarHeader: ({
    year,
    month,
    onPrevMonth,
    onNextMonth,
    onToday,
    onAddTask,
  }: {
    year: number;
    month: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onAddTask: () => void;
  }) => (
    <div data-testid="calendar-header">
      <span data-testid="current-year">{year}</span>
      <span data-testid="current-month">{month}</span>
      <button type="button" data-testid="prev-month" onClick={onPrevMonth}>Prev</button>
      <button type="button" data-testid="next-month" onClick={onNextMonth}>Next</button>
      <button type="button" data-testid="today" onClick={onToday}>Today</button>
      <button type="button" data-testid="add-task" onClick={onAddTask}>Add</button>
    </div>
  ),
}));

vi.mock('@/components/features/calendar/CalendarGrid', () => ({
  CalendarGrid: ({
    year,
    month,
    events,
    selectedDate,
    onDayClick,
    onEventClick,
    onAddClick,
  }: {
    year: number;
    month: number;
    events: CalendarEvent[];
    selectedDate?: Date | null;
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onAddClick?: (date: Date) => void;
  }) => (
    <div data-testid="calendar-grid" data-year={year} data-month={month}>
      <span data-testid="event-count">{events.length}</span>
      <span data-testid="selected-date">{selectedDate?.toISOString() || 'none'}</span>
      <button
        type="button"
        data-testid="trigger-day-click"
        onClick={() => onDayClick?.(new Date('2026-02-15'))}
      >
        Click Day
      </button>
      <button
        type="button"
        data-testid="trigger-event-click"
        onClick={() => onEventClick?.(events[0])}
      >
        Click Event
      </button>
      <button
        type="button"
        data-testid="trigger-add-click"
        onClick={() => onAddClick?.(new Date('2026-02-20'))}
      >
        Add Click
      </button>
    </div>
  ),
}));

vi.mock('@/components/features/tasks', () => ({
  TaskForm: ({
    onSubmit,
    onClose,
    isSubmitting,
    initialDate,
  }: {
    onSubmit: (data: unknown) => void;
    onClose: () => void;
    isSubmitting: boolean;
    initialDate: Date;
  }) => (
    <div data-testid="task-form" data-submitting={isSubmitting}>
      <span data-testid="initial-date">{initialDate.toISOString()}</span>
      <button type="button" data-testid="submit-form" onClick={() => onSubmit({ title: 'New Task' })}>
        Submit
      </button>
      <button type="button" data-testid="close-form" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/LoadingState', () => ({
  LoadingState: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

import { useCalendarTasks } from '@/hooks/useCalendar';
import { useCreateTask } from '@/hooks/useTasks';

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Meeting 1',
    type: 'meeting',
    priority: 'high',
    status: 'in_progress',
    start: '2026-02-10T10:00:00Z',
    end: '2026-02-10T11:00:00Z',
    time: '10:00',
    isAllDay: false,
    progress: 0,
    isCompleted: false,
    color: '#3B82F6',
    assignee: null,
    project: null,
    customer: null,
  },
];

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('shows loading state when loading', () => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useCalendarTasks>);

      render(<CalendarView />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('載入行事曆...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when error occurs', () => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed'),
      } as ReturnType<typeof useCalendarTasks>);

      render(<CalendarView />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('無法載入行事曆')).toBeInTheDocument();
    });
  });

  describe('Normal Rendering', () => {
    beforeEach(() => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: mockEvents } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);
    });

    it('renders calendar header', () => {
      render(<CalendarView />);

      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    });

    it('renders calendar grid', () => {
      render(<CalendarView />);

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });

    it('passes current year and month to components', () => {
      render(<CalendarView />);

      // February 2026
      expect(screen.getByTestId('current-year')).toHaveTextContent('2026');
      expect(screen.getByTestId('current-month')).toHaveTextContent('1'); // 0-indexed
    });

    it('passes events to calendar grid', () => {
      render(<CalendarView />);

      expect(screen.getByTestId('event-count')).toHaveTextContent('1');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: [] } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);
    });

    it('navigates to previous month', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('prev-month'));

      // Should now be January 2026
      expect(screen.getByTestId('current-month')).toHaveTextContent('0');
    });

    it('navigates to next month', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('next-month'));

      // Should now be March 2026
      expect(screen.getByTestId('current-month')).toHaveTextContent('2');
    });

    it('handles year rollback when going to previous from January', () => {
      render(<CalendarView />);

      // Go back to January first
      fireEvent.click(screen.getByTestId('prev-month'));
      // Now go back to December of previous year
      fireEvent.click(screen.getByTestId('prev-month'));

      expect(screen.getByTestId('current-year')).toHaveTextContent('2025');
      expect(screen.getByTestId('current-month')).toHaveTextContent('11');
    });

    it('handles year rollover when going to next from December', () => {
      render(<CalendarView />);

      // Go forward to December (10 months)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('next-month'));
      }
      // Now go forward to January next year
      fireEvent.click(screen.getByTestId('next-month'));

      expect(screen.getByTestId('current-year')).toHaveTextContent('2027');
      expect(screen.getByTestId('current-month')).toHaveTextContent('0');
    });

    it('navigates to today', () => {
      render(<CalendarView />);

      // Go to a different month
      fireEvent.click(screen.getByTestId('next-month'));
      fireEvent.click(screen.getByTestId('next-month'));

      // Click today
      fireEvent.click(screen.getByTestId('today'));

      // Should be back to February 2026
      expect(screen.getByTestId('current-year')).toHaveTextContent('2026');
      expect(screen.getByTestId('current-month')).toHaveTextContent('1');
    });
  });

  describe('Day Selection', () => {
    beforeEach(() => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: [] } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);
    });

    it('selects date when day is clicked', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('trigger-day-click'));

      expect(screen.getByTestId('selected-date')).toHaveTextContent('2026-02-15');
    });
  });

  describe('Event Click', () => {
    beforeEach(() => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: mockEvents } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);
    });

    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();
      render(<CalendarView onEventClick={onEventClick} />);

      fireEvent.click(screen.getByTestId('trigger-event-click'));

      expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });
  });

  describe('Task Form', () => {
    beforeEach(() => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: [] } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);
    });

    it('does not show task form initially', () => {
      render(<CalendarView />);

      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });

    it('shows task form when add button is clicked', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('add-task'));

      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('shows task form when add is clicked on a day', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('trigger-add-click'));

      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('closes task form when close is clicked', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('add-task'));
      expect(screen.getByTestId('task-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-form'));
      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });

    it('passes initial date to task form from header add button', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('add-task'));

      // Should have current date
      const initialDate = screen.getByTestId('initial-date').textContent;
      expect(initialDate).toContain('2026-02-05');
    });

    it('passes clicked date to task form from day add', () => {
      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('trigger-add-click'));

      // Should have Feb 20 date
      const initialDate = screen.getByTestId('initial-date').textContent;
      expect(initialDate).toContain('2026-02-20');
    });

    it('submits form and calls create mutation', () => {
      const mockMutate = vi.fn((data, options) => {
        options?.onSuccess?.();
      });
      vi.mocked(useCreateTask).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useCreateTask>);

      render(<CalendarView />);

      fireEvent.click(screen.getByTestId('add-task'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(mockMutate).toHaveBeenCalled();
      // Form should close after success
      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });
  });

  describe('Empty Events', () => {
    it('handles empty events array', () => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: { data: { events: [] } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);

      render(<CalendarView />);

      expect(screen.getByTestId('event-count')).toHaveTextContent('0');
    });

    it('handles null data', () => {
      vi.mocked(useCalendarTasks).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCalendarTasks>);

      render(<CalendarView />);

      expect(screen.getByTestId('event-count')).toHaveTextContent('0');
    });
  });
});
