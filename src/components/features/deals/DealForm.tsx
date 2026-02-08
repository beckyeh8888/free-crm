'use client';

/**
 * DealForm - Create/Edit deal modal form
 */

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { pipelineLabels } from '@/lib/design-tokens';
import { CustomerCombobox } from '@/components/ui/CustomerCombobox';
import type { Deal } from '@/hooks/useDeals';

interface DealFormProps {
  readonly deal?: Deal | null;
  readonly onSubmit: (data: DealFormData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
  readonly initialCustomerId?: string;
  readonly initialCustomerName?: string;
}

export interface DealFormData {
  readonly title: string;
  readonly value: number | null;
  readonly currency: string;
  readonly stage: string;
  readonly probability: number;
  readonly closeDate: string;
  readonly notes: string;
  readonly customerId: string;
}

const stageOptions = Object.entries(pipelineLabels);

function getSubmitLabel(isSubmitting: boolean | undefined, isEdit: boolean): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新';
  return '建立';
}

export function DealForm({ deal, onSubmit, onClose, isSubmitting, initialCustomerId, initialCustomerName }: DealFormProps) {
  const [formData, setFormData] = useState<DealFormData>({
    title: deal?.title || '',
    value: deal?.value ?? null,
    currency: deal?.currency || 'TWD',
    stage: deal?.stage || 'lead',
    probability: deal?.probability ?? 0,
    closeDate: deal?.closeDate?.split('T')[0] || '',
    notes: deal?.notes || '',
    customerId: deal?.customerId || initialCustomerId || '',
  });

  const handleChange = (field: keyof DealFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const dateInputRef = useRef<HTMLInputElement>(null);
  const dialogLabel = deal ? '編輯商機' : '新增商機';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      <dialog
        open
        className="relative w-full max-w-md bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
        aria-label={dialogLabel}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {dialogLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-5 space-y-4"
        >
          <label className="block">
            <span className="text-sm text-text-secondary mb-1 block">
              名稱 <span className="text-error">*</span>
            </span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="form-input"
              required
            />
          </label>

          {/* Customer Picker */}
          <div className="block">
            <span className="text-sm text-text-secondary mb-1 block">客戶</span>
            <CustomerCombobox
              value={formData.customerId}
              initialName={deal?.customer?.name ?? initialCustomerName}
              onChange={(id) => handleChange('customerId', id)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">金額</span>
              <input
                type="number"
                value={formData.value ?? ''}
                onChange={(e) => handleChange('value', e.target.value ? Number(e.target.value) : null)}
                className="form-input"
                min={0}
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">階段</span>
              <select
                value={formData.stage}
                onChange={(e) => handleChange('stage', e.target.value)}
                className="form-input"
              >
                {stageOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">機率 (%)</span>
              <input
                type="number"
                value={formData.probability}
                onChange={(e) => handleChange('probability', Number(e.target.value))}
                className="form-input"
                min={0}
                max={100}
              />
            </label>
            <div className="block">
              <span className="text-sm text-text-secondary mb-1 block">預計成交日</span>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={formData.closeDate}
                  placeholder="yyyy-mm-dd"
                  className="form-input cursor-pointer"
                  onClick={() => dateInputRef.current?.showPicker()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dateInputRef.current?.showPicker(); }}
                />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleChange('closeDate', e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-sm text-text-secondary mb-1 block">備註</span>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="form-input resize-none"
              rows={3}
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(isSubmitting, !!deal)}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
