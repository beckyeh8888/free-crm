'use client';

/**
 * ReportKPI - KPI number card with label, value, and trend arrow
 */

interface ReportKPIProps {
  readonly label: string;
  readonly value: string;
  readonly trend?: number; // Positive = up, negative = down, 0 or undefined = neutral
  readonly trendLabel?: string;
}

export function ReportKPI({ label, value, trend, trendLabel }: ReportKPIProps) {
  const trendColor =
    trend && trend > 0
      ? 'text-[#22c55e]'
      : trend && trend < 0
        ? 'text-[#ef4444]'
        : 'text-[#a0a0a0]';

  const trendArrow =
    trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '';

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 min-h-[100px] flex flex-col justify-between">
      <span className="text-xs text-[#a0a0a0] font-medium">{label}</span>
      <div className="mt-2">
        <span className="text-2xl font-bold text-[#fafafa]">{value}</span>
        {trend !== undefined && (
          <span className={`ml-2 text-xs font-medium ${trendColor}`}>
            {trendArrow} {Math.abs(trend)}%
            {trendLabel ? ` ${trendLabel}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
