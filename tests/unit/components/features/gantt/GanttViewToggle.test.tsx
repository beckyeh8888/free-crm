/**
 * GanttViewToggle Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GanttViewToggle, type TimeRange } from '@/components/features/gantt/GanttViewToggle';

describe('GanttViewToggle Component', () => {
  const defaultProps = {
    value: 'month' as TimeRange,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('renders all time range options', () => {
      render(<GanttViewToggle {...defaultProps} />);

      expect(screen.getByText('週')).toBeInTheDocument();
      expect(screen.getByText('月')).toBeInTheDocument();
      expect(screen.getByText('季')).toBeInTheDocument();
      expect(screen.getByText('年')).toBeInTheDocument();
    });

    it('highlights selected option', () => {
      render(<GanttViewToggle {...defaultProps} value="month" />);

      const monthButton = screen.getByRole('radio', { name: '月' });
      expect(monthButton).toHaveAttribute('aria-checked', 'true');
    });

    it('marks non-selected options as unchecked', () => {
      render(<GanttViewToggle {...defaultProps} value="month" />);

      const weekButton = screen.getByRole('radio', { name: '週' });
      expect(weekButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Interactions', () => {
    it('calls onChange when week is clicked', () => {
      render(<GanttViewToggle {...defaultProps} />);

      fireEvent.click(screen.getByText('週'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('week');
    });

    it('calls onChange when month is clicked', () => {
      render(<GanttViewToggle {...defaultProps} value="week" />);

      fireEvent.click(screen.getByText('月'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('month');
    });

    it('calls onChange when quarter is clicked', () => {
      render(<GanttViewToggle {...defaultProps} />);

      fireEvent.click(screen.getByText('季'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('quarter');
    });

    it('calls onChange when year is clicked', () => {
      render(<GanttViewToggle {...defaultProps} />);

      fireEvent.click(screen.getByText('年'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('year');
    });

    it('calls onChange even when clicking already selected option', () => {
      render(<GanttViewToggle {...defaultProps} value="month" />);

      fireEvent.click(screen.getByText('月'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('month');
    });
  });

  describe('Accessibility', () => {
    it('has radiogroup role', () => {
      render(<GanttViewToggle {...defaultProps} />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('all options have radio role', () => {
      render(<GanttViewToggle {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(4);
    });

    it('buttons have proper type attribute', () => {
      render(<GanttViewToggle {...defaultProps} />);

      const buttons = screen.getAllByRole('radio');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('buttons have minimum touch target size', () => {
      render(<GanttViewToggle {...defaultProps} />);

      const buttons = screen.getAllByRole('radio');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[36px]');
      });
    });
  });

  describe('State Management', () => {
    it('updates visual selection when value prop changes', () => {
      const { rerender } = render(<GanttViewToggle {...defaultProps} value="week" />);

      expect(screen.getByRole('radio', { name: '週' })).toHaveAttribute('aria-checked', 'true');

      rerender(<GanttViewToggle {...defaultProps} value="quarter" />);

      expect(screen.getByRole('radio', { name: '週' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: '季' })).toHaveAttribute('aria-checked', 'true');
    });
  });
});
