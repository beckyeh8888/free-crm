/**
 * useProjects Hook Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/useProjects';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockProjects = [
  {
    id: 'proj-1',
    name: '專案一',
    description: '專案描述',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    color: '#3B82F6',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    customerId: 'cust-1',
    customer: { id: 'cust-1', name: '客戶一' },
    _count: { tasks: 5 },
  },
  {
    id: 'proj-2',
    name: '專案二',
    description: null,
    status: 'completed',
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    color: '#10B981',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    customerId: null,
    _count: { tasks: 10 },
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

describe('useProjects Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProjects', () => {
    it('fetches projects list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockProjects,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/projects', {});
      expect(result.current.data?.data).toHaveLength(2);
    });

    it('fetches projects with filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockProjects[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useProjects({ status: 'active', search: '專案' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/projects', {
        status: 'active',
        search: '專案',
      });
    });

    it('fetches projects with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockProjects,
        pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
      });

      const { result } = renderHook(
        () => useProjects({ page: 2, limit: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/projects', {
        page: '2',
        limit: '5',
      });
    });

    it('fetches projects by customer', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockProjects[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useProjects({ customerId: 'cust-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/projects', {
        customerId: 'cust-1',
      });
    });
  });

  describe('useProject', () => {
    it('fetches single project by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockProjects[0],
      });

      const { result } = renderHook(() => useProject('proj-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/projects/proj-1');
      expect(result.current.data?.data.name).toBe('專案一');
    });

    it('does not fetch when id is empty', async () => {
      const { result } = renderHook(() => useProject(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProject', () => {
    it('creates a new project', async () => {
      const newProject = {
        name: '新專案',
        description: '專案描述',
        status: 'active' as const,
        color: '#FF5722',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'proj-new', ...newProject },
      });

      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newProject);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/projects', newProject);
    });

    it('creates project with customer', async () => {
      const newProject = {
        name: '客戶專案',
        customerId: 'cust-1',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'proj-new', ...newProject },
      });

      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newProject);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/projects', newProject);
    });
  });

  describe('useUpdateProject', () => {
    it('updates an existing project', async () => {
      const updateData = {
        id: 'proj-1',
        name: '更新的專案',
        status: 'completed' as const,
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockProjects[0], ...updateData },
      });

      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/projects/proj-1', {
        name: '更新的專案',
        status: 'completed',
      });
    });

    it('updates project dates', async () => {
      const updateData = {
        id: 'proj-1',
        startDate: '2026-03-01',
        endDate: '2026-04-01',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockProjects[0], ...updateData },
      });

      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/projects/proj-1', {
        startDate: '2026-03-01',
        endDate: '2026-04-01',
      });
    });
  });

  describe('useDeleteProject', () => {
    it('deletes a project', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
        data: { message: '已刪除', id: 'proj-1' },
      });

      const { result } = renderHook(() => useDeleteProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('proj-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/projects/proj-1');
    });
  });
});
