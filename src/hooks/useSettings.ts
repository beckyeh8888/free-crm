/**
 * Settings hooks - TanStack Query hooks for account/settings API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Profile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image: string | null;
  readonly status: string;
  readonly emailVerified: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly security: {
    readonly has2FA: boolean;
    readonly twoFactorVerifiedAt: string | null;
  };
  readonly organizations: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly plan: string;
    readonly logo: string | null;
    readonly role: {
      readonly id: string;
      readonly name: string;
      readonly description: string;
    };
    readonly joinedAt: string;
  }[];
}

interface ProfileResponse {
  readonly success: boolean;
  readonly data: Profile;
}

export interface LoginHistoryEntry {
  readonly id: string;
  readonly ip: string;
  readonly userAgent: string;
  readonly location: string;
  readonly device: string;
  readonly browser: string;
  readonly status: string;
  readonly failReason: string | null;
  readonly createdAt: string;
  readonly statusLabel: string;
}

interface LoginHistoryResponse {
  readonly success: boolean;
  readonly data: readonly LoginHistoryEntry[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
  readonly summary: {
    readonly totalLogins: number;
    readonly successfulLogins: number;
    readonly failedAttempts: number;
    readonly lastSuccessfulLogin: string | null;
  };
}

interface TwoFactorSetupResponse {
  readonly success: boolean;
  readonly data: {
    readonly qrCode: string;
    readonly secret: string;
    readonly backupCodes: readonly string[];
    readonly instructions: {
      readonly step1: string;
      readonly step2: string;
      readonly step3: string;
    };
  };
}

interface SuccessMessageResponse {
  readonly success: boolean;
  readonly data: {
    readonly success: boolean;
    readonly message: string;
  };
}

interface TwoFactorVerifyResponse {
  readonly success: boolean;
  readonly data: {
    readonly success: boolean;
    readonly message: string;
    readonly enabledAt: string;
  };
}

// ============================================
// Profile Hooks
// ============================================

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get<ProfileResponse>('/api/account/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { readonly name?: string; readonly image?: string | null }) =>
      apiClient.patch<ProfileResponse>('/api/account/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============================================
// Password Hook
// ============================================

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: {
      readonly currentPassword: string;
      readonly newPassword: string;
      readonly confirmPassword: string;
    }) => apiClient.post<SuccessMessageResponse>('/api/account/password', data),
  });
}

// ============================================
// 2FA Hooks
// ============================================

export function useSetup2FA() {
  return useMutation({
    mutationFn: () =>
      apiClient.post<TwoFactorSetupResponse>('/api/account/2fa/setup', {}),
  });
}

export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { readonly token: string }) =>
      apiClient.post<TwoFactorVerifyResponse>('/api/account/2fa/verify', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      readonly password: string;
      readonly token?: string;
      readonly backupCode?: string;
    }) => apiClient.post<SuccessMessageResponse>('/api/account/2fa/disable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============================================
// Login History Hook
// ============================================

export function useLoginHistory(params: { readonly page?: number; readonly limit?: number } = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);

  return useQuery({
    queryKey: ['login-history', params],
    queryFn: () => apiClient.get<LoginHistoryResponse>('/api/account/login-history', queryParams),
  });
}

// ============================================
// Notification Preferences Hooks
// ============================================

export interface NotificationPreference {
  readonly channel: 'email' | 'in_app';
  readonly eventType: 'deal_stage_change' | 'task_reminder' | 'customer_assign' | 'new_document';
  readonly enabled: boolean;
}

interface NotificationPreferencesResponse {
  readonly success: boolean;
  readonly data: {
    readonly preferences: readonly NotificationPreference[];
  };
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiClient.get<NotificationPreferencesResponse>('/api/account/notifications'),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { readonly preferences: readonly NotificationPreference[] }) =>
      apiClient.patch<NotificationPreferencesResponse>('/api/account/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
