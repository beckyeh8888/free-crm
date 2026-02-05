'use client';

/**
 * GanttHeader - Time axis header
 * Sprint 5: Calendar & Gantt Chart
 */

import { useMemo } from 'react';
import type { TimeRange } from './GanttViewToggle';

interface GanttHeaderProps {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly timeRange: TimeRange;
}

interface TimeLabel {
  key: string;
  label: string;
  subLabel?: string;
  widthPercent: number;
}

function generateTimeLabels(
  start: Date,
  end: Date,
  range: TimeRange
): TimeLabel[] {
  const labels: TimeLabel[] = [];
  const current = new Date(start);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (range === 'week') {
    // Daily labels for week view
    while (current <= end) {
      const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][current.getDay()];
      labels.push({
        key: current.toISOString(),
        label: `${current.getDate()}`,
        subLabel: dayOfWeek,
        widthPercent: 100 / totalDays,
      });
      current.setDate(current.getDate() + 1);
    }
  } else if (range === 'month') {
    // Weekly labels for month view
    const weekStart = new Date(current);
    while (weekStart <= end) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const daysInWeek = Math.min(
        7,
        Math.ceil((Math.min(weekEnd.getTime(), end.getTime()) - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      labels.push({
        key: weekStart.toISOString(),
        label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        subLabel: `週`,
        widthPercent: (daysInWeek / totalDays) * 100,
      });
      weekStart.setDate(weekStart.getDate() + 7);
    }
  } else if (range === 'quarter') {
    // Monthly labels for quarter view
    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const daysInMonth = Math.min(
        monthEnd.getDate(),
        Math.ceil((Math.min(monthEnd.getTime(), end.getTime()) - Math.max(monthStart.getTime(), start.getTime())) / (1000 * 60 * 60 * 24)) + 1
      );
      labels.push({
        key: `${current.getFullYear()}-${current.getMonth()}`,
        label: `${current.getMonth() + 1}月`,
        widthPercent: (daysInMonth / totalDays) * 100,
      });
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
  } else {
    // Quarterly labels for year view
    while (current <= end) {
      const quarter = Math.floor(current.getMonth() / 3) + 1;
      const quarterStart = new Date(current.getFullYear(), (quarter - 1) * 3, 1);
      const quarterEnd = new Date(current.getFullYear(), quarter * 3, 0);
      const daysInQuarter = Math.ceil(
        (Math.min(quarterEnd.getTime(), end.getTime()) - Math.max(quarterStart.getTime(), start.getTime())) / (1000 * 60 * 60 * 24)
      ) + 1;
      labels.push({
        key: `${current.getFullYear()}-Q${quarter}`,
        label: `Q${quarter}`,
        subLabel: `${current.getFullYear()}`,
        widthPercent: (daysInQuarter / totalDays) * 100,
      });
      current.setMonth(current.getMonth() + 3);
      current.setDate(1);
    }
  }

  return labels;
}

export function GanttHeader({ startDate, endDate, timeRange }: GanttHeaderProps) {
  const labels = useMemo(
    () => generateTimeLabels(startDate, endDate, timeRange),
    [startDate, endDate, timeRange]
  );

  return (
    <div className="flex h-10 border-b border-border bg-background-secondary">
      {/* Task Column Header */}
      <div className="w-64 flex-shrink-0 flex items-center px-3 border-r border-border">
        <span className="text-sm font-medium text-text-secondary">任務</span>
      </div>

      {/* Time Labels */}
      <div className="flex-1 flex">
        {labels.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center justify-center border-r border-border last:border-r-0"
            style={{ width: `${item.widthPercent}%` }}
          >
            <span className="text-xs font-medium text-text-primary">{item.label}</span>
            {item.subLabel && (
              <span className="text-xs text-text-muted">{item.subLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
