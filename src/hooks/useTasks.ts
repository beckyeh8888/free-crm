/**
 * Task hooks - TanStack Query hooks for task CRUD
 * Sprint 5: Calendar & Gantt Chart
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export type TaskType = 'task' | 'call' | 'meeting' | 'email' | 'follow_up' | 'milestone';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly type: TaskType;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly dueTime: string | null;
  readonly completedAt: string | null;
  readonly isAllDay: boolean;
  readonly reminderAt: string | null;
  readonly reminderSent: boolean;
  readonly progress: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy?: {
    readonly id: string;
    readonly name: string | null;
    readonly image: string | null;
  } | null;
  readonly assignedTo?: {
    readonly id: string;
    readonly name: string | null;
    readonly image: string | null;
  } | null;
  readonly project?: {
    readonly id: string;
    readonly name: string;
    readonly color: string | null;
  } | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
  } | null;
  readonly deal?: {
    readonly id: string;
    readonly title: string;
  } | null;
  readonly contact?: {
    readonly id: string;
    readonly name: string;
  } | null;
}

export interface TaskWithDependencies extends Task {
  readonly dependencies?: readonly {
    readonly id: string;
    readonly type: string;
    readonly prerequisite: {
      readonly id: string;
      readonly title: string;
      readonly status: TaskStatus;
    };
  }[];
  readonly dependents?: readonly {
    readonly id: string;
    readonly type: string;
    readonly dependent: {
      readonly id: string;
      readonly title: string;
      readonly status: TaskStatus;
    };
  }[];
}

interface TaskListResponse {
  readonly success: boolean;
  readonly data: readonly Task[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface TaskResponse {
  readonly success: boolean;
  readonly data: Task | TaskWithDependencies;
}

export interface TaskParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly projectId?: string;
  readonly customerId?: string;
  readonly dealId?: string;
  readonly assignedToId?: string;
  readonly dueDateFrom?: string;
  readonly dueDateTo?: string;
  readonly startDateFrom?: string;
  readonly startDateTo?: string;
  readonly sort?: 'dueDate' | 'priority' | 'startDate' | 'createdAt';
  readonly order?: 'asc' | 'desc';
}

export interface CreateTaskData {
  readonly title: string;
  readonly description?: string;
  readonly type?: TaskType;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly startDate?: string;
  readonly dueDate?: string;
  readonly dueTime?: string;
  readonly isAllDay?: boolean;
  readonly reminderAt?: string;
  readonly progress?: number;
  readonly assignedToId?: string | null;
  readonly projectId?: string | null;
  readonly customerId?: string | null;
  readonly dealId?: string | null;
  readonly contactId?: string | null;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  readonly id: string;
}

// ============================================
// Query Hooks
// ============================================

/** 將 TaskParams 轉換為查詢參數物件 */
function buildTaskQueryParams(params: TaskParams): Record<string, string> {
  // 使用 Object.entries 遍歷所有參數，過濾有值的並轉換為字串
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  );
}

export function useTasks(params: TaskParams = {}) {
  const queryParams = buildTaskQueryParams(params);

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiClient.get<TaskListResponse>('/api/tasks', queryParams),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient.get<TaskResponse>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) =>
      apiClient.post<TaskResponse>('/api/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskData) =>
      apiClient.patch<TaskResponse>(`/api/tasks/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ success: boolean; data: { message: string; id: string } }>(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<TaskResponse>(`/api/tasks/${id}/complete`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}

// ============================================
// Dependency Hooks
// ============================================

interface DependencyResponse {
  readonly success: boolean;
  readonly data: {
    readonly taskId: string;
    readonly dependencies: readonly {
      readonly id: string;
      readonly type: string;
      readonly task: {
        readonly id: string;
        readonly title: string;
        readonly status: TaskStatus;
        readonly dueDate: string | null;
      };
    }[];
    readonly dependents: readonly {
      readonly id: string;
      readonly type: string;
      readonly task: {
        readonly id: string;
        readonly title: string;
        readonly status: TaskStatus;
        readonly startDate: string | null;
      };
    }[];
  };
}

export function useTaskDependencies(taskId: string) {
  return useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: () => apiClient.get<DependencyResponse>(`/api/tasks/${taskId}/dependencies`),
    enabled: !!taskId,
  });
}

export interface CreateDependencyData {
  readonly taskId: string;
  readonly prerequisiteId: string;
  readonly type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, ...data }: CreateDependencyData) =>
      apiClient.post(`/api/tasks/${taskId}/dependencies`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}

export interface RemoveDependencyData {
  readonly taskId: string;
  readonly dependencyId?: string;
  readonly prerequisiteId?: string;
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dependencyId, prerequisiteId }: RemoveDependencyData) => {
      const params = new URLSearchParams();
      if (dependencyId) params.set('dependencyId', dependencyId);
      if (prerequisiteId) params.set('prerequisiteId', prerequisiteId);
      const queryString = params.toString();
      const suffix = queryString ? `?${queryString}` : '';
      const url = `/api/tasks/${taskId}/dependencies${suffix}`;
      return apiClient.delete(url);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
    },
  });
}
