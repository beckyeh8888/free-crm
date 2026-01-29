/**
 * DealForm Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DealForm } from '@/components/features/deals/DealForm';
import type { Deal } from '@/hooks/useDeals';

function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    title: 'Test Deal',
    value: 300000,
    currency: 'TWD',
    stage: 'proposal',
    probability: 60,
    closeDate: '2026-03-15T00:00:00Z',
    closedAt: null,
    notes: 'Deal notes',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    customerId: 'cust-1',
    createdById: null,
    assignedToId: null,
    ...overrides,
  };
}

describe('DealForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Create mode', () => {
    it('renders 新增商機 title', () => {
      render(<DealForm {...defaultProps} />);

      expect(screen.getByText('新增商機')).toBeInTheDocument();
    });

    it('renders 建立 submit button', () => {
      render(<DealForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立' })).toBeInTheDocument();
    });

    it('has dialog with correct aria-label', () => {
      render(<DealForm {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '新增商機' })).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('renders 編輯商機 title', () => {
      render(<DealForm {...defaultProps} deal={createMockDeal()} />);

      expect(screen.getByText('編輯商機')).toBeInTheDocument();
    });

    it('renders 更新 submit button', () => {
      render(<DealForm {...defaultProps} deal={createMockDeal()} />);

      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    it('pre-fills form with deal data', () => {
      render(<DealForm {...defaultProps} deal={createMockDeal()} />);

      expect(screen.getByDisplayValue('Test Deal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('300000')).toBeInTheDocument();
    });
  });

  describe('Stage options', () => {
    it('renders all pipeline stage options', () => {
      render(<DealForm {...defaultProps} />);

      expect(screen.getByText('潛在客戶')).toBeInTheDocument();
      expect(screen.getByText('已確認')).toBeInTheDocument();
      expect(screen.getByText('提案中')).toBeInTheDocument();
      expect(screen.getByText('談判中')).toBeInTheDocument();
      expect(screen.getByText('成交')).toBeInTheDocument();
      expect(screen.getByText('失敗')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('shows 儲存中... when isSubmitting', () => {
      render(<DealForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: '儲存中...' })).toBeInTheDocument();
    });

    it('disables submit when title is empty', () => {
      render(<DealForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立' });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('Events', () => {
    it('calls onClose when cancel clicked', () => {
      const onClose = vi.fn();
      render(<DealForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<DealForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit with form data', () => {
      const onSubmit = vi.fn();
      render(<DealForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill in required title field (first textbox, before textarea)
      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'New Deal' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: '建立' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Deal' })
      );
    });
  });
});
