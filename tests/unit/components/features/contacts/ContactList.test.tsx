/**
 * ContactList Component Tests
 * Tests for contact list container with loading/empty states
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ContactList } from '@/components/features/contacts/ContactList';
import type { Contact } from '@/hooks/useContacts';

// Mock ContactRow
vi.mock('@/components/features/contacts/ContactRow', () => ({
  ContactRow: ({
    contact,
    onEdit,
    onDelete,
  }: {
    contact: Contact;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`contact-row-${contact.id}`}>
      <span>{contact.name}</span>
      <button type="button" onClick={onEdit} data-testid={`edit-${contact.id}`}>
        Edit
      </button>
      <button type="button" onClick={onDelete} data-testid={`delete-${contact.id}`}>
        Delete
      </button>
    </div>
  ),
}));

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

describe('ContactList', () => {
  const defaultProps = {
    contacts: mockContacts,
    isLoading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      render(<ContactList {...defaultProps} isLoading={true} contacts={[]} />);

      // Should show skeleton elements (3 skeleton items)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('does not show contacts when loading', () => {
      render(<ContactList {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('contact-row-contact-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no contacts', () => {
      render(<ContactList {...defaultProps} contacts={[]} />);

      expect(screen.getByText('尚無聯絡人')).toBeInTheDocument();
    });

    it('shows help text in empty state', () => {
      render(<ContactList {...defaultProps} contacts={[]} />);

      expect(screen.getByText('點擊上方「新增聯絡人」按鈕新增第一個聯絡人')).toBeInTheDocument();
    });

    it('does not show contacts in empty state', () => {
      render(<ContactList {...defaultProps} contacts={[]} />);

      expect(screen.queryByTestId('contact-row-contact-1')).not.toBeInTheDocument();
    });
  });

  describe('Contacts Display', () => {
    it('renders all contacts', () => {
      render(<ContactList {...defaultProps} />);

      expect(screen.getByTestId('contact-row-contact-1')).toBeInTheDocument();
      expect(screen.getByTestId('contact-row-contact-2')).toBeInTheDocument();
    });

    it('renders contact names', () => {
      render(<ContactList {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders list with correct aria-label', () => {
      render(<ContactList {...defaultProps} />);

      expect(screen.getByRole('region', { name: '聯絡人列表' })).toBeInTheDocument();
    });
  });

  describe('Edit Handler', () => {
    it('calls onEdit with correct contact when edit is clicked', () => {
      const onEdit = vi.fn();
      render(<ContactList {...defaultProps} onEdit={onEdit} />);

      screen.getByTestId('edit-contact-1').click();

      expect(onEdit).toHaveBeenCalledWith(mockContacts[0]);
    });

    it('calls onEdit with second contact when editing second row', () => {
      const onEdit = vi.fn();
      render(<ContactList {...defaultProps} onEdit={onEdit} />);

      screen.getByTestId('edit-contact-2').click();

      expect(onEdit).toHaveBeenCalledWith(mockContacts[1]);
    });
  });

  describe('Delete Handler', () => {
    it('calls onDelete with correct contact when delete is clicked', () => {
      const onDelete = vi.fn();
      render(<ContactList {...defaultProps} onDelete={onDelete} />);

      screen.getByTestId('delete-contact-1').click();

      expect(onDelete).toHaveBeenCalledWith(mockContacts[0]);
    });

    it('calls onDelete with second contact when deleting second row', () => {
      const onDelete = vi.fn();
      render(<ContactList {...defaultProps} onDelete={onDelete} />);

      screen.getByTestId('delete-contact-2').click();

      expect(onDelete).toHaveBeenCalledWith(mockContacts[1]);
    });
  });

  describe('Single Contact', () => {
    it('renders correctly with single contact', () => {
      const singleContact = [mockContacts[0]];
      render(<ContactList {...defaultProps} contacts={singleContact} />);

      expect(screen.getByTestId('contact-row-contact-1')).toBeInTheDocument();
      expect(screen.queryByTestId('contact-row-contact-2')).not.toBeInTheDocument();
    });
  });

  describe('Many Contacts', () => {
    it('renders all contacts in a long list', () => {
      const manyContacts = Array.from({ length: 10 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i + 1}`,
        name: `Contact ${i + 1}`,
      }));

      render(<ContactList {...defaultProps} contacts={manyContacts} />);

      expect(screen.getAllByTestId(/^contact-row-/)).toHaveLength(10);
    });
  });
});
