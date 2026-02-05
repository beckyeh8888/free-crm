/**
 * GanttBar Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GanttBar } from '@/components/features/gantt/GanttBar';

// Mock design tokens
vi.mock('@/lib/design-tokens', () => ({
  taskTypeColors: {
    task: '#3B82F6',
    meeting: '#8B5CF6',
    call: '#22C55E',
    email: '#F97316',
    follow_up: '#06B6D4',
    milestone: '#EC4899',
  },
}));

describe('GanttBar Component', () => {
  const defaultProps = {
    title: '任務一',
    type: 'task',
    progress: 50,
    startPercent: 10,
    widthPercent: 30,
  };

  describe('Display', () => {
    it('renders with correct title in tooltip', () => {
      render(<GanttBar {...defaultProps} />);

      const bar = screen.getByRole('button');
      expect(bar).toHaveAttribute('title', '任務一 (50%)');
    });

    it('positions bar correctly', () => {
      render(<GanttBar {...defaultProps} />);

      const bar = screen.getByRole('button');
      expect(bar).toHaveStyle({ left: '10%', width: '30%' });
    });

    it('ensures minimum visible width', () => {
      render(<GanttBar {...defaultProps} widthPercent={1} />);

      const bar = screen.getByRole('button');
      expect(bar).toHaveStyle({ width: '2%' }); // Minimum 2%
    });

    it('uses custom color when provided', () => {
      const customColor = '#FF5722';
      render(<GanttBar {...defaultProps} color={customColor} />);

      const bar = screen.getByRole('button');
      expect(bar).toBeInTheDocument();
    });

    it('shows progress indicator for partial completion', () => {
      const { container } = render(<GanttBar {...defaultProps} progress={50} />);

      // Progress indicator should be present (border-r-2 class)
      const indicator = container.querySelector('.border-r-2');
      expect(indicator).toBeInTheDocument();
    });

    it('hides progress indicator when complete', () => {
      const { container } = render(<GanttBar {...defaultProps} progress={100} />);

      // No border indicator for 100% complete
      const indicator = container.querySelector('.border-r-2');
      expect(indicator).not.toBeInTheDocument();
    });

    it('hides progress indicator when no progress', () => {
      const { container } = render(<GanttBar {...defaultProps} progress={0} />);

      const indicator = container.querySelector('.border-r-2');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<GanttBar {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles Enter key', () => {
      const onClick = vi.fn();
      render(<GanttBar {...defaultProps} onClick={onClick} />);

      const bar = screen.getByRole('button');
      fireEvent.keyDown(bar, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key', () => {
      const onClick = vi.fn();
      render(<GanttBar {...defaultProps} onClick={onClick} />);

      const bar = screen.getByRole('button');
      fireEvent.keyDown(bar, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when clicked without onClick handler', () => {
      render(<GanttBar {...defaultProps} />);

      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<GanttBar {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is focusable', () => {
      render(<GanttBar {...defaultProps} />);

      const bar = screen.getByRole('button');
      expect(bar).toHaveAttribute('tabIndex', '0');
    });

    it('has descriptive title attribute', () => {
      render(<GanttBar {...defaultProps} title="重要任務" progress={75} />);

      const bar = screen.getByRole('button');
      expect(bar).toHaveAttribute('title', '重要任務 (75%)');
    });
  });

  describe('Task Types', () => {
    const taskTypes = ['task', 'meeting', 'call', 'email', 'follow_up', 'milestone'];

    taskTypes.forEach((type) => {
      it(`renders correctly for ${type} type`, () => {
        render(<GanttBar {...defaultProps} type={type} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('falls back to task color for unknown type', () => {
      render(<GanttBar {...defaultProps} type="unknown_type" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
