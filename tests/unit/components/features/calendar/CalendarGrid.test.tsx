/**
 * CalendarGrid Component Tests
 * Tests for 7x6 month view calendar grid
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CalendarGrid } from '@/components/features/calendar/CalendarGrid';
import type { CalendarEvent } from '@/hooks/useCalendar';

// Mock CalendarDay component
vi.mock('@/components/features/calendar/CalendarDay', () => ({
  CalendarDay: ({
    date,
    events,
    isCurrentMonth,
    isToday,
    isSelected,
    onDayClick,
    onEventClick,
    onAddClick,
  }: {
    date: Date;
    events: CalendarEvent[];
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onAddClick?: (date: Date) => void;
  }) => (
    <div
      data-testid={`day-${date.getDate()}-${date.getMonth()}`}
      data-current-month={isCurrentMonth}
      data-is-today={isToday}
      data-is-selected={isSelected}
      data-event-count={events.length}
      onClick={() => onDayClick?.(date)}
      onDoubleClick={() => onAddClick?.(date)}
    >
      {date.getDate()}
      {events.map(e => (
        <button key={e.id} type="button" onClick={() => onEventClick?.(e)}>
          {e.title}
        </button>
      ))}
    </div>
  ),
}));

// Mock useCalendar hook
vi.mock('@/hooks/useCalendar', async () => {
  const actual = await vi.importActual('@/hooks/useCalendar');
  return {
    ...actual,
    getEventsForDay: vi.fn((events: CalendarEvent[], date: Date) => {
      return events.filter(e => {
        const eventDate = new Date(e.start);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      });
    }),
  };
});

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
  {
    id: 'event-2',
    title: 'Call 1',
    type: 'call',
    priority: 'medium',
    status: 'pending',
    start: '2026-02-15T14:00:00Z',
    end: '2026-02-15T15:00:00Z',
    time: '14:00',
    isAllDay: false,
    progress: 0,
    isCompleted: false,
    color: '#10B981',
    assignee: null,
    project: null,
    customer: null,
  },
];

describe('CalendarGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders weekday headers', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByText('一')).toBeInTheDocument();
      expect(screen.getByText('二')).toBeInTheDocument();
      expect(screen.getByText('三')).toBeInTheDocument();
      expect(screen.getByText('四')).toBeInTheDocument();
      expect(screen.getByText('五')).toBeInTheDocument();
      expect(screen.getByText('六')).toBeInTheDocument();
    });

    it('renders calendar grid with correct aria label', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      expect(screen.getByRole('grid', { name: '月曆' })).toBeInTheDocument();
    });

    it('renders 42 calendar days (6 rows)', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      // Grid should have 42 CalendarDay components
      const days = screen.getAllByTestId(/^day-/);
      expect(days.length).toBe(42);
    });
  });

  describe('Month Display', () => {
    it('marks days in current month', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      // Day 15 of February 2026 should be in current month
      const day15 = screen.getByTestId('day-15-1');
      expect(day15).toHaveAttribute('data-current-month', 'true');
    });

    it('marks days outside current month', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      // Days from January (month 0) should not be current month
      const janDay = screen.queryByTestId('day-31-0');
      if (janDay) {
        expect(janDay).toHaveAttribute('data-current-month', 'false');
      }
    });
  });

  describe('Today Highlighting', () => {
    it('marks today correctly', () => {
      // System time is set to Feb 5, 2026
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      const today = screen.getByTestId('day-5-1');
      expect(today).toHaveAttribute('data-is-today', 'true');
    });

    it('does not mark other days as today', () => {
      render(<CalendarGrid year={2026} month={1} events={[]} />);

      const notToday = screen.getByTestId('day-10-1');
      expect(notToday).toHaveAttribute('data-is-today', 'false');
    });
  });

  describe('Selected Date', () => {
    it('marks selected date', () => {
      const selectedDate = new Date('2026-02-10');
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={[]}
          selectedDate={selectedDate}
        />
      );

      const selected = screen.getByTestId('day-10-1');
      expect(selected).toHaveAttribute('data-is-selected', 'true');
    });

    it('does not mark other days as selected', () => {
      const selectedDate = new Date('2026-02-10');
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={[]}
          selectedDate={selectedDate}
        />
      );

      const notSelected = screen.getByTestId('day-15-1');
      expect(notSelected).toHaveAttribute('data-is-selected', 'false');
    });

    it('handles null selected date', () => {
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={[]}
          selectedDate={null}
        />
      );

      const day = screen.getByTestId('day-10-1');
      expect(day).toHaveAttribute('data-is-selected', 'false');
    });
  });

  describe('Events Display', () => {
    it('passes events to corresponding days', () => {
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={mockEvents}
        />
      );

      // Event on Feb 10 should be passed to that day
      const day10 = screen.getByTestId('day-10-1');
      expect(day10).toHaveAttribute('data-event-count', '1');
    });

    it('days without events have zero event count', () => {
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={mockEvents}
        />
      );

      // Day without events
      const day5 = screen.getByTestId('day-5-1');
      expect(day5).toHaveAttribute('data-event-count', '0');
    });
  });

  describe('Click Handlers', () => {
    it('calls onDayClick when day is clicked', () => {
      const onDayClick = vi.fn();
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={[]}
          onDayClick={onDayClick}
        />
      );

      const day10 = screen.getByTestId('day-10-1');
      day10.click();

      expect(onDayClick).toHaveBeenCalledTimes(1);
      expect(onDayClick).toHaveBeenCalledWith(expect.any(Date));
    });

    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={mockEvents}
          onEventClick={onEventClick}
        />
      );

      const eventButton = screen.getByText('Meeting 1');
      eventButton.click();

      expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('calls onAddClick when add is triggered', () => {
      const onAddClick = vi.fn();
      render(
        <CalendarGrid
          year={2026}
          month={1}
          events={[]}
          onAddClick={onAddClick}
        />
      );

      const day10 = screen.getByTestId('day-10-1');
      day10.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      expect(onAddClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different Months', () => {
    it('renders January correctly', () => {
      render(<CalendarGrid year={2026} month={0} events={[]} />);

      // Should include January days
      expect(screen.getByTestId('day-1-0')).toBeInTheDocument();
      expect(screen.getByTestId('day-31-0')).toBeInTheDocument();
    });

    it('renders December correctly', () => {
      render(<CalendarGrid year={2026} month={11} events={[]} />);

      // Should include December days
      expect(screen.getByTestId('day-1-11')).toBeInTheDocument();
      expect(screen.getByTestId('day-31-11')).toBeInTheDocument();
    });

    it('handles leap year February', () => {
      // 2024 is a leap year
      render(<CalendarGrid year={2024} month={1} events={[]} />);

      // Should have 42 days still
      const days = screen.getAllByTestId(/^day-/);
      expect(days.length).toBe(42);
    });
  });
});
