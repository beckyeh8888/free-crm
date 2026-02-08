/**
 * PipelineBoard Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { PipelineBoard } from '@/components/features/deals/PipelineBoard';
import type { Deal } from '@/hooks/useDeals';

function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    title: 'Test Deal',
    value: 100000,
    currency: 'TWD',
    stage: 'lead',
    probability: 50,
    closeDate: null,
    closedAt: null,
    notes: null,
    lossReason: null,
    lossNotes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    customerId: 'cust-1',
    createdById: null,
    assignedToId: null,
    ...overrides,
  };
}

describe('PipelineBoard Component', () => {
  describe('Column rendering', () => {
    it('renders all 6 pipeline columns with labels', () => {
      render(<PipelineBoard deals={[]} />);

      expect(screen.getByText('潛在客戶')).toBeInTheDocument();
      expect(screen.getByText('已確認')).toBeInTheDocument();
      expect(screen.getByText('提案中')).toBeInTheDocument();
      expect(screen.getByText('談判中')).toBeInTheDocument();
      expect(screen.getByText('成交')).toBeInTheDocument();
      expect(screen.getByText('失敗')).toBeInTheDocument();
    });

    it('shows 無商機 for empty columns', () => {
      render(<PipelineBoard deals={[]} />);

      const emptyMessages = screen.getAllByText('無商機');
      expect(emptyMessages).toHaveLength(6);
    });
  });

  describe('Deal distribution', () => {
    it('renders deals in correct columns', () => {
      const deals = [
        createMockDeal({ id: 'd1', title: 'Lead Deal', stage: 'lead' }),
        createMockDeal({ id: 'd2', title: 'Proposal Deal', stage: 'proposal' }),
      ];

      render(<PipelineBoard deals={deals} />);

      expect(screen.getByText('Lead Deal')).toBeInTheDocument();
      expect(screen.getByText('Proposal Deal')).toBeInTheDocument();
    });

    it('shows correct count per column', () => {
      const deals = [
        createMockDeal({ id: 'd1', stage: 'lead' }),
        createMockDeal({ id: 'd2', stage: 'lead' }),
        createMockDeal({ id: 'd3', stage: 'proposal' }),
      ];

      render(<PipelineBoard deals={deals} />);

      // The count "2" should appear for lead column
      // The count "1" should appear for proposal column
      const allCounts = screen.getAllByText('2');
      expect(allCounts.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty message only for columns without deals', () => {
      const deals = [
        createMockDeal({ id: 'd1', stage: 'lead' }),
      ];

      render(<PipelineBoard deals={deals} />);

      // 5 empty columns should show 無商機
      const emptyMessages = screen.getAllByText('無商機');
      expect(emptyMessages).toHaveLength(5);
    });
  });
});
