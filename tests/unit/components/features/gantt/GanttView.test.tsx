/**
 * GanttView Component Tests
 * Tests for Gantt chart container
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { GanttView } from '@/components/features/gantt/GanttView';

// Mock useGantt hook
vi.mock('@/hooks/useGantt', () => ({
  useGanttData: vi.fn(),
}));

// Mock child components
vi.mock('@/components/features/gantt/GanttHeader', () => ({
  GanttHeader: ({ startDate, endDate, timeRange }: { startDate: Date; endDate: Date; timeRange: string }) => (
    <div data-testid="gantt-header" data-range={timeRange}>
      Header: {startDate.toISOString().split('T')[0]} - {endDate.toISOString().split('T')[0]}
    </div>
  ),
}));

vi.mock('@/components/features/gantt/GanttTaskRow', () => ({
  GanttTaskRow: ({ task, onClick }: { task: { id: string; title: string }; onClick?: (t: unknown) => void }) => (
    <div data-testid={`task-row-${task.id}`} onClick={() => onClick?.(task)}>
      {task.title}
    </div>
  ),
}));

vi.mock('@/components/features/gantt/GanttFilters', () => ({
  GanttFilters: ({ values, onChange }: { values: unknown; onChange: (v: unknown) => void }) => (
    <div data-testid="gantt-filters">
      <button type="button" onClick={() => onChange({ projectId: 'proj-1', customerId: '', assignedToId: '' })}>
        Set Project Filter
      </button>
    </div>
  ),
}));

vi.mock('@/components/features/gantt/GanttViewToggle', () => ({
  GanttViewToggle: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="gantt-view-toggle">
      <button type="button" onClick={() => onChange('week')}>Week</button>
      <button type="button" onClick={() => onChange('quarter')}>Quarter</button>
      <button type="button" onClick={() => onChange('year')}>Year</button>
      <span data-testid="current-range">{value}</span>
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

import { useGanttData } from '@/hooks/useGantt';

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
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
  },
  {
    id: 'task-2',
    title: 'Task 2',
    type: 'call',
    priority: 'medium',
    status: 'pending',
    startDate: '2026-02-03',
    endDate: '2026-02-10',
    progress: 0,
    isCompleted: false,
    color: '#F59E0B',
    assignee: null,
    project: null,
    customer: { id: 'cust-1', name: 'Customer 1' },
  },
];

describe('GanttView', () => {
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
      vi.mocked(useGanttData).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useGanttData>);

      render(<GanttView />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('載入甘特圖...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when error occurs', () => {
      vi.mocked(useGanttData).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed'),
      } as ReturnType<typeof useGanttData>);

      render(<GanttView />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('無法載入甘特圖')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no tasks', () => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: [] } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);

      render(<GanttView />);

      expect(screen.getByText('此期間沒有任務')).toBeInTheDocument();
    });
  });

  describe('Tasks Display', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('renders task rows', () => {
      render(<GanttView />);

      expect(screen.getByTestId('task-row-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-row-task-2')).toBeInTheDocument();
    });

    it('renders header component', () => {
      render(<GanttView />);

      expect(screen.getByTestId('gantt-header')).toBeInTheDocument();
    });

    it('renders filters component', () => {
      render(<GanttView />);

      expect(screen.getByTestId('gantt-filters')).toBeInTheDocument();
    });

    it('renders view toggle component', () => {
      render(<GanttView />);

      expect(screen.getByTestId('gantt-view-toggle')).toBeInTheDocument();
    });
  });

  describe('Time Range Controls', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('defaults to month view', () => {
      render(<GanttView />);

      expect(screen.getByTestId('current-range')).toHaveTextContent('month');
    });

    it('changes time range when toggle is clicked', () => {
      render(<GanttView />);

      fireEvent.click(screen.getByText('Week'));

      expect(screen.getByTestId('current-range')).toHaveTextContent('week');
    });

    it('can switch to quarter view', () => {
      render(<GanttView />);

      fireEvent.click(screen.getByText('Quarter'));

      expect(screen.getByTestId('current-range')).toHaveTextContent('quarter');
    });

    it('can switch to year view', () => {
      render(<GanttView />);

      fireEvent.click(screen.getByText('Year'));

      expect(screen.getByTestId('current-range')).toHaveTextContent('year');
    });
  });

  describe('Navigation Controls', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('renders prev button', () => {
      render(<GanttView />);

      expect(screen.getByLabelText('上一期')).toBeInTheDocument();
    });

    it('renders next button', () => {
      render(<GanttView />);

      expect(screen.getByLabelText('下一期')).toBeInTheDocument();
    });

    it('renders today button', () => {
      render(<GanttView />);

      expect(screen.getByText('今天')).toBeInTheDocument();
    });

    it('navigates to previous period when prev is clicked', () => {
      render(<GanttView />);

      const initialCallCount = vi.mocked(useGanttData).mock.calls.length;

      fireEvent.click(screen.getByLabelText('上一期'));

      // Should trigger a re-render with new dates
      expect(vi.mocked(useGanttData).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('navigates to next period when next is clicked', () => {
      render(<GanttView />);

      const initialCallCount = vi.mocked(useGanttData).mock.calls.length;

      fireEvent.click(screen.getByLabelText('下一期'));

      // Should trigger a re-render with new dates
      expect(vi.mocked(useGanttData).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('navigates to today when today button is clicked', () => {
      render(<GanttView />);

      // First navigate away
      fireEvent.click(screen.getByLabelText('下一期'));
      fireEvent.click(screen.getByText('今天'));

      // Should reset to current month
      expect(useGanttData).toHaveBeenCalled();
    });
  });

  describe('Filter Handling', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('applies filters when changed', () => {
      render(<GanttView />);

      fireEvent.click(screen.getByText('Set Project Filter'));

      const lastCall = vi.mocked(useGanttData).mock.calls[vi.mocked(useGanttData).mock.calls.length - 1][0];
      expect(lastCall.projectId).toBe('proj-1');
    });
  });

  describe('Task Click', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('calls onTaskClick when task is clicked', () => {
      const onTaskClick = vi.fn();

      render(<GanttView onTaskClick={onTaskClick} />);

      fireEvent.click(screen.getByTestId('task-row-task-1'));

      expect(onTaskClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task-1',
          title: 'Task 1',
        })
      );
    });

    it('converts task to CalendarEvent format', () => {
      const onTaskClick = vi.fn();

      render(<GanttView onTaskClick={onTaskClick} />);

      fireEvent.click(screen.getByTestId('task-row-task-1'));

      expect(onTaskClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting',
          priority: 'high',
          status: 'in_progress',
          progress: 50,
          isCompleted: false,
        })
      );
    });
  });

  describe('Date Range Display', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('displays date range', () => {
      render(<GanttView />);

      // Date range should be displayed
      expect(screen.getByText(/\d{4}\/\d{1,2}\/\d{1,2} - \d{4}\/\d{1,2}\/\d{1,2}/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('has accessible prev button', () => {
      render(<GanttView />);

      const prevButton = screen.getByLabelText('上一期');
      expect(prevButton).toHaveAttribute('type', 'button');
    });

    it('has accessible next button', () => {
      render(<GanttView />);

      const nextButton = screen.getByLabelText('下一期');
      expect(nextButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Navigation in Different Time Ranges', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('navigates prev in week view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Week')); // Switch to week
      fireEvent.click(screen.getByLabelText('上一期')); // Navigate prev
      expect(useGanttData).toHaveBeenCalled();
    });

    it('navigates next in week view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Week'));
      fireEvent.click(screen.getByLabelText('下一期'));
      expect(useGanttData).toHaveBeenCalled();
    });

    it('navigates prev in quarter view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Quarter'));
      fireEvent.click(screen.getByLabelText('上一期'));
      expect(useGanttData).toHaveBeenCalled();
    });

    it('navigates next in quarter view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Quarter'));
      fireEvent.click(screen.getByLabelText('下一期'));
      expect(useGanttData).toHaveBeenCalled();
    });

    it('navigates prev in year view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Year'));
      fireEvent.click(screen.getByLabelText('上一期'));
      expect(useGanttData).toHaveBeenCalled();
    });

    it('navigates next in year view', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Year'));
      fireEvent.click(screen.getByLabelText('下一期'));
      expect(useGanttData).toHaveBeenCalled();
    });
  });

  describe('Date Range Computation', () => {
    beforeEach(() => {
      vi.mocked(useGanttData).mockReturnValue({
        data: { data: { tasks: mockTasks } },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGanttData>);
    });

    it('computes week range correctly', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Week'));
      // Header should show a 7-day range
      const header = screen.getByTestId('gantt-header');
      expect(header).toHaveAttribute('data-range', 'week');
    });

    it('computes quarter range correctly', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Quarter'));
      const header = screen.getByTestId('gantt-header');
      expect(header).toHaveAttribute('data-range', 'quarter');
    });

    it('computes year range correctly', () => {
      render(<GanttView />);
      fireEvent.click(screen.getByText('Year'));
      const header = screen.getByTestId('gantt-header');
      expect(header).toHaveAttribute('data-range', 'year');
    });
  });
});
