'use client';

/**
 * RevenueChart - ComposedChart with Area (won) + Bar (lost)
 */

import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AccessibleChart } from './AccessibleChart';
import { ReportCard } from './ReportCard';
import { chartTheme, chartColors } from './ChartTheme';
import { formatPeriodLabel, formatCurrency, formatCompactNumber } from '@/lib/report-utils';
import type { RevenueTrendItem, RevenueSummary } from '@/types/reports';

interface RevenueChartProps {
  readonly trends: readonly RevenueTrendItem[];
  readonly summary: RevenueSummary;
}

/** Format YAxis tick values */
export function revenueYAxisFormatter(v: number): string {
  return formatCompactNumber(v);
}

/** Format Tooltip values */
export function revenueTooltipFormatter(val: unknown, name: unknown): [string, string] {
  return [formatCurrency(Number(val ?? 0)), String(name)];
}

/** Format Tooltip label */
export function revenueTooltipLabelFormatter(label: unknown): string {
  return String(label);
}

export function RevenueChart({ trends, summary }: RevenueChartProps) {
  const chartData = trends.map((item) => ({
    period: item.period,
    name: formatPeriodLabel(item.period),
    成交額: item.wonValue,
    失敗額: item.lostValue,
    商機數: item.dealCount,
  }));

  const tableData = chartData.map((row) => ({
    期間: row.name,
    成交額: formatCurrency(row['成交額']),
    失敗額: formatCurrency(row['失敗額']),
    商機數: row['商機數'],
  }));

  return (
    <ReportCard title="營收趨勢">
      <AccessibleChart
        title="營收趨勢圖"
        description={`總營收 ${formatCurrency(summary.totalRevenue)}，成長率 ${summary.growthRate}%`}
        columns={['期間', '成交額', '失敗額', '商機數']}
        data={tableData}
      >
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid
              stroke={chartTheme.grid.stroke}
              strokeDasharray={chartTheme.grid.strokeDasharray}
            />
            <XAxis
              dataKey="name"
              {...chartTheme.axis}
              interval="preserveStartEnd"
            />
            <YAxis
              {...chartTheme.axis}
              tickFormatter={revenueYAxisFormatter}
            />
            <Tooltip
              contentStyle={chartTheme.tooltip}
              formatter={revenueTooltipFormatter}
              labelFormatter={revenueTooltipLabelFormatter}
            />
            <Legend wrapperStyle={chartTheme.legend} />
            <Area
              type="monotone"
              dataKey="成交額"
              fill={chartColors.success}
              fillOpacity={0.15}
              stroke={chartColors.success}
              strokeWidth={2}
            />
            <Bar
              dataKey="失敗額"
              fill={chartColors.error}
              fillOpacity={0.6}
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </AccessibleChart>
    </ReportCard>
  );
}
