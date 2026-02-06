'use client';

/**
 * DealDetailDrawer - Slide-in drawer for deal details with edit/delete
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import {
  X,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  User,
  FileText,
} from 'lucide-react';
import { DealForm, type DealFormData } from './DealForm';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  useDeal,
  useUpdateDeal,
  useDeleteDeal,
  type Deal,
} from '@/hooks/useDeals';
import { pipelineColors, pipelineLabels } from '@/lib/design-tokens';

// ============================================
// Types
// ============================================

interface DealDetailDrawerProps {
  readonly dealId: string;
  readonly onClose: () => void;
}

type DrawerState =
  | { type: 'view' }
  | { type: 'edit' }
  | { type: 'delete' };

// ============================================
// Constants
// ============================================

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;

// ============================================
// Helpers
// ============================================

function formatValue(value: number | null, currency: string): string {
  if (value == null) return '-';
  const prefix = currency === 'TWD' ? 'NT$' : currency;
  return `${prefix} ${value.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-TW');
}

// ============================================
// Component
// ============================================

export function DealDetailDrawer({ dealId, onClose }: DealDetailDrawerProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>({ type: 'view' });

  // Fetch latest deal data
  const { data: dealData, isLoading } = useDeal(dealId);
  const deal = dealData?.data;

  // Mutations
  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();

  // Handlers
  const handleUpdate = (formData: DealFormData) => {
    updateMutation.mutate(
      { id: dealId, ...formData },
      {
        onSuccess: () => setDrawerState({ type: 'view' }),
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(dealId, {
      onSuccess: () => onClose(),
    });
  };

  const stageLabel = deal ? (pipelineLabels[deal.stage] ?? deal.stage) : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <dialog
        open
        className="
          fixed right-0 top-0 h-full w-full max-w-lg m-0
          bg-background border-l border-border
          z-50 flex flex-col
          animate-slide-in-right
        "
        aria-label={deal ? `${deal.title} 的詳細資訊` : '商機詳細資訊'}
      >
        {isLoading || !deal ? (
          <DrawerSkeleton onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {deal.title}
                </h2>
                <span className="text-xs text-text-muted">{stageLabel}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="
                  w-10 h-10 flex items-center justify-center rounded-lg
                  text-text-muted hover:text-text-primary hover:bg-background-hover
                  transition-colors ml-2
                "
                aria-label="關閉面板"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Action Bar */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => setDrawerState({ type: 'edit' })}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  border border-border text-text-secondary
                  hover:bg-background-hover transition-colors
                  min-h-[44px]
                "
              >
                <Pencil className="w-4 h-4" />
                <span>編輯</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerState({ type: 'delete' })}
                className="
                  w-11 flex items-center justify-center
                  px-2 py-2.5 rounded-lg
                  border border-error/30 text-error
                  hover:bg-error/10 transition-colors
                  min-h-[44px]
                "
                aria-label="刪除商機"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Value Display */}
              <section aria-label="商機金額">
                <p className="text-2xl font-bold text-accent-600">
                  {formatValue(deal.value, deal.currency)}
                </p>
              </section>

              {/* Stage Progress */}
              <section aria-label="階段進度">
                <h3 className="text-sm font-medium text-text-muted mb-3">階段進度</h3>
                <StageProgress currentStage={deal.stage} />
              </section>

              {/* Deal Info */}
              <section aria-label="商機資訊">
                <h3 className="text-sm font-medium text-text-muted mb-3">商機資訊</h3>
                <div className="space-y-3">
                  <InfoRow
                    icon={<Percent className="w-4 h-4" />}
                    label="成交機率"
                    value={`${deal.probability}%`}
                  />
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="預計成交日"
                    value={formatDate(deal.closeDate)}
                  />
                  <InfoRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="幣別"
                    value={deal.currency}
                  />
                  <InfoRow
                    icon={<User className="w-4 h-4" />}
                    label="客戶"
                    value={deal.customer?.name ?? '-'}
                  />
                </div>
              </section>

              {/* Notes */}
              {deal.notes && (
                <section aria-label="備註">
                  <h3 className="text-sm font-medium text-text-muted mb-3">備註</h3>
                  <div className="bg-background-hover/50 rounded-lg p-3">
                    <div className="flex gap-2">
                      <FileText className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{deal.notes}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section aria-label="其他資訊">
                <h3 className="text-sm font-medium text-text-muted mb-3">其他資訊</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">建立時間</span>
                    <span className="text-text-secondary">{formatDate(deal.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">更新時間</span>
                    <span className="text-text-secondary">{formatDate(deal.updatedAt)}</span>
                  </div>
                  {deal.closedAt && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">結案時間</span>
                      <span className="text-text-secondary">{formatDate(deal.closedAt)}</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </dialog>

      {/* Edit Modal */}
      {drawerState.type === 'edit' && deal && (
        <DealForm
          deal={deal}
          onSubmit={handleUpdate}
          onClose={() => setDrawerState({ type: 'view' })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {drawerState.type === 'delete' && deal && (
        <DeleteConfirmModal
          entityType="商機"
          entityName={deal.title}
          onConfirm={handleDelete}
          onCancel={() => setDrawerState({ type: 'view' })}
          isDeleting={deleteMutation.isPending}
          warningMessage="刪除商機後將無法恢復。"
        />
      )}
    </>
  );
}

// ============================================
// StageProgress
// ============================================

interface StageProgressProps {
  readonly currentStage: string;
}

function StageProgress({ currentStage }: StageProgressProps) {
  const currentIndex = stageOrder.indexOf(currentStage as typeof stageOrder[number]);

  return (
    <div className="flex gap-1">
      {stageOrder.map((stage, index) => {
        const color = pipelineColors[stage];
        const label = pipelineLabels[stage] ?? stage;
        const isActive = index <= currentIndex;

        return (
          <div key={stage} className="flex-1 min-w-0">
            <div
              className="h-2 rounded-full transition-colors"
              style={{ backgroundColor: isActive ? color : '#2a2a2a' }}
              title={label}
              aria-hidden="true"
            />
            <p
              className={`text-[10px] mt-1 truncate text-center ${
                index === currentIndex ? 'text-text-primary font-medium' : 'text-text-muted'
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// InfoRow
// ============================================

interface InfoRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================
// DrawerSkeleton
// ============================================

interface DrawerSkeletonProps {
  readonly onClose: () => void;
}

function DrawerSkeleton({ onClose }: DrawerSkeletonProps) {
  return (
    <>
      <header className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
        <div className="animate-pulse flex-1">
          <div className="h-5 w-40 bg-background-hover rounded" />
          <div className="h-3 w-20 bg-background-hover rounded mt-1" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary"
          aria-label="關閉面板"
        >
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="animate-pulse p-4 space-y-4">
        <div className="h-8 w-48 bg-background-hover rounded" />
        <div className="h-2 bg-background-hover rounded-full" />
        <div className="space-y-3">
          <div className="h-10 bg-background-hover rounded" />
          <div className="h-10 bg-background-hover rounded" />
          <div className="h-10 bg-background-hover rounded" />
        </div>
      </div>
    </>
  );
}
