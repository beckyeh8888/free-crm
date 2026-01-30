/**
 * DocumentForm Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentForm } from '@/components/features/documents/DocumentForm';

describe('DocumentForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Create mode', () => {
    it('renders 新增文件 title', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByText('新增文件')).toBeInTheDocument();
    });

    it('renders 建立文件 submit button', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立文件' })).toBeInTheDocument();
    });

    it('has dialog with correct aria-label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '新增文件' })).toBeInTheDocument();
    });

    it('shows mode tabs for text and file input', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('tab', { name: '文字輸入' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '檔案上傳' })).toBeInTheDocument();
    });

    it('defaults to text input mode', () => {
      render(<DocumentForm {...defaultProps} />);

      const textTab = screen.getByRole('tab', { name: '文字輸入' });
      expect(textTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Form fields', () => {
    it('renders name input with label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件名稱/)).toBeInTheDocument();
    });

    it('renders type select with label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件類型/)).toBeInTheDocument();
    });

    it('renders content textarea in text mode', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件內容/)).toBeInTheDocument();
    });

    it('renders customer ID input', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/關聯客戶/)).toBeInTheDocument();
    });

    it('type select has correct options', () => {
      render(<DocumentForm {...defaultProps} />);

      const select = screen.getByLabelText(/文件類型/) as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('contract');
      expect(options).toContain('email');
      expect(options).toContain('meeting_notes');
      expect(options).toContain('quotation');
    });
  });

  describe('File upload mode', () => {
    it('switches to file upload when tab clicked', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      const fileTab = screen.getByRole('tab', { name: '檔案上傳' });
      expect(fileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows upload zone in file mode', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.getByText('拖放檔案至此處')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('shows 儲存中... when isSubmitting', () => {
      render(<DocumentForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: '儲存中...' })).toBeInTheDocument();
    });

    it('disables submit when name is empty', () => {
      render(<DocumentForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit when name is filled', () => {
      render(<DocumentForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'My Document' } });

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('Events', () => {
    it('calls onClose when cancel clicked', () => {
      const onClose = vi.fn();
      render(<DocumentForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<DocumentForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit with form data', () => {
      const onSubmit = vi.fn();
      render(<DocumentForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill in name field
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'New Document' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Document' })
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-modal attribute', () => {
      render(<DocumentForm {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('close button meets minimum touch target (44px)', () => {
      render(<DocumentForm {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: '關閉' });
      expect(closeBtn.className).toContain('min-h-[44px]');
      expect(closeBtn.className).toContain('min-w-[44px]');
    });

    it('submit button meets minimum touch target (44px)', () => {
      render(<DocumentForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn.className).toContain('min-h-[44px]');
    });
  });
});
