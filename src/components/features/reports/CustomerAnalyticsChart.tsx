'use client';

/**
 * CustomerAnalyticsChart - LineChart growth + PieChart status distribution
 */

import {
  LineChart,
  Line,
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
import { formatPeriodLabel, formatCurrency } from '@/lib/report-utils';
import { statusColors } from '@/lib/design-tokens';
import type {
  CustomerGrowthItem,
  CustomerStatusItem,
  TopCustomerItem,
  CustomerSummary,
} from '@/types/reports';

const STATUS_LABELS: Record<string, string> = {
  active: '活躍',
  inactive: '非活躍',
  lead: '潛在客戶',
};

interface CustomerAnalyticsChartProps {
  readonly growth: readonly CustomerGrowthItem[];
  readonly statusDistribution: readonly CustomerStatusItem[];
  readonly topCustomersByRevenue: readonly TopCustomerItem[];
  readonly summary: CustomerSummary;
}

export function CustomerAnalyticsChart({
  growth,
  statusDistribution,
  topCustomersByRevenue,
  summary,
}: CustomerAnalyticsChartProps) {
  // Growth chart data
  const growthData = growth.map((item) => ({
    period: item.period,
    name: formatPeriodLabel(item.period),
    新客戶: item.newCustomers,
    累計: item.totalCustomers,
  }));

  const growthTableData = growthData.map((row) => ({
    期間: row.name,
    新客戶: row['新客戶'],
    累計: row['累計'],
  }));

  // Pie chart data
  const pieData = statusDistribution.map((item) => ({
    name: STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
    fill: statusColors[item.status as keyof typeof statusColors] ?? '#666',
  }));

  return (
    <div className="space-y-4">
      {/* Growth Trend */}
      <ReportCard title="客戶成長趨勢">
        <AccessibleChart
          title="客戶成長趨勢"
          description={`共 ${summary.totalCustomers} 位客戶`}
          columns={['期間', '新客戶', '累計']}
          data={growthTableData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid
                stroke={chartTheme.grid.stroke}
                strokeDasharray={chartTheme.grid.strokeDasharray}
              />
              <XAxis dataKey="name" {...chartTheme.axis} interval="preserveStartEnd" />
              <YAxis {...chartTheme.axis} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Legend wrapperStyle={chartTheme.legend} />
              <Line
                type="monotone"
                dataKey="累計"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="新客戶"
                stroke={chartColors.success}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </ReportCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <ReportCard title="客戶狀態分佈">
          <AccessibleChart
            title="客戶狀態分佈"
            columns={['狀態', '數量']}
            data={pieData.map((d) => ({ '狀態': d.name, '數量': d.value }))}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={chartTheme.legend} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChart>
        </ReportCard>

        {/* Top Customers */}
        <ReportCard title="營收 Top 10 客戶">
          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table className="w-full text-sm" aria-label="營收排名前十客戶">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th scope="col" className="text-left px-2 py-1.5 text-[#a0a0a0] font-medium text-xs">#</th>
                  <th scope="col" className="text-left px-2 py-1.5 text-[#a0a0a0] font-medium text-xs">客戶</th>
                  <th scope="col" className="text-right px-2 py-1.5 text-[#a0a0a0] font-medium text-xs">營收</th>
                  <th scope="col" className="text-right px-2 py-1.5 text-[#a0a0a0] font-medium text-xs">成交數</th>
                </tr>
              </thead>
              <tbody>
                {topCustomersByRevenue.map((customer, i) => (
                  <tr key={customer.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="px-2 py-1.5 text-[#666666] text-xs">{i + 1}</td>
                    <td className="px-2 py-1.5 text-[#fafafa] text-xs truncate max-w-[120px]">
                      {customer.name}
                    </td>
                    <td className="px-2 py-1.5 text-right text-[#fafafa] text-xs font-medium">
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-[#a0a0a0] text-xs">
                      {customer.dealCount}
                    </td>
                  </tr>
                ))}
                {topCustomersByRevenue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center text-[#666666] text-xs">
                      尚無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
