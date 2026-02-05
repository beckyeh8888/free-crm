'use client';

/**
 * TeamPerformanceChart - BarChart team revenue + ranking table
 */

import {
  BarChart,
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
import { formatCurrency, formatCompactNumber } from '@/lib/report-utils';
import type { TeamMemberPerformance, TeamSummary } from '@/types/reports';

interface TeamPerformanceChartProps {
  readonly members: readonly TeamMemberPerformance[];
  readonly summary: TeamSummary;
}

/** Format XAxis tick values */
export function teamXAxisFormatter(v: number): string {
  return formatCompactNumber(v);
}

/** Format Tooltip values */
export function teamTooltipFormatter(val: unknown, name: unknown): [string, string] | [number, string] {
  const v = Number(val ?? 0);
  if (name === '營收') return [formatCurrency(v), String(name)];
  return [v, String(name)];
}

export function TeamPerformanceChart({
  members,
  summary,
}: TeamPerformanceChartProps) {
  const chartData = members.map((m) => ({
    name: m.name,
    營收: m.metrics.revenue,
    商機數: m.metrics.deals,
    勝率: m.metrics.winRate,
  }));

  const tableData = chartData.map((row) => ({
    成員: row.name,
    營收: formatCurrency(row['營收']),
    商機數: row['商機數'],
    勝率: `${row['勝率']}%`,
  }));

  return (
    <div className="space-y-4">
      {/* Revenue Bar Chart */}
      <ReportCard title="團隊營收比較">
        <AccessibleChart
          title="團隊營收比較圖"
          description={`共 ${summary.totalMembers} 位成員，總營收 ${formatCurrency(summary.totalRevenue)}`}
          columns={['成員', '營收', '商機數', '勝率']}
          data={tableData}
        >
          <ResponsiveContainer width="100%" height={Math.max(280, members.length * 50)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid
                stroke={chartTheme.grid.stroke}
                strokeDasharray={chartTheme.grid.strokeDasharray}
                horizontal={false}
              />
              <XAxis
                type="number"
                {...chartTheme.axis}
                tickFormatter={teamXAxisFormatter}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                {...chartTheme.axis}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                formatter={teamTooltipFormatter}
              />
              <Legend wrapperStyle={chartTheme.legend} />
              <Bar dataKey="營收" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </ReportCard>

      {/* Detailed Rankings Table */}
      <ReportCard title="成員排名">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="團隊成員績效排名">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th scope="col" className="text-left px-3 py-2 text-[#a0a0a0] font-medium">#</th>
                <th scope="col" className="text-left px-3 py-2 text-[#a0a0a0] font-medium">成員</th>
                <th scope="col" className="text-right px-3 py-2 text-[#a0a0a0] font-medium">營收</th>
                <th scope="col" className="text-right px-3 py-2 text-[#a0a0a0] font-medium">商機</th>
                <th scope="col" className="text-right px-3 py-2 text-[#a0a0a0] font-medium">勝率</th>
                <th scope="col" className="text-right px-3 py-2 text-[#a0a0a0] font-medium">任務</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <tr key={member.userId} className="border-b border-[#2a2a2a] last:border-0">
                  <td className="px-3 py-2 text-[#666666]">{i + 1}</td>
                  <td className="px-3 py-2 text-[#fafafa]">{member.name}</td>
                  <td className="px-3 py-2 text-right text-[#fafafa] font-medium">
                    {formatCurrency(member.metrics.revenue)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#a0a0a0]">
                    {member.metrics.wonDeals}/{member.metrics.deals}
                  </td>
                  <td className="px-3 py-2 text-right text-[#a0a0a0]">
                    {member.metrics.winRate}%
                  </td>
                  <td className="px-3 py-2 text-right text-[#a0a0a0]">
                    {member.metrics.completedTasks}/{member.metrics.tasks}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-[#666666]">
                    尚無資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportCard>
    </div>
  );
}
