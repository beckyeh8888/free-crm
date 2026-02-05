/**
 * Project hooks - TanStack Query hooks for project CRUD
 * Sprint 5: Calendar & Gantt Chart
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { ProjectStatus } from '@/lib/validation';

// ============================================
// Types
// ============================================

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: ProjectStatus;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly color: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customerId: string | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
    readonly company?: string | null;
  } | null;
  readonly _count?: {
    readonly tasks: number;
  };
}

interface ProjectListResponse {
  readonly success: boolean;
  readonly data: readonly Project[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface ProjectResponse {
  readonly success: boolean;
  readonly data: Project;
}

export interface ProjectParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly status?: ProjectStatus;
  readonly customerId?: string;
}

export interface CreateProjectData {
  readonly name: string;
  readonly description?: string;
  readonly status?: ProjectStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly color?: string;
  readonly customerId?: string | null;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  readonly id: string;
}

// ============================================
// Query Hooks
// ============================================

export function useProjects(params: ProjectParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.customerId) queryParams.customerId = params.customerId;

  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiClient.get<ProjectListResponse>('/api/projects', queryParams),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.get<ProjectResponse>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) =>
      apiClient.post<ProjectResponse>('/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectData) =>
      apiClient.patch<ProjectResponse>(`/api/projects/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ success: boolean; data: { message: string; id: string } }>(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
