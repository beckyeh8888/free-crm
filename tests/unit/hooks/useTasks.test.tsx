/**
 * useTasks Hook Tests
 * Sprint 5: Calendar & Gantt Chart
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useTaskDependencies,
  useAddDependency,
  useRemoveDependency,
} from '@/hooks/useTasks';
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

const mockTasks = [
  {
    id: 'task-1',
    title: '任務一',
    description: '描述',
    type: 'task',
    priority: 'medium',
    status: 'pending',
    startDate: '2026-02-01',
    dueDate: '2026-02-10',
    progress: 0,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'task-2',
    title: '任務二',
    description: null,
    type: 'meeting',
    priority: 'high',
    status: 'in_progress',
    startDate: '2026-02-05',
    dueDate: '2026-02-15',
    progress: 50,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-02T00:00:00Z',
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

describe('useTasks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTasks', () => {
    it('fetches tasks list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockTasks,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks', {});
      expect(result.current.data?.data).toHaveLength(2);
    });

    it('fetches tasks with filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockTasks[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useTasks({ status: 'pending', priority: 'medium' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks', {
        status: 'pending',
        priority: 'medium',
      });
    });

    it('fetches tasks with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockTasks,
        pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
      });

      const { result } = renderHook(
        () => useTasks({ page: 2, limit: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks', {
        page: '2',
        limit: '5',
      });
    });
  });

  describe('useTask', () => {
    it('fetches single task by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockTasks[0],
      });

      const { result } = renderHook(() => useTask('task-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/task-1');
      expect(result.current.data?.data.title).toBe('任務一');
    });

    it('does not fetch when id is empty', async () => {
      const { result } = renderHook(() => useTask(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTask', () => {
    it('creates a new task', async () => {
      const newTask = {
        title: '新任務',
        type: 'task' as const,
        priority: 'high' as const,
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'task-new', ...newTask },
      });

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newTask);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/tasks', newTask);
    });
  });

  describe('useUpdateTask', () => {
    it('updates an existing task', async () => {
      const updateData = {
        id: 'task-1',
        title: '更新的任務',
        status: 'completed' as const,
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockTasks[0], ...updateData },
      });

      const { result } = renderHook(() => useUpdateTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/tasks/task-1', {
        title: '更新的任務',
        status: 'completed',
      });
    });
  });

  describe('useDeleteTask', () => {
    it('deletes a task', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
        data: { message: '已刪除', id: 'task-1' },
      });

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('task-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/tasks/task-1');
    });
  });

  describe('useCompleteTask', () => {
    it('marks a task as complete', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { ...mockTasks[0], status: 'completed' },
      });

      const { result } = renderHook(() => useCompleteTask(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('task-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/tasks/task-1/complete');
    });
  });

  describe('useTaskDependencies', () => {
    it('fetches task dependencies', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          taskId: 'task-1',
          dependencies: [],
          dependents: [],
        },
      });

      const { result } = renderHook(() => useTaskDependencies('task-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/tasks/task-1/dependencies');
    });
  });

  describe('useAddDependency', () => {
    it('adds a dependency', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'dep-1', type: 'finish_to_start' },
      });

      const { result } = renderHook(() => useAddDependency(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        prerequisiteId: 'task-2',
        type: 'finish_to_start',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/tasks/task-1/dependencies', {
        prerequisiteId: 'task-2',
        type: 'finish_to_start',
      });
    });
  });

  describe('useRemoveDependency', () => {
    it('removes a dependency by dependencyId', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useRemoveDependency(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        dependencyId: 'dep-1',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/tasks/task-1/dependencies?dependencyId=dep-1'
      );
    });

    it('removes a dependency by prerequisiteId', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useRemoveDependency(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        taskId: 'task-1',
        prerequisiteId: 'task-2',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/tasks/task-1/dependencies?prerequisiteId=task-2'
      );
    });
  });
});
