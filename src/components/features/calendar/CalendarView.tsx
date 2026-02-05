'use client';

/**
 * CalendarView - Monthly calendar view container
 * Sprint 5: Calendar & Gantt Chart
 */

import { useState, useCallback } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { TaskForm, type TaskFormData } from '@/components/features/tasks';
import { useCalendarTasks, getMonthRange, type CalendarEvent } from '@/hooks/useCalendar';
import { useCreateTask, useUpdateTask, type TaskType, type TaskPriority, type TaskStatus } from '@/hooks/useTasks';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';

interface CalendarViewProps {
  readonly onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ onEventClick }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [initialFormDate, setInitialFormDate] = useState<Date>(new Date());

  // Get date range for current month view
  const { start, end } = getMonthRange(new Date(year, month, 1));

  // Fetch calendar data
  const {
    data: calendarData,
    isLoading,
    error,
  } = useCalendarTasks({ start, end });

  const createMutation = useCreateTask();
  // updateMutation will be used when drag-to-reschedule is implemented
  const _updateMutation = useUpdateTask();

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month, setYear, setMonth]);

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month, setYear, setMonth]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(now);
  }, [setYear, setMonth, setSelectedDate]);

  // Day click handler
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Add task handler
  const handleAddClick = useCallback((date: Date) => {
    setInitialFormDate(date);
    setShowTaskForm(true);
  }, []);

  const handleAddTask = useCallback(() => {
    setInitialFormDate(new Date());
    setShowTaskForm(true);
  }, []);

  // Event click handler
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      onEventClick?.(event);
    },
    [onEventClick]
  );

  // Form submit handler
  const handleFormSubmit = useCallback(
    (data: TaskFormData) => {
      createMutation.mutate(
        {
          title: data.title,
          description: data.description || undefined,
          type: data.type as TaskType,
          priority: data.priority as TaskPriority,
          status: data.status as TaskStatus,
          startDate: data.startDate || undefined,
          dueDate: data.dueDate || undefined,
          dueTime: data.dueTime || undefined,
          isAllDay: data.isAllDay,
          progress: data.progress,
          projectId: data.projectId || undefined,
          customerId: data.customerId || undefined,
          dealId: data.dealId || undefined,
        },
        {
          onSuccess: () => {
            setShowTaskForm(false);
          },
        }
      );
    },
    [createMutation]
  );

  // Loading state
  if (isLoading) {
    return <LoadingState message="載入行事曆..." />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16" />}
        title="無法載入行事曆"
        description="請稍後再試"
      />
    );
  }

  const events = [...(calendarData?.data?.events || [])];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onAddTask={handleAddTask}
      />

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <CalendarGrid
          year={year}
          month={month}
          events={events}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          onAddClick={handleAddClick}
        />
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={handleFormSubmit}
          onClose={() => setShowTaskForm(false)}
          isSubmitting={createMutation.isPending}
          initialDate={initialFormDate}
        />
      )}
    </div>
  );
}
