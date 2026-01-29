/**
 * DealCard Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DealCard } from '@/components/features/deals/DealCard';
import type { Deal } from '@/hooks/useDeals';

function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    title: 'Enterprise Deal',
    value: 500000,
    currency: 'TWD',
    stage: 'proposal',
    probability: 60,
    closeDate: null,
    closedAt: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    customerId: 'cust-1',
    createdById: null,
    assignedToId: null,
    customer: { id: 'cust-1', name: 'Acme Corp', company: null },
    ...overrides,
  };
}

describe('DealCard Component', () => {
  describe('Rendering', () => {
    it('renders deal title', () => {
      render(<DealCard deal={createMockDeal()} />);

      expect(screen.getByText('Enterprise Deal')).toBeInTheDocument();
    });

    it('renders as button element', () => {
      render(<DealCard deal={createMockDeal()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows customer name', () => {
      render(<DealCard deal={createMockDeal()} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  describe('Value display', () => {
    it('shows formatted value with NT$ for TWD', () => {
      render(<DealCard deal={createMockDeal({ value: 500000, currency: 'TWD' })} />);

      expect(screen.getByText(/NT\$500,000/)).toBeInTheDocument();
    });

    it('shows value with other currency', () => {
      render(<DealCard deal={createMockDeal({ value: 10000, currency: 'USD' })} />);

      expect(screen.getByText(/USD10,000/)).toBeInTheDocument();
    });

    it('hides value when null', () => {
      render(<DealCard deal={createMockDeal({ value: null })} />);

      expect(screen.queryByText(/NT\$/)).not.toBeInTheDocument();
    });
  });

  describe('Customer display', () => {
    it('shows dash when no customer', () => {
      render(<DealCard deal={createMockDeal({ customer: undefined })} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Events', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<DealCard deal={createMockDeal()} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
