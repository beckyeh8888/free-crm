'use client';

/**
 * TaskActivityChart - BarChart completion trend + PieChart status distribution
 */

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
import { formatPeriodLabel } from '@/lib/report-utils';
import type {
  TaskCompletionItem,
  TaskDistributionItem,
  TaskSummary,
} from '@/types/reports';

interface TaskActivityChartProps {
  readonly completionTrend: readonly TaskCompletionItem[];
  readonly statusDistribution: readonly TaskDistributionItem[];
  readonly priorityDistribution: readonly TaskDistributionItem[];
  readonly typeDistribution: readonly TaskDistributionItem[];
  readonly summary: TaskSummary;
}

export function TaskActivityChart({
  completionTrend,
  statusDistribution,
  priorityDistribution,
  summary,
}: TaskActivityChartProps) {
  // Completion trend data
  const trendData = completionTrend.map((item) => ({
    period: item.period,
    name: formatPeriodLabel(item.period),
    已完成: item.completed,
    已建立: item.created,
  }));

  const trendTableData = trendData.map((row) => ({
    期間: row.name,
    已完成: row['已完成'],
    已建立: row['已建立'],
  }));

  return (
    <div className="space-y-4">
      {/* Completion Trend */}
      <ReportCard title="任務完成趨勢">
        <AccessibleChart
          title="任務完成趨勢"
          description={`完成率 ${summary.completionRate}%`}
          columns={['期間', '已完成', '已建立']}
          data={trendTableData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid
                stroke={chartTheme.grid.stroke}
                strokeDasharray={chartTheme.grid.strokeDasharray}
              />
              <XAxis dataKey="name" {...chartTheme.axis} interval="preserveStartEnd" />
              <YAxis {...chartTheme.axis} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Legend wrapperStyle={chartTheme.legend} />
              <Bar dataKey="已建立" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="已完成" fill={chartColors.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </ReportCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <ReportCard title="狀態分佈">
          <AccessibleChart
            title="任務狀態分佈"
            columns={['狀態', '數量']}
            data={statusDistribution.map((d) => ({ '狀態': d.label, '數量': d.value }))}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusDistribution.map((d) => ({ name: d.label, value: d.value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution.map((_, i) => (
                    <Cell key={`status-${i}`} fill={chartColors.series[i % chartColors.series.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={chartTheme.legend} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChart>
        </ReportCard>

        {/* Priority Distribution */}
        <ReportCard title="優先級分佈">
          <AccessibleChart
            title="任務優先級分佈"
            columns={['優先級', '數量']}
            data={priorityDistribution.map((d) => ({ '優先級': d.label, '數量': d.value }))}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={priorityDistribution.map((d) => ({ name: d.label, value: d.value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityDistribution.map((_, i) => (
                    <Cell key={`priority-${i}`} fill={chartColors.series[i % chartColors.series.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={chartTheme.legend} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChart>
        </ReportCard>
      </div>
    </div>
  );
}
