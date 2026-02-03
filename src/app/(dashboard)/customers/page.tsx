'use client';

/**
 * Customers Page - Calm CRM Dark Theme
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useCustomers, useCreateCustomer, type Customer } from '@/hooks/useCustomers';
import { CustomerRow } from '@/components/features/customers/CustomerRow';
import { CustomerForm, type CustomerFormData } from '@/components/features/customers/CustomerForm';
import { ContactsPanel } from '@/components/features/contacts';

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '活躍' },
  { key: 'lead', label: '潛在' },
  { key: 'inactive', label: '停用' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useCustomers({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const createMutation = useCreateCustomer();

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreate = (formData: CustomerFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
      onError: (error) => {
        console.error('建立客戶失敗:', error);
        alert(`建立失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="搜尋客戶..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input pl-9 w-full"
              aria-label="搜尋客戶"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增客戶</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1" role="tablist" aria-label="客戶狀態篩選">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.key}
            onClick={() => {
              setStatusFilter(filter.key);
              setPage(1);
            }}
            className={`
              px-3 py-1.5 rounded-lg text-sm transition-colors min-h-[36px]
              ${
                statusFilter === filter.key
                  ? 'bg-accent-600 text-white'
                  : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Customer List */}
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
        <CustomerListContent
          isLoading={isLoading}
          customers={customers}
          search={search}
          onShowForm={() => setShowForm(true)}
          onSelectCustomer={setSelectedCustomer}
        />
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            共 {pagination.total} 位客戶
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
            >
              上一頁
            </button>
            <span className="px-3 py-1.5 text-sm text-text-muted">
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CustomerForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Contacts Panel */}
      {selectedCustomer && (
        <ContactsPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

interface CustomerListContentProps {
  readonly isLoading: boolean;
  readonly customers: readonly Customer[];
  readonly search: string;
  readonly onShowForm: () => void;
  readonly onSelectCustomer: (customer: Customer) => void;
}

function CustomerListContent({ isLoading, customers, search, onShowForm, onSelectCustomer }: CustomerListContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border-subtle">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="h-14 animate-pulse bg-background-hover/30" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">
          {search ? '找不到符合的客戶' : '尚無客戶資料'}
        </p>
        {!search && (
          <button
            type="button"
            onClick={onShowForm}
            className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
          >
            新增第一位客戶
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {customers.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
          onClick={() => onSelectCustomer(customer)}
        />
      ))}
    </div>
  );
}
