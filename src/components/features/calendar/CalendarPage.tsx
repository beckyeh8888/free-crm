'use client';

/**
 * CalendarPage - Main container with Calendar/Gantt tab switcher
 * Sprint 5: Calendar & Gantt Chart
 */

import { useState, useCallback } from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { GanttView } from '@/components/features/gantt';
import { TaskDetailModal } from '@/components/features/tasks/TaskDetailModal';
import type { CalendarEvent } from '@/hooks/useCalendar';

type ViewTab = 'calendar' | 'gantt';

interface CalendarPageProps {
  readonly defaultTab?: ViewTab;
}

export function CalendarPage({ defaultTab = 'calendar' }: CalendarPageProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>(defaultTab);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium
            border-b-2 -mb-[2px] transition-colors
            min-h-[44px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
            ${
              activeTab === 'calendar'
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }
          `}
          aria-selected={activeTab === 'calendar'}
          role="tab"
        >
          <Calendar className="w-4 h-4" />
          月曆
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gantt')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium
            border-b-2 -mb-[2px] transition-colors
            min-h-[44px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
            ${
              activeTab === 'gantt'
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }
          `}
          aria-selected={activeTab === 'gantt'}
          role="tab"
        >
          <BarChart3 className="w-4 h-4" />
          甘特圖
        </button>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden" role="tabpanel">
        {activeTab === 'calendar' && (
          <CalendarView onEventClick={handleEventClick} />
        )}
        {activeTab === 'gantt' && (
          <GanttView onTaskClick={handleEventClick} />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedEvent && (
        <TaskDetailModal
          event={selectedEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
