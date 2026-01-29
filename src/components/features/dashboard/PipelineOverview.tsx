'use client';

/**
 * PipelineOverview - Shows deal pipeline stage distribution
 * Matches Pencil Dashboard design
 */

import { pipelineColors, pipelineLabels } from '@/lib/design-tokens';

interface PipelineStage {
  readonly stage: string;
  readonly count: number;
  readonly value: number;
}

interface PipelineOverviewProps {
  readonly stages: readonly PipelineStage[];
}

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export function PipelineOverview({ stages }: PipelineOverviewProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const orderedStages = stageOrder
    .map((key) => stages.find((s) => s.stage === key))
    .filter((s): s is PipelineStage => s !== undefined);

  return (
    <section className="bg-background-tertiary border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Pipeline 概覽</h2>
      <div className="space-y-3">
        {orderedStages.map((stage) => {
          const color = pipelineColors[stage.stage as keyof typeof pipelineColors] || '#666666';
          const label = pipelineLabels[stage.stage] || stage.stage;
          const widthPercent = Math.max((stage.count / maxCount) * 100, 8);

          return (
            <div key={stage.stage} className="flex items-center gap-3">
              <span className="w-16 text-xs text-text-secondary truncate">{label}</span>
              <div className="flex-1 h-6 bg-background-hover rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center px-2"
                  style={{ width: `${widthPercent}%`, backgroundColor: color }}
                >
                  <span className="text-xs font-medium text-white">{stage.count}</span>
                </div>
              </div>
              <span className="w-20 text-xs text-text-muted text-right">
                {formatCurrency(stage.value)}
              </span>
            </div>
          );
        })}
        {orderedStages.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">尚無商機資料</p>
        )}
      </div>
    </section>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `NT$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `NT$${(value / 1000).toFixed(0)}K`;
  }
  return `NT$${value}`;
}
