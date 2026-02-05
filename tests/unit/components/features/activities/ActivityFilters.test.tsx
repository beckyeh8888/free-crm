/**
 * ActivityFilters Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ActivityFilters } from '@/components/features/activities/ActivityFilters';

const defaultProps = {
  filters: { page: 1, limit: 20 },
  onFiltersChange: vi.fn(),
  filterOptions: {
    actions: ['create', 'update', 'delete'],
    entities: ['customer', 'deal', 'document'],
  },
};

describe('ActivityFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders action filter', () => {
      render(<ActivityFilters {...defaultProps} />);

      expect(screen.getByLabelText('動作類型')).toBeInTheDocument();
    });

    it('renders entity filter', () => {
      render(<ActivityFilters {...defaultProps} />);

      expect(screen.getByLabelText('實體類型')).toBeInTheDocument();
    });

    it('renders start date filter', () => {
      render(<ActivityFilters {...defaultProps} />);

      expect(screen.getByLabelText('開始日期')).toBeInTheDocument();
    });

    it('renders end date filter', () => {
      render(<ActivityFilters {...defaultProps} />);

      expect(screen.getByLabelText('結束日期')).toBeInTheDocument();
    });

    it('renders action options with labels', () => {
      render(<ActivityFilters {...defaultProps} />);

      const actionSelect = screen.getByLabelText('動作類型');
      expect(actionSelect).toContainHTML('新增');
      expect(actionSelect).toContainHTML('更新');
      expect(actionSelect).toContainHTML('刪除');
    });

    it('renders entity options with labels', () => {
      render(<ActivityFilters {...defaultProps} />);

      const entitySelect = screen.getByLabelText('實體類型');
      expect(entitySelect).toContainHTML('客戶');
      expect(entitySelect).toContainHTML('商機');
      expect(entitySelect).toContainHTML('文件');
    });
  });

  describe('Clear Button', () => {
    it('does not show clear button when no filters active', () => {
      render(<ActivityFilters {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '清除所有篩選條件' })).not.toBeInTheDocument();
    });

    it('shows clear button when action filter is set', () => {
      render(
        <ActivityFilters
          {...defaultProps}
          filters={{ ...defaultProps.filters, action: 'create' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除所有篩選條件' })).toBeInTheDocument();
    });

    it('shows clear button when entity filter is set', () => {
      render(
        <ActivityFilters
          {...defaultProps}
          filters={{ ...defaultProps.filters, entity: 'customer' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除所有篩選條件' })).toBeInTheDocument();
    });

    it('shows clear button when date filter is set', () => {
      render(
        <ActivityFilters
          {...defaultProps}
          filters={{ ...defaultProps.filters, startDate: '2026-01-01' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除所有篩選條件' })).toBeInTheDocument();
    });

    it('calls onFiltersChange with cleared filters', () => {
      const onFiltersChange = vi.fn();
      render(
        <ActivityFilters
          {...defaultProps}
          onFiltersChange={onFiltersChange}
          filters={{ page: 2, limit: 20, action: 'create', entity: 'customer' }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '清除所有篩選條件' }));

      expect(onFiltersChange).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('Filter Changes', () => {
    it('calls onFiltersChange when action is selected', () => {
      const onFiltersChange = vi.fn();
      render(
        <ActivityFilters {...defaultProps} onFiltersChange={onFiltersChange} />
      );

      fireEvent.change(screen.getByLabelText('動作類型'), { target: { value: 'create' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', page: 1 })
      );
    });

    it('calls onFiltersChange when entity is selected', () => {
      const onFiltersChange = vi.fn();
      render(
        <ActivityFilters {...defaultProps} onFiltersChange={onFiltersChange} />
      );

      fireEvent.change(screen.getByLabelText('實體類型'), { target: { value: 'customer' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'customer', page: 1 })
      );
    });

    it('calls onFiltersChange when start date is set', () => {
      const onFiltersChange = vi.fn();
      render(
        <ActivityFilters {...defaultProps} onFiltersChange={onFiltersChange} />
      );

      fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2026-02-01' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-02-01', page: 1 })
      );
    });

    it('clears action when empty value is selected', () => {
      const onFiltersChange = vi.fn();
      render(
        <ActivityFilters
          {...defaultProps}
          onFiltersChange={onFiltersChange}
          filters={{ ...defaultProps.filters, action: 'create' }}
        />
      );

      fireEvent.change(screen.getByLabelText('動作類型'), { target: { value: '' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: undefined, page: 1 })
      );
    });
  });

  describe('Accessibility', () => {
    it('has type button on clear button', () => {
      render(
        <ActivityFilters
          {...defaultProps}
          filters={{ ...defaultProps.filters, action: 'create' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除所有篩選條件' })).toHaveAttribute(
        'type',
        'button'
      );
    });
  });
});
