'use client';

/**
 * Reports Page - Sprint 6
 * Interactive chart-based reports with 5 tabs:
 * Sales Pipeline / Revenue / Customer Analytics / Task Activity / Team Performance
 *
 * WCAG 2.2 AAA Compliant
 * Recharts loaded via next/dynamic (SSR: false)
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  ReportTabNavigation,
  ReportDateRangePicker,
  ReportExportButton,
  ReportKPI,
} from '@/components/features/reports';
import type { ReportTab } from '@/components/features/reports';
import {
  useSalesPipeline,
  useRevenue,
  useCustomerAnalytics,
  useTaskActivity,
  useTeamPerformance,
} from '@/hooks/useReports';
import { formatCurrency, formatPercentage } from '@/lib/report-utils';
import type {
  SalesPipelineReport,
  RevenueReport,
  CustomerAnalyticsReport,
  TaskActivityReport,
  TeamPerformanceReport,
} from '@/types/reports';

// ============================================
// Lazy-loaded chart components (no SSR)
// ============================================

const SalesPipelineChart = dynamic(
  () => import('@/components/features/reports/SalesPipelineChart').then((m) => m.SalesPipelineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const RevenueChart = dynamic(
  () => import('@/components/features/reports/RevenueChart').then((m) => m.RevenueChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const CustomerAnalyticsChart = dynamic(
  () => import('@/components/features/reports/CustomerAnalyticsChart').then((m) => m.CustomerAnalyticsChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const TaskActivityChart = dynamic(
  () => import('@/components/features/reports/TaskActivityChart').then((m) => m.TaskActivityChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const TeamPerformanceChart = dynamic(
  () => import('@/components/features/reports/TeamPerformanceChart').then((m) => m.TeamPerformanceChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// ============================================
// Skeleton
// ============================================

function ChartSkeleton() {
  return (
    <div className="h-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl animate-pulse" />
  );
}

const KPI_SKELETON_IDS = ['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4'] as const;

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {KPI_SKELETON_IDS.map((id) => (
        <div key={id} className="h-[100px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ============================================
// Tab Label Map
// ============================================

const TAB_LABELS: Record<ReportTab, string> = {
  pipeline: '銷售管線',
  revenue: '營收分析',
  customers: '客戶分析',
  tasks: '任務活動',
  team: '團隊績效',
};

// ============================================
// Page Component
// ============================================

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('pipeline');
  const now = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: now.toISOString(),
  });
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Fetch data for the active tab
  const pipelineQuery = useSalesPipeline(activeTab === 'pipeline' ? dateRange : undefined);
  const revenueQuery = useRevenue(activeTab === 'revenue' ? { ...dateRange, groupBy: 'month' } : undefined);
  const customerQuery = useCustomerAnalytics(activeTab === 'customers' ? dateRange : undefined);
  const taskQuery = useTaskActivity(activeTab === 'tasks' ? dateRange : undefined);
  const teamQuery = useTeamPerformance(activeTab === 'team' ? dateRange : undefined);

  // Export handler
  const handleExport = useCallback(async (format: 'csv' | 'json' | 'print') => {
    if (format === 'print') {
      globalThis.print();
      return;
    }

    setExportingFormat(format);
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, limit: 1000 }),
      });

      if (!response.ok) throw new Error('匯出失敗');

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      link.download = filenameMatch?.[1] ?? `report.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    } finally {
      setExportingFormat(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-[#fafafa]">報表分析</h1>
        <div className="flex items-center gap-3">
          <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
          <ReportExportButton
            onExport={handleExport}
            isExporting={exportingFormat !== null}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <ReportTabNavigation activeTab={activeTab} onChange={setActiveTab} />

      {/* Live region for tab changes */}
      <div className="sr-only" aria-live="polite" role="status">
        已切換至{TAB_LABELS[activeTab]}報表
      </div>

      {/* Report Content */}
      <div
        id={`report-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`report-tab-${activeTab}`}
      >
        {activeTab === 'pipeline' && (
          <PipelinePanel data={pipelineQuery.data?.data} isLoading={pipelineQuery.isLoading} />
        )}
        {activeTab === 'revenue' && (
          <RevenuePanel data={revenueQuery.data?.data} isLoading={revenueQuery.isLoading} />
        )}
        {activeTab === 'customers' && (
          <CustomerPanel data={customerQuery.data?.data} isLoading={customerQuery.isLoading} />
        )}
        {activeTab === 'tasks' && (
          <TaskPanel data={taskQuery.data?.data} isLoading={taskQuery.isLoading} />
        )}
        {activeTab === 'team' && (
          <TeamPanel data={teamQuery.data?.data} isLoading={teamQuery.isLoading} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Tab Panel Components
// ============================================

function PipelinePanel({
  data,
  isLoading,
}: {
  readonly data?: SalesPipelineReport | null;
  readonly isLoading: boolean;
}) {
  if (isLoading || !data) return <><KPISkeleton /><ChartSkeleton /></>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReportKPI label="總商機數" value={String(data.summary.totalDeals)} />
        <ReportKPI label="勝率" value={formatPercentage(data.summary.winRate)} />
        <ReportKPI label="總金額" value={formatCurrency(data.summary.totalValue)} />
        <ReportKPI label="平均成交天數" value={`${data.summary.avgDaysToClose} 天`} />
      </div>
      <SalesPipelineChart
        funnel={data.funnel}
        conversionRates={data.conversionRates}
        summary={data.summary}
      />
    </div>
  );
}

function RevenuePanel({
  data,
  isLoading,
}: {
  readonly data?: RevenueReport | null;
  readonly isLoading: boolean;
}) {
  if (isLoading || !data) return <><KPISkeleton /><ChartSkeleton /></>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReportKPI label="總營收" value={formatCurrency(data.summary.totalRevenue)} />
        <ReportKPI
          label="成長率"
          value={formatPercentage(Math.abs(data.summary.growthRate))}
          trend={data.summary.growthRate}
        />
        <ReportKPI label="平均成交金額" value={formatCurrency(data.summary.avgDealSize)} />
        <ReportKPI label="總失敗金額" value={formatCurrency(data.summary.totalLost)} />
      </div>
      <RevenueChart trends={data.trends} summary={data.summary} />
    </div>
  );
}

function CustomerPanel({
  data,
  isLoading,
}: {
  readonly data?: CustomerAnalyticsReport | null;
  readonly isLoading: boolean;
}) {
  if (isLoading || !data) return <><KPISkeleton /><ChartSkeleton /></>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReportKPI label="總客戶數" value={String(data.summary.totalCustomers)} />
        <ReportKPI label="活躍客戶" value={String(data.summary.activeCustomers)} />
        <ReportKPI label="新增客戶" value={String(data.summary.newCustomersThisPeriod)} />
        <ReportKPI label="平均客戶營收" value={formatCurrency(data.summary.avgRevenuePerCustomer)} />
      </div>
      <CustomerAnalyticsChart
        growth={data.growth}
        statusDistribution={data.statusDistribution}
        topCustomersByRevenue={data.topCustomersByRevenue}
        summary={data.summary}
      />
    </div>
  );
}

function TaskPanel({
  data,
  isLoading,
}: {
  readonly data?: TaskActivityReport | null;
  readonly isLoading: boolean;
}) {
  if (isLoading || !data) return <><KPISkeleton /><ChartSkeleton /></>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReportKPI label="總任務數" value={String(data.summary.totalTasks)} />
        <ReportKPI label="完成率" value={formatPercentage(data.summary.completionRate)} />
        <ReportKPI label="逾期任務" value={String(data.summary.overdueTasks)} />
        <ReportKPI label="平均完成天數" value={`${data.summary.avgCompletionDays} 天`} />
      </div>
      <TaskActivityChart
        completionTrend={data.completionTrend}
        statusDistribution={data.statusDistribution}
        priorityDistribution={data.priorityDistribution}
        typeDistribution={data.typeDistribution}
        summary={data.summary}
      />
    </div>
  );
}

function TeamPanel({
  data,
  isLoading,
}: {
  readonly data?: TeamPerformanceReport | null;
  readonly isLoading: boolean;
}) {
  if (isLoading || !data) return <><KPISkeleton /><ChartSkeleton /></>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReportKPI label="團隊人數" value={String(data.summary.totalMembers)} />
        <ReportKPI label="總營收" value={formatCurrency(data.summary.totalRevenue)} />
        <ReportKPI label="平均勝率" value={formatPercentage(data.summary.avgWinRate)} />
        <ReportKPI label="最佳成員" value={data.summary.topPerformer ?? '-'} />
      </div>
      <TeamPerformanceChart members={data.members} summary={data.summary} />
    </div>
  );
}
