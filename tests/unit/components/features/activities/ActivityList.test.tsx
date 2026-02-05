/**
 * ActivityList Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ActivityList } from '@/components/features/activities/ActivityList';
import type { Activity } from '@/hooks/useActivities';

// Mock ActivityItem
vi.mock('@/components/features/activities/ActivityItem', () => ({
  ActivityItem: ({
    activity,
    onNavigate,
  }: {
    activity: Activity;
    onNavigate?: (entity: string, entityId: string) => void;
  }) => (
    <div data-testid={`activity-${activity.id}`}>
      <span>{activity.action}</span>
      {onNavigate && activity.entityId && (
        <button
          type="button"
          onClick={() => onNavigate(activity.entity, activity.entityId!)}
          data-testid={`navigate-${activity.id}`}
        >
          Navigate
        </button>
      )}
    </div>
  ),
}));

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    action: 'create',
    entity: 'customer',
    entityId: 'cust-1',
    userId: 'user-1',
    user: { name: 'User 1', email: 'u1@test.com' },
    createdAt: '2026-02-05T10:00:00Z',
    details: null,
  },
  {
    id: 'act-2',
    action: 'update',
    entity: 'deal',
    entityId: 'deal-1',
    userId: 'user-1',
    user: { name: 'User 1', email: 'u1@test.com' },
    createdAt: '2026-02-05T09:00:00Z',
    details: null,
  },
];

describe('ActivityList', () => {
  const defaultProps = {
    activities: mockActivities,
    isLoading: false,
    onNavigateToEntity: vi.fn(),
  };

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      const { container } = render(
        <ActivityList activities={[]} isLoading={true} onNavigateToEntity={vi.fn()} />
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders 5 skeleton items', () => {
      const { container } = render(
        <ActivityList activities={[]} isLoading={true} onNavigateToEntity={vi.fn()} />
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(5);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no activities', () => {
      render(
        <ActivityList activities={[]} isLoading={false} onNavigateToEntity={vi.fn()} />
      );

      expect(screen.getByText('尚無活動記錄')).toBeInTheDocument();
    });
  });

  describe('Activity Display', () => {
    it('renders activities', () => {
      render(<ActivityList {...defaultProps} />);

      expect(screen.getByTestId('activity-act-1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-act-2')).toBeInTheDocument();
    });

    it('renders section with aria-label', () => {
      render(<ActivityList {...defaultProps} />);

      expect(screen.getByLabelText('活動列表')).toBeInTheDocument();
    });

    it('renders correct number of activities', () => {
      render(<ActivityList {...defaultProps} />);

      expect(screen.getByText('create')).toBeInTheDocument();
      expect(screen.getByText('update')).toBeInTheDocument();
    });
  });
});
