/**
 * ExportAuditLogsModal Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ExportAuditLogsModal } from '@/components/features/admin/ExportAuditLogsModal';
import type { AuditLogFilters } from '@/hooks/useAuditLogs';

// Mock hook
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useAuditLogs', () => ({
  useExportAuditLogs: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

import { useExportAuditLogs } from '@/hooks/useAuditLogs';

describe('ExportAuditLogsModal', () => {
  const emptyFilters: AuditLogFilters = {};
  const defaultProps = {
    filters: emptyFilters,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    vi.mocked(useExportAuditLogs).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useExportAuditLogs>);
  });

  describe('Rendering', () => {
    it('renders dialog with title', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('匯出審計日誌')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });

    it('renders format selection', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('匯出格式')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('renders limit select', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByLabelText('最大筆數')).toBeInTheDocument();
    });

    it('renders cancel and export buttons', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('匯出')).toBeInTheDocument();
    });

    it('renders format descriptions', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('Excel 相容')).toBeInTheDocument();
      expect(screen.getByText('程式處理')).toBeInTheDocument();
    });
  });

  describe('Format Selection', () => {
    it('defaults to CSV format', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      // CSV button should have accent style
      const csvButton = screen.getByText('CSV').closest('button');
      expect(csvButton).toBeInTheDocument();
    });

    it('switches to JSON format', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      fireEvent.click(screen.getByText('JSON').closest('button')!);

      // Export with JSON format
      fireEvent.click(screen.getByText('匯出'));

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'json' })
      );
    });
  });

  describe('Limit Selection', () => {
    it('defaults to 1000', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      const select = screen.getByLabelText('最大筆數') as HTMLSelectElement;
      expect(select.value).toBe('1000');
    });

    it('allows changing limit', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      const select = screen.getByLabelText('最大筆數');
      fireEvent.change(select, { target: { value: '5000' } });

      fireEvent.click(screen.getByText('匯出'));

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5000 })
      );
    });

    it('renders all limit options', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      const select = screen.getByLabelText('最大筆數');
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(5);
    });
  });

  describe('Filter Info', () => {
    it('does not show filter info when no filters active', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.queryByText('將套用目前的篩選條件：')).not.toBeInTheDocument();
    });

    it('shows filter info when filters are active', () => {
      const filters: AuditLogFilters = {
        action: 'create',
        entity: 'customer',
      };
      render(<ExportAuditLogsModal {...defaultProps} filters={filters} />);

      expect(screen.getByText('將套用目前的篩選條件：')).toBeInTheDocument();
      expect(screen.getByText('• 操作類型: create')).toBeInTheDocument();
      expect(screen.getByText('• 實體類型: customer')).toBeInTheDocument();
    });

    it('shows date filters', () => {
      const filters: AuditLogFilters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      render(<ExportAuditLogsModal {...defaultProps} filters={filters} />);

      expect(screen.getByText('• 開始日期: 2026-01-01')).toBeInTheDocument();
      expect(screen.getByText('• 結束日期: 2026-01-31')).toBeInTheDocument();
    });

    it('shows user filter', () => {
      const filters: AuditLogFilters = { userId: 'user-1' };
      render(<ExportAuditLogsModal {...defaultProps} filters={filters} />);

      expect(screen.getByText('• 指定用戶')).toBeInTheDocument();
    });
  });

  describe('Export Action', () => {
    it('calls mutateAsync with CSV params', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      fireEvent.click(screen.getByText('匯出'));

      expect(mockMutateAsync).toHaveBeenCalledWith({
        format: 'csv',
        limit: 1000,
      });
    });

    it('includes filters in export params', () => {
      const filters: AuditLogFilters = { action: 'create', entity: 'customer' };
      render(<ExportAuditLogsModal {...defaultProps} filters={filters} />);

      fireEvent.click(screen.getByText('匯出'));

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entity: 'customer',
        })
      );
    });

    it('calls onClose after successful export', async () => {
      const onClose = vi.fn();
      render(<ExportAuditLogsModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('匯出'));

      // Wait for async
      await vi.waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not call onClose on export error', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Export failed'));
      const onClose = vi.fn();
      render(<ExportAuditLogsModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('匯出'));

      // Wait a tick
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading text when exporting', () => {
      vi.mocked(useExportAuditLogs).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useExportAuditLogs>);

      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('匯出中...')).toBeInTheDocument();
    });

    it('disables cancel button when exporting', () => {
      vi.mocked(useExportAuditLogs).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useExportAuditLogs>);

      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeDisabled();
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ExportAuditLogsModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<ExportAuditLogsModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ExportAuditLogsModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type button on close button', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toHaveAttribute('type', 'button');
    });

    it('has type button on format buttons', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      const csvBtn = screen.getByText('CSV').closest('button');
      const jsonBtn = screen.getByText('JSON').closest('button');
      expect(csvBtn).toHaveAttribute('type', 'button');
      expect(jsonBtn).toHaveAttribute('type', 'button');
    });

    it('has radiogroup for format selection', () => {
      render(<ExportAuditLogsModal {...defaultProps} />);

      expect(screen.getByRole('radiogroup', { name: '匯出格式選擇' })).toBeInTheDocument();
    });
  });
});
