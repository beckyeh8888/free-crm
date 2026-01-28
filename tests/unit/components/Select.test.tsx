/**
 * Select Component Unit Tests
 * Tests for Select component with options, error states, and accessibility
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/ui/Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Select label="Country" options={mockOptions} />);

      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<Select options={mockOptions} />);

      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Select options={mockOptions} placeholder="Select an option" />);

      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Select options={mockOptions} className="custom-class" />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('custom-class');
    });

    it('renders with custom id', () => {
      render(<Select id="custom-id" label="Custom" options={mockOptions} />);

      const select = screen.getByLabelText('Custom');
      expect(select).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Options', () => {
    it('renders options with correct values', () => {
      render(<Select options={mockOptions} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveValue('option1');
      expect(options[1]).toHaveValue('option2');
      expect(options[2]).toHaveValue('option3');
    });

    it('renders disabled options', () => {
      const optionsWithDisabled = [
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled', disabled: true },
      ];

      render(<Select options={optionsWithDisabled} />);

      expect(screen.getByRole('option', { name: 'Disabled' })).toBeDisabled();
    });

    it('placeholder option is disabled', () => {
      render(<Select options={mockOptions} placeholder="Choose..." />);

      expect(screen.getByRole('option', { name: 'Choose...' })).toBeDisabled();
    });
  });

  describe('Label Association', () => {
    it('associates label with select via htmlFor', () => {
      render(<Select label="Category" options={mockOptions} />);

      const select = screen.getByLabelText('Category');
      const label = screen.getByText('Category');

      expect(label).toHaveAttribute('for', select.id);
    });

    it('generates unique id when not provided', () => {
      render(
        <>
          <Select label="First" options={mockOptions} />
          <Select label="Second" options={mockOptions} />
        </>
      );

      const firstSelect = screen.getByLabelText('First');
      const secondSelect = screen.getByLabelText('Second');

      expect(firstSelect.id).not.toBe(secondSelect.id);
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('min-h-[44px]');
    });

    it('applies small size', () => {
      render(<Select options={mockOptions} size="sm" />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('min-h-[36px]');
    });

    it('applies large size', () => {
      render(<Select options={mockOptions} size="lg" />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('min-h-[52px]');
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<Select options={mockOptions} error="Please select an option" />);

      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('applies error styles', () => {
      render(<Select options={mockOptions} error="Error" />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('border-red-500');
    });

    it('sets aria-invalid when has error', () => {
      render(<Select options={mockOptions} error="Error" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message via aria-describedby', () => {
      render(<Select id="category" options={mockOptions} error="Required" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'category-error');
    });

    it('error message has alert role', () => {
      render(<Select options={mockOptions} error="Error message" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });

  describe('Disabled State', () => {
    it('handles disabled state', () => {
      render(<Select options={mockOptions} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Select options={mockOptions} disabled />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('disabled:opacity-60');
    });
  });

  describe('Events', () => {
    it('calls onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'option2' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Select options={mockOptions} onFocus={handleFocus} />);

      const select = screen.getByRole('combobox');
      fireEvent.focus(select);

      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<Select options={mockOptions} onBlur={handleBlur} />);

      const select = screen.getByRole('combobox');
      fireEvent.blur(select);

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Controlled Value', () => {
    it('reflects controlled value', () => {
      render(<Select options={mockOptions} value="option2" onChange={() => {}} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });

    it('updates when controlled value changes', () => {
      const { rerender } = render(
        <Select options={mockOptions} value="option1" onChange={() => {}} />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option1');

      rerender(<Select options={mockOptions} value="option3" onChange={() => {}} />);
      expect(select.value).toBe('option3');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-invalid when no error', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });

    it('is focusable', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      select.focus();
      expect(document.activeElement).toBe(select);
    });

    it('meets minimum touch target size (44px)', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select.className).toContain('min-h-[44px]');
    });

    it('supports keyboard navigation', () => {
      render(<Select options={mockOptions} />);

      const select = screen.getByRole('combobox');
      select.focus();

      // Arrow down should work natively
      fireEvent.keyDown(select, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(select);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to select element', () => {
      const ref = { current: null as HTMLSelectElement | null };
      render(<Select ref={ref} options={mockOptions} />);

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(<Select options={[]} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    it('handles options with empty value', () => {
      const optionsWithEmpty = [
        { value: '', label: 'None' },
        { value: 'some', label: 'Some Value' },
      ];

      render(<Select options={optionsWithEmpty} />);

      expect(screen.getByRole('option', { name: 'None' })).toHaveValue('');
    });
  });
});
