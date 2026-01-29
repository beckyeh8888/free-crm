'use client';

/**
 * Reports Page - Calm CRM Dark Theme
 * Pipeline Funnel + Win Rate + Revenue Trend + Top Performers
 * WCAG 2.2 AAA Compliant
 */

import { useDeals } from '@/hooks/useDeals';
import { pipelineColors, pipelineLabels } from '@/lib/design-tokens';

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export default function ReportsPage() {
  const { data, isLoading } = useDeals({ limit: 200 });
  const deals = data?.data ?? [];

  // Aggregate stats
  const stageGroups: Record<string, { count: number; value: number }> = {};
  for (const stage of stageOrder) {
    stageGroups[stage] = { count: 0, value: 0 };
  }
  for (const deal of deals) {
    if (stageGroups[deal.stage]) {
      stageGroups[deal.stage].count += 1;
      stageGroups[deal.stage].value += deal.value ?? 0;
    }
  }

  const totalDeals = deals.length;
  const wonDeals = stageGroups.closed_won?.count ?? 0;
  const lostDeals = stageGroups.closed_lost?.count ?? 0;
  const closedDeals = wonDeals + lostDeals;
  const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

  const maxCount = Math.max(...Object.values(stageGroups).map((s) => s.count), 1);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`report-skeleton-${i}`} className="h-64 bg-background-tertiary border border-border rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
        >
          PDF
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
        >
          CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <section className="bg-background-tertiary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Pipeline 漏斗</h2>
          <div className="space-y-3">
            {stageOrder.map((stage) => {
              const color = pipelineColors[stage as keyof typeof pipelineColors] || '#666666';
              const label = pipelineLabels[stage] || stage;
              const stageData = stageGroups[stage];
              const widthPercent = Math.max((stageData.count / maxCount) * 100, 8);

              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-text-secondary truncate">{label}</span>
                  <div className="flex-1 h-7 bg-background-hover rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center px-2"
                      style={{ width: `${widthPercent}%`, backgroundColor: color }}
                    >
                      <span className="text-xs font-medium text-white">{stageData.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Win Rate */}
        <section className="bg-background-tertiary border border-border rounded-xl p-5 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-text-primary mb-4 self-start">勝率</h2>
          <div className="text-center">
            <p className="text-5xl font-bold text-text-primary">{winRate}%</p>
            <p className="text-sm text-text-secondary mt-2">
              成交 / 已結案
            </p>
            <p className="text-sm text-text-muted mt-1">
              {wonDeals} / {closedDeals}
            </p>
          </div>
        </section>

        {/* Revenue by Stage */}
        <section className="bg-background-tertiary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">各階段營收</h2>
          <div className="space-y-3">
            {stageOrder.map((stage) => {
              const color = pipelineColors[stage as keyof typeof pipelineColors] || '#666666';
              const label = pipelineLabels[stage] || stage;
              const stageData = stageGroups[stage];

              return (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-text-secondary">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    NT${stageData.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        <section className="bg-background-tertiary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">總覽</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">總商機數</span>
              <span className="text-sm font-medium text-text-primary">{totalDeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">進行中</span>
              <span className="text-sm font-medium text-text-primary">{totalDeals - closedDeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">已成交</span>
              <span className="text-sm font-medium text-success">{wonDeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">已失敗</span>
              <span className="text-sm font-medium text-error">{lostDeals}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">總營收</span>
              <span className="text-sm font-bold text-accent-600">
                NT${(stageGroups.closed_won?.value ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
