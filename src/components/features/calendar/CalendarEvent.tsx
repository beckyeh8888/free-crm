'use client';

/**
 * CalendarEvent - Single event item in calendar day cell
 * Sprint 5: Calendar & Gantt Chart
 */

import { TaskTypeIcon, type TaskType } from '@/components/features/tasks';
import type { CalendarEvent as CalendarEventType } from '@/hooks/useCalendar';

interface CalendarEventProps {
  readonly event: CalendarEventType;
  readonly onClick?: (event: CalendarEventType) => void;
  readonly compact?: boolean;
}

export function CalendarEvent({
  event,
  onClick,
  compact = false,
}: CalendarEventProps) {
  const handleClick = () => {
    onClick?.(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(event);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-600"
        style={{
          backgroundColor: `${event.color}20`,
          color: event.color,
        }}
        title={event.title}
      >
        {event.time && !event.isAllDay && (
          <span className="mr-1 opacity-75">{event.time}</span>
        )}
        {event.title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        w-full text-left px-2 py-1.5 rounded-lg
        flex items-center gap-2
        transition-colors hover:opacity-80
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
        ${event.isCompleted ? 'opacity-60' : ''}
      `}
      style={{
        backgroundColor: `${event.color}15`,
        borderLeft: `3px solid ${event.color}`,
      }}
    >
      <TaskTypeIcon type={event.type as TaskType} size="sm" />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            event.isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
          }`}
        >
          {event.title}
        </p>
        {event.time && !event.isAllDay && (
          <p className="text-xs text-text-muted">{event.time}</p>
        )}
      </div>
      {event.assignee && (
        <div
          className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0"
          title={event.assignee.name || ''}
        >
          <span className="text-xs text-white font-medium">
            {event.assignee.name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}
    </button>
  );
}
