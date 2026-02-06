'use client';

/**
 * CustomerDetailPanel - Slide-in panel for customer details with edit/delete
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X, Pencil, Trash2, Mail, Phone, Building2, FileText } from 'lucide-react';
import { ContactsPanel } from '@/components/features/contacts';
import { CustomerForm, type CustomerFormData } from './CustomerForm';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
} from '@/hooks/useCustomers';
import { statusColors } from '@/lib/design-tokens';

// ============================================
// Types
// ============================================

interface CustomerDetailPanelProps {
  readonly customer: Customer;
  readonly onClose: () => void;
}

type PanelState =
  | { type: 'view' }
  | { type: 'edit' }
  | { type: 'delete' }
  | { type: 'contacts' };

// ============================================
// Helpers
// ============================================

const statusLabels: Record<string, string> = {
  active: '活躍',
  inactive: '停用',
  lead: '潛在',
};

const typeLabels: Record<string, string> = {
  B2B: 'B2B 企業客戶',
  B2C: 'B2C 個人客戶',
};

// ============================================
// Component
// ============================================

export function CustomerDetailPanel({ customer, onClose }: CustomerDetailPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>({ type: 'view' });

  // Fetch latest customer data
  const { data: customerData } = useCustomer(customer.id);
  const latestCustomer = customerData?.data ?? customer;

  // Mutations
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // Handlers
  const handleUpdate = (formData: CustomerFormData) => {
    updateMutation.mutate(
      { id: customer.id, ...formData },
      {
        onSuccess: () => setPanelState({ type: 'view' }),
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(customer.id, {
      onSuccess: () => onClose(),
    });
  };

  const statusColor = statusColors[latestCustomer.status as keyof typeof statusColors] || statusColors.inactive;
  const statusLabel = statusLabels[latestCustomer.status] || latestCustomer.status;
  const typeLabel = typeLabels[latestCustomer.type] || latestCustomer.type;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <dialog
        open
        className="
          fixed right-0 top-0 h-full w-full max-w-lg m-0
          bg-background border-l border-border
          z-50 flex flex-col
          animate-slide-in-right
        "
        aria-label={`${latestCustomer.name} 的詳細資訊`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {latestCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                {latestCustomer.name}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-xs text-text-muted">{statusLabel}</span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{typeLabel}</span>
              </div>
            </div>
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
            onClick={() => setPanelState({ type: 'edit' })}
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
            onClick={() => setPanelState({ type: 'contacts' })}
            className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              bg-accent-600 text-white
              hover:bg-accent-700 transition-colors
              min-h-[44px]
            "
          >
            <span>聯絡人</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelState({ type: 'delete' })}
            className="
              w-11 flex items-center justify-center
              px-2 py-2.5 rounded-lg
              border border-error/30 text-error
              hover:bg-error/10 transition-colors
              min-h-[44px]
            "
            aria-label="刪除客戶"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Contact Info */}
          <section aria-label="聯絡資訊">
            <h3 className="text-sm font-medium text-text-muted mb-3">聯絡資訊</h3>
            <div className="space-y-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="電子郵件" value={latestCustomer.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="電話" value={latestCustomer.phone} />
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="公司" value={latestCustomer.company} />
            </div>
          </section>

          {/* Notes */}
          {latestCustomer.notes && (
            <section aria-label="備註">
              <h3 className="text-sm font-medium text-text-muted mb-3">備註</h3>
              <div className="bg-background-hover/50 rounded-lg p-3">
                <div className="flex gap-2">
                  <FileText className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{latestCustomer.notes}</p>
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
                <span className="text-text-secondary">{new Date(latestCustomer.createdAt).toLocaleDateString('zh-TW')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">更新時間</span>
                <span className="text-text-secondary">{new Date(latestCustomer.updatedAt).toLocaleDateString('zh-TW')}</span>
              </div>
            </div>
          </section>
        </div>
      </dialog>

      {/* Edit Modal */}
      {panelState.type === 'edit' && (
        <CustomerForm
          customer={latestCustomer}
          onSubmit={handleUpdate}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {panelState.type === 'delete' && (
        <DeleteConfirmModal
          entityType="客戶"
          entityName={latestCustomer.name}
          onConfirm={handleDelete}
          onCancel={() => setPanelState({ type: 'view' })}
          isDeleting={deleteMutation.isPending}
          warningMessage="刪除客戶將同時刪除其所有聯絡人資料。"
        />
      )}

      {/* Contacts Panel */}
      {panelState.type === 'contacts' && (
        <ContactsPanel
          customer={latestCustomer}
          onClose={() => setPanelState({ type: 'view' })}
        />
      )}
    </>
  );
}

// ============================================
// InfoRow
// ============================================

interface InfoRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string | null;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm text-text-primary truncate">{value || '-'}</p>
      </div>
    </div>
  );
}
