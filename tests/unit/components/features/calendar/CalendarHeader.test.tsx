/**
 * CalendarHeader Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarHeader } from '@/components/features/calendar/CalendarHeader';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left">←</span>,
  ChevronRight: () => <span data-testid="icon-chevron-right">→</span>,
  Plus: () => <span data-testid="icon-plus">+</span>,
}));

describe('CalendarHeader Component', () => {
  const defaultProps = {
    year: 2026,
    month: 1, // February (0-indexed)
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onToday: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('displays current year and month', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getByText('2026年 二月')).toBeInTheDocument();
    });

    it('displays correct month name for all months', () => {
      const months = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月',
      ];

      months.forEach((monthName, index) => {
        const { unmount } = render(<CalendarHeader {...defaultProps} month={index} />);
        expect(screen.getByText(`2026年 ${monthName}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('renders navigation buttons', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getByLabelText('上個月')).toBeInTheDocument();
      expect(screen.getByLabelText('下個月')).toBeInTheDocument();
      expect(screen.getByText('今天')).toBeInTheDocument();
    });

    it('renders add task button when handler is provided', () => {
      render(<CalendarHeader {...defaultProps} onAddTask={vi.fn()} />);

      expect(screen.getByText('新增任務')).toBeInTheDocument();
    });

    it('does not render add task button when handler is not provided', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.queryByText('新增任務')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onPrevMonth when previous button is clicked', () => {
      render(<CalendarHeader {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('上個月'));

      expect(defaultProps.onPrevMonth).toHaveBeenCalledTimes(1);
    });

    it('calls onNextMonth when next button is clicked', () => {
      render(<CalendarHeader {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('下個月'));

      expect(defaultProps.onNextMonth).toHaveBeenCalledTimes(1);
    });

    it('calls onToday when today button is clicked', () => {
      render(<CalendarHeader {...defaultProps} />);

      fireEvent.click(screen.getByText('今天'));

      expect(defaultProps.onToday).toHaveBeenCalledTimes(1);
    });

    it('calls onAddTask when add task button is clicked', () => {
      const onAddTask = vi.fn();
      render(<CalendarHeader {...defaultProps} onAddTask={onAddTask} />);

      fireEvent.click(screen.getByText('新增任務'));

      expect(onAddTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for navigation buttons', () => {
      render(<CalendarHeader {...defaultProps} />);

      const prevButton = screen.getByLabelText('上個月');
      const nextButton = screen.getByLabelText('下個月');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('buttons have proper type attribute', () => {
      render(<CalendarHeader {...defaultProps} onAddTask={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('buttons have minimum touch target size', () => {
      render(<CalendarHeader {...defaultProps} onAddTask={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });
});
