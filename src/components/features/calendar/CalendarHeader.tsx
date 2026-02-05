'use client';

/**
 * CalendarHeader - Month navigation controls
 * Sprint 5: Calendar & Gantt Chart
 */

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarHeaderProps {
  readonly year: number;
  readonly month: number;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onToday: () => void;
  readonly onAddTask?: () => void;
}

const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAddTask,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          aria-label="上個月"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
        >
          今天
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          aria-label="下個月"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Current Month/Year */}
        <h2 className="ml-4 text-xl font-semibold text-text-primary">
          {year}年 {MONTH_NAMES[month]}
        </h2>
      </div>

      {/* Add Task Button */}
      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>新增任務</span>
        </button>
      )}
    </div>
  );
}
