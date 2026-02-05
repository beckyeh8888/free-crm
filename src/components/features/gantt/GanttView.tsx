'use client';

/**
 * GanttView - Gantt chart container
 * Sprint 5: Calendar & Gantt Chart
 */

import { useState, useMemo, useCallback } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { GanttHeader } from './GanttHeader';
import { GanttTaskRow } from './GanttTaskRow';
import { GanttFilters, type GanttFilterValues } from './GanttFilters';
import { GanttViewToggle, type TimeRange } from './GanttViewToggle';
import { useGanttData, type GanttTask } from '@/hooks/useGantt';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CalendarEvent } from '@/hooks/useCalendar';

interface GanttViewProps {
  readonly onTaskClick?: (event: CalendarEvent) => void;
}

function getDateRange(baseDate: Date, range: TimeRange): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (range) {
    case 'week':
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case 'month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'quarter': {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      end.setMonth((quarter + 1) * 3);
      end.setDate(0);
      break;
    }
    case 'year':
      start.setMonth(0);
      start.setDate(1);
      end.setMonth(11);
      end.setDate(31);
      break;
  }

  return { start, end };
}

function formatDateRange(start: Date, end: Date): string {
  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function GanttView({ onTaskClick }: GanttViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [baseDate, setBaseDate] = useState(new Date());
  const [filters, setFilters] = useState<GanttFilterValues>({
    projectId: '',
    customerId: '',
    assignedToId: '',
  });

  const { start, end } = useMemo(
    () => getDateRange(baseDate, timeRange),
    [baseDate, timeRange]
  );

  const { data, isLoading, error } = useGanttData({
    start: start.toISOString(),
    end: end.toISOString(),
    projectId: filters.projectId || undefined,
    customerId: filters.customerId || undefined,
    assignedToId: filters.assignedToId || undefined,
  });

  const handlePrev = useCallback(() => {
    const newDate = new Date(baseDate);
    switch (timeRange) {
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() - 3);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setBaseDate(newDate);
  }, [baseDate, timeRange]);

  const handleNext = useCallback(() => {
    const newDate = new Date(baseDate);
    switch (timeRange) {
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setBaseDate(newDate);
  }, [baseDate, timeRange]);

  const handleToday = useCallback(() => {
    setBaseDate(new Date());
  }, []);

  const handleTaskClick = useCallback(
    (task: GanttTask) => {
      // Convert GanttTask to CalendarEvent format
      const event: CalendarEvent = {
        id: task.id,
        title: task.title,
        type: task.type,
        priority: task.priority,
        status: task.status,
        start: task.startDate || task.endDate || new Date().toISOString(),
        end: task.endDate || task.startDate || new Date().toISOString(),
        time: null,
        isAllDay: true,
        progress: task.progress,
        isCompleted: task.isCompleted,
        color: task.color || '#3B82F6',
        assignee: task.assignee,
        project: task.project,
        customer: task.customer,
      };
      onTaskClick?.(event);
    },
    [onTaskClick]
  );

  if (isLoading) {
    return <LoadingState message="載入甘特圖..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="無法載入甘特圖"
        description="請稍後再試"
      />
    );
  }

  const tasks = data?.data?.tasks || [];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        {/* Filters */}
        <GanttFilters values={filters} onChange={setFilters} />

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-background-hover transition-colors"
            aria-label="上一期"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-sm text-text-secondary hover:bg-background-hover rounded-lg transition-colors"
          >
            今天
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-background-hover transition-colors"
            aria-label="下一期"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Date Range Display */}
          <span className="text-sm text-text-muted mx-2">
            {formatDateRange(start, end)}
          </span>

          {/* View Toggle */}
          <GanttViewToggle value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <GanttHeader startDate={start} endDate={end} timeRange={timeRange} />

        {/* Task Rows */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100% - 40px)' }}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              此期間沒有任務
            </div>
          ) : (
            tasks.map((task) => (
              <GanttTaskRow
                key={task.id}
                task={task}
                timelineStart={start}
                timelineEnd={end}
                onClick={handleTaskClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
