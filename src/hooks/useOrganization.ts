/**
 * Organization Management Hooks
 * TanStack Query hooks for organization settings and stats
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly plan: 'free' | 'pro' | 'enterprise';
  readonly logo: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly memberCount: number;
  readonly customerCount: number;
  readonly documentCount: number;
}

export interface OrganizationStats {
  readonly counts: {
    readonly members: number;
    readonly customers: number;
    readonly deals: number;
    readonly documents: number;
  };
  readonly memberBreakdown: {
    readonly active: number;
    readonly suspended: number;
    readonly invited: number;
  };
  readonly dealBreakdown: {
    readonly open: number;
    readonly won: number;
    readonly lost: number;
  };
  readonly limits: {
    readonly members: number;
    readonly customers: number;
    readonly documents: number;
  };
  readonly usage: {
    readonly membersUsage: number;
    readonly customersUsage: number;
    readonly documentsUsage: number;
  };
}

export interface UpdateOrganizationData {
  readonly name?: string;
  readonly logo?: string | null;
}

interface OrganizationResponse {
  readonly success: boolean;
  readonly data: Organization;
}

interface StatsResponse {
  readonly success: boolean;
  readonly data: OrganizationStats;
}

// ============================================
// Query Keys
// ============================================

export const organizationKeys = {
  all: ['organization'] as const,
  detail: () => [...organizationKeys.all, 'detail'] as const,
  stats: () => [...organizationKeys.all, 'stats'] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch current organization details
 */
export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.detail(),
    queryFn: async () => {
      return apiClient.get<OrganizationResponse>('/api/organization');
    },
  });
}

/**
 * Fetch organization usage statistics
 */
export function useOrganizationStats() {
  return useQuery({
    queryKey: organizationKeys.stats(),
    queryFn: async () => {
      return apiClient.get<StatsResponse>('/api/organization/stats');
    },
  });
}

/**
 * Update organization settings
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      return apiClient.patch<OrganizationResponse>('/api/organization', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
