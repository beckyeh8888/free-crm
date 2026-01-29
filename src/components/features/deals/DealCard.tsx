'use client';

/**
 * DealCard - Deal card for pipeline board
 * Matches Pencil DealCard component design
 */

import type { Deal } from '@/hooks/useDeals';

interface DealCardProps {
  readonly deal: Deal;
  readonly onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full p-3 rounded-lg
        bg-background-secondary border border-border
        hover:border-border/80 hover:bg-background-hover
        transition-colors duration-150
        text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset
      "
    >
      <p className="text-sm font-medium text-text-primary truncate">{deal.title}</p>
      {deal.value != null && (
        <p className="text-sm text-accent-600 mt-1">
          {deal.currency === 'TWD' ? 'NT$' : deal.currency}
          {deal.value.toLocaleString()}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-muted truncate">
          {deal.customer?.name || '-'}
        </span>
        <span
          className="w-2 h-2 rounded-full bg-success flex-shrink-0"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
