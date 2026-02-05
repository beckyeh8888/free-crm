/**
 * ActivityItem Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ActivityItem } from '@/components/features/activities/ActivityItem';
import type { Activity } from '@/hooks/useActivities';

describe('ActivityItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseActivity: Activity = {
    id: 'act-1',
    action: 'create',
    entity: 'customer',
    entityId: 'cust-1',
    userId: 'user-1',
    user: { name: 'John Doe', email: 'john@test.com' },
    createdAt: '2026-02-05T11:30:00Z',
    details: null,
  };

  describe('Rendering', () => {
    it('renders user name', () => {
      render(<ActivityItem activity={baseActivity} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders action label', () => {
      render(<ActivityItem activity={baseActivity} />);

      expect(screen.getByText('新增了')).toBeInTheDocument();
    });

    it('renders entity label', () => {
      render(<ActivityItem activity={baseActivity} />);

      expect(screen.getByText('客戶')).toBeInTheDocument();
    });

    it('renders time element', () => {
      render(<ActivityItem activity={baseActivity} />);

      const timeEl = screen.getByText('30 分鐘前');
      expect(timeEl).toBeInTheDocument();
      expect(timeEl).toHaveAttribute('datetime', '2026-02-05T11:30:00Z');
    });

    it('shows 剛剛 for very recent activities', () => {
      const recentActivity = {
        ...baseActivity,
        createdAt: '2026-02-05T12:00:00Z',
      };
      render(<ActivityItem activity={recentActivity} />);

      expect(screen.getByText('剛剛')).toBeInTheDocument();
    });

    it('shows hours for activities within a day', () => {
      const hourAgo = {
        ...baseActivity,
        createdAt: '2026-02-05T09:00:00Z',
      };
      render(<ActivityItem activity={hourAgo} />);

      expect(screen.getByText('3 小時前')).toBeInTheDocument();
    });

    it('shows days for activities within a week', () => {
      const daysAgo = {
        ...baseActivity,
        createdAt: '2026-02-03T12:00:00Z',
      };
      render(<ActivityItem activity={daysAgo} />);

      expect(screen.getByText('2 天前')).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('shows email when no name', () => {
      const noNameActivity = {
        ...baseActivity,
        user: { name: null, email: 'john@test.com' },
      };
      render(<ActivityItem activity={noNameActivity} />);

      expect(screen.getByText('john@test.com')).toBeInTheDocument();
    });

    it('shows 系統 when no user', () => {
      const noUserActivity = {
        ...baseActivity,
        user: null,
      } as unknown as Activity;
      render(<ActivityItem activity={noUserActivity} />);

      expect(screen.getByText('系統')).toBeInTheDocument();
    });
  });

  describe('Action Types', () => {
    it('shows 更新了 for update action', () => {
      render(<ActivityItem activity={{ ...baseActivity, action: 'update' }} />);

      expect(screen.getByText('更新了')).toBeInTheDocument();
    });

    it('shows 刪除了 for delete action', () => {
      render(<ActivityItem activity={{ ...baseActivity, action: 'delete' }} />);

      expect(screen.getByText('刪除了')).toBeInTheDocument();
    });

    it('shows raw action for unknown actions', () => {
      render(<ActivityItem activity={{ ...baseActivity, action: 'custom' }} />);

      expect(screen.getByText('custom')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders as button when navigable', () => {
      const onNavigate = vi.fn();
      render(<ActivityItem activity={baseActivity} onNavigate={onNavigate} />);

      expect(screen.getByRole('button', { name: '前往客戶詳情' })).toBeInTheDocument();
    });

    it('calls onNavigate when clicked', () => {
      const onNavigate = vi.fn();
      render(<ActivityItem activity={baseActivity} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole('button', { name: '前往客戶詳情' }));

      expect(onNavigate).toHaveBeenCalledWith('customer', 'cust-1');
    });

    it('does not render as button when no onNavigate', () => {
      render(<ActivityItem activity={baseActivity} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render as button for user entity', () => {
      const userActivity = {
        ...baseActivity,
        entity: 'user',
        entityId: 'user-1',
      };
      render(<ActivityItem activity={userActivity} onNavigate={vi.fn()} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render as button when no entityId', () => {
      const noIdActivity = {
        ...baseActivity,
        entityId: null,
      } as unknown as Activity;
      render(<ActivityItem activity={noIdActivity} onNavigate={vi.fn()} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows navigation arrow when navigable', () => {
      render(<ActivityItem activity={baseActivity} onNavigate={vi.fn()} />);

      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Entity Title', () => {
    it('shows entity title from details.name', () => {
      const withDetails = {
        ...baseActivity,
        details: { name: 'ACME Corp' },
      };
      render(<ActivityItem activity={withDetails} />);

      expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    });

    it('shows entity title from details.title', () => {
      const withDetails = {
        ...baseActivity,
        details: { title: 'Big Deal' },
      };
      render(<ActivityItem activity={withDetails} />);

      expect(screen.getByText('Big Deal')).toBeInTheDocument();
    });
  });
});
