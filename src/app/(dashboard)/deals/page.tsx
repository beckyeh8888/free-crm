'use client';

/**
 * Deals Page - Calm CRM Dark Theme
 * Pipeline board + List view
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useDeals, useCreateDeal } from '@/hooks/useDeals';
import { PipelineBoard } from '@/components/features/deals/PipelineBoard';
import { DealCard } from '@/components/features/deals/DealCard';
import { DealForm, type DealFormData } from '@/components/features/deals/DealForm';

type ViewMode = 'pipeline' | 'list';

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useDeals({ limit: 100 });
  const createMutation = useCreateDeal();

  const deals = data?.data ?? [];

  const handleCreate = (formData: DealFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-background-tertiary border border-border rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('pipeline')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors min-h-[36px]
              ${viewMode === 'pipeline' ? 'bg-accent-600 text-white' : 'text-text-secondary hover:text-text-primary'}
            `}
            aria-label="Pipeline 視圖"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors min-h-[36px]
              ${viewMode === 'list' ? 'bg-accent-600 text-white' : 'text-text-secondary hover:text-text-primary'}
            `}
            aria-label="列表視圖"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">列表</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增商機</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`col-skeleton-${i}`} className="flex-1 min-w-[180px]">
                <div className="h-6 bg-background-tertiary rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-20 bg-background-tertiary rounded-lg" />
                  <div className="h-20 bg-background-tertiary rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'pipeline' ? (
        <PipelineBoard deals={deals} />
      ) : (
        <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
          {deals.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {deals.map((deal) => (
                <div key={deal.id} className="p-3">
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-text-muted">尚無商機資料</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
              >
                新增第一筆商機
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <DealForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}
    </div>
  );
}
