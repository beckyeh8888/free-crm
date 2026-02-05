/**
 * TaskTypeIcon Component Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskTypeIcon, type TaskType } from '@/components/features/tasks/TaskTypeIcon';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckSquare: ({ className }: { className?: string }) => (
    <span data-testid="icon-task" className={className}>task</span>
  ),
  Phone: ({ className }: { className?: string }) => (
    <span data-testid="icon-call" className={className}>call</span>
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon-meeting" className={className}>meeting</span>
  ),
  Mail: ({ className }: { className?: string }) => (
    <span data-testid="icon-email" className={className}>email</span>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon-follow_up" className={className}>follow_up</span>
  ),
  Flag: ({ className }: { className?: string }) => (
    <span data-testid="icon-milestone" className={className}>milestone</span>
  ),
}));

// Mock design tokens
vi.mock('@/lib/design-tokens', () => ({
  taskTypeColors: {
    task: '#3B82F6',
    call: '#22C55E',
    meeting: '#8B5CF6',
    email: '#F97316',
    follow_up: '#06B6D4',
    milestone: '#EC4899',
  },
  taskTypeLabels: {
    task: '任務',
    call: '電話',
    meeting: '會議',
    email: '郵件',
    follow_up: '跟進',
    milestone: '里程碑',
  },
}));

describe('TaskTypeIcon Component', () => {
  const taskTypes: TaskType[] = ['task', 'call', 'meeting', 'email', 'follow_up', 'milestone'];

  describe('Icon Rendering', () => {
    taskTypes.forEach((type) => {
      it(`renders ${type} icon`, () => {
        render(<TaskTypeIcon type={type} />);
        expect(screen.getByTestId(`icon-${type}`)).toBeInTheDocument();
      });
    });

    it('renders default icon for unknown type', () => {
      // @ts-expect-error Testing unknown type
      render(<TaskTypeIcon type="unknown" />);
      expect(screen.getByTestId('icon-task')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<TaskTypeIcon type="task" size="sm" />);
      const icon = screen.getByTestId('icon-task');
      expect(icon).toHaveClass('w-3.5', 'h-3.5');
    });

    it('renders medium size by default', () => {
      render(<TaskTypeIcon type="task" />);
      const icon = screen.getByTestId('icon-task');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('renders large size', () => {
      render(<TaskTypeIcon type="task" size="lg" />);
      const icon = screen.getByTestId('icon-task');
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Label Display', () => {
    it('does not show label by default', () => {
      render(<TaskTypeIcon type="task" />);
      expect(screen.queryByText('任務')).not.toBeInTheDocument();
    });

    it('shows label when showLabel is true', () => {
      render(<TaskTypeIcon type="task" showLabel />);
      expect(screen.getByText('任務')).toBeInTheDocument();
    });

    taskTypes.forEach((type) => {
      const labels: Record<TaskType, string> = {
        task: '任務',
        call: '電話',
        meeting: '會議',
        email: '郵件',
        follow_up: '跟進',
        milestone: '里程碑',
      };

      it(`shows correct label for ${type}`, () => {
        render(<TaskTypeIcon type={type} showLabel />);
        expect(screen.getByText(labels[type])).toBeInTheDocument();
      });
    });
  });

  describe('Title Attribute', () => {
    it('has title attribute for tooltip', () => {
      const { container } = render(<TaskTypeIcon type="meeting" />);
      const wrapper = container.querySelector('[title]');
      expect(wrapper).toHaveAttribute('title', '會議');
    });
  });

  describe('Custom Class', () => {
    it('applies custom className', () => {
      const { container } = render(<TaskTypeIcon type="task" className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('renders within wrapper span', () => {
      const { container } = render(<TaskTypeIcon type="task" />);
      const wrapper = container.querySelector('span.inline-flex');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
