/**
 * useAuditLogs Hook Tests
 * Unit tests for audit log viewing and export hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import {
  useAuditLogs,
  useExportAuditLogs,
  auditLogKeys,
} from '@/hooks/useAuditLogs';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock fetch for export
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock URL and document for download
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
globalThis.URL.createObjectURL = mockCreateObjectURL;
globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

const mockAuditLogs = [
  {
    id: 'log-1',
    action: 'create',
    entity: 'customer',
    entityId: 'cust-1',
    user: {
      id: 'user-1',
      name: '張三',
      email: 'zhang@example.com',
      image: null,
    },
    details: { name: '新客戶' },
    metadata: { source: 'web' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'log-2',
    action: 'update',
    entity: 'deal',
    entityId: 'deal-1',
    user: {
      id: 'user-2',
      name: '李四',
      email: 'li@example.com',
    },
    details: { stage: 'won' },
    metadata: null,
    ipAddress: '10.0.0.1',
    userAgent: 'Chrome',
    createdAt: '2026-02-05T09:30:00Z',
  },
  {
    id: 'log-3',
    action: 'delete',
    entity: 'document',
    entityId: null,
    user: null,
    details: null,
    metadata: null,
    ipAddress: null,
    userAgent: null,
    createdAt: '2026-02-05T09:00:00Z',
  },
];

const mockFilterOptions = {
  actions: ['create', 'update', 'delete'],
  entities: ['customer', 'deal', 'document'],
  users: [
    { id: 'user-1', name: '張三', email: 'zhang@example.com' },
    { id: 'user-2', name: '李四', email: 'li@example.com' },
  ],
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

describe('useAuditLogs Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auditLogKeys', () => {
    it('generates correct query keys', () => {
      expect(auditLogKeys.all).toEqual(['audit-logs']);
      expect(auditLogKeys.lists()).toEqual(['audit-logs', 'list']);
      expect(auditLogKeys.list({ page: 1 })).toEqual(['audit-logs', 'list', { page: 1 }]);
      expect(auditLogKeys.list({ action: 'create', page: 1 })).toEqual([
        'audit-logs',
        'list',
        { action: 'create', page: 1 },
      ]);
    });
  });

  describe('useAuditLogs', () => {
    it('fetches audit logs with default options', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs?page=1&limit=20');
      expect(result.current.data?.data).toHaveLength(3);
    });

    it('fetches audit logs with action filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({ filters: { action: 'create' } }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs?page=1&limit=20&action=create');
    });

    it('fetches audit logs with entity filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[1]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({ filters: { entity: 'deal' } }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs?page=1&limit=20&entity=deal');
    });

    it('fetches audit logs with userId filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({ filters: { userId: 'user-1' } }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs?page=1&limit=20&userId=user-1');
    });

    it('fetches audit logs with date range filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({
          filters: {
            startDate: '2026-02-01',
            endDate: '2026-02-05',
          },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/admin/audit-logs?page=1&limit=20&startDate=2026-02-01&endDate=2026-02-05'
      );
    });

    it('fetches audit logs with search filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({ filters: { search: '張三' } }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search='));
    });

    it('fetches audit logs with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[1]],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({ page: 2, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs?page=2&limit=10');
      expect(result.current.data?.pagination.page).toBe(2);
    });

    it('fetches audit logs with all filters combined', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockAuditLogs[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs({
          filters: {
            action: 'create',
            entity: 'customer',
            userId: 'user-1',
            startDate: '2026-02-01',
            endDate: '2026-02-05',
          },
          page: 1,
          limit: 20,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const url = vi.mocked(apiClient.get).mock.calls[0][0];
      expect(url).toContain('action=create');
      expect(url).toContain('entity=customer');
      expect(url).toContain('userId=user-1');
      expect(url).toContain('startDate=2026-02-01');
      expect(url).toContain('endDate=2026-02-05');
    });

    it('returns filter options in response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockAuditLogs,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
        filterOptions: mockFilterOptions,
      });

      const { result } = renderHook(
        () => useAuditLogs(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.filterOptions.actions).toContain('create');
      expect(result.current.data?.filterOptions.entities).toContain('customer');
      expect(result.current.data?.filterOptions.users).toHaveLength(2);
    });
  });

  describe('useExportAuditLogs', () => {
    let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      };
      originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('exports audit logs to CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        }),
      });

      const { result } = renderHook(
        () => useExportAuditLogs(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({ format: 'csv' });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv' }),
      });
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('exports audit logs to JSON', async () => {
      const mockBlob = new Blob(['{"data":[]}'], { type: 'application/json' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="audit-logs.json"',
        }),
      });

      const { result } = renderHook(
        () => useExportAuditLogs(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({ format: 'json' });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      });
    });

    it('exports with filters', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({}),
      });

      const { result } = renderHook(
        () => useExportAuditLogs(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({
          format: 'csv',
          action: 'create',
          entity: 'customer',
          startDate: '2026-02-01',
          endDate: '2026-02-05',
          limit: 100,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          action: 'create',
          entity: 'customer',
          startDate: '2026-02-01',
          endDate: '2026-02-05',
          limit: 100,
        }),
      });
    });

    it('handles export error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(
        () => useExportAuditLogs(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({ format: 'csv' });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('uses fallback filename when Content-Disposition is missing', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({}), // No Content-Disposition
      });

      const { result } = renderHook(
        () => useExportAuditLogs(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        result.current.mutate({ format: 'csv' });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockLink.download).toBe('audit-logs.csv');
    });
  });
});
