'use client';

/**
 * Deals Page - Calm CRM Dark Theme
 * Pipeline board + List view
 * WCAG 2.2 AAA Compliant
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List, Search, UserCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useDeals, useCreateDeal, useUpdateDeal, type Deal } from '@/hooks/useDeals';
import { PipelineBoard } from '@/components/features/deals/PipelineBoard';
import { DealCard } from '@/components/features/deals/DealCard';
import { DealForm, type DealFormData } from '@/components/features/deals/DealForm';
import { DealDetailDrawer } from '@/components/features/deals/DealDetailDrawer';

type ViewMode = 'pipeline' | 'list';

export default function DealsPage() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');
  const { data: session } = useSession();

  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [showForm, setShowForm] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [myDealsOnly, setMyDealsOnly] = useState(false);

  // Auto-open detail drawer from URL ?id= param — syncing external URL state into React
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (urlId && !selectedDealId) {
      setSelectedDealId(urlId);
    }
  }, [urlId, selectedDealId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { data, isLoading } = useDeals({ limit: 100, search: search || undefined });
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();

  // Handle drag-and-drop stage change
  const handleStageChange = (dealId: string, newStage: string) => {
    if (newStage === 'closed_lost') {
      // Open the detail drawer so the user can use the loss reason modal
      setSelectedDealId(dealId);
      return;
    }
    updateMutation.mutate({ id: dealId, stage: newStage });
  };

  // Client-side filter for "my deals" (since API doesn't filter by assignedToId yet)
  const deals = useMemo(() => {
    const allDeals = data?.data ?? [];
    if (!myDealsOnly || !session?.user?.id) return allDeals;
    return allDeals.filter(
      (d) => d.assignedToId === session.user.id || d.createdById === session.user.id
    );
  }, [data, myDealsOnly, session]);

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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="搜尋商機..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 w-full"
            aria-label="搜尋商機"
          />
        </div>
        <button
          type="button"
          onClick={() => setMyDealsOnly(!myDealsOnly)}
          className={`
            flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm transition-colors border
            ${myDealsOnly
              ? 'bg-accent-600/15 text-accent-400 border-accent-600/40'
              : 'text-text-secondary border-border hover:bg-background-hover hover:text-text-primary'
            }
          `}
          aria-pressed={myDealsOnly}
          aria-label="只顯示我的商機"
        >
          <UserCircle className="w-4 h-4" />
          <span className="hidden sm:inline">我的商機</span>
        </button>
      </div>

      {/* Content */}
      <DealsContent
        isLoading={isLoading}
        viewMode={viewMode}
        deals={deals}
        onShowForm={() => setShowForm(true)}
        onDealClick={(id) => setSelectedDealId(id)}
        onStageChange={handleStageChange}
      />

      {/* Form Modal */}
      {showForm && (
        <DealForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Deal Detail Drawer */}
      {selectedDealId && (
        <DealDetailDrawer
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
        />
      )}
    </div>
  );
}

const COL_SKELETON_KEYS = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6'] as const;

interface DealsContentProps {
  readonly isLoading: boolean;
  readonly viewMode: ViewMode;
  readonly deals: readonly Deal[];
  readonly onShowForm: () => void;
  readonly onDealClick: (dealId: string) => void;
  readonly onStageChange?: (dealId: string, newStage: string) => void;
}

function DealsContent({ isLoading, viewMode, deals, onShowForm, onDealClick, onStageChange }: DealsContentProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex gap-4">
          {COL_SKELETON_KEYS.map((key) => (
            <div key={key} className="flex-1 min-w-[180px]">
              <div className="h-6 bg-background-tertiary rounded mb-3" />
              <div className="space-y-2">
                <div className="h-20 bg-background-tertiary rounded-lg" />
                <div className="h-20 bg-background-tertiary rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'pipeline') {
    return <PipelineBoard deals={deals} onDealClick={onDealClick} onStageChange={onStageChange} />;
  }

  return (
    <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
      {deals.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {deals.map((deal) => (
            <div key={deal.id} className="p-3">
              <DealCard deal={deal} onClick={() => onDealClick(deal.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-text-muted">尚無商機資料</p>
          <button
            type="button"
            onClick={onShowForm}
            className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
          >
            新增第一筆商機
          </button>
        </div>
      )}
    </div>
  );
}
