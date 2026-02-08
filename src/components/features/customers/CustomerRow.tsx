'use client';

/**
 * CustomerRow - Customer list item
 * Matches Pencil CustomerRow component design
 */

import { Phone, Mail } from 'lucide-react';
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

  // Build subtitle: B2B shows company info, B2C shows personal info
  const subtitleParts = customer.type === 'B2B'
    ? [customer.companyPhone, customer.taxId].filter(Boolean)
    : [customer.company, customer.email, customer.phone].filter(Boolean);
  const subtitle = subtitleParts.join(' · ') || '-';

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group w-full flex items-center gap-3 px-4 py-3
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
        <p className="text-xs text-text-muted truncate">{subtitle}</p>
      </div>

      {/* Quick actions (hover on desktop, always visible on mobile) */}
      <div className="flex items-center gap-1 sm:hidden sm:group-hover:flex">
        {(customer.type === 'B2B' ? customer.companyPhone : customer.phone) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); window.open(`tel:${customer.type === 'B2B' ? customer.companyPhone : customer.phone}`); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); window.open(`tel:${customer.type === 'B2B' ? customer.companyPhone : customer.phone}`); } }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
            aria-label={`撥打 ${customer.name} 的電話`}
          >
            <Phone className="w-3.5 h-3.5" />
          </span>
        )}
        {customer.email && customer.type !== 'B2B' && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); window.open(`mailto:${customer.email}`); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); window.open(`mailto:${customer.email}`); } }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
            aria-label={`寄信給 ${customer.name}`}
          >
            <Mail className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">{statusLabel}</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          aria-label={`狀態: ${statusLabel}`}
        />
      </div>
    </button>
  );
}
