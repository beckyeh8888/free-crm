/**
 * Admin Users Management Hooks
 * TanStack Query hooks for user CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface AdminUser {
  readonly memberId: string;
  readonly userId: string;
  readonly name: string | null;
  readonly email: string;
  readonly image: string | null;
  readonly userStatus: string;
  readonly memberStatus: string;
  readonly role: {
    readonly id: string;
    readonly name: string;
    readonly isSystem: boolean;
  };
  readonly joinedAt: string;
  readonly invitedAt: string | null;
  readonly invitedBy: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly has2FA: boolean;
}

export interface AdminUserDetail extends AdminUser {
  readonly emailVerified: string | null;
  readonly security: {
    readonly has2FA: boolean;
    readonly twoFactorVerifiedAt: string | null;
    readonly recentLogins: readonly {
      readonly id: string;
      readonly ip: string;
      readonly device: string;
      readonly browser: string;
      readonly location: string;
      readonly status: string;
      readonly createdAt: string;
    }[];
  };
}

export interface InviteUserData {
  readonly email: string;
  readonly name: string;
  readonly roleId: string;
}

export interface UpdateUserData {
  readonly name?: string;
  readonly roleId?: string;
  readonly status?: 'active' | 'invited' | 'suspended';
}

interface UsersResponse {
  readonly success: boolean;
  readonly data: readonly AdminUser[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface UserDetailResponse {
  readonly success: boolean;
  readonly data: AdminUserDetail;
}

interface MutationResponse {
  readonly success: boolean;
  readonly data: {
    readonly memberId: string;
    readonly userId: string;
    readonly name: string | null;
    readonly email: string;
  };
}

// ============================================
// Query Keys
// ============================================

export const adminUserKeys = {
  all: ['admin-users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...adminUserKeys.lists(), filters] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch admin users list
 */
export function useAdminUsers(options?: {
  readonly search?: string;
  readonly status?: string;
  readonly roleId?: string;
  readonly page?: number;
  readonly limit?: number;
}) {
  const { search = '', status = '', roleId = '', page = 1, limit = 20 } = options ?? {};

  return useQuery({
    queryKey: adminUserKeys.list({ search, status, roleId, page, limit }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (roleId) params.set('roleId', roleId);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const url = `/api/admin/users?${params.toString()}`;
      return apiClient.get<UsersResponse>(url);
    },
  });
}

/**
 * Fetch single user detail
 */
export function useAdminUserDetail(memberId: string | null) {
  return useQuery({
    queryKey: adminUserKeys.detail(memberId ?? ''),
    queryFn: async () => {
      if (!memberId) throw new Error('No member ID');
      return apiClient.get<UserDetailResponse>(`/api/admin/users/${memberId}`);
    },
    enabled: !!memberId,
  });
}

/**
 * Invite a new user to the organization
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteUserData) => {
      return apiClient.post<MutationResponse>('/api/admin/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}

/**
 * Update user information
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, data }: { readonly memberId: string; readonly data: UpdateUserData }) => {
      return apiClient.patch<MutationResponse>(`/api/admin/users/${memberId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(variables.memberId) });
    },
  });
}

/**
 * Delete (remove) user from organization
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return apiClient.delete<{ readonly success: boolean }>(`/api/admin/users/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}

/**
 * Suspend user
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return apiClient.patch<MutationResponse>(`/api/admin/users/${memberId}`, {
        status: 'suspended',
      });
    },
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(memberId) });
    },
  });
}

/**
 * Activate user (unsuspend)
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return apiClient.patch<MutationResponse>(`/api/admin/users/${memberId}`, {
        status: 'active',
      });
    },
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(memberId) });
    },
  });
}
