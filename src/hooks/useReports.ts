/**
 * Report hooks - TanStack Query hooks for report APIs
 * Sprint 6: Reports & Charts
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type {
  ReportApiResponse,
  SalesPipelineReport,
  RevenueReport,
  CustomerAnalyticsReport,
  TaskActivityReport,
  TeamPerformanceReport,
  ReportGroupBy,
} from '@/types/reports';

// ============================================
// Query Key Factory
// ============================================

const reportKeys = {
  all: ['reports'] as const,
  salesPipeline: (params?: ReportDateParams) =>
    [...reportKeys.all, 'sales-pipeline', params] as const,
  revenue: (params?: RevenueParams) =>
    [...reportKeys.all, 'revenue', params] as const,
  customers: (params?: ReportDateParams) =>
    [...reportKeys.all, 'customers', params] as const,
  tasks: (params?: ReportDateParams) =>
    [...reportKeys.all, 'tasks', params] as const,
  team: (params?: ReportDateParams) =>
    [...reportKeys.all, 'team', params] as const,
};

// ============================================
// Parameter Types
// ============================================

interface ReportDateParams {
  readonly startDate?: string;
  readonly endDate?: string;
}

interface RevenueParams extends ReportDateParams {
  readonly groupBy?: ReportGroupBy;
}

// ============================================
// Utility
// ============================================

function buildQueryString(params?: ReportDateParams | RevenueParams): string {
  if (!params) return '';
  const record: Record<string, string | undefined> = { ...params };
  const entries = Object.entries(record).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

// ============================================
// Hooks
// ============================================

export function useSalesPipeline(params?: ReportDateParams) {
  const qs = buildQueryString(params);

  return useQuery({
    queryKey: reportKeys.salesPipeline(params),
    queryFn: () =>
      apiClient.get<ReportApiResponse<SalesPipelineReport>>(
        `/api/reports/sales-pipeline${qs}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenue(params?: RevenueParams) {
  const qs = buildQueryString(params);

  return useQuery({
    queryKey: reportKeys.revenue(params),
    queryFn: () =>
      apiClient.get<ReportApiResponse<RevenueReport>>(
        `/api/reports/revenue${qs}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerAnalytics(params?: ReportDateParams) {
  const qs = buildQueryString(params);

  return useQuery({
    queryKey: reportKeys.customers(params),
    queryFn: () =>
      apiClient.get<ReportApiResponse<CustomerAnalyticsReport>>(
        `/api/reports/customers${qs}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaskActivity(params?: ReportDateParams) {
  const qs = buildQueryString(params);

  return useQuery({
    queryKey: reportKeys.tasks(params),
    queryFn: () =>
      apiClient.get<ReportApiResponse<TaskActivityReport>>(
        `/api/reports/tasks${qs}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamPerformance(params?: ReportDateParams) {
  const qs = buildQueryString(params);

  return useQuery({
    queryKey: reportKeys.team(params),
    queryFn: () =>
      apiClient.get<ReportApiResponse<TeamPerformanceReport>>(
        `/api/reports/team${qs}`
      ),
    staleTime: 5 * 60 * 1000,
  });
}
