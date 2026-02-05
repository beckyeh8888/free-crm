'use client';

/**
 * SalesPipelineChart - BarChart funnel + conversion rate table
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AccessibleChart } from './AccessibleChart';
import { ReportCard } from './ReportCard';
import { chartTheme } from './ChartTheme';
import { pipelineLabels, pipelineColors } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/report-utils';
import type {
  PipelineFunnelItem,
  PipelineConversionRate,
  SalesPipelineSummary,
} from '@/types/reports';

interface SalesPipelineChartProps {
  readonly funnel: readonly PipelineFunnelItem[];
  readonly conversionRates: readonly PipelineConversionRate[];
  readonly summary: SalesPipelineSummary;
}

/** Format Tooltip values */
export function pipelineTooltipFormatter(val: unknown): [unknown, string] {
  return [val ?? 0, '商機數'];
}

export function SalesPipelineChart({
  funnel,
  conversionRates,
  summary,
}: SalesPipelineChartProps) {
  const chartData = funnel.map((item) => ({
    stage: item.stage,
    name: pipelineLabels[item.stage] ?? item.stage,
    count: item.count,
    value: item.value,
  }));

  const tableData = chartData.map((row) => ({
    階段: row.name,
    數量: row.count,
    金額: formatCurrency(row.value),
  }));

  return (
    <div className="space-y-4">
      <ReportCard title="Pipeline 漏斗">
        <AccessibleChart
          title="銷售管線漏斗圖"
          description={`共 ${summary.totalDeals} 筆商機，勝率 ${summary.winRate}%`}
          columns={['階段', '數量', '金額']}
          data={tableData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid
                stroke={chartTheme.grid.stroke}
                strokeDasharray={chartTheme.grid.strokeDasharray}
                horizontal={false}
              />
              <XAxis type="number" {...chartTheme.axis} />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                {...chartTheme.axis}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                formatter={pipelineTooltipFormatter}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.stage}
                    fill={pipelineColors[entry.stage as keyof typeof pipelineColors] ?? '#666'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </ReportCard>

      {/* Conversion Rates Table */}
      <ReportCard title="轉換率">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="階段轉換率">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th scope="col" className="text-left px-3 py-2 text-[#a0a0a0] font-medium">從</th>
                <th scope="col" className="text-left px-3 py-2 text-[#a0a0a0] font-medium">到</th>
                <th scope="col" className="text-right px-3 py-2 text-[#a0a0a0] font-medium">轉換率</th>
              </tr>
            </thead>
            <tbody>
              {conversionRates.map((rate) => (
                <tr key={`${rate.from}-${rate.to}`} className="border-b border-[#2a2a2a] last:border-0">
                  <td className="px-3 py-2 text-[#fafafa]">{pipelineLabels[rate.from] ?? rate.from}</td>
                  <td className="px-3 py-2 text-[#fafafa]">{pipelineLabels[rate.to] ?? rate.to}</td>
                  <td className="px-3 py-2 text-right text-[#fafafa] font-medium">{rate.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>
    </div>
  );
}
