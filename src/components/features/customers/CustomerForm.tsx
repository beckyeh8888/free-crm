'use client';

/**
 * CustomerForm - Smart B2B/B2C customer creation form
 * B2B: Company-centric with optional primary contact
 * B2C: Person-centric with auto primary contact
 * WCAG 2.2 AAA Compliant
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
  readonly companyPhone?: string;
  readonly fax?: string;
  readonly taxId?: string;
  readonly type: string;
  readonly status: string;
  readonly notes: string;
  readonly primaryContact?: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly title: string;
  };
}

function getSubmitLabel(isSubmitting: boolean | undefined, isEdit: boolean): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新';
  return '建立';
}

export function CustomerForm({ customer, onSubmit, onClose, isSubmitting }: CustomerFormProps) {
  const isEdit = !!customer;

  const [type, setType] = useState<'B2B' | 'B2C'>(
    (customer?.type as 'B2B' | 'B2C') || 'B2B'
  );
  const [status, setStatus] = useState(customer?.status || 'active');
  const [notes, setNotes] = useState(customer?.notes || '');

  // B2B fields
  const [companyName, setCompanyName] = useState(
    customer ? (customer.company || customer.name) : ''
  );
  const [companyPhone, setCompanyPhone] = useState(customer?.companyPhone || '');
  const [fax, setFax] = useState(customer?.fax || '');
  const [taxId, setTaxId] = useState(customer?.taxId || '');

  // B2C fields
  const [personName, setPersonName] = useState(customer?.name || '');
  const [personEmail, setPersonEmail] = useState(customer?.email || '');
  const [personPhone, setPersonPhone] = useState(customer?.phone || '');
  const [b2cCompany, setB2cCompany] = useState(customer?.company || '');

  // Primary contact (B2B only, new customers)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTitle, setContactTitle] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (type === 'B2B') {
      const hasPrimaryContact = !isEdit && contactName.trim();
      onSubmit({
        name: companyName,
        email: hasPrimaryContact ? contactEmail : '',
        phone: hasPrimaryContact ? contactPhone : '',
        company: companyName,
        companyPhone: companyPhone || undefined,
        fax: fax || undefined,
        taxId: taxId || undefined,
        type,
        status,
        notes,
        ...(hasPrimaryContact && {
          primaryContact: {
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            title: contactTitle,
          },
        }),
      });
    } else {
      // B2C
      onSubmit({
        name: personName,
        email: personEmail,
        phone: personPhone,
        company: b2cCompany,
        type,
        status,
        notes,
        ...(!isEdit && personName.trim() && {
          primaryContact: {
            name: personName,
            email: personEmail,
            phone: personPhone,
            title: '',
          },
        }),
      });
    }
  };

  const canSubmit = type === 'B2B' ? companyName.trim() : personName.trim();
  const dialogLabel = isEdit ? '編輯客戶' : '新增客戶';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      <dialog
        open
        className="relative w-full max-w-md bg-background-tertiary border border-border rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto"
        aria-label={dialogLabel}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-background-tertiary z-10">
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Selector — segmented buttons at the top */}
          <fieldset>
            <legend className="text-sm text-text-secondary mb-2 block">客戶類型</legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('B2B')}
                className={`
                  flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${type === 'B2B'
                    ? 'bg-accent-600 text-white'
                    : 'bg-background-hover/50 text-text-secondary hover:bg-background-hover border border-border'
                  }
                `}
                aria-pressed={type === 'B2B'}
              >
                B2B 企業客戶
              </button>
              <button
                type="button"
                onClick={() => setType('B2C')}
                className={`
                  flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                  ${type === 'B2C'
                    ? 'bg-accent-600 text-white'
                    : 'bg-background-hover/50 text-text-secondary hover:bg-background-hover border border-border'
                  }
                `}
                aria-pressed={type === 'B2C'}
              >
                B2C 個人客戶
              </button>
            </div>
          </fieldset>

          {type === 'B2B' ? (
            <>
              {/* B2B: Company Name */}
              <FormField label="公司名稱" required>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="form-input"
                  placeholder="輸入公司名稱"
                  required
                />
              </FormField>

              {/* Company Info */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="公司電話">
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="form-input"
                    placeholder="02-xxxx-xxxx"
                  />
                </FormField>
                <FormField label="傳真">
                  <input
                    type="tel"
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    className="form-input"
                    placeholder="02-xxxx-xxxx"
                  />
                </FormField>
              </div>

              <FormField label="統一編號">
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="form-input"
                  placeholder="12345678"
                  maxLength={20}
                />
              </FormField>

              {/* Status */}
              <FormField label="狀態">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="active">活躍</option>
                  <option value="lead">潛在</option>
                  <option value="inactive">停用</option>
                </select>
              </FormField>

              {/* Primary Contact Section (only for new customers) */}
              {!isEdit && (
                <fieldset className="border border-border/50 rounded-lg p-4 space-y-3">
                  <legend className="text-sm font-medium text-text-secondary px-2">
                    主要聯絡人（選填）
                  </legend>
                  <FormField label="聯絡人姓名">
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="form-input"
                      placeholder="輸入姓名"
                    />
                  </FormField>
                  <FormField label="電子郵件">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="form-input"
                      placeholder="email@example.com"
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="電話">
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="form-input"
                        placeholder="09xx-xxx-xxx"
                      />
                    </FormField>
                    <FormField label="職稱">
                      <input
                        type="text"
                        value={contactTitle}
                        onChange={(e) => setContactTitle(e.target.value)}
                        className="form-input"
                        placeholder="經理、總監..."
                      />
                    </FormField>
                  </div>
                </fieldset>
              )}
            </>
          ) : (
            <>
              {/* B2C: Person Info */}
              <FormField label="姓名" required>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="form-input"
                  placeholder="輸入姓名"
                  required
                />
              </FormField>

              <FormField label="電子郵件">
                <input
                  type="email"
                  value={personEmail}
                  onChange={(e) => setPersonEmail(e.target.value)}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </FormField>

              <FormField label="電話">
                <input
                  type="tel"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  className="form-input"
                  placeholder="09xx-xxx-xxx"
                />
              </FormField>

              <FormField label="公司（選填）">
                <input
                  type="text"
                  value={b2cCompany}
                  onChange={(e) => setB2cCompany(e.target.value)}
                  className="form-input"
                  placeholder="所屬公司"
                />
              </FormField>

              {/* Status */}
              <FormField label="狀態">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="active">活躍</option>
                  <option value="lead">潛在</option>
                  <option value="inactive">停用</option>
                </select>
              </FormField>
            </>
          )}

          {/* Notes */}
          <FormField label="備註">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              disabled={isSubmitting || !canSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(isSubmitting, isEdit)}
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
