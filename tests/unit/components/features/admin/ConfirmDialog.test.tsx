/**
 * ConfirmDialog Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfirmDialog } from '@/components/features/admin/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: '確認刪除',
    message: '此操作無法復原，確定要刪除嗎？',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders alertdialog', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('確認刪除')).toBeInTheDocument();
    });

    it('renders message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('此操作無法復原，確定要刪除嗎？')).toBeInTheDocument();
    });

    it('renders default confirm label', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('確認')).toBeInTheDocument();
    });

    it('renders default cancel label', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('renders custom confirm label', () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="刪除" />);

      expect(screen.getByText('刪除')).toBeInTheDocument();
    });

    it('renders custom cancel label', () => {
      render(<ConfirmDialog {...defaultProps} cancelLabel="返回" />);

      expect(screen.getByText('返回')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('確認'));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when close button is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows 處理中... when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />);

      expect(screen.getByText('處理中...')).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />);

      expect(screen.getByText('處理中...')).toBeDisabled();
      expect(screen.getByText('取消')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-title');
    });

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-message');
    });

    it('has type button on all buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });

    it('dialog has open attribute', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toHaveAttribute('open');
    });
  });
});
