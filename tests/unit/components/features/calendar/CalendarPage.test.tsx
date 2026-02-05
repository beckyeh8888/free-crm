/**
 * CalendarPage Component Tests
 * Tests for main container with Calendar/Gantt tab switcher
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CalendarPage } from '@/components/features/calendar/CalendarPage';
import type { CalendarEvent } from '@/hooks/useCalendar';

// Mock child components
vi.mock('@/components/features/calendar/CalendarView', () => ({
  CalendarView: ({
    onEventClick,
  }: {
    onEventClick?: (event: CalendarEvent) => void;
  }) => (
    <div data-testid="calendar-view">
      <button
        type="button"
        data-testid="trigger-event-click"
        onClick={() =>
          onEventClick?.({
            id: 'event-1',
            title: 'Test Event',
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
          })
        }
      >
        Click Event
      </button>
    </div>
  ),
}));

vi.mock('@/components/features/gantt', () => ({
  GanttView: ({
    onTaskClick,
  }: {
    onTaskClick?: (event: CalendarEvent) => void;
  }) => (
    <div data-testid="gantt-view">
      <button
        type="button"
        data-testid="trigger-task-click"
        onClick={() =>
          onTaskClick?.({
            id: 'task-1',
            title: 'Gantt Task',
            type: 'todo',
            priority: 'medium',
            status: 'pending',
            start: '2026-02-15T00:00:00Z',
            end: '2026-02-20T00:00:00Z',
            time: null,
            isAllDay: true,
            progress: 50,
            isCompleted: false,
            color: '#10B981',
            assignee: null,
            project: null,
            customer: null,
          })
        }
      >
        Click Task
      </button>
    </div>
  ),
}));

vi.mock('@/components/features/tasks/TaskDetailModal', () => ({
  TaskDetailModal: ({
    event,
    onClose,
  }: {
    event: CalendarEvent;
    onClose: () => void;
  }) => (
    <div data-testid="task-detail-modal">
      <span data-testid="modal-event-title">{event.title}</span>
      <button type="button" data-testid="close-modal" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('CalendarPage', () => {
  describe('Default Rendering', () => {
    it('renders calendar tab as active by default', () => {
      render(<CalendarPage />);

      const calendarTab = screen.getByRole('tab', { name: '月曆' });
      expect(calendarTab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders gantt tab as inactive by default', () => {
      render(<CalendarPage />);

      const ganttTab = screen.getByRole('tab', { name: '甘特圖' });
      expect(ganttTab).toHaveAttribute('aria-selected', 'false');
    });

    it('renders CalendarView by default', () => {
      render(<CalendarPage />);

      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
      expect(screen.queryByTestId('gantt-view')).not.toBeInTheDocument();
    });

    it('renders tabpanel', () => {
      render(<CalendarPage />);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  describe('Default Tab Prop', () => {
    it('shows gantt view when defaultTab is gantt', () => {
      render(<CalendarPage defaultTab="gantt" />);

      expect(screen.getByTestId('gantt-view')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-view')).not.toBeInTheDocument();
    });

    it('marks gantt tab as selected when defaultTab is gantt', () => {
      render(<CalendarPage defaultTab="gantt" />);

      const ganttTab = screen.getByRole('tab', { name: '甘特圖' });
      expect(ganttTab).toHaveAttribute('aria-selected', 'true');

      const calendarTab = screen.getByRole('tab', { name: '月曆' });
      expect(calendarTab).toHaveAttribute('aria-selected', 'false');
    });

    it('shows calendar view when defaultTab is calendar', () => {
      render(<CalendarPage defaultTab="calendar" />);

      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('switches to gantt view when gantt tab is clicked', () => {
      render(<CalendarPage />);

      fireEvent.click(screen.getByRole('tab', { name: '甘特圖' }));

      expect(screen.getByTestId('gantt-view')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-view')).not.toBeInTheDocument();
    });

    it('switches back to calendar view when calendar tab is clicked', () => {
      render(<CalendarPage />);

      // Switch to gantt first
      fireEvent.click(screen.getByRole('tab', { name: '甘特圖' }));
      expect(screen.getByTestId('gantt-view')).toBeInTheDocument();

      // Switch back to calendar
      fireEvent.click(screen.getByRole('tab', { name: '月曆' }));
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
      expect(screen.queryByTestId('gantt-view')).not.toBeInTheDocument();
    });

    it('updates aria-selected when switching tabs', () => {
      render(<CalendarPage />);

      const calendarTab = screen.getByRole('tab', { name: '月曆' });
      const ganttTab = screen.getByRole('tab', { name: '甘特圖' });

      // Initially calendar is selected
      expect(calendarTab).toHaveAttribute('aria-selected', 'true');
      expect(ganttTab).toHaveAttribute('aria-selected', 'false');

      // Switch to gantt
      fireEvent.click(ganttTab);
      expect(calendarTab).toHaveAttribute('aria-selected', 'false');
      expect(ganttTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Task Detail Modal', () => {
    it('does not show modal initially', () => {
      render(<CalendarPage />);

      expect(screen.queryByTestId('task-detail-modal')).not.toBeInTheDocument();
    });

    it('shows modal when calendar event is clicked', () => {
      render(<CalendarPage />);

      fireEvent.click(screen.getByTestId('trigger-event-click'));

      expect(screen.getByTestId('task-detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-event-title')).toHaveTextContent('Test Event');
    });

    it('shows modal when gantt task is clicked', () => {
      render(<CalendarPage defaultTab="gantt" />);

      fireEvent.click(screen.getByTestId('trigger-task-click'));

      expect(screen.getByTestId('task-detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-event-title')).toHaveTextContent('Gantt Task');
    });

    it('closes modal when close is clicked', () => {
      render(<CalendarPage />);

      // Open modal
      fireEvent.click(screen.getByTestId('trigger-event-click'));
      expect(screen.getByTestId('task-detail-modal')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('task-detail-modal')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has type button on both tab buttons', () => {
      render(<CalendarPage />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('type', 'button');
      });
    });

    it('renders two tabs', () => {
      render(<CalendarPage />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });
  });
});
