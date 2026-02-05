/**
 * useDashboardStats Hook Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

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
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockStatsResponse = {
  success: true,
  data: {
    customerCount: 10,
    dealCount: 5,
    documentCount: 3,
    totalRevenue: 2000000,
    pipelineStages: [
      { stage: 'lead', count: 3, value: 500000 },
    ],
    recentActivity: [],
  },
};

describe('useDashboardStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockStatsResponse);

    renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/stats');
    });
  });

  it('returns data on success', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockStatsResponse);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data.customerCount).toBe(10);
    expect(result.current.data?.data.totalRevenue).toBe(2000000);
  });
});
