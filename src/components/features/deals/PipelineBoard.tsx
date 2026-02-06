'use client';

/**
 * PipelineBoard - Kanban-style pipeline board for deals
 * Matches Pencil Deals Desktop design
 */

import type { Deal } from '@/hooks/useDeals';
import { DealCard } from './DealCard';
import { pipelineColors, pipelineLabels } from '@/lib/design-tokens';

interface PipelineBoardProps {
  readonly deals: readonly Deal[];
  readonly onDealClick?: (dealId: string) => void;
}

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export function PipelineBoard({ deals, onDealClick }: PipelineBoardProps) {
  // Group deals by stage
  const stageGroups: Record<string, Deal[]> = {};
  for (const stage of stageOrder) {
    stageGroups[stage] = [];
  }
  for (const deal of deals) {
    if (stageGroups[deal.stage]) {
      stageGroups[deal.stage].push(deal);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
      {stageOrder.map((stage) => {
        const color = pipelineColors[stage as keyof typeof pipelineColors] || '#666666';
        const label = pipelineLabels[stage] || stage;
        const stageDeals = stageGroups[stage] || [];

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-64 lg:flex-1 lg:min-w-[180px]"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <h3 className="text-sm font-medium text-text-primary">{label}</h3>
              <span className="text-xs text-text-muted ml-auto">
                {stageDeals.length}
              </span>
            </div>

            {/* Color bar */}
            <div
              className="h-0.5 rounded-full mb-3"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />

            {/* Cards */}
            <div className="space-y-2">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={onDealClick ? () => onDealClick(deal.id) : undefined} />
              ))}
              {stageDeals.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-text-muted">無商機</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
