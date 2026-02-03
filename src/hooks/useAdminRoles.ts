/**
 * Admin Roles Management Hooks
 * TanStack Query hooks for role CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Permission {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly id?: string;
}

export interface AdminRole {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly isDefault: boolean;
  readonly organizationId: string | null;
  readonly memberCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly permissions?: readonly Permission[];
  readonly permissionCount?: number;
}

export interface PermissionCategory {
  readonly category: string;
  readonly name: string;
  readonly order: number;
  readonly permissions: readonly Permission[];
}

export interface CreateRoleData {
  readonly name: string;
  readonly description?: string;
  readonly permissions: readonly string[];
  readonly isDefault?: boolean;
}

export interface UpdateRoleData {
  readonly name?: string;
  readonly description?: string;
  readonly permissions?: readonly string[];
  readonly isDefault?: boolean;
}

interface RolesResponse {
  readonly success: boolean;
  readonly data: readonly AdminRole[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
  };
}

interface PermissionsResponse {
  readonly success: boolean;
  readonly data: {
    readonly grouped: readonly PermissionCategory[];
    readonly totalCount: number;
    readonly categories: readonly {
      readonly key: string;
      readonly name: string;
      readonly order: number;
    }[];
  };
}

interface RoleMutationResponse {
  readonly success: boolean;
  readonly data: AdminRole;
}

// ============================================
// Query Keys
// ============================================

export const adminRoleKeys = {
  all: ['admin-roles'] as const,
  lists: () => [...adminRoleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...adminRoleKeys.lists(), filters] as const,
  details: () => [...adminRoleKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminRoleKeys.details(), id] as const,
};

export const permissionKeys = {
  all: ['admin-permissions'] as const,
  grouped: () => [...permissionKeys.all, 'grouped'] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch admin roles list
 */
export function useAdminRoles(options?: {
  readonly includeSystem?: boolean;
  readonly includePermissions?: boolean;
}) {
  const { includeSystem = true, includePermissions = false } = options ?? {};

  return useQuery({
    queryKey: adminRoleKeys.list({ includeSystem, includePermissions }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('includeSystem', String(includeSystem));
      params.set('includePermissions', String(includePermissions));

      const url = `/api/admin/roles?${params.toString()}`;
      return apiClient.get<RolesResponse>(url);
    },
  });
}

/**
 * Fetch all permissions grouped by category
 */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.grouped(),
    queryFn: async () => {
      return apiClient.get<PermissionsResponse>('/api/admin/permissions?groupByCategory=true');
    },
  });
}

/**
 * Create a new custom role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleData) => {
      return apiClient.post<RoleMutationResponse>('/api/admin/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}

/**
 * Update role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { readonly roleId: string; readonly data: UpdateRoleData }) => {
      return apiClient.patch<RoleMutationResponse>(`/api/admin/roles/${roleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}

/**
 * Delete role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      return apiClient.delete<{ readonly success: boolean }>(`/api/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleKeys.all });
    },
  });
}
