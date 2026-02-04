/**
 * TaskPriorityBadge Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskPriorityBadge, type TaskPriority } from '@/components/features/tasks/TaskPriorityBadge';

// Mock design tokens
vi.mock('@/lib/design-tokens', () => ({
  taskPriorityColors: {
    low: '#6B7280',
    medium: '#3B82F6',
    high: '#F97316',
    urgent: '#EF4444',
  },
  taskPriorityLabels: {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急',
  },
}));

describe('TaskPriorityBadge Component', () => {
  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  describe('Label Display', () => {
    const labels: Record<TaskPriority, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '緊急',
    };

    priorities.forEach((priority) => {
      it(`renders correct label for ${priority} priority`, () => {
        render(<TaskPriorityBadge priority={priority} />);
        expect(screen.getByText(labels[priority])).toBeInTheDocument();
      });
    });

    it('renders default label for unknown priority', () => {
      // @ts-expect-error Testing unknown priority
      render(<TaskPriorityBadge priority="unknown" />);
      expect(screen.getByText('中')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<TaskPriorityBadge priority="high" size="sm" />);
      const badge = screen.getByText('高');
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');
    });

    it('renders medium size by default', () => {
      render(<TaskPriorityBadge priority="high" />);
      const badge = screen.getByText('高');
      expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
    });
  });

  describe('Custom Class', () => {
    it('applies custom className', () => {
      render(<TaskPriorityBadge priority="medium" className="custom-class" />);
      const badge = screen.getByText('中');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Styling', () => {
    it('has inline background and text color', () => {
      render(<TaskPriorityBadge priority="high" />);
      const badge = screen.getByText('高');
      expect(badge).toHaveStyle({
        backgroundColor: '#F9731620',
        color: '#F97316',
      });
    });

    it('has rounded corners', () => {
      render(<TaskPriorityBadge priority="low" />);
      const badge = screen.getByText('低');
      expect(badge).toHaveClass('rounded-md');
    });
  });
});
