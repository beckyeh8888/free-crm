/**
 * useOrganization Hook Tests
 * Unit tests for organization settings and stats hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import {
  useOrganization,
  useOrganizationStats,
  useUpdateOrganization,
  organizationKeys,
} from '@/hooks/useOrganization';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockOrganization = {
  id: 'org-1',
  name: '測試公司',
  slug: 'test-company',
  plan: 'pro' as const,
  logo: 'https://example.com/logo.png',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  memberCount: 10,
  customerCount: 50,
  documentCount: 100,
};

const mockOrganizationStats = {
  counts: {
    members: 10,
    customers: 50,
    deals: 25,
    documents: 100,
  },
  memberBreakdown: {
    active: 8,
    suspended: 1,
    invited: 1,
  },
  dealBreakdown: {
    open: 15,
    won: 8,
    lost: 2,
  },
  limits: {
    members: 20,
    customers: 100,
    documents: 500,
  },
  usage: {
    membersUsage: 50,
    customersUsage: 50,
    documentsUsage: 20,
  },
};

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

describe('useOrganization Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('organizationKeys', () => {
    it('generates correct query keys', () => {
      expect(organizationKeys.all).toEqual(['organization']);
      expect(organizationKeys.detail()).toEqual(['organization', 'detail']);
      expect(organizationKeys.stats()).toEqual(['organization', 'stats']);
    });
  });

  describe('useOrganization', () => {
    it('fetches organization details', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganization,
      });

      const { result } = renderHook(
        () => useOrganization(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/organization');
      expect(result.current.data?.data.name).toBe('測試公司');
      expect(result.current.data?.data.plan).toBe('pro');
    });

    it('handles organization fetch error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not authorized'));

      const { result } = renderHook(
        () => useOrganization(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('returns organization with all fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganization,
      });

      const { result } = renderHook(
        () => useOrganization(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const org = result.current.data?.data;
      expect(org?.id).toBe('org-1');
      expect(org?.slug).toBe('test-company');
      expect(org?.logo).toBe('https://example.com/logo.png');
      expect(org?.memberCount).toBe(10);
      expect(org?.customerCount).toBe(50);
      expect(org?.documentCount).toBe(100);
    });
  });

  describe('useOrganizationStats', () => {
    it('fetches organization stats', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganizationStats,
      });

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/organization/stats');
    });

    it('returns counts', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganizationStats,
      });

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data?.data;
      expect(stats?.counts.members).toBe(10);
      expect(stats?.counts.customers).toBe(50);
      expect(stats?.counts.deals).toBe(25);
      expect(stats?.counts.documents).toBe(100);
    });

    it('returns member breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganizationStats,
      });

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data?.data;
      expect(stats?.memberBreakdown.active).toBe(8);
      expect(stats?.memberBreakdown.suspended).toBe(1);
      expect(stats?.memberBreakdown.invited).toBe(1);
    });

    it('returns deal breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganizationStats,
      });

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data?.data;
      expect(stats?.dealBreakdown.open).toBe(15);
      expect(stats?.dealBreakdown.won).toBe(8);
      expect(stats?.dealBreakdown.lost).toBe(2);
    });

    it('returns limits and usage', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockOrganizationStats,
      });

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data?.data;
      expect(stats?.limits.members).toBe(20);
      expect(stats?.usage.membersUsage).toBe(50);
    });

    it('handles stats fetch error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Stats unavailable'));

      const { result } = renderHook(
        () => useOrganizationStats(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateOrganization', () => {
    it('updates organization name', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockOrganization,
          name: '新公司名稱',
        },
      });

      const { result } = renderHook(
        () => useUpdateOrganization(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ name: '新公司名稱' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/organization', {
        name: '新公司名稱',
      });
    });

    it('updates organization logo', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockOrganization,
          logo: 'https://example.com/new-logo.png',
        },
      });

      const { result } = renderHook(
        () => useUpdateOrganization(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ logo: 'https://example.com/new-logo.png' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/organization', {
        logo: 'https://example.com/new-logo.png',
      });
    });

    it('removes organization logo', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockOrganization,
          logo: null,
        },
      });

      const { result } = renderHook(
        () => useUpdateOrganization(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ logo: null });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/organization', {
        logo: null,
      });
    });

    it('updates multiple fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockOrganization,
          name: '新名稱',
          logo: 'https://example.com/new-logo.png',
        },
      });

      const { result } = renderHook(
        () => useUpdateOrganization(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        name: '新名稱',
        logo: 'https://example.com/new-logo.png',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/organization', {
        name: '新名稱',
        logo: 'https://example.com/new-logo.png',
      });
    });

    it('handles update error', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Name already taken'));

      const { result } = renderHook(
        () => useUpdateOrganization(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ name: '已存在的名稱' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
