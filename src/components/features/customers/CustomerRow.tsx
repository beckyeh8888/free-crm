'use client';

/**
 * CustomerRow - Customer list item
 * Matches Pencil CustomerRow component design
 */

import type { Customer } from '@/hooks/useCustomers';
import { statusColors } from '@/lib/design-tokens';

interface CustomerRowProps {
  readonly customer: Customer;
  readonly onClick?: () => void;
}

const statusLabels: Record<string, string> = {
  active: '活躍',
  inactive: '停用',
  lead: '潛在',
};

export function CustomerRow({ customer, onClick }: CustomerRowProps) {
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const statusColor = statusColors[customer.status as keyof typeof statusColors] || statusColors.inactive;
  const statusLabel = statusLabels[customer.status] || customer.status;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex items-center gap-3 px-4 py-3
        hover:bg-background-hover
        transition-colors duration-150
        text-left min-h-[56px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
      "
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{customer.name}</p>
        <p className="text-xs text-text-muted truncate">{customer.company || customer.email || '-'}</p>
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted hidden sm:inline">{statusLabel}</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          aria-label={`狀態: ${statusLabel}`}
        />
      </div>
    </button>
  );
}
