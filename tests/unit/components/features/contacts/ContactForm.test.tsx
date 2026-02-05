/**
 * ContactForm Component Tests
 * Tests for create/edit contact modal form
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ContactForm } from '@/components/features/contacts/ContactForm';
import type { Contact } from '@/hooks/useContacts';

const mockContact: Contact = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+886-912-345-678',
  title: 'CEO',
  isPrimary: true,
  customerId: 'customer-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

describe('ContactForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode (no contact)', () => {
    it('shows "新增聯絡人" as dialog label', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '新增聯絡人' })).toBeInTheDocument();
    });

    it('shows "新增聯絡人" as header', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '新增聯絡人' })).toBeInTheDocument();
    });

    it('shows "建立" on submit button', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立' })).toBeInTheDocument();
    });

    it('starts with empty form fields', () => {
      render(<ContactForm {...defaultProps} />);

      const nameInput = screen.getByRole('textbox', { name: /姓名/ });
      const emailInput = screen.getByRole('textbox', { name: /電子郵件/ });
      const phoneInput = screen.getByRole('textbox', { name: /電話/ });
      const titleInput = screen.getByRole('textbox', { name: /職稱/ });
      const primaryCheckbox = screen.getByRole('checkbox', { name: /設為主要聯絡人/ });

      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
      expect(titleInput).toHaveValue('');
      expect(primaryCheckbox).not.toBeChecked();
    });
  });

  describe('Edit Mode (with contact)', () => {
    it('shows "編輯聯絡人" as dialog label', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} />);

      expect(screen.getByRole('dialog', { name: '編輯聯絡人' })).toBeInTheDocument();
    });

    it('shows "編輯聯絡人" as header', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} />);

      expect(screen.getByRole('heading', { name: '編輯聯絡人' })).toBeInTheDocument();
    });

    it('shows "更新" on submit button', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} />);

      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    it('pre-fills form with contact data', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} />);

      expect(screen.getByRole('textbox', { name: /姓名/ })).toHaveValue('John Doe');
      expect(screen.getByRole('textbox', { name: /電子郵件/ })).toHaveValue('john@example.com');
      expect(screen.getByRole('textbox', { name: /電話/ })).toHaveValue('+886-912-345-678');
      expect(screen.getByRole('textbox', { name: /職稱/ })).toHaveValue('CEO');
      expect(screen.getByRole('checkbox', { name: /設為主要聯絡人/ })).toBeChecked();
    });
  });

  describe('Form Fields', () => {
    it('renders name field with required indicator', () => {
      render(<ContactForm {...defaultProps} />);

      const nameLabel = screen.getByText('姓名');
      expect(nameLabel.parentElement).toHaveTextContent('*');
    });

    it('allows input in name field', () => {
      render(<ContactForm {...defaultProps} />);

      const nameInput = screen.getByRole('textbox', { name: /姓名/ });
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(nameInput).toHaveValue('New Name');
    });

    it('allows input in email field', () => {
      render(<ContactForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: /電子郵件/ });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows input in phone field', () => {
      render(<ContactForm {...defaultProps} />);

      const phoneInput = screen.getByRole('textbox', { name: /電話/ });
      fireEvent.change(phoneInput, { target: { value: '0912345678' } });

      expect(phoneInput).toHaveValue('0912345678');
    });

    it('allows input in title field', () => {
      render(<ContactForm {...defaultProps} />);

      const titleInput = screen.getByRole('textbox', { name: /職稱/ });
      fireEvent.change(titleInput, { target: { value: 'Manager' } });

      expect(titleInput).toHaveValue('Manager');
    });

    it('allows toggling primary checkbox', () => {
      render(<ContactForm {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /設為主要聯絡人/ });
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('shows placeholder for title field', () => {
      render(<ContactForm {...defaultProps} />);

      const titleInput = screen.getByRole('textbox', { name: /職稱/ });
      expect(titleInput).toHaveAttribute('placeholder', '例如：業務經理');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when submitted', () => {
      const onSubmit = vi.fn();
      render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.change(screen.getByRole('textbox', { name: /姓名/ }), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/ }), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /電話/ }), {
        target: { value: '0912345678' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /職稱/ }), {
        target: { value: 'Developer' },
      });
      fireEvent.click(screen.getByRole('checkbox', { name: /設為主要聯絡人/ }));

      fireEvent.click(screen.getByRole('button', { name: '建立' }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@test.com',
        phone: '0912345678',
        title: 'Developer',
        isPrimary: true,
      });
    });

    it('only includes non-empty optional fields', () => {
      const onSubmit = vi.fn();
      render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.change(screen.getByRole('textbox', { name: /姓名/ }), {
        target: { value: 'Test User' },
      });

      fireEvent.click(screen.getByRole('button', { name: '建立' }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        isPrimary: false,
      });
    });

    it('prevents submission when name is empty', () => {
      render(<ContactForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: '建立' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submission when name has value', () => {
      render(<ContactForm {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox', { name: /姓名/ }), {
        target: { value: 'Test' },
      });

      const submitButton = screen.getByRole('button', { name: '建立' });
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submission when name only has whitespace', () => {
      render(<ContactForm {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox', { name: /姓名/ }), {
        target: { value: '   ' },
      });

      const submitButton = screen.getByRole('button', { name: '建立' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Submitting State', () => {
    it('shows "儲存中..." when submitting', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} isSubmitting={true} />);

      expect(screen.getByRole('button', { name: '儲存中...' })).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      render(<ContactForm {...defaultProps} contact={mockContact} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: '儲存中...' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Close/Cancel', () => {
    it('renders close button', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ContactForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<ContactForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ContactForm {...defaultProps} onClose={onClose} />);

      // Find backdrop by aria-hidden
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has form element', () => {
      render(<ContactForm {...defaultProps} />);

      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('close button has type button', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toHaveAttribute('type', 'button');
    });

    it('cancel button has type button', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '取消' })).toHaveAttribute('type', 'button');
    });

    it('submit button has type submit', () => {
      render(<ContactForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立' })).toHaveAttribute('type', 'submit');
    });
  });
});
