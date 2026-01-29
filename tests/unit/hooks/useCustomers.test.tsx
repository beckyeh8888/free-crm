/**
 * useCustomers Hook Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCustomers, useCreateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';

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
    { id: 'c1', name: 'Customer 1', email: 'c1@test.com', status: 'active' },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe('useCustomers Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCustomers', () => {
    it('calls apiClient.get with correct URL', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      renderHook(() => useCustomers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/customers', {});
      });
    });

    it('passes query params correctly', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      renderHook(() => useCustomers({ page: 2, search: 'test', status: 'active' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/customers', {
          page: '2',
          search: 'test',
          status: 'active',
        });
      });
    });

    it('returns data on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockListResponse);

      const { result } = renderHook(() => useCustomers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
    });
  });

  describe('useCreateCustomer', () => {
    it('calls apiClient.post with correct URL', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: {} });

      const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ name: 'New Customer', email: 'new@test.com' });
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/customers', {
          name: 'New Customer',
          email: 'new@test.com',
        });
      });
    });
  });

  describe('useDeleteCustomer', () => {
    it('calls apiClient.delete with correct URL', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteCustomer(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate('cust-123');
      });

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/api/customers/cust-123');
      });
    });
  });
});
