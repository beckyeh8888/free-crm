'use client';

/**
 * Dashboard Page - Calm CRM Dark Theme
 * WCAG 2.2 AAA Compliant
 */

import { Users, Handshake, FileText, DollarSign } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/features/dashboard/StatCard';
import { PipelineOverview } from '@/components/features/dashboard/PipelineOverview';
import { RecentActivity } from '@/components/features/dashboard/RecentActivity';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `NT$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `NT$${(value / 1000).toFixed(0)}K`;
  }
  return `NT$${value}`;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">無法載入儀表板資料</p>
      </div>
    );
  }

  const stats = data?.data;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">統計數據</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="客戶總數"
            value={stats?.customerCount ?? 0}
            icon={Users}
          />
          <StatCard
            label="進行中商機"
            value={stats?.dealCount ?? 0}
            icon={Handshake}
          />
          <StatCard
            label="文件數量"
            value={stats?.documentCount ?? 0}
            icon={FileText}
          />
          <StatCard
            label="總營收"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            icon={DollarSign}
          />
        </div>
      </section>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineOverview stages={stats?.pipelineStages ?? []} />
        <RecentActivity activities={stats?.recentActivity ?? []} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-skeleton-${i}`} className="h-24 bg-background-tertiary border border-border rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-background-tertiary border border-border rounded-xl" />
        <div className="h-64 bg-background-tertiary border border-border rounded-xl" />
      </div>
    </div>
  );
}
