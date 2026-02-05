/**
 * CustomerRow Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerRow } from '@/components/features/customers/CustomerRow';
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
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    organizationId: 'org-1',
    createdById: 'user-1',
    assignedToId: null,
    ...overrides,
  };
}

describe('CustomerRow Component', () => {
  describe('Rendering', () => {
    it('renders customer name', () => {
      render(<CustomerRow customer={createMockCustomer()} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('renders company name', () => {
      render(<CustomerRow customer={createMockCustomer()} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('shows initials in avatar', () => {
      render(<CustomerRow customer={createMockCustomer({ name: 'John Smith' })} />);

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('shows single initial for single-word name', () => {
      render(<CustomerRow customer={createMockCustomer({ name: 'Alice' })} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders as button element', () => {
      render(<CustomerRow customer={createMockCustomer()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Fallback display', () => {
    it('shows email when no company', () => {
      render(<CustomerRow customer={createMockCustomer({ company: null })} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('shows dash when no company or email', () => {
      render(<CustomerRow customer={createMockCustomer({ company: null, email: null })} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Status', () => {
    it('shows status label for active', () => {
      render(<CustomerRow customer={createMockCustomer({ status: 'active' })} />);

      expect(screen.getByText('活躍')).toBeInTheDocument();
    });

    it('shows status dot with aria-label', () => {
      render(<CustomerRow customer={createMockCustomer({ status: 'active' })} />);

      expect(screen.getByLabelText('狀態: 活躍')).toBeInTheDocument();
    });
  });

  describe('Events', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<CustomerRow customer={createMockCustomer()} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
