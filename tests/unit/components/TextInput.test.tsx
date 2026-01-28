/**
 * TextInput Component Unit Tests
 * Tests for TextInput component with label, error, and hint states
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '@/components/ui/TextInput';

describe('TextInput Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<TextInput />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<TextInput label="Email" />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<TextInput placeholder="Enter email" />);

      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<TextInput className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
    });

    it('renders with custom id', () => {
      render(<TextInput id="custom-id" label="Custom" />);

      const input = screen.getByLabelText('Custom');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Label Association', () => {
    it('associates label with input via htmlFor', () => {
      render(<TextInput label="Username" />);

      const input = screen.getByLabelText('Username');
      const label = screen.getByText('Username');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('generates unique id when not provided', () => {
      render(
        <>
          <TextInput label="First" />
          <TextInput label="Second" />
        </>
      );

      const firstInput = screen.getByLabelText('First');
      const secondInput = screen.getByLabelText('Second');

      expect(firstInput.id).not.toBe(secondInput.id);
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<TextInput />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('min-h-[44px]');
    });

    it('applies small size', () => {
      render(<TextInput size="sm" />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('min-h-[36px]');
    });

    it('applies large size', () => {
      render(<TextInput size="lg" />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('min-h-[52px]');
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<TextInput error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styles', () => {
      render(<TextInput error="Error" />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-red-500');
    });

    it('sets aria-invalid when has error', () => {
      render(<TextInput error="Error" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message via aria-describedby', () => {
      render(<TextInput id="email" error="Invalid email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('error message has alert role', () => {
      render(<TextInput error="Error message" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });

  describe('Hint State', () => {
    it('displays hint text', () => {
      render(<TextInput hint="Enter a valid email address" />);

      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });

    it('links hint via aria-describedby', () => {
      render(<TextInput id="email" hint="Helper text" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-hint');
    });

    it('hides hint when error is present', () => {
      render(<TextInput hint="Helper" error="Error" />);

      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('handles disabled state', () => {
      render(<TextInput disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<TextInput disabled />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('disabled:opacity-60');
    });
  });

  describe('Events', () => {
    it('calls onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<TextInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<TextInput onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<TextInput onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    it('supports type="text" (default)', () => {
      render(<TextInput />);

      // Default input type is text
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('supports type="email"', () => {
      render(<TextInput type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('supports type="password"', () => {
      render(<TextInput type="password" />);

      // Password inputs don't have textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('supports type="search"', () => {
      render(<TextInput type="search" />);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-invalid when no error', () => {
      render(<TextInput />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('is focusable', () => {
      render(<TextInput />);

      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('meets minimum touch target size (44px)', () => {
      render(<TextInput />);

      const input = screen.getByRole('textbox');
      expect(input.className).toContain('min-h-[44px]');
    });

    it('combines hint and error in aria-describedby', () => {
      render(<TextInput id="field" hint="Helper" error="Error" />);

      const input = screen.getByRole('textbox');
      // Both error and hint are linked in aria-describedby (hint is visually hidden but still accessible)
      expect(input).toHaveAttribute('aria-describedby', 'field-error field-hint');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<TextInput ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
