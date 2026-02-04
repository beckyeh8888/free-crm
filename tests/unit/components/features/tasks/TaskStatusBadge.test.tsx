/**
 * TaskStatusBadge Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStatusBadge, type TaskStatus } from '@/components/features/tasks/TaskStatusBadge';

// Mock design tokens
vi.mock('@/lib/design-tokens', () => ({
  taskStatusColors: {
    pending: '#6B7280',
    in_progress: '#3B82F6',
    completed: '#22C55E',
    cancelled: '#EF4444',
  },
  taskStatusLabels: {
    pending: '待處理',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消',
  },
}));

describe('TaskStatusBadge Component', () => {
  const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

  describe('Label Display', () => {
    const labels: Record<TaskStatus, string> = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      cancelled: '已取消',
    };

    statuses.forEach((status) => {
      it(`renders correct label for ${status} status`, () => {
        render(<TaskStatusBadge status={status} />);
        expect(screen.getByText(labels[status])).toBeInTheDocument();
      });
    });

    it('renders default label for unknown status', () => {
      // @ts-expect-error Testing unknown status
      render(<TaskStatusBadge status="unknown" />);
      expect(screen.getByText('待處理')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<TaskStatusBadge status="completed" size="sm" />);
      const badge = screen.getByText('已完成');
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');
    });

    it('renders medium size by default', () => {
      render(<TaskStatusBadge status="completed" />);
      const badge = screen.getByText('已完成');
      expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
    });
  });

  describe('Custom Class', () => {
    it('applies custom className', () => {
      render(<TaskStatusBadge status="pending" className="custom-class" />);
      const badge = screen.getByText('待處理');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Styling', () => {
    it('has inline background and text color', () => {
      render(<TaskStatusBadge status="completed" />);
      const badge = screen.getByText('已完成');
      expect(badge).toHaveStyle({
        backgroundColor: '#22C55E20',
        color: '#22C55E',
      });
    });

    it('has rounded-full corners (pill shape)', () => {
      render(<TaskStatusBadge status="pending" />);
      const badge = screen.getByText('待處理');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Status Indicator Dot', () => {
    it('renders status indicator dot', () => {
      const { container } = render(<TaskStatusBadge status="in_progress" />);
      const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('dot has aria-hidden', () => {
      const { container } = render(<TaskStatusBadge status="pending" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });
  });
});
