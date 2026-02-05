/**
 * CalendarEvent Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarEvent } from '@/components/features/calendar/CalendarEvent';
import type { CalendarEvent as CalendarEventType } from '@/hooks/useCalendar';

// Mock TaskTypeIcon
vi.mock('@/components/features/tasks', () => ({
  TaskTypeIcon: ({ type, size }: { type: string; size: string }) => (
    <span data-testid="task-type-icon" data-type={type} data-size={size}>
      {type}
    </span>
  ),
}));

const mockEvent: CalendarEventType = {
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
};

describe('CalendarEvent Component', () => {
  describe('Default View', () => {
    it('renders event title', () => {
      render(<CalendarEvent event={mockEvent} />);

      expect(screen.getByText('會議一')).toBeInTheDocument();
    });

    it('renders event time', () => {
      render(<CalendarEvent event={mockEvent} />);

      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('renders task type icon', () => {
      render(<CalendarEvent event={mockEvent} />);

      const icon = screen.getByTestId('task-type-icon');
      expect(icon).toHaveAttribute('data-type', 'meeting');
      expect(icon).toHaveAttribute('data-size', 'sm');
    });

    it('renders assignee initial', () => {
      render(<CalendarEvent event={mockEvent} />);

      expect(screen.getByText('測')).toBeInTheDocument();
    });

    it('handles click event', () => {
      const handleClick = vi.fn();
      render(<CalendarEvent event={mockEvent} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(mockEvent);
    });

    it('handles keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<CalendarEvent event={mockEvent} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledWith(mockEvent);
    });

    it('handles Space key', () => {
      const handleClick = vi.fn();
      render(<CalendarEvent event={mockEvent} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });

      expect(handleClick).toHaveBeenCalledWith(mockEvent);
    });

    it('applies completed style', () => {
      const completedEvent = { ...mockEvent, isCompleted: true };
      render(<CalendarEvent event={completedEvent} />);

      const title = screen.getByText('會議一');
      expect(title).toHaveClass('line-through');
    });

    it('hides time for all-day events', () => {
      const allDayEvent = { ...mockEvent, isAllDay: true };
      render(<CalendarEvent event={allDayEvent} />);

      expect(screen.queryByText('10:00')).not.toBeInTheDocument();
    });
  });

  describe('Compact View', () => {
    it('renders in compact mode', () => {
      render(<CalendarEvent event={mockEvent} compact />);

      expect(screen.getByText('會議一')).toBeInTheDocument();
    });

    it('shows time in compact mode', () => {
      render(<CalendarEvent event={mockEvent} compact />);

      // In compact mode, time is inline with title
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('has title attribute in compact mode', () => {
      render(<CalendarEvent event={mockEvent} compact />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', '會議一');
    });

    it('hides time in compact mode for all-day events', () => {
      const allDayEvent = { ...mockEvent, isAllDay: true };
      render(<CalendarEvent event={allDayEvent} compact />);

      expect(screen.queryByText('10:00')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles event without assignee', () => {
      const eventNoAssignee = { ...mockEvent, assignee: null };
      render(<CalendarEvent event={eventNoAssignee} />);

      expect(screen.queryByText('測')).not.toBeInTheDocument();
    });

    it('handles event without time', () => {
      const eventNoTime = { ...mockEvent, time: null };
      render(<CalendarEvent event={eventNoTime} />);

      expect(screen.queryByText('10:00')).not.toBeInTheDocument();
    });

    it('handles assignee without name', () => {
      const eventNoName = {
        ...mockEvent,
        assignee: { id: 'user-1', name: null, image: null },
      };
      render(<CalendarEvent event={eventNoName} />);

      // Should show '?' when name is null
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('does not call onClick when handler is not provided', () => {
      render(<CalendarEvent event={mockEvent} />);

      // Should not throw when clicked without handler
      fireEvent.click(screen.getByRole('button'));
    });
  });
});
