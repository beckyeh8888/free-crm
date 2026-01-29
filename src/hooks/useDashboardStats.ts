/**
 * Dashboard stats hook - TanStack Query hook for dashboard statistics
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

interface DashboardStats {
  readonly customerCount: number;
  readonly dealCount: number;
  readonly documentCount: number;
  readonly totalRevenue: number;
  readonly pipelineStages: readonly {
    readonly stage: string;
    readonly count: number;
    readonly value: number;
  }[];
  readonly recentActivity: readonly {
    readonly id: string;
    readonly action: string;
    readonly entity: string;
    readonly entityId: string | null;
    readonly details: string | null;
    readonly createdAt: string;
    readonly user: {
      readonly name: string | null;
      readonly email: string;
    } | null;
  }[];
}

interface DashboardStatsResponse {
  readonly success: boolean;
  readonly data: DashboardStats;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get<DashboardStatsResponse>('/api/dashboard/stats'),
    staleTime: 30 * 1000, // 30 seconds for dashboard
  });
}
