/**
 * FilterBar Component Unit Tests
 * Tests for FilterBar with search and select filters
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, FilterField } from '@/components/ui/FilterBar/FilterBar';

describe('FilterBar Component', () => {
  const searchField: FilterField = {
    key: 'search',
    label: '搜尋',
    type: 'search',
    placeholder: '輸入關鍵字',
  };

  const selectField: FilterField = {
    key: 'status',
    label: '狀態',
    type: 'select',
    placeholder: '選擇狀態',
    options: [
      { value: 'active', label: '啟用' },
      { value: 'inactive', label: '停用' },
    ],
  };

  const defaultProps = {
    fields: [searchField, selectField] as readonly FilterField[],
    values: { search: '', status: '' },
    onChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders search role form', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByRole('search', { name: '篩選條件' })).toBeInTheDocument();
    });

    it('renders search field', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByLabelText('搜尋')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('輸入關鍵字')).toBeInTheDocument();
    });

    it('renders select field', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByLabelText('狀態')).toBeInTheDocument();
    });

    it('does not render clear button when no values', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
    });

    it('renders clear button when has values', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除' })).toBeInTheDocument();
    });

    it('renders submit button when showSubmit is true', () => {
      render(<FilterBar {...defaultProps} showSubmit={true} />);

      expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument();
    });

    it('does not render submit button by default', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '搜尋' })).not.toBeInTheDocument();
    });

    it('renders custom submit text', () => {
      render(<FilterBar {...defaultProps} showSubmit={true} submitText="過濾" />);

      expect(screen.getByRole('button', { name: '過濾' })).toBeInTheDocument();
    });

    it('renders custom clear text', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
          clearText="重設"
        />
      );

      expect(screen.getByRole('button', { name: '重設' })).toBeInTheDocument();
    });

    it('renders actions', () => {
      render(
        <FilterBar
          {...defaultProps}
          actions={<button type="button">Custom Action</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onChange when search field changes', () => {
      const handleChange = vi.fn();
      render(<FilterBar {...defaultProps} onChange={handleChange} />);

      const searchInput = screen.getByLabelText('搜尋');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(handleChange).toHaveBeenCalledWith({
        search: 'test query',
        status: '',
      });
    });

    it('calls onChange when select field changes', () => {
      const handleChange = vi.fn();
      render(<FilterBar {...defaultProps} onChange={handleChange} />);

      const selectInput = screen.getByLabelText('狀態');
      fireEvent.change(selectInput, { target: { value: 'active' } });

      expect(handleChange).toHaveBeenCalledWith({
        search: '',
        status: 'active',
      });
    });

    it('calls onClear and resets values when clear button clicked', () => {
      const handleChange = vi.fn();
      const handleClear = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: 'active' }}
          onChange={handleChange}
          onClear={handleClear}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '清除' }));

      expect(handleChange).toHaveBeenCalledWith({
        search: '',
        status: '',
      });
      expect(handleClear).toHaveBeenCalled();
    });

    it('calls onSubmit when form is submitted', () => {
      const handleSubmit = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          showSubmit={true}
          onSubmit={handleSubmit}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '搜尋' }));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('prevents default form submission', () => {
      const handleSubmit = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          showSubmit={true}
          onSubmit={handleSubmit}
        />
      );

      const form = screen.getByRole('search');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      fireEvent(form, submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables all inputs when disabled is true', () => {
      render(<FilterBar {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('搜尋')).toBeDisabled();
      expect(screen.getByLabelText('狀態')).toBeDisabled();
    });

    it('disables submit button when disabled', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSubmit={true}
          disabled={true}
        />
      );

      expect(screen.getByRole('button', { name: '搜尋' })).toBeDisabled();
    });

    it('disables clear button when disabled', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
          disabled={true}
        />
      );

      expect(screen.getByRole('button', { name: '清除' })).toBeDisabled();
    });

    it('disables clear button when loading', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
          loading={true}
        />
      );

      expect(screen.getByRole('button', { name: '清除' })).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading on submit button when loading', () => {
      render(
        <FilterBar
          {...defaultProps}
          showSubmit={true}
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: '搜尋' });
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Layout', () => {
    it('uses horizontal layout by default', () => {
      const { container } = render(<FilterBar {...defaultProps} />);

      const form = container.querySelector('form');
      expect(form?.className).toContain('flex');
    });

    it('uses vertical layout when specified', () => {
      const { container } = render(<FilterBar {...defaultProps} layout="vertical" />);

      const form = container.querySelector('form');
      expect(form?.className).toContain('space-y-4');
    });
  });

  describe('Has Values Detection', () => {
    it('detects empty string values as no values', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: '', status: '' }}
        />
      );

      expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
    });

    it('detects whitespace-only values as no values', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: '   ', status: '' }}
        />
      );

      expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
    });

    it('shows clear button with valid values', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
        />
      );

      expect(screen.getByRole('button', { name: '清除' })).toBeInTheDocument();
    });
  });

  describe('showClear option', () => {
    it('hides clear button when showClear is false even with values', () => {
      render(
        <FilterBar
          {...defaultProps}
          values={{ search: 'test', status: '' }}
          showClear={false}
        />
      );

      expect(screen.queryByRole('button', { name: '清除' })).not.toBeInTheDocument();
    });
  });

  describe('Multiple Fields', () => {
    it('renders multiple fields correctly', () => {
      const fields: FilterField[] = [
        { key: 'name', label: '名稱', type: 'search' },
        { key: 'type', label: '類型', type: 'select', options: [] },
        { key: 'region', label: '地區', type: 'select', options: [] },
      ];

      render(
        <FilterBar
          fields={fields}
          values={{ name: '', type: '', region: '' }}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByLabelText('名稱')).toBeInTheDocument();
      expect(screen.getByLabelText('類型')).toBeInTheDocument();
      expect(screen.getByLabelText('地區')).toBeInTheDocument();
    });
  });
});
