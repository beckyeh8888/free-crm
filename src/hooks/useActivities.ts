/**
 * Activity hooks - TanStack Query hooks for activity feed
 * Real-time polling every 30 seconds
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Activity {
  readonly id: string;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly details: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly user: {
    readonly id: string;
    readonly name: string | null;
    readonly email: string;
  } | null;
}

export interface ActivityFilters {
  readonly page?: number;
  readonly limit?: number;
  readonly action?: string;
  readonly entity?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

interface ActivityListResponse {
  readonly success: boolean;
  readonly data: readonly Activity[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
  readonly filterOptions: {
    readonly actions: readonly string[];
    readonly entities: readonly string[];
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch activities with filters and real-time polling
 * @param filters - Filter and pagination options
 * @param enablePolling - Enable 30-second polling (default: true)
 */
export function useActivities(filters: ActivityFilters = {}, enablePolling = true) {
  const queryParams: Record<string, string> = {};

  if (filters.page) queryParams.page = String(filters.page);
  if (filters.limit) queryParams.limit = String(filters.limit);
  if (filters.action) queryParams.action = filters.action;
  if (filters.entity) queryParams.entity = filters.entity;
  if (filters.startDate) queryParams.startDate = filters.startDate;
  if (filters.endDate) queryParams.endDate = filters.endDate;

  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => apiClient.get<ActivityListResponse>('/api/activities', queryParams),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: enablePolling ? 30 * 1000 : false, // Poll every 30 seconds
  });
}
