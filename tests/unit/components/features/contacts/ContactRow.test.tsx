/**
 * ContactRow Component Tests
 * Tests for contact list item with actions
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ContactRow } from '@/components/features/contacts/ContactRow';
import type { Contact } from '@/hooks/useContacts';

const mockContact: Contact = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+886-912-345-678',
  title: 'CEO',
  isPrimary: false,
  customerId: 'customer-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

describe('ContactRow', () => {
  const defaultProps = {
    contact: mockContact,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders contact name', () => {
      render(<ContactRow {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders contact title', () => {
      render(<ContactRow {...defaultProps} />);

      expect(screen.getByText('CEO')).toBeInTheDocument();
    });

    it('renders initials in avatar', () => {
      render(<ContactRow {...defaultProps} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('handles single name initials', () => {
      const singleNameContact = { ...mockContact, name: 'John' };
      render(<ContactRow {...defaultProps} contact={singleNameContact} />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays "無職稱" when no title', () => {
      const noTitleContact = { ...mockContact, title: '' };
      render(<ContactRow {...defaultProps} contact={noTitleContact} />);

      expect(screen.getByText('無職稱')).toBeInTheDocument();
    });

    it('displays "無職稱" when title is null', () => {
      const noTitleContact = { ...mockContact, title: null as unknown as string };
      render(<ContactRow {...defaultProps} contact={noTitleContact} />);

      expect(screen.getByText('無職稱')).toBeInTheDocument();
    });
  });

  describe('Primary Contact Badge', () => {
    it('shows primary badge when isPrimary is true', () => {
      const primaryContact = { ...mockContact, isPrimary: true };
      render(<ContactRow {...defaultProps} contact={primaryContact} />);

      expect(screen.getByText('主要')).toBeInTheDocument();
    });

    it('does not show primary badge when isPrimary is false', () => {
      render(<ContactRow {...defaultProps} />);

      expect(screen.queryByText('主要')).not.toBeInTheDocument();
    });
  });

  describe('Email Link', () => {
    it('renders email link when email exists', () => {
      render(<ContactRow {...defaultProps} />);

      const emailLink = screen.getByLabelText('寄送郵件給 John Doe');
      expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com');
    });

    it('does not render email link when email is empty', () => {
      const noEmailContact = { ...mockContact, email: '' };
      render(<ContactRow {...defaultProps} contact={noEmailContact} />);

      expect(screen.queryByLabelText(/寄送郵件給/)).not.toBeInTheDocument();
    });

    it('shows email as title attribute', () => {
      render(<ContactRow {...defaultProps} />);

      const emailLink = screen.getByLabelText('寄送郵件給 John Doe');
      expect(emailLink).toHaveAttribute('title', 'john@example.com');
    });
  });

  describe('Phone Link', () => {
    it('renders phone link when phone exists', () => {
      render(<ContactRow {...defaultProps} />);

      const phoneLink = screen.getByLabelText('撥打電話給 John Doe');
      expect(phoneLink).toHaveAttribute('href', 'tel:+886-912-345-678');
    });

    it('does not render phone link when phone is empty', () => {
      const noPhoneContact = { ...mockContact, phone: '' };
      render(<ContactRow {...defaultProps} contact={noPhoneContact} />);

      expect(screen.queryByLabelText(/撥打電話給/)).not.toBeInTheDocument();
    });

    it('shows phone as title attribute', () => {
      render(<ContactRow {...defaultProps} />);

      const phoneLink = screen.getByLabelText('撥打電話給 John Doe');
      expect(phoneLink).toHaveAttribute('title', '+886-912-345-678');
    });
  });

  describe('More Menu', () => {
    it('renders more menu button', () => {
      render(<ContactRow {...defaultProps} />);

      expect(screen.getByLabelText('更多操作')).toBeInTheDocument();
    });

    it('has correct aria attributes on menu button', () => {
      render(<ContactRow {...defaultProps} />);

      const menuButton = screen.getByLabelText('更多操作');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('opens menu when button is clicked', () => {
      render(<ContactRow {...defaultProps} />);

      const menuButton = screen.getByLabelText('更多操作');
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows edit option in menu', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));

      expect(screen.getByRole('menuitem', { name: '編輯' })).toBeInTheDocument();
    });

    it('shows delete option in menu', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));

      expect(screen.getByRole('menuitem', { name: '刪除' })).toBeInTheDocument();
    });

    it('calls onEdit when edit is clicked', () => {
      const onEdit = vi.fn();
      render(<ContactRow {...defaultProps} onEdit={onEdit} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      fireEvent.click(screen.getByRole('menuitem', { name: '編輯' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete is clicked', () => {
      const onDelete = vi.fn();
      render(<ContactRow {...defaultProps} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      fireEvent.click(screen.getByRole('menuitem', { name: '刪除' }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('closes menu after edit is clicked', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      fireEvent.click(screen.getByRole('menuitem', { name: '編輯' }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes menu after delete is clicked', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      fireEvent.click(screen.getByRole('menuitem', { name: '刪除' }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes menu when clicking outside', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes menu when Escape is pressed', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('toggles menu when button is clicked twice', () => {
      render(<ContactRow {...defaultProps} />);

      const menuButton = screen.getByLabelText('更多操作');

      fireEvent.click(menuButton);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.click(menuButton);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has type button on menu button', () => {
      render(<ContactRow {...defaultProps} />);

      const menuButton = screen.getByLabelText('更多操作');
      expect(menuButton).toHaveAttribute('type', 'button');
    });

    it('has type button on edit menu item', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      const editButton = screen.getByRole('menuitem', { name: '編輯' });
      expect(editButton).toHaveAttribute('type', 'button');
    });

    it('has type button on delete menu item', () => {
      render(<ContactRow {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('更多操作'));
      const deleteButton = screen.getByRole('menuitem', { name: '刪除' });
      expect(deleteButton).toHaveAttribute('type', 'button');
    });
  });
});
