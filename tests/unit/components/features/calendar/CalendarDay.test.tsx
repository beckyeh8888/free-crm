/**
 * CalendarDay Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarDay } from '@/components/features/calendar/CalendarDay';
import type { CalendarEvent as CalendarEventType } from '@/hooks/useCalendar';

// Mock CalendarEvent component
vi.mock('@/components/features/calendar/CalendarEvent', () => ({
  CalendarEvent: ({ event, onClick, compact }: {
    event: CalendarEventType;
    onClick?: (event: CalendarEventType) => void;
    compact?: boolean;
  }) => (
    <button
      data-testid={`event-${event.id}`}
      data-compact={compact}
      onClick={() => onClick?.(event)}
    >
      {event.title}
    </button>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus">+</span>,
}));

const mockEvents: CalendarEventType[] = [
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
    assignee: null,
    project: null,
    customer: null,
  },
  {
    id: 'event-2',
    title: '任務二',
    type: 'task',
    priority: 'medium',
    status: 'in_progress',
    start: '2026-02-05T14:00:00Z',
    end: '2026-02-05T15:00:00Z',
    time: '14:00',
    isAllDay: false,
    progress: 50,
    isCompleted: false,
    color: '#3B82F6',
    assignee: null,
    project: null,
    customer: null,
  },
  {
    id: 'event-3',
    title: '電話三',
    type: 'call',
    priority: 'low',
    status: 'pending',
    start: '2026-02-05T16:00:00Z',
    end: '2026-02-05T16:30:00Z',
    time: '16:00',
    isAllDay: false,
    progress: 0,
    isCompleted: false,
    color: '#22C55E',
    assignee: null,
    project: null,
    customer: null,
  },
  {
    id: 'event-4',
    title: '追蹤四',
    type: 'follow_up',
    priority: 'medium',
    status: 'pending',
    start: '2026-02-05T17:00:00Z',
    end: '2026-02-05T17:30:00Z',
    time: '17:00',
    isAllDay: false,
    progress: 0,
    isCompleted: false,
    color: '#06B6D4',
    assignee: null,
    project: null,
    customer: null,
  },
];

describe('CalendarDay Component', () => {
  const defaultProps = {
    date: new Date('2026-02-05'),
    events: mockEvents.slice(0, 2),
    isCurrentMonth: true,
    isToday: false,
  };

  describe('Display', () => {
    it('displays the day number', () => {
      render(<CalendarDay {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders events', () => {
      render(<CalendarDay {...defaultProps} />);

      expect(screen.getByTestId('event-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-event-2')).toBeInTheDocument();
    });

    it('shows events in compact mode', () => {
      render(<CalendarDay {...defaultProps} />);

      const event = screen.getByTestId('event-event-1');
      expect(event).toHaveAttribute('data-compact', 'true');
    });

    it('highlights today', () => {
      render(<CalendarDay {...defaultProps} isToday />);

      const dayNumber = screen.getByText('5');
      expect(dayNumber).toHaveClass('bg-accent-600');
    });

    it('dims days outside current month', () => {
      render(<CalendarDay {...defaultProps} isCurrentMonth={false} />);

      const dayNumber = screen.getByText('5');
      expect(dayNumber).toHaveClass('text-text-muted');
    });

    it('shows selected state', () => {
      render(<CalendarDay {...defaultProps} isSelected />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Event Limiting', () => {
    it('shows maximum 3 events', () => {
      render(<CalendarDay {...defaultProps} events={mockEvents} />);

      expect(screen.getByTestId('event-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-event-2')).toBeInTheDocument();
      expect(screen.getByTestId('event-event-3')).toBeInTheDocument();
      expect(screen.queryByTestId('event-event-4')).not.toBeInTheDocument();
    });

    it('shows hidden events count', () => {
      render(<CalendarDay {...defaultProps} events={mockEvents} />);

      expect(screen.getByText('+1 更多')).toBeInTheDocument();
    });

    it('does not show hidden count when all events are visible', () => {
      render(<CalendarDay {...defaultProps} />);

      expect(screen.queryByText(/更多/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onDayClick when day is clicked', () => {
      const onDayClick = vi.fn();
      render(<CalendarDay {...defaultProps} onDayClick={onDayClick} />);

      fireEvent.click(screen.getByRole('gridcell'));

      expect(onDayClick).toHaveBeenCalledWith(defaultProps.date);
    });

    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();
      render(<CalendarDay {...defaultProps} onEventClick={onEventClick} />);

      fireEvent.click(screen.getByTestId('event-event-1'));

      expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('calls onAddClick when add button is clicked', () => {
      const onAddClick = vi.fn();
      render(<CalendarDay {...defaultProps} onAddClick={onAddClick} />);

      const addButton = screen.getByLabelText(/新增任務/);
      fireEvent.click(addButton);

      expect(onAddClick).toHaveBeenCalledWith(defaultProps.date);
    });

    it('calls onDayClick when "more" button is clicked', () => {
      const onDayClick = vi.fn();
      render(<CalendarDay {...defaultProps} events={mockEvents} onDayClick={onDayClick} />);

      fireEvent.click(screen.getByText('+1 更多'));

      expect(onDayClick).toHaveBeenCalledWith(defaultProps.date);
    });

    it('does not propagate add button click to day click', () => {
      const onDayClick = vi.fn();
      const onAddClick = vi.fn();
      render(<CalendarDay {...defaultProps} onDayClick={onDayClick} onAddClick={onAddClick} />);

      const addButton = screen.getByLabelText(/新增任務/);
      fireEvent.click(addButton);

      expect(onAddClick).toHaveBeenCalledTimes(1);
      expect(onDayClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Enter key on day cell', () => {
      const onDayClick = vi.fn();
      render(<CalendarDay {...defaultProps} onDayClick={onDayClick} />);

      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: 'Enter' });

      expect(onDayClick).toHaveBeenCalledWith(defaultProps.date);
    });

    it('handles Space key on day cell', () => {
      const onDayClick = vi.fn();
      render(<CalendarDay {...defaultProps} onDayClick={onDayClick} />);

      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: ' ' });

      expect(onDayClick).toHaveBeenCalledWith(defaultProps.date);
    });

    it('is focusable', () => {
      render(<CalendarDay {...defaultProps} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Accessibility', () => {
    it('has gridcell role', () => {
      render(<CalendarDay {...defaultProps} />);

      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });

    it('add button has descriptive aria-label', () => {
      render(<CalendarDay {...defaultProps} />);

      const addButton = screen.getByLabelText(/在.*新增任務/);
      expect(addButton).toBeInTheDocument();
    });
  });
});
