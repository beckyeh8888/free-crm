/**
 * AuditLogFilters Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AuditLogFilters } from '@/components/features/admin/AuditLogFilters';

const defaultProps = {
  filters: {} as Record<string, string | undefined>,
  filterOptions: {
    actions: ['create', 'update', 'delete'],
    entities: ['customer', 'deal'],
    users: [
      { id: 'user-1', name: 'User 1', email: 'u1@test.com' },
      { id: 'user-2', name: null, email: 'u2@test.com' },
    ],
  },
  onFilterChange: vi.fn(),
  onClear: vi.fn(),
};

describe('AuditLogFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter toggle button', () => {
      render(<AuditLogFilters {...defaultProps} />);

      expect(screen.getByText('篩選')).toBeInTheDocument();
    });

    it('does not show filter panel initially', () => {
      render(<AuditLogFilters {...defaultProps} />);

      expect(screen.queryByLabelText('開始日期')).not.toBeInTheDocument();
    });

    it('shows filter panel when toggled', () => {
      render(<AuditLogFilters {...defaultProps} />);

      fireEvent.click(screen.getByText('篩選'));

      expect(screen.getByLabelText('開始日期')).toBeInTheDocument();
      expect(screen.getByLabelText('結束日期')).toBeInTheDocument();
      expect(screen.getByLabelText('操作類型')).toBeInTheDocument();
      expect(screen.getByLabelText('實體類型')).toBeInTheDocument();
    });

    it('shows user filter when options have users', () => {
      render(<AuditLogFilters {...defaultProps} />);

      fireEvent.click(screen.getByText('篩選'));

      expect(screen.getByLabelText('用戶')).toBeInTheDocument();
    });

    it('renders action options with labels', () => {
      render(<AuditLogFilters {...defaultProps} />);

      fireEvent.click(screen.getByText('篩選'));

      const actionSelect = screen.getByLabelText('操作類型');
      expect(actionSelect).toContainHTML('新增');
      expect(actionSelect).toContainHTML('更新');
      expect(actionSelect).toContainHTML('刪除');
    });

    it('renders entity options with labels', () => {
      render(<AuditLogFilters {...defaultProps} />);

      fireEvent.click(screen.getByText('篩選'));

      const entitySelect = screen.getByLabelText('實體類型');
      expect(entitySelect).toContainHTML('客戶');
      expect(entitySelect).toContainHTML('商機');
    });

    it('renders user options showing name or email', () => {
      render(<AuditLogFilters {...defaultProps} />);

      fireEvent.click(screen.getByText('篩選'));

      const userSelect = screen.getByLabelText('用戶');
      expect(userSelect).toContainHTML('User 1');
      expect(userSelect).toContainHTML('u2@test.com');
    });
  });

  describe('Clear Button', () => {
    it('does not show clear button when no filters active', () => {
      render(<AuditLogFilters {...defaultProps} />);

      expect(screen.queryByText('清除篩選')).not.toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      render(
        <AuditLogFilters
          {...defaultProps}
          filters={{ action: 'create' }}
        />
      );

      expect(screen.getByText('清除篩選')).toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', () => {
      const onClear = vi.fn();
      render(
        <AuditLogFilters
          {...defaultProps}
          onClear={onClear}
          filters={{ action: 'create' }}
        />
      );

      fireEvent.click(screen.getByText('清除篩選'));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('shows active filter count badge', () => {
      render(
        <AuditLogFilters
          {...defaultProps}
          filters={{ action: 'create', entity: 'customer' }}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Filter Changes', () => {
    it('calls onFilterChange when action is selected', () => {
      const onFilterChange = vi.fn();
      render(
        <AuditLogFilters {...defaultProps} onFilterChange={onFilterChange} />
      );

      fireEvent.click(screen.getByText('篩選'));
      fireEvent.change(screen.getByLabelText('操作類型'), { target: { value: 'create' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create' })
      );
    });

    it('calls onFilterChange when entity is selected', () => {
      const onFilterChange = vi.fn();
      render(
        <AuditLogFilters {...defaultProps} onFilterChange={onFilterChange} />
      );

      fireEvent.click(screen.getByText('篩選'));
      fireEvent.change(screen.getByLabelText('實體類型'), { target: { value: 'customer' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'customer' })
      );
    });

    it('calls onFilterChange when date is set', () => {
      const onFilterChange = vi.fn();
      render(
        <AuditLogFilters {...defaultProps} onFilterChange={onFilterChange} />
      );

      fireEvent.click(screen.getByText('篩選'));
      fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2026-02-01' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-02-01' })
      );
    });

    it('clears filter value with empty string', () => {
      const onFilterChange = vi.fn();
      render(
        <AuditLogFilters
          {...defaultProps}
          onFilterChange={onFilterChange}
          filters={{ action: 'create' }}
        />
      );

      fireEvent.click(screen.getByText('篩選'));
      fireEvent.change(screen.getByLabelText('操作類型'), { target: { value: '' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: undefined })
      );
    });
  });

  describe('Accessibility', () => {
    it('has type button on toggle button', () => {
      render(<AuditLogFilters {...defaultProps} />);

      const filterButton = screen.getByText('篩選').closest('button');
      expect(filterButton).toHaveAttribute('type', 'button');
    });
  });
});
