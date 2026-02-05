/**
 * useDeals Hook Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeals, useDeal, useCreateDeal, useUpdateDeal, useDeleteDeal } from '@/hooks/useDeals';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockListResponse = {
  success: true,
  data: [
    { id: 'd1', title: 'Deal 1', value: 100000, stage: 'lead' },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe('useDeals Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDeals', () => {
    it('calls apiClient.get with correct URL', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      renderHook(() => useDeals(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/deals', {});
      });
    });

    it('passes query params correctly', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      renderHook(() => useDeals({ page: 2, stage: 'proposal', search: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/deals', {
          page: '2',
          stage: 'proposal',
          search: 'test',
        });
      });
    });

    it('returns data on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      const { result } = renderHook(() => useDeals(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
    });
  });

  describe('useCreateDeal', () => {
    it('calls apiClient.post with correct URL', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: {} });

      const { result } = renderHook(() => useCreateDeal(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ title: 'New Deal', value: 50000 });
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/deals', {
          title: 'New Deal',
          value: 50000,
        });
      });
    });
  });

  describe('useDeal', () => {
    it('calls apiClient.get with correct URL for single deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { id: 'd1', title: 'Deal 1', value: 100000, stage: 'lead' },
      });

      renderHook(() => useDeal('d1'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/deals/d1');
      });
    });

    it('returns data on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { id: 'd1', title: 'Deal 1', value: 100000, stage: 'lead' },
      });

      const { result } = renderHook(() => useDeal('d1'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual({
        id: 'd1',
        title: 'Deal 1',
        value: 100000,
        stage: 'lead',
      });
    });
  });

  describe('useUpdateDeal', () => {
    it('calls apiClient.put with correct URL and data', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: {} });

      const { result } = renderHook(() => useUpdateDeal(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ id: 'deal-123', title: 'Updated Deal', value: 75000 });
      });

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/api/deals/deal-123', {
          title: 'Updated Deal',
          value: 75000,
        });
      });
    });
  });

  describe('useDeleteDeal', () => {
    it('calls apiClient.delete with correct URL', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteDeal(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate('deal-123');
      });

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/api/deals/deal-123');
      });
    });
  });
});
