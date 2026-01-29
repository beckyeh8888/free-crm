/**
 * CustomerForm Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import type { Customer } from '@/hooks/useCustomers';

function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '0912345678',
    company: 'Acme Corp',
    type: 'B2B',
    status: 'active',
    notes: 'Test notes',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    organizationId: 'org-1',
    createdById: 'user-1',
    assignedToId: null,
    ...overrides,
  };
}

describe('CustomerForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Create mode', () => {
    it('renders 新增客戶 title', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByText('新增客戶')).toBeInTheDocument();
    });

    it('renders 建立 submit button', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立' })).toBeInTheDocument();
    });

    it('has dialog with correct aria-label', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '新增客戶' })).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('renders 編輯客戶 title', () => {
      render(<CustomerForm {...defaultProps} customer={createMockCustomer()} />);

      expect(screen.getByText('編輯客戶')).toBeInTheDocument();
    });

    it('renders 更新 submit button', () => {
      render(<CustomerForm {...defaultProps} customer={createMockCustomer()} />);

      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    it('pre-fills form with customer data', () => {
      render(<CustomerForm {...defaultProps} customer={createMockCustomer()} />);

      expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('shows 儲存中... when isSubmitting', () => {
      render(<CustomerForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: '儲存中...' })).toBeInTheDocument();
    });

    it('disables submit when name is empty', () => {
      render(<CustomerForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立' });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('Events', () => {
    it('calls onClose when cancel clicked', () => {
      const onClose = vi.fn();
      render(<CustomerForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<CustomerForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit with form data', () => {
      const onSubmit = vi.fn();
      render(<CustomerForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill in required name field (first textbox)
      const nameInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(nameInput, { target: { value: 'New Customer' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: '建立' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Customer' })
      );
    });
  });
});
