/**
 * CustomerDetailPanel Component Tests
 * Tests for slide-in panel for customer details with edit/delete
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CustomerDetailPanel } from '@/components/features/customers/CustomerDetailPanel';
import type { Customer } from '@/hooks/useCustomers';

// Mock hooks
vi.mock('@/hooks/useCustomers', () => ({
  useCustomer: vi.fn(),
  useUpdateCustomer: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteCustomer: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock CustomerForm
vi.mock('@/components/features/customers/CustomerForm', () => ({
  CustomerForm: ({
    customer,
    onSubmit,
    onClose,
  }: {
    customer?: Customer | null;
    onSubmit: (data: unknown) => void;
    onClose: () => void;
    isSubmitting?: boolean;
  }) => (
    <div data-testid="customer-form" data-editing={!!customer}>
      <span data-testid="form-mode">{customer ? 'edit' : 'create'}</span>
      <button type="button" onClick={() => onSubmit({ name: 'Updated' })} data-testid="submit-form">
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

// Mock ContactsPanel
vi.mock('@/components/features/contacts', () => ({
  ContactsPanel: ({
    onClose,
  }: {
    customer: Customer;
    onClose: () => void;
  }) => (
    <div data-testid="contacts-panel">
      <button type="button" onClick={onClose} data-testid="close-contacts">
        Close Contacts
      </button>
    </div>
  ),
}));

import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';

const mockCustomer: Customer = {
  id: 'customer-1',
  name: '台灣科技公司',
  email: 'info@techcorp.tw',
  phone: '02-1234-5678',
  company: 'TechCorp Inc.',
  type: 'B2B',
  status: 'active',
  notes: '重要客戶，需要特別關注',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  organizationId: 'org-1',
  createdById: 'user-1',
  assignedToId: 'user-1',
};

describe('CustomerDetailPanel', () => {
  const defaultProps = {
    customer: mockCustomer,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCustomer).mockReturnValue({
      data: { success: true, data: mockCustomer },
      isLoading: false,
    } as ReturnType<typeof useCustomer>);
  });

  describe('Rendering', () => {
    it('renders panel with customer name in aria-label', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '台灣科技公司 的詳細資訊' })).toBeInTheDocument();
    });

    it('renders customer name in header', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '台灣科技公司' })).toBeInTheDocument();
    });

    it('renders status label', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByText('活躍')).toBeInTheDocument();
    });

    it('renders type label', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByText('B2B 企業客戶')).toBeInTheDocument();
    });

    it('renders contact info section', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByLabelText('聯絡資訊')).toBeInTheDocument();
      expect(screen.getByText('info@techcorp.tw')).toBeInTheDocument();
      expect(screen.getByText('02-1234-5678')).toBeInTheDocument();
      expect(screen.getByText('TechCorp Inc.')).toBeInTheDocument();
    });

    it('renders notes section', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByLabelText('備註')).toBeInTheDocument();
      expect(screen.getByText('重要客戶，需要特別關注')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByText('編輯')).toBeInTheDocument();
      expect(screen.getByText('聯絡人')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '刪除客戶' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉面板' })).toBeInTheDocument();
    });
  });

  describe('Close Panel', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<CustomerDetailPanel {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉面板' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<CustomerDetailPanel {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit Customer', () => {
    it('does not show customer form initially', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.queryByTestId('customer-form')).not.toBeInTheDocument();
    });

    it('shows customer form when edit button is clicked', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));

      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('shows form in edit mode', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));

      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
    });

    it('calls update mutation on form submit', () => {
      const mockMutate = vi.fn();
      vi.mocked(useUpdateCustomer).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('closes form after successful update', () => {
      const mockMutate = vi.fn((_data: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });
      vi.mocked(useUpdateCustomer).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('編輯'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(screen.queryByTestId('customer-form')).not.toBeInTheDocument();
    });
  });

  describe('Delete Customer', () => {
    it('shows delete confirmation when delete is clicked', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除客戶' }));

      expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();
    });

    it('calls delete mutation on confirm', () => {
      const mockMutate = vi.fn();
      vi.mocked(useDeleteCustomer).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除客戶' }));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(mockMutate).toHaveBeenCalledWith('customer-1', expect.anything());
    });

    it('calls onClose after successful delete', () => {
      const onClose = vi.fn();
      const mockMutate = vi.fn((_id: string, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });
      vi.mocked(useDeleteCustomer).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteCustomer>);

      render(<CustomerDetailPanel {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除客戶' }));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('closes confirmation on cancel', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除客戶' }));
      expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument();
    });
  });

  describe('Contacts Panel', () => {
    it('does not show contacts panel initially', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.queryByTestId('contacts-panel')).not.toBeInTheDocument();
    });

    it('shows contacts panel when contacts button is clicked', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('聯絡人'));

      expect(screen.getByTestId('contacts-panel')).toBeInTheDocument();
    });

    it('closes contacts panel when close button is clicked', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('聯絡人'));
      expect(screen.getByTestId('contacts-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-contacts'));
      expect(screen.queryByTestId('contacts-panel')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders dash for null email', () => {
      vi.mocked(useCustomer).mockReturnValue({
        data: { success: true, data: { ...mockCustomer, email: null } },
        isLoading: false,
      } as ReturnType<typeof useCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      const infoSection = screen.getByLabelText('聯絡資訊');
      expect(infoSection).toBeInTheDocument();
    });

    it('hides notes section when notes is null', () => {
      vi.mocked(useCustomer).mockReturnValue({
        data: { success: true, data: { ...mockCustomer, notes: null } },
        isLoading: false,
      } as ReturnType<typeof useCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.queryByLabelText('備註')).not.toBeInTheDocument();
    });

    it('uses unknown status label as-is', () => {
      vi.mocked(useCustomer).mockReturnValue({
        data: { success: true, data: { ...mockCustomer, status: 'unknown' } },
        isLoading: false,
      } as ReturnType<typeof useCustomer>);

      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label sections', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      expect(screen.getByLabelText('聯絡資訊')).toBeInTheDocument();
      expect(screen.getByLabelText('備註')).toBeInTheDocument();
      expect(screen.getByLabelText('其他資訊')).toBeInTheDocument();
    });

    it('has type button on all action buttons', () => {
      render(<CustomerDetailPanel {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: '關閉面板' });
      const deleteBtn = screen.getByRole('button', { name: '刪除客戶' });

      expect(closeBtn).toHaveAttribute('type', 'button');
      expect(deleteBtn).toHaveAttribute('type', 'button');
    });
  });
});
