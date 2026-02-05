'use client';

/**
 * CalendarDay - Single day cell in calendar grid
 * Sprint 5: Calendar & Gantt Chart
 */

import { Plus } from 'lucide-react';
import { CalendarEvent } from './CalendarEvent';
import type { CalendarEvent as CalendarEventType } from '@/hooks/useCalendar';

interface CalendarDayProps {
  readonly date: Date;
  readonly events: CalendarEventType[];
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected?: boolean;
  readonly onDayClick?: (date: Date) => void;
  readonly onEventClick?: (event: CalendarEventType) => void;
  readonly onAddClick?: (date: Date) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export function CalendarDay({
  date,
  events,
  isCurrentMonth,
  isToday,
  isSelected,
  onDayClick,
  onEventClick,
  onAddClick,
}: CalendarDayProps) {
  const day = date.getDate();
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = events.length - MAX_VISIBLE_EVENTS;

  const handleDayClick = () => {
    onDayClick?.(date);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick?.(date);
  };

  return (
    <div
      className={`
        group relative min-h-[100px] p-1 border-b border-r border-border
        transition-colors cursor-pointer
        ${isCurrentMonth ? 'bg-background' : 'bg-background-secondary'}
        ${isSelected ? 'bg-accent-600/10' : 'hover:bg-background-hover'}
      `}
      onClick={handleDayClick}
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDayClick();
        }
      }}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            w-7 h-7 flex items-center justify-center rounded-full text-sm
            ${isToday ? 'bg-accent-600 text-white font-bold' : ''}
            ${!isToday && isCurrentMonth ? 'text-text-primary' : ''}
            ${!isCurrentMonth ? 'text-text-muted' : ''}
          `}
        >
          {day}
        </span>

        {/* Add Button (visible on hover) */}
        <button
          type="button"
          onClick={handleAddClick}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-accent-600 hover:bg-accent-600/10 transition-all"
          aria-label={`在 ${date.toLocaleDateString('zh-TW')} 新增任務`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <CalendarEvent
            key={event.id}
            event={event}
            onClick={onEventClick}
            compact
          />
        ))}

        {/* Hidden Events Count */}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="w-full text-left px-1.5 py-0.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDayClick?.(date);
            }}
          >
            +{hiddenCount} 更多
          </button>
        )}
      </div>
    </div>
  );
}
