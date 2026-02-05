/**
 * ContactsPanel Component Tests
 * Tests for slide-in panel for managing customer contacts
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ContactsPanel } from '@/components/features/contacts/ContactsPanel';
import type { Customer } from '@/hooks/useCustomers';
import type { Contact } from '@/hooks/useContacts';

// Mock hooks
vi.mock('@/hooks/useContacts', () => ({
  useContacts: vi.fn(),
  useCreateContact: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateContact: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteContact: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock child components
vi.mock('@/components/features/contacts/ContactList', () => ({
  ContactList: ({
    contacts,
    isLoading,
    onEdit,
    onDelete,
  }: {
    contacts: Contact[];
    isLoading: boolean;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
  }) => (
    <div data-testid="contact-list" data-loading={isLoading}>
      {contacts.map((c) => (
        <div key={c.id} data-testid={`contact-${c.id}`}>
          <span>{c.name}</span>
          <button type="button" onClick={() => onEdit(c)} data-testid={`edit-${c.id}`}>Edit</button>
          <button type="button" onClick={() => onDelete(c)} data-testid={`delete-${c.id}`}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/features/contacts/ContactForm', () => ({
  ContactForm: ({
    contact,
    onSubmit,
    onClose,
    isSubmitting,
  }: {
    contact?: Contact | null;
    onSubmit: (data: unknown) => void;
    onClose: () => void;
    isSubmitting?: boolean;
  }) => (
    <div data-testid="contact-form" data-editing={!!contact}>
      <span data-testid="form-mode">{contact ? 'edit' : 'create'}</span>
      <button type="button" onClick={() => onSubmit({ name: 'Test' })} data-testid="submit-form">
        Submit
      </button>
      <button type="button" onClick={onClose} data-testid="close-form">
        Close
      </button>
    </div>
  ),
}));

import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/useContacts';

const mockCustomer: Customer = {
  id: 'customer-1',
  name: 'Test Company',
  email: 'company@example.com',
  phone: '0912345678',
  type: 'company',
  status: 'active',
  address: '123 Test St',
  description: 'A test company',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  organizationId: 'org-1',
  createdById: 'user-1',
  assignedToId: 'user-1',
};

const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+886-912-345-678',
    title: 'CEO',
    isPrimary: true,
    customerId: 'customer-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'contact-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+886-987-654-321',
    title: 'CTO',
    isPrimary: false,
    customerId: 'customer-1',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-15T00:00:00Z',
  },
];

describe('ContactsPanel', () => {
  const defaultProps = {
    customer: mockCustomer,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useContacts).mockReturnValue({
      data: { data: mockContacts },
      isLoading: false,
    } as ReturnType<typeof useContacts>);
  });

  describe('Rendering', () => {
    it('renders panel with customer name in aria-label', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: 'Test Company 的聯絡人' })).toBeInTheDocument();
    });

    it('renders header with "聯絡人"', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '聯絡人' })).toBeInTheDocument();
    });

    it('renders customer name in header', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('renders add contact button', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: '新增聯絡人' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉面板' })).toBeInTheDocument();
    });

    it('renders contact count in footer', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByText('共 2 位聯絡人')).toBeInTheDocument();
    });

    it('renders contact list', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('passes loading state to contact list', () => {
      vi.mocked(useContacts).mockReturnValue({
        data: { data: [] },
        isLoading: true,
      } as unknown as ReturnType<typeof useContacts>);

      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByTestId('contact-list')).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Close Panel', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ContactsPanel {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉面板' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ContactsPanel {...defaultProps} onClose={onClose} />);

      // Find backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Create Contact', () => {
    it('does not show contact form initially', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });

    it('shows contact form when add button is clicked', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '新增聯絡人' }));

      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    it('shows form in create mode', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '新增聯絡人' }));

      expect(screen.getByTestId('form-mode')).toHaveTextContent('create');
    });

    it('calls create mutation on form submit', () => {
      const mockMutate = vi.fn();
      vi.mocked(useCreateContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useCreateContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '新增聯絡人' }));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('closes form after successful create', () => {
      const mockMutate = vi.fn((data, options) => {
        options?.onSuccess?.();
      });
      vi.mocked(useCreateContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useCreateContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '新增聯絡人' }));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });
  });

  describe('Edit Contact', () => {
    it('shows contact form when edit is clicked', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-contact-1'));

      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    it('shows form in edit mode', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-contact-1'));

      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
    });

    it('calls update mutation on form submit', () => {
      const mockMutate = vi.fn();
      vi.mocked(useUpdateContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-contact-1'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('closes form after successful update', () => {
      const mockMutate = vi.fn((data, options) => {
        options?.onSuccess?.();
      });
      vi.mocked(useUpdateContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useUpdateContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-contact-1'));
      fireEvent.click(screen.getByTestId('submit-form'));

      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });
  });

  describe('Delete Contact', () => {
    it('shows delete confirmation when delete is clicked', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));

      expect(screen.getByRole('dialog', { name: '確認刪除' })).toBeInTheDocument();
    });

    it('shows contact name in delete confirmation', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));

      // Contact name appears in both the list and the confirmation dialog
      const johnDoeElements = screen.getAllByText(/John Doe/);
      expect(johnDoeElements.length).toBeGreaterThan(1);
    });

    it('calls delete mutation on confirm', () => {
      const mockMutate = vi.fn();
      vi.mocked(useDeleteContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(mockMutate).toHaveBeenCalledWith('contact-1', expect.anything());
    });

    it('closes confirmation on cancel', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));
      expect(screen.getByRole('dialog', { name: '確認刪除' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(screen.queryByRole('dialog', { name: '確認刪除' })).not.toBeInTheDocument();
    });

    it('shows "刪除中..." when deleting', () => {
      vi.mocked(useDeleteContact).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useDeleteContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));

      expect(screen.getByRole('button', { name: '刪除中...' })).toBeInTheDocument();
    });

    it('closes confirmation after successful delete', () => {
      const mockMutate = vi.fn((id, options) => {
        options?.onSuccess?.();
      });
      vi.mocked(useDeleteContact).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteContact>);

      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-contact-1'));
      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(screen.queryByRole('dialog', { name: '確認刪除' })).not.toBeInTheDocument();
    });
  });

  describe('Form Close', () => {
    it('closes create form when close is clicked', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '新增聯絡人' }));
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-form'));
      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });

    it('closes edit form when close is clicked', () => {
      render(<ContactsPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('edit-contact-1'));
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-form'));
      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });
  });

  describe('Empty Contacts', () => {
    it('shows count of 0 when no contacts', () => {
      vi.mocked(useContacts).mockReturnValue({
        data: { data: [] },
        isLoading: false,
      } as unknown as ReturnType<typeof useContacts>);

      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByText('共 0 位聯絡人')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has type button on close button', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉面板' })).toHaveAttribute('type', 'button');
    });

    it('has type button on add button', () => {
      render(<ContactsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: '新增聯絡人' })).toHaveAttribute('type', 'button');
    });
  });
});
