'use client';

/**
 * ContactForm - Create/Edit contact modal form
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Contact, CreateContactData } from '@/hooks/useContacts';

// ============================================
// Types
// ============================================

interface ContactFormProps {
  readonly contact?: Contact | null;
  readonly onSubmit: (data: CreateContactData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
}

interface ContactFormState {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly title: string;
  readonly isPrimary: boolean;
}

// ============================================
// Helpers
// ============================================

function getSubmitLabel(
  isSubmitting: boolean | undefined,
  isEdit: boolean
): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新';
  return '建立';
}

// ============================================
// Component
// ============================================

export function ContactForm({
  contact,
  onSubmit,
  onClose,
  isSubmitting,
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormState>({
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    title: contact?.title ?? '',
    isPrimary: contact?.isPrimary ?? false,
  });

  const handleChange = (field: keyof ContactFormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Build data object with all fields at once (readonly safe)
    const data: CreateContactData = {
      name: formData.name,
      isPrimary: formData.isPrimary,
      ...(formData.email && { email: formData.email }),
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.title && { title: formData.title }),
    };

    onSubmit(data);
  };

  const dialogLabel = contact ? '編輯聯絡人' : '新增聯絡人';

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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="姓名" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </FormField>

          <FormField label="職稱">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="form-input"
              placeholder="例如：業務經理"
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

          {/* Primary Contact Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => handleChange('isPrimary', e.target.checked)}
              className="w-5 h-5 rounded border-border bg-background text-accent-600 focus:ring-accent-600 focus:ring-offset-background cursor-pointer"
            />
            <span className="text-sm text-text-secondary">
              設為主要聯絡人
            </span>
          </label>

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
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(isSubmitting, !!contact)}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

// ============================================
// FormField Helper Component
// ============================================

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

export type { ContactFormProps };
