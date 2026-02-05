/**
 * TaskDetailModal Component Tests
 * Tests for task detail view modal
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskDetailModal } from '@/components/features/tasks/TaskDetailModal';
import type { CalendarEvent } from '@/hooks/useCalendar';

// Mock child components
vi.mock('@/components/features/tasks/TaskTypeIcon', () => ({
  TaskTypeIcon: ({ type }: { type: string }) => (
    <span data-testid="task-type-icon" data-type={type} />
  ),
}));

vi.mock('@/components/features/tasks/TaskPriorityBadge', () => ({
  TaskPriorityBadge: ({ priority }: { priority: string }) => (
    <span data-testid="task-priority-badge" data-priority={priority}>
      {priority}
    </span>
  ),
}));

vi.mock('@/components/features/tasks/TaskStatusBadge', () => ({
  TaskStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="task-status-badge" data-status={status}>
      {status}
    </span>
  ),
}));

const baseEvent: CalendarEvent = {
  id: 'event-1',
  title: 'Sprint Planning',
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
};

describe('TaskDetailModal', () => {
  const defaultProps = {
    event: baseEvent,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal with aria-label', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '任務詳情' })).toBeInTheDocument();
    });

    it('renders event title', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
    });

    it('renders heading 任務詳情', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '任務詳情' })).toBeInTheDocument();
    });

    it('renders task type icon', () => {
      render(<TaskDetailModal {...defaultProps} />);

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'meeting');
    });

    it('renders status badge', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByTestId('task-status-badge')).toHaveAttribute(
        'data-status',
        'in_progress'
      );
    });

    it('renders priority badge', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByTestId('task-priority-badge')).toHaveAttribute(
        'data-priority',
        'high'
      );
    });

    it('renders close buttons (header and actions)', () => {
      render(<TaskDetailModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: '關閉' });
      expect(closeButtons.length).toBe(2);
    });

    it('renders close button in actions', () => {
      render(<TaskDetailModal {...defaultProps} />);

      // There are two close buttons: header icon + bottom action button
      const closeButtons = screen.getAllByText('關閉');
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Date Display', () => {
    it('shows single date when start equals end', () => {
      render(<TaskDetailModal {...defaultProps} />);

      // Both start and end are Feb 10 2026
      expect(screen.getByText(/2026年2月10日/)).toBeInTheDocument();
    });

    it('shows date range when start differs from end', () => {
      const rangeEvent: CalendarEvent = {
        ...baseEvent,
        start: '2026-02-10T00:00:00Z',
        end: '2026-02-15T00:00:00Z',
      };
      render(<TaskDetailModal event={rangeEvent} onClose={vi.fn()} />);

      expect(screen.getByText(/~/)).toBeInTheDocument();
    });

    it('shows time when not all-day', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('時間：')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('does not show time for all-day events', () => {
      const allDayEvent: CalendarEvent = {
        ...baseEvent,
        isAllDay: true,
        time: null,
      };
      render(<TaskDetailModal event={allDayEvent} onClose={vi.fn()} />);

      expect(screen.queryByText('時間：')).not.toBeInTheDocument();
    });
  });

  describe('Progress', () => {
    it('shows progress bar when progress > 0', () => {
      const eventWithProgress: CalendarEvent = {
        ...baseEvent,
        progress: 75,
      };
      render(<TaskDetailModal event={eventWithProgress} onClose={vi.fn()} />);

      expect(screen.getByText('進度')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('does not show progress bar when progress is 0', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.queryByText('進度')).not.toBeInTheDocument();
    });
  });

  describe('Related Info', () => {
    it('shows assignee when present', () => {
      const eventWithAssignee: CalendarEvent = {
        ...baseEvent,
        assignee: { name: 'John Doe' },
      };
      render(<TaskDetailModal event={eventWithAssignee} onClose={vi.fn()} />);

      expect(screen.getByText('負責人：')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows 未指派 when assignee name is empty', () => {
      const eventWithEmptyAssignee: CalendarEvent = {
        ...baseEvent,
        assignee: { name: '' },
      };
      render(<TaskDetailModal event={eventWithEmptyAssignee} onClose={vi.fn()} />);

      expect(screen.getByText('未指派')).toBeInTheDocument();
    });

    it('does not show assignee section when null', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.queryByText('負責人：')).not.toBeInTheDocument();
    });

    it('shows project when present', () => {
      const eventWithProject: CalendarEvent = {
        ...baseEvent,
        project: { name: 'CRM Project' },
      };
      render(<TaskDetailModal event={eventWithProject} onClose={vi.fn()} />);

      expect(screen.getByText('專案：')).toBeInTheDocument();
      expect(screen.getByText('CRM Project')).toBeInTheDocument();
    });

    it('does not show project section when null', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.queryByText('專案：')).not.toBeInTheDocument();
    });

    it('shows customer when present', () => {
      const eventWithCustomer: CalendarEvent = {
        ...baseEvent,
        customer: { name: 'ACME Corp' },
      };
      render(<TaskDetailModal event={eventWithCustomer} onClose={vi.fn()} />);

      expect(screen.getByText('客戶：')).toBeInTheDocument();
      expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    });

    it('does not show customer section when null', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.queryByText('客戶：')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onClose when close header button is clicked', () => {
      const onClose = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={onClose} />);

      // First '關閉' button is the header icon button (aria-label)
      const closeButtons = screen.getAllByRole('button', { name: '關閉' });
      fireEvent.click(closeButtons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not show edit button when onEdit is not provided', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '編輯' })).not.toBeInTheDocument();
      expect(screen.queryByText('編輯任務')).not.toBeInTheDocument();
    });

    it('shows edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={vi.fn()} onEdit={onEdit} />);

      expect(screen.getByRole('button', { name: '編輯' })).toBeInTheDocument();
      expect(screen.getByText('編輯任務')).toBeInTheDocument();
    });

    it('calls onEdit when edit header button is clicked', () => {
      const onEdit = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={vi.fn()} onEdit={onEdit} />);

      fireEvent.click(screen.getByRole('button', { name: '編輯' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit action button is clicked', () => {
      const onEdit = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={vi.fn()} onEdit={onEdit} />);

      fireEvent.click(screen.getByText('編輯任務'));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type button on close buttons', () => {
      render(<TaskDetailModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button', { name: '關閉' });
      closeButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });

    it('has type button on edit button when present', () => {
      render(<TaskDetailModal event={baseEvent} onClose={vi.fn()} onEdit={vi.fn()} />);

      expect(screen.getByRole('button', { name: '編輯' })).toHaveAttribute('type', 'button');
    });

    it('has open attribute on dialog', () => {
      render(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('open');
    });
  });

  describe('Edge Cases - formatDate / formatTime branches', () => {
    it('renders dash when start date is null', () => {
      const nullStartEvent: CalendarEvent = {
        ...baseEvent,
        start: null,
        end: '2026-02-15T00:00:00Z',
      };
      render(<TaskDetailModal event={nullStartEvent} onClose={vi.fn()} />);

      // start is null so formatDate returns '-'; end has a date
      // start !== end so range branch is taken: "- ~ 2026年2月15日"
      expect(screen.getByText(/- ~/)).toBeInTheDocument();
    });

    it('renders dash when end date is null', () => {
      const nullEndEvent: CalendarEvent = {
        ...baseEvent,
        start: '2026-02-10T00:00:00Z',
        end: null,
      };
      render(<TaskDetailModal event={nullEndEvent} onClose={vi.fn()} />);

      // end is null so formatDate returns '-'; start has a date
      // start !== end so range branch is taken: "2026年2月10日 ~ -"
      expect(screen.getByText(/~ -/)).toBeInTheDocument();
    });

    it('renders dash for both dates when start and end are null', () => {
      const nullDatesEvent: CalendarEvent = {
        ...baseEvent,
        start: null,
        end: null,
      };
      render(<TaskDetailModal event={nullDatesEvent} onClose={vi.fn()} />);

      // start === end (both null) so single-date branch is taken: "-"
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // formatDate(null) returns '-'
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('renders single formatted date when start equals end', () => {
      const sameDateTime: CalendarEvent = {
        ...baseEvent,
        start: '2026-03-01T00:00:00Z',
        end: '2026-03-01T00:00:00Z',
      };
      render(<TaskDetailModal event={sameDateTime} onClose={vi.fn()} />);

      // start === end so single-date branch is taken
      expect(screen.getByText(/2026年3月1日/)).toBeInTheDocument();
      expect(screen.queryByText(/~/)).not.toBeInTheDocument();
    });

    it('does not show time when isAllDay is true even if time exists', () => {
      const allDayWithTime: CalendarEvent = {
        ...baseEvent,
        time: '10:00',
        isAllDay: true,
      };
      render(<TaskDetailModal event={allDayWithTime} onClose={vi.fn()} />);

      expect(screen.queryByText('時間：')).not.toBeInTheDocument();
    });

    it('does not show time section when time is null and not all-day', () => {
      const noTimeEvent: CalendarEvent = {
        ...baseEvent,
        time: null,
        isAllDay: false,
      };
      render(<TaskDetailModal event={noTimeEvent} onClose={vi.fn()} />);

      expect(screen.queryByText('時間：')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases - progress undefined', () => {
    it('does not show progress section when progress is undefined', () => {
      const eventNoProgress = {
        ...baseEvent,
        progress: undefined,
      } as unknown as CalendarEvent;
      render(<TaskDetailModal event={eventNoProgress} onClose={vi.fn()} />);

      expect(screen.queryByText('進度')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases - multiple related info', () => {
    it('shows all related info sections simultaneously', () => {
      const fullEvent: CalendarEvent = {
        ...baseEvent,
        assignee: { id: 'a1', name: 'Jane Doe', image: null },
        project: { id: 'p1', name: 'Alpha Project', color: '#ff0000' },
        customer: { id: 'c1', name: 'Corp X' },
      };
      render(<TaskDetailModal event={fullEvent} onClose={vi.fn()} />);

      expect(screen.getByText('負責人：')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('專案：')).toBeInTheDocument();
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
      expect(screen.getByText('客戶：')).toBeInTheDocument();
      expect(screen.getByText('Corp X')).toBeInTheDocument();
    });
  });

  describe('Actions - bottom close button', () => {
    it('calls onClose when bottom action close button is clicked', () => {
      const onClose = vi.fn();
      render(<TaskDetailModal event={baseEvent} onClose={onClose} />);

      // There are two close buttons: header icon + bottom action
      const closeButtons = screen.getAllByRole('button', { name: '關閉' });
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
