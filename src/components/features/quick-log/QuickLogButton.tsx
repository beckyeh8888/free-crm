'use client';

/**
 * QuickLogButton - Floating action button for quick activity logging
 * Allows salespeople to quickly log calls, meetings, and emails
 * WCAG 2.2 AAA Compliant
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Phone, Users as MeetingIcon, Mail } from 'lucide-react';
import { useCreateTask, type TaskType } from '@/hooks/useTasks';
import { useCustomers } from '@/hooks/useCustomers';

// ============================================
// Types
// ============================================

interface QuickLogButtonProps {
  readonly className?: string;
}

interface QuickLogFormData {
  readonly type: TaskType;
  readonly title: string;
  readonly customerId: string;
  readonly notes: string;
}

// ============================================
// Constants
// ============================================

const activityTypes = [
  { key: 'call' as TaskType, label: '電話', icon: Phone },
  { key: 'meeting' as TaskType, label: '會議', icon: MeetingIcon },
  { key: 'email' as TaskType, label: '郵件', icon: Mail },
] as const;

// ============================================
// Component
// ============================================

export function QuickLogButton({ className = '' }: QuickLogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<QuickLogFormData>({
    type: 'call',
    title: '',
    customerId: '',
    notes: '',
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const panelRef = useRef<HTMLDialogElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  const createTask = useCreateTask();
  const { data: customersData } = useCustomers({
    search: customerSearch || undefined,
    limit: 5,
  });
  const customers = customersData?.data ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showCustomerDropdown) return;
    function handleClick(e: MouseEvent) {
      if (customerInputRef.current && !customerInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCustomerDropdown]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const now = new Date();
    createTask.mutate(
      {
        title: formData.title,
        type: formData.type,
        description: formData.notes || undefined,
        customerId: formData.customerId || null,
        dueDate: now.toISOString(),
        status: 'completed',
        priority: 'medium',
      },
      {
        onSuccess: () => {
          setFormData({ type: 'call', title: '', customerId: '', notes: '' });
          setCustomerSearch('');
          setIsOpen(false);
        },
      }
    );
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({ type: 'call', title: '', customerId: '', notes: '' });
    setCustomerSearch('');
  };

  const selectedCustomerName = formData.customerId
    ? customers.find((c) => c.id === formData.customerId)?.name
    : null;

  // Auto-generate title based on type + customer
  const autoTitle = `${activityTypes.find((t) => t.key === formData.type)?.label ?? ''}${
    selectedCustomerName ? ` - ${selectedCustomerName}` : ''
  }`;

  return (
    <>
      {/* FAB Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          w-14 h-14 rounded-full
          bg-accent-600 text-white shadow-lg
          hover:bg-accent-700 hover:shadow-xl
          transition-all duration-200
          flex items-center justify-center
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2
          ${className}
        `}
        aria-label="快速記錄活動"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Log Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={handleClose}
            aria-hidden="true"
          />
          <dialog
            ref={panelRef}
            open
            className="
              fixed bottom-20 right-4 lg:bottom-8 lg:right-8 m-0
              w-[calc(100vw-2rem)] max-w-sm
              bg-background border border-border rounded-xl shadow-2xl
              z-[70] p-0
            "
            aria-label="快速記錄活動"
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">快速記錄</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                  aria-label="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Activity Type Selector */}
              <fieldset>
                <legend className="sr-only">活動類型</legend>
                <div className="flex gap-2">
                  {activityTypes.map((item) => {
                    const Icon = item.icon;
                    const isSelected = formData.type === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: item.key })}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5
                          px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]
                          ${isSelected
                            ? 'bg-accent-600 text-white'
                            : 'bg-background-hover/50 text-text-secondary hover:bg-background-hover border border-border'
                          }
                        `}
                        aria-pressed={isSelected}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Customer Search */}
              <div className="relative">
                <label htmlFor="quick-log-customer" className="text-xs text-text-muted block mb-1">
                  客戶（選填）
                </label>
                {selectedCustomerName ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary border border-border">
                    <span className="text-sm text-text-primary flex-1 truncate">{selectedCustomerName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customerId: '' });
                        setCustomerSearch('');
                      }}
                      className="text-text-muted hover:text-text-primary"
                      aria-label="清除客戶選擇"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={customerInputRef}
                      id="quick-log-customer"
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="搜尋客戶名稱..."
                      className="
                        w-full px-3 py-2 rounded-lg bg-background-secondary border border-border
                        text-text-primary text-sm placeholder:text-text-muted
                        focus:outline-none focus:ring-2 focus:ring-accent-600
                      "
                      autoComplete="off"
                    />
                    {showCustomerDropdown && customers.length > 0 && (
                      <div
                        role="listbox"
                        className="absolute left-0 right-0 top-full mt-1 bg-background-secondary border border-border rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto"
                      >
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            role="option"
                            aria-selected={formData.customerId === customer.id}
                            onClick={() => {
                              setFormData({ ...formData, customerId: customer.id });
                              setCustomerSearch('');
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-background-hover transition-colors min-h-[36px]"
                          >
                            {customer.name}
                            {customer.company && (
                              <span className="text-text-muted ml-1.5">({customer.company})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="quick-log-title" className="text-xs text-text-muted block mb-1">
                  標題
                </label>
                <input
                  id="quick-log-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={autoTitle || '活動摘要...'}
                  className="
                    w-full px-3 py-2 rounded-lg bg-background-secondary border border-border
                    text-text-primary text-sm placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-accent-600
                  "
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="quick-log-notes" className="text-xs text-text-muted block mb-1">
                  備註（選填）
                </label>
                <textarea
                  id="quick-log-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="簡短記錄重點..."
                  className="
                    w-full px-3 py-2 rounded-lg bg-background-secondary border border-border
                    text-text-primary text-sm resize-none placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-accent-600
                  "
                  rows={2}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!formData.title.trim() || createTask.isPending}
                className="
                  w-full py-2.5 rounded-lg text-sm font-medium min-h-[44px]
                  bg-accent-600 text-white hover:bg-accent-700 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {createTask.isPending ? '儲存中...' : '儲存記錄'}
              </button>
            </form>
          </dialog>
        </>
      )}
    </>
  );
}
