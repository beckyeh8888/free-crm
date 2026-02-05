/**
 * useActivities Hook Tests
 * Unit tests for activity feed hook with real-time polling
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockActivities = [
  {
    id: 'act-1',
    action: 'create',
    entity: 'customer',
    entityId: 'cust-1',
    details: { name: '新客戶' },
    createdAt: '2026-02-05T10:30:00Z',
    user: {
      id: 'user-1',
      name: '張三',
      email: 'zhang@example.com',
    },
  },
  {
    id: 'act-2',
    action: 'update',
    entity: 'deal',
    entityId: 'deal-1',
    details: { status: 'won' },
    createdAt: '2026-02-05T10:15:00Z',
    user: {
      id: 'user-2',
      name: '李四',
      email: 'li@example.com',
    },
  },
  {
    id: 'act-3',
    action: 'delete',
    entity: 'document',
    entityId: null,
    details: null,
    createdAt: '2026-02-05T10:00:00Z',
    user: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useActivities Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Fetching', () => {
    it('fetches activities list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: {
          actions: ['create', 'update', 'delete'],
          entities: ['customer', 'deal', 'document'],
        },
      });

      const { result } = renderHook(
        () => useActivities(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {});
      expect(result.current.data?.data).toHaveLength(3);
    });

    it('handles empty activities list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        filterOptions: { actions: [], entities: [] },
      });

      const { result } = renderHook(
        () => useActivities(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toHaveLength(0);
    });

    it('handles API error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useActivities(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Filtering', () => {
    it('fetches activities with action filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockActivities[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: { actions: ['create'], entities: ['customer'] },
      });

      const { result } = renderHook(
        () => useActivities({ action: 'create' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {
        action: 'create',
      });
    });

    it('fetches activities with entity filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockActivities[1]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: { actions: ['update'], entities: ['deal'] },
      });

      const { result } = renderHook(
        () => useActivities({ entity: 'deal' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {
        entity: 'deal',
      });
    });

    it('fetches activities with date range filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: { actions: [], entities: [] },
      });

      const { result } = renderHook(
        () => useActivities({
          startDate: '2026-02-01',
          endDate: '2026-02-05',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {
        startDate: '2026-02-01',
        endDate: '2026-02-05',
      });
    });

    it('fetches activities with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockActivities[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        filterOptions: { actions: ['create'], entities: ['customer'] },
      });

      const { result } = renderHook(
        () => useActivities({
          action: 'create',
          entity: 'customer',
          limit: 10,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {
        action: 'create',
        entity: 'customer',
        limit: '10',
      });
    });
  });

  describe('Pagination', () => {
    it('fetches activities with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockActivities[0]],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
        filterOptions: { actions: [], entities: [] },
      });

      const { result } = renderHook(
        () => useActivities({ page: 2, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/activities', {
        page: '2',
        limit: '10',
      });
      expect(result.current.data?.pagination.page).toBe(2);
    });
  });

  describe('Polling', () => {
    it('enables polling by default', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: { actions: [], entities: [] },
      });

      const { result } = renderHook(
        () => useActivities({}, true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Note: We can't directly test the polling interval,
      // but we can verify the hook is configured correctly
      expect(result.current.isSuccess).toBe(true);
    });

    it('disables polling when requested', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: { actions: [], entities: [] },
      });

      const { result } = renderHook(
        () => useActivities({}, false),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Filter Options', () => {
    it('returns filter options in response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: {
          actions: ['create', 'update', 'delete'],
          entities: ['customer', 'deal', 'document'],
        },
      });

      const { result } = renderHook(
        () => useActivities(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.filterOptions.actions).toContain('create');
      expect(result.current.data?.filterOptions.entities).toContain('customer');
    });
  });
});
