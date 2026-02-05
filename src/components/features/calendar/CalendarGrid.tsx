'use client';

/**
 * CalendarGrid - 7x6 grid for month view
 * Sprint 5: Calendar & Gantt Chart
 */

import { useMemo } from 'react';
import { CalendarDay } from './CalendarDay';
import { getEventsForDay, type CalendarEvent } from '@/hooks/useCalendar';

interface CalendarGridProps {
  readonly year: number;
  readonly month: number;
  readonly events: CalendarEvent[];
  readonly selectedDate?: Date | null;
  readonly onDayClick?: (date: Date) => void;
  readonly onEventClick?: (event: CalendarEvent) => void;
  readonly onAddClick?: (date: Date) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const endDate = new Date(lastDay);
  const remainingDays = 6 - lastDay.getDay();
  endDate.setDate(endDate.getDate() + remainingDays);

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Ensure we always have 42 days (6 rows)
  while (days.length < 42) {
    const nextDay = new Date(days[days.length - 1]);
    nextDay.setDate(nextDay.getDate() + 1);
    days.push(nextDay);
  }

  return days;
}

export function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onDayClick,
  onEventClick,
  onAddClick,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  return (
    <div className="border-l border-t border-border rounded-lg overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-background-secondary">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`
              py-2 text-center text-sm font-medium border-b border-r border-border
              ${index === 0 ? 'text-error' : index === 6 ? 'text-accent-600' : 'text-text-secondary'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7" role="grid" aria-label="月曆">
        {days.map((date) => {
          const dayEvents = getEventsForDay(events, date);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

          return (
            <CalendarDay
              key={date.toISOString()}
              date={date}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isSelected={isSelected}
              onDayClick={onDayClick}
              onEventClick={onEventClick}
              onAddClick={onAddClick}
            />
          );
        })}
      </div>
    </div>
  );
}
