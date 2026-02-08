'use client';

/**
 * DealDetailDrawer - Slide-in drawer for deal details with edit/delete
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { DealForm, type DealFormData } from './DealForm';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  useDeal,
  useUpdateDeal,
  useDeleteDeal,
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
  | { type: 'delete' }
  | { type: 'loss_reason' };

// ============================================
// Constants
// ============================================

const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;

const lossReasons = [
  { key: 'price', label: '價格因素' },
  { key: 'competition', label: '競爭對手' },
  { key: 'timing', label: '時機不對' },
  { key: 'need', label: '需求消失' },
  { key: 'budget', label: '預算不足' },
  { key: 'other', label: '其他原因' },
] as const;

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
  const router = useRouter();
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

              {/* Stage Progress — clickable to change stage */}
              <section aria-label="階段進度">
                <h3 className="text-sm font-medium text-text-muted mb-3">階段進度</h3>
                <StageProgress
                  currentStage={deal.stage}
                  onStageChange={(newStage) => {
                    if (newStage === 'closed_lost') {
                      setDrawerState({ type: 'loss_reason' });
                    } else {
                      updateMutation.mutate({ id: dealId, stage: newStage });
                    }
                  }}
                />
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
                  {deal.customer ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/customers?id=${deal.customer?.id}`)}
                      className="w-full text-left hover:bg-background-hover/50 rounded-lg transition-colors -mx-1 px-1"
                    >
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="客戶"
                        value={deal.customer.name}
                      />
                    </button>
                  ) : (
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="客戶"
                      value="-"
                    />
                  )}
                </div>
              </section>

              {/* Loss Reason (shown when closed_lost) */}
              {deal.stage === 'closed_lost' && deal.lossReason && (
                <section aria-label="失敗原因">
                  <h3 className="text-sm font-medium text-text-muted mb-3">失敗原因</h3>
                  <div className="bg-error/5 border border-error/20 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {lossReasons.find((r) => r.key === deal.lossReason)?.label ?? deal.lossReason}
                        </p>
                        {deal.lossNotes && (
                          <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{deal.lossNotes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

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

      {/* Loss Reason Modal */}
      {drawerState.type === 'loss_reason' && deal && (
        <LossReasonModal
          dealTitle={deal.title}
          isSubmitting={updateMutation.isPending}
          onSubmit={(reason, notes) => {
            updateMutation.mutate(
              { id: dealId, stage: 'closed_lost', lossReason: reason, lossNotes: notes || null },
              { onSuccess: () => setDrawerState({ type: 'view' }) }
            );
          }}
          onCancel={() => setDrawerState({ type: 'view' })}
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
  readonly onStageChange?: (stage: string) => void;
}

function StageProgress({ currentStage, onStageChange }: StageProgressProps) {
  const currentIndex = stageOrder.indexOf(currentStage as typeof stageOrder[number]);
  const [confirmStage, setConfirmStage] = useState<string | null>(null);

  const handleStageClick = (stage: string) => {
    if (!onStageChange) return;
    if (stage === currentStage) return;
    setConfirmStage(stage);
  };

  const handleConfirm = () => {
    if (confirmStage && onStageChange) {
      onStageChange(confirmStage);
      setConfirmStage(null);
    }
  };

  return (
    <div>
      <div className="flex gap-1">
        {stageOrder.map((stage, index) => {
          const color = pipelineColors[stage];
          const label = pipelineLabels[stage] ?? stage;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = onStageChange && stage !== currentStage;

          function getLabelClass(): string {
            if (isCurrent) return 'text-text-primary font-medium';
            if (isClickable) return 'text-text-muted group-hover:text-text-primary';
            return 'text-text-muted';
          }

          return (
            <button
              key={stage}
              type="button"
              onClick={() => handleStageClick(stage)}
              disabled={!isClickable}
              className={`flex-1 min-w-0 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              aria-label={`移動到${label}階段`}
              title={isClickable ? `移動到「${label}」` : label}
            >
              <div
                className={`h-2 rounded-full transition-all ${isClickable ? 'group-hover:h-3' : ''}`}
                style={{ backgroundColor: isActive ? color : '#2a2a2a' }}
                aria-hidden="true"
              />
              <p
                className={`text-[10px] mt-1 truncate text-center transition-colors ${getLabelClass()}`}
              >
                {label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Confirmation Popover */}
      {confirmStage && (
        <div className="mt-3 p-3 bg-background-secondary border border-border rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            移動到「{pipelineLabels[confirmStage] ?? confirmStage}」？
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmStage(null)}
              className="px-3 py-1.5 text-sm rounded-lg text-text-muted hover:bg-background-hover transition-colors min-h-[32px]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 py-1.5 text-sm rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[32px]"
            >
              確認
            </button>
          </div>
        </div>
      )}
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
// LossReasonModal
// ============================================

interface LossReasonModalProps {
  readonly dealTitle: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (reason: string, notes: string) => void;
  readonly onCancel: () => void;
}

function LossReasonModal({ dealTitle, isSubmitting, onSubmit, onCancel }: LossReasonModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit(reason, notes);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[60]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <dialog
        open
        className="fixed inset-0 m-auto w-full max-w-md h-fit bg-background border border-border rounded-xl shadow-xl z-[70] p-0"
        aria-label={`${dealTitle} — 記錄失敗原因`}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">記錄失敗原因</h2>
            <p className="text-sm text-text-muted mt-1">
              將「{dealTitle}」標記為流失，請選擇原因。
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-text-secondary mb-2">失敗原因</legend>
            <div className="grid grid-cols-2 gap-2">
              {lossReasons.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setReason(item.key)}
                  className={`
                    px-3 py-2.5 rounded-lg text-sm text-left transition-colors min-h-[44px]
                    ${reason === item.key
                      ? 'bg-error/15 border-error/50 text-error border'
                      : 'bg-background-hover/50 border border-border text-text-secondary hover:bg-background-hover'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="loss-notes" className="text-sm font-medium text-text-secondary block mb-1">
              補充說明（選填）
            </label>
            <textarea
              id="loss-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg bg-background-secondary border border-border
                text-text-primary text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-accent-600
              "
              rows={3}
              maxLength={2000}
              placeholder="例如：客戶轉向競爭對手 X 的方案..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg text-sm text-text-muted hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!reason || isSubmitting}
              className="
                px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px]
                bg-error text-white hover:bg-error/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? '處理中...' : '確認流失'}
            </button>
          </div>
        </form>
      </dialog>
    </>
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
