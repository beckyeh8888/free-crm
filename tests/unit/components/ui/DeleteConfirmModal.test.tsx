/**
 * DeleteConfirmModal Component Tests
 * Tests for reusable delete confirmation dialog
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    entityType: '客戶',
    entityName: '台灣科技公司',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog with aria-label', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '確認刪除' })).toBeInTheDocument();
    });

    it('renders entity type in title', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText('確認刪除客戶？')).toBeInTheDocument();
    });

    it('renders entity name in description', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText(/台灣科技公司/)).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });

    it('renders confirm button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '確認刪除' })).toBeInTheDocument();
    });
  });

  describe('Warning Message', () => {
    it('does not render warning when not provided', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.queryByText('刪除客戶將同時刪除其所有聯絡人資料。')).not.toBeInTheDocument();
    });

    it('renders warning message when provided', () => {
      render(
        <DeleteConfirmModal
          {...defaultProps}
          warningMessage="刪除客戶將同時刪除其所有聯絡人資料。"
        />
      );

      expect(screen.getByText('刪除客戶將同時刪除其所有聯絡人資料。')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<DeleteConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: '確認刪除' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<DeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
      const onCancel = vi.fn();
      render(<DeleteConfirmModal {...defaultProps} onCancel={onCancel} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows "刪除中..." when isDeleting is true', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={true} />);

      expect(screen.getByRole('button', { name: '刪除中...' })).toBeInTheDocument();
    });

    it('disables confirm button when isDeleting is true', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={true} />);

      expect(screen.getByRole('button', { name: '刪除中...' })).toBeDisabled();
    });

    it('shows "確認刪除" when isDeleting is false', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={false} />);

      expect(screen.getByRole('button', { name: '確認刪除' })).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('all buttons have type="button"', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button).toHaveAttribute('type', 'button');
      }
    });

    it('has min-h-[44px] touch targets on buttons', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const cancelBtn = screen.getByRole('button', { name: '取消' });
      const confirmBtn = screen.getByRole('button', { name: '確認刪除' });

      expect(cancelBtn.className).toContain('min-h-[44px]');
      expect(confirmBtn.className).toContain('min-h-[44px]');
    });
  });

  describe('Different Entity Types', () => {
    it('renders with 商機 entity type', () => {
      render(
        <DeleteConfirmModal
          {...defaultProps}
          entityType="商機"
          entityName="大型企業方案"
        />
      );

      expect(screen.getByText('確認刪除商機？')).toBeInTheDocument();
      expect(screen.getByText(/大型企業方案/)).toBeInTheDocument();
    });

    it('renders with 聯絡人 entity type', () => {
      render(
        <DeleteConfirmModal
          {...defaultProps}
          entityType="聯絡人"
          entityName="王小明"
        />
      );

      expect(screen.getByText('確認刪除聯絡人？')).toBeInTheDocument();
      expect(screen.getByText(/王小明/)).toBeInTheDocument();
    });
  });
});
