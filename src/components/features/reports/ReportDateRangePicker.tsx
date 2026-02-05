'use client';

/**
 * ReportDateRangePicker - Date range selection for reports
 * Presets: today, this week, this month, this quarter, this year, custom
 */

import { useState, useCallback } from 'react';

type PresetKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  readonly startDate: string;
  readonly endDate: string;
}

interface ReportDateRangePickerProps {
  readonly value: DateRange;
  readonly onChange: (range: DateRange) => void;
}

const PRESETS: readonly { readonly key: PresetKey; readonly label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
  { key: 'year', label: '今年' },
  { key: 'custom', label: '自訂' },
];

function getPresetRange(key: PresetKey): DateRange | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (key) {
    case 'today':
      return {
        startDate: new Date(year, month, now.getDate()).toISOString(),
        endDate: now.toISOString(),
      };
    case 'week': {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    case 'month':
      return {
        startDate: new Date(year, month, 1).toISOString(),
        endDate: now.toISOString(),
      };
    case 'quarter': {
      const q = Math.floor(month / 3);
      return {
        startDate: new Date(year, q * 3, 1).toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'year':
      return {
        startDate: new Date(year, 0, 1).toISOString(),
        endDate: now.toISOString(),
      };
    case 'custom':
      return null;
  }
}

export function ReportDateRangePicker({
  value,
  onChange,
}: ReportDateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetKey>('year');
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = useCallback(
    (key: PresetKey) => {
      setActivePreset(key);
      if (key === 'custom') {
        setShowCustom(true);
        return;
      }
      setShowCustom(false);
      const range = getPresetRange(key);
      if (range) {
        onChange(range);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex gap-1" role="group" aria-label="日期範圍預設">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePreset(preset.key)}
            className={`px-3 py-1.5 text-xs rounded-lg border min-h-[32px] transition-colors ${
              activePreset === preset.key
                ? 'bg-[#0070f0] border-[#0070f0] text-white'
                : 'border-[#2a2a2a] text-[#a0a0a0] hover:bg-[#262626]'
            }`}
            aria-pressed={activePreset === preset.key}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="report-start-date">
            開始日期
          </label>
          <input
            id="report-start-date"
            type="date"
            value={value.startDate.split('T')[0]}
            onChange={(e) =>
              onChange({
                ...value,
                startDate: new Date(e.target.value).toISOString(),
              })
            }
            className="px-2 py-1 text-xs rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#fafafa] min-h-[32px]"
            aria-label="報表開始日期"
          />
          <span className="text-[#666666] text-xs">~</span>
          <label className="sr-only" htmlFor="report-end-date">
            結束日期
          </label>
          <input
            id="report-end-date"
            type="date"
            value={value.endDate.split('T')[0]}
            onChange={(e) =>
              onChange({
                ...value,
                endDate: new Date(e.target.value).toISOString(),
              })
            }
            className="px-2 py-1 text-xs rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#fafafa] min-h-[32px]"
            aria-label="報表結束日期"
          />
        </div>
      )}
    </div>
  );
}
