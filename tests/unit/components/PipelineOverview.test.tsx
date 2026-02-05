/**
 * PipelineOverview Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { PipelineOverview } from '@/components/features/dashboard/PipelineOverview';

const mockStages = [
  { stage: 'lead', count: 5, value: 500000 },
  { stage: 'qualified', count: 3, value: 300000 },
  { stage: 'proposal', count: 2, value: 1200000 },
  { stage: 'negotiation', count: 1, value: 800000 },
  { stage: 'closed_won', count: 4, value: 2000000 },
  { stage: 'closed_lost', count: 2, value: 400000 },
];

describe('PipelineOverview Component', () => {
  describe('Rendering', () => {
    it('renders Pipeline 概覽 heading', () => {
      render(<PipelineOverview stages={mockStages} />);

      expect(screen.getByRole('heading', { name: 'Pipeline 概覽' })).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const { container } = render(<PipelineOverview stages={mockStages} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders all provided stages with labels', () => {
      render(<PipelineOverview stages={mockStages} />);

      expect(screen.getByText('潛在客戶')).toBeInTheDocument();
      expect(screen.getByText('已確認')).toBeInTheDocument();
      expect(screen.getByText('提案中')).toBeInTheDocument();
      expect(screen.getByText('談判中')).toBeInTheDocument();
      expect(screen.getByText('成交')).toBeInTheDocument();
      expect(screen.getByText('失敗')).toBeInTheDocument();
    });

    it('shows stage counts', () => {
      render(<PipelineOverview stages={mockStages} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Currency formatting', () => {
    it('formats values with K suffix', () => {
      render(<PipelineOverview stages={[{ stage: 'lead', count: 1, value: 500000 }]} />);

      expect(screen.getByText('NT$500K')).toBeInTheDocument();
    });

    it('formats values with M suffix', () => {
      render(<PipelineOverview stages={[{ stage: 'lead', count: 1, value: 2000000 }]} />);

      expect(screen.getByText('NT$2.0M')).toBeInTheDocument();
    });

    it('formats small values without suffix', () => {
      render(<PipelineOverview stages={[{ stage: 'lead', count: 1, value: 500 }]} />);

      expect(screen.getByText('NT$500')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no stages', () => {
      render(<PipelineOverview stages={[]} />);

      expect(screen.getByText('尚無商機資料')).toBeInTheDocument();
    });
  });
});
