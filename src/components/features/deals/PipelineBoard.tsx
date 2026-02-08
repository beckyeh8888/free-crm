'use client';

/**
 * PipelineBoard - Kanban-style pipeline board for deals with drag-and-drop
 * Matches Pencil Deals Desktop design
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Deal } from '@/hooks/useDeals';
import { DealCard } from './DealCard';
import { pipelineColors, pipelineLabels } from '@/lib/design-tokens';

interface PipelineBoardProps {
  readonly deals: readonly Deal[];
  readonly onDealClick?: (dealId: string) => void;
  readonly onStageChange?: (dealId: string, newStage: string) => void;
}

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

function formatStageValue(deals: readonly Deal[]): string {
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  if (total === 0) return '-';
  if (total >= 1000000) return `NT$${(total / 1000000).toFixed(1)}M`;
  if (total >= 1000) return `NT$${(total / 1000).toFixed(0)}K`;
  return `NT$${total.toLocaleString()}`;
}

export function PipelineBoard({ deals, onDealClick, onStageChange }: PipelineBoardProps) {
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

  const activeDeal = activeDealId ? deals.find((d) => d.id === activeDealId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDealId(null);
    const { active, over } = event;
    if (!over || !onStageChange) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const currentDeal = deals.find((d) => d.id === dealId);
    if (!currentDeal || currentDeal.stage === newStage) return;

    onStageChange(dealId, newStage);
  }, [deals, onStageChange]);

  const handleDragCancel = useCallback(() => {
    setActiveDealId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        {stageOrder.map((stage) => {
          const stageDeals = stageGroups[stage] || [];

          return (
            <StageColumn
              key={stage}
              stage={stage}
              deals={stageDeals}
              onDealClick={onDealClick}
              isDragActive={activeDealId !== null}
              activeDealStage={activeDeal?.stage}
            />
          );
        })}
      </div>

      {/* Drag Overlay — renders the card being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeDeal ? (
          <div className="opacity-90 rotate-2 scale-105">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================
// StageColumn (droppable)
// ============================================

interface StageColumnProps {
  readonly stage: string;
  readonly deals: readonly Deal[];
  readonly onDealClick?: (dealId: string) => void;
  readonly isDragActive: boolean;
  readonly activeDealStage?: string;
}

function StageColumn({ stage, deals, onDealClick, isDragActive, activeDealStage }: StageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  const color = pipelineColors[stage as keyof typeof pipelineColors] || '#666666';
  const label = pipelineLabels[stage] || stage;
  const isValidTarget = isDragActive && activeDealStage !== stage;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-64 lg:flex-1 lg:min-w-[180px] rounded-lg transition-colors
        ${isOver ? 'bg-accent-600/10 ring-2 ring-accent-600/30' : ''}
        ${isValidTarget && !isOver ? 'bg-background-hover/30' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-medium text-text-primary">{label}</h3>
        <span className="text-xs text-text-muted ml-auto">
          {deals.length}
        </span>
      </div>
      {/* Column Summary */}
      <p className="text-xs text-text-muted mb-3 pl-4">
        {formatStageValue(deals)}
      </p>

      {/* Color bar */}
      <div
        className="h-0.5 rounded-full mb-3"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      {/* Cards */}
      <div className="space-y-2 min-h-[60px]">
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
            onClick={onDealClick ? () => onDealClick(deal.id) : undefined}
          />
        ))}
        {deals.length === 0 && !isOver && (
          <div className="py-8 text-center">
            <p className="text-xs text-text-muted">無商機</p>
          </div>
        )}
        {isOver && (
          <div className="py-4 text-center border-2 border-dashed border-accent-600/40 rounded-lg">
            <p className="text-xs text-accent-400">放到這裡</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// DraggableDealCard
// ============================================

interface DraggableDealCardProps {
  readonly deal: Deal;
  readonly onClick?: () => void;
}

function DraggableDealCard({ deal, onClick }: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <DealCard deal={deal} onClick={onClick} />
    </div>
  );
}
