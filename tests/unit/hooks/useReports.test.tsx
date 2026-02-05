/**
 * useReports Hooks Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useSalesPipeline,
  useRevenue,
  useCustomerAnalytics,
  useTaskActivity,
  useTeamPerformance,
} from '@/hooks/useReports';

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

describe('useSalesPipeline Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useSalesPipeline(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/sales-pipeline');
    });
  });

  it('passes query parameters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(
      () => useSalesPipeline({ startDate: '2026-01-01', endDate: '2026-12-31' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2026-01-01')
      );
    });
  });

  it('returns data on success', async () => {
    const mockData = { success: true, data: { funnel: [], conversionRates: [], summary: {} } };
    vi.mocked(apiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSalesPipeline(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});

describe('useRevenue Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useRevenue(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/revenue');
    });
  });

  it('passes groupBy parameter', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(
      () => useRevenue({ groupBy: 'quarter' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('groupBy=quarter')
      );
    });
  });

  it('returns data on success', async () => {
    const mockData = { success: true, data: { trends: [], summary: {} } };
    vi.mocked(apiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => useRevenue(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCustomerAnalytics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useCustomerAnalytics(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/customers');
    });
  });

  it('returns data on success', async () => {
    const mockData = { success: true, data: { growth: [], statusDistribution: [], topCustomersByRevenue: [], summary: {} } };
    vi.mocked(apiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCustomerAnalytics(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});

describe('useTaskActivity Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useTaskActivity(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/tasks');
    });
  });

  it('passes date parameters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(
      () => useTaskActivity({ startDate: '2026-01-01' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2026-01-01')
      );
    });
  });
});

describe('useTeamPerformance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient.get with correct URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useTeamPerformance(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/team');
    });
  });

  it('returns data on success', async () => {
    const mockData = { success: true, data: { members: [], summary: {} } };
    vi.mocked(apiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTeamPerformance(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('handles empty params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useTeamPerformance({}), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/team');
    });
  });
});
