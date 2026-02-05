'use client';

/**
 * GanttViewToggle - Time range view switcher (week/month/quarter/year)
 * Sprint 5: Calendar & Gantt Chart
 */

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

interface GanttViewToggleProps {
  readonly value: TimeRange;
  readonly onChange: (value: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季' },
  { value: 'year', label: '年' },
];

export function GanttViewToggle({ value, onChange }: GanttViewToggleProps) {
  return (
    <div className="flex items-center bg-background-secondary rounded-lg p-1" role="radiogroup">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            min-h-[36px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
            ${
              value === option.value
                ? 'bg-accent-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }
          `}
          role="radio"
          aria-checked={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
