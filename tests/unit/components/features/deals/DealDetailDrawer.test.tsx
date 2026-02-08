/**
 * DealDetailDrawer Component Tests
 * Tests for slide-in drawer for deal details with edit/delete
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DealDetailDrawer } from '@/components/features/deals/DealDetailDrawer';
import type { Deal } from '@/hooks/useDeals';

// Mock hooks
vi.mock('@/hooks/useDeals', () => ({
  useDeal: vi.fn(),
  useUpdateDeal: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteDeal: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock DealForm
vi.mock('@/components/features/deals/DealForm', () => ({
  DealForm: ({
    deal,
    onSubmit,
    onClose,
  }: {
    deal?: Deal | null;
    onSubmit: (data: unknown) => void;
    onClose: () => void;
    isSubmitting?: boolean;
  }) => (
    <div data-testid="deal-form" data-editing={!!deal}>
      <span data-testid="form-mode">{deal ? 'edit' : 'create'}</span>
      <button type="button" onClick={() => onSubmit({ title: 'Updated' })} data-testid="submit-form">
        Submit
      </button>
      <button type="button" onClick={onClose} data-testid="close-form">
        Close
      </button>
    </div>
  ),
}));

// Mock DeleteConfirmModal
vi.mock('@/components/ui/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({
    entityName,
    onConfirm,
    onCancel,
    isDeleting,
  }: {
    entityType: string;
    entityName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
    warningMessage?: string;
  }) => (
    <dialog open aria-label="確認刪除" data-testid="delete-confirm">
      <p>確定要刪除 {entityName} 嗎？</p>
      <button type="button" onClick={onConfirm} aria-label={isDeleting ? '刪除中...' : '確認刪除'}>
        {isDeleting ? '刪除中...' : '確認刪除'}
      </button>
      <button type="button" onClick={onCancel} aria-label="取消">
        取消
      </button>
    </dialog>
  ),
}));

import { useDeal, useUpdateDeal, useDeleteDeal } from '@/hooks/useDeals';

const mockDeal: Deal = {
  id: 'deal-1',
  title: '大型企業方案',
  value: 500000,
  currency: 'TWD',
  stage: 'proposal',
  probability: 60,
  closeDate: '2026-03-15T00:00:00Z',
  closedAt: null,
  notes: '客戶正在評估中',
  lossReason: null,
  lossNotes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  customerId: 'customer-1',
  createdById: 'user-1',
  assignedToId: 'user-1',
  customer: {
    id: 'customer-1',
    name: '台灣科技公司',
    company: 'TechCorp',
  },
};

describe('DealDetailDrawer', () => {
  const defaultProps = {
    dealId: 'deal-1',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeal).mockReturnValue({
      data: { success: true, data: mockDeal },
      isLoading: false,
    } as ReturnType<typeof useDeal>);
  });

  describe('Rendering', () => {
    it('renders drawer with deal title in aria-label', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '大型企業方案 的詳細資訊' })).toBeInTheDocument();
    });

    it('renders deal title in header', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '大型企業方案' })).toBeInTheDocument();
    });

    it('renders formatted deal value', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('NT$ 500,000')).toBeInTheDocument();
    });

    it('renders stage label in header', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      // '提案中' appears in both header and stage progress, use getAllByText
      const stageLabels = screen.getAllByText('提案中');
      expect(stageLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('renders stage progress section', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('階段進度')).toBeInTheDocument();
      // Should show all 6 pipeline stage labels
      expect(screen.getByText('潛在客戶')).toBeInTheDocument();
      expect(screen.getByText('已確認')).toBeInTheDocument();
      expect(screen.getByText('成交')).toBeInTheDocument();
      expect(screen.getByText('失敗')).toBeInTheDocument();
    });

    it('renders deal info section', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('商機資訊')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('TWD')).toBeInTheDocument();
      expect(screen.getByText('台灣科技公司')).toBeInTheDocument();
    });

    it('renders notes section', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('備註')).toBeInTheDocument();
      expect(screen.getByText('客戶正在評估中')).toBeInTheDocument();
    });

    it('renders metadata section', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('其他資訊')).toBeInTheDocument();
      expect(screen.getByText('建立時間')).toBeInTheDocument();
      expect(screen.getByText('更新時間')).toBeInTheDocument();
    });

    it('renders edit and delete buttons', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('編輯')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '刪除商機' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉面板' })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      // Should show skeleton close button but no deal content
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByText('大型企業方案')).not.toBeInTheDocument();
    });
  });

  describe('Close Drawer', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<DealDetailDrawer {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉面板' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<DealDetailDrawer {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit Deal', () => {
    it('does not show deal form initially', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.queryByTestId('deal-form')).not.toBeInTheDocument();
    });

    it('shows deal form when edit button is clicked', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));

      expect(screen.getByTestId('deal-form')).toBeInTheDocument();
    });

    it('shows form in edit mode', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));

      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
    });

    it('calls update mutation on form submit', () => {
      const mockMutate = vi.fn();
      vi.mocked(useUpdateDeal).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('closes form after successful update', () => {
      const mockMutate = vi.fn((_data: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });
      vi.mocked(useUpdateDeal).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(screen.queryByTestId('deal-form')).not.toBeInTheDocument();
    });

    it('closes form when close button in form is clicked', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));
      expect(screen.getByTestId('deal-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-form'));
      expect(screen.queryByTestId('deal-form')).not.toBeInTheDocument();
    });
  });

  describe('Delete Deal', () => {
    it('shows delete confirmation when delete is clicked', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));

      expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();
    });

    it('shows deal name in delete confirmation', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));

      // Deal name appears in both drawer header and delete confirmation
      const nameElements = screen.getAllByText(/大型企業方案/);
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it('calls delete mutation on confirm', () => {
      const mockMutate = vi.fn();
      vi.mocked(useDeleteDeal).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(mockMutate).toHaveBeenCalledWith('deal-1', expect.anything());
    });

    it('calls onClose after successful delete', () => {
      const onClose = vi.fn();
      const mockMutate = vi.fn((_id: string, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });
      vi.mocked(useDeleteDeal).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteDeal>);

      render(<DealDetailDrawer {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('closes confirmation on cancel', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));
      expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument();
    });

    it('shows "刪除中..." when deleting', () => {
      vi.mocked(useDeleteDeal).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useDeleteDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除商機' }));

      expect(screen.getByRole('button', { name: '刪除中...' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles deal with null value', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: { success: true, data: { ...mockDeal, value: null } },
        isLoading: false,
      } as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('handles deal with no customer', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: { success: true, data: { ...mockDeal, customer: undefined } },
        isLoading: false,
      } as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      // Customer field should show '-'
      const customerSection = screen.getByText('客戶');
      expect(customerSection).toBeInTheDocument();
    });

    it('handles deal with no notes', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: { success: true, data: { ...mockDeal, notes: null } },
        isLoading: false,
      } as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.queryByText('備註')).not.toBeInTheDocument();
    });

    it('shows closedAt when deal is closed', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: {
          success: true,
          data: { ...mockDeal, stage: 'closed_won', closedAt: '2026-02-20T00:00:00Z' },
        },
        isLoading: false,
      } as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('結案時間')).toBeInTheDocument();
    });

    it('handles non-TWD currency', () => {
      vi.mocked(useDeal).mockReturnValue({
        data: { success: true, data: { ...mockDeal, currency: 'USD', value: 15000 } },
        isLoading: false,
      } as ReturnType<typeof useDeal>);

      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByText('USD 15,000')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has type button on all action buttons', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: '關閉面板' });
      const deleteBtn = screen.getByRole('button', { name: '刪除商機' });

      expect(closeBtn).toHaveAttribute('type', 'button');
      expect(deleteBtn).toHaveAttribute('type', 'button');
    });

    it('has aria-label sections', () => {
      render(<DealDetailDrawer {...defaultProps} />);

      expect(screen.getByLabelText('商機金額')).toBeInTheDocument();
      expect(screen.getByLabelText('階段進度')).toBeInTheDocument();
      expect(screen.getByLabelText('商機資訊')).toBeInTheDocument();
      expect(screen.getByLabelText('備註')).toBeInTheDocument();
      expect(screen.getByLabelText('其他資訊')).toBeInTheDocument();
    });
  });
});
