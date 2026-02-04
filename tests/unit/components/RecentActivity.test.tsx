/**
 * RecentActivity Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentActivity } from '@/components/features/dashboard/RecentActivity';

const mockActivities = [
  {
    id: 'act-1',
    action: 'create',
    entity: 'customer',
    entityId: 'cust-1',
    details: null,
    createdAt: new Date().toISOString(),
    user: { name: 'John Smith', email: 'john@example.com' },
  },
  {
    id: 'act-2',
    action: 'update',
    entity: 'deal',
    entityId: 'deal-1',
    details: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user: { name: null, email: 'admin@example.com' },
  },
  {
    id: 'act-3',
    action: 'delete',
    entity: 'document',
    entityId: 'doc-1',
    details: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user: null,
  },
];

describe('RecentActivity Component', () => {
  describe('Rendering', () => {
    it('renders 近期活動 heading', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByRole('heading', { name: '近期活動' })).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const { container } = render(<RecentActivity activities={mockActivities} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders activity entries with user name', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('renders action and entity labels in Chinese', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('客戶')).toBeInTheDocument();
      expect(screen.getByText('商機')).toBeInTheDocument();
    });

    it('shows email when user name is null', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    it('shows 系統 when user is null', () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText('系統')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no activities', () => {
      render(<RecentActivity activities={[]} />);

      expect(screen.getByText('尚無活動記錄')).toBeInTheDocument();
    });
  });
});
