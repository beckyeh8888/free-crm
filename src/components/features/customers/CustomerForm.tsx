'use client';

/**
 * CustomerForm - Create/Edit customer modal form
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Customer } from '@/hooks/useCustomers';

interface CustomerFormProps {
  readonly customer?: Customer | null;
  readonly onSubmit: (data: CustomerFormData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
}

export interface CustomerFormData {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly company: string;
  readonly type: string;
  readonly status: string;
  readonly notes: string;
}

function getSubmitLabel(isSubmitting: boolean | undefined, isEdit: boolean): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新';
  return '建立';
}

export function CustomerForm({ customer, onSubmit, onClose, isSubmitting }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    type: customer?.type || 'B2B',
    status: customer?.status || 'active',
    notes: customer?.notes || '',
  });

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const dialogLabel = customer ? '編輯客戶' : '新增客戶';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
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

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-5 space-y-4"
        >
          <FormField label="名稱" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input"
              required
            />
          </FormField>

          <FormField label="電子郵件">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="電話">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField label="公司">
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="form-input"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="類型">
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="form-input"
              >
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </FormField>

            <FormField label="狀態">
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input"
              >
                <option value="active">活躍</option>
                <option value="lead">潛在</option>
                <option value="inactive">停用</option>
              </select>
            </FormField>
          </div>

          <FormField label="備註">
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="form-input resize-none"
              rows={3}
            />
          </FormField>

          {/* Actions */}
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
              disabled={isSubmitting || !formData.name}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(isSubmitting, !!customer)}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  readonly label: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-text-secondary mb-1 block">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
