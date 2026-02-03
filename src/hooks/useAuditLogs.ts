/**
 * Audit Logs Management Hooks
 * TanStack Query hooks for audit log viewing and export
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface AuditLogUser {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly image?: string | null;
}

export interface AuditLog {
  readonly id: string;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly user: AuditLogUser | null;
  readonly details: Record<string, unknown> | null;
  readonly metadata: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: string;
}

export interface AuditLogFilters {
  readonly action?: string;
  readonly entity?: string;
  readonly userId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly search?: string;
}

export interface FilterOptions {
  readonly actions: readonly string[];
  readonly entities: readonly string[];
  readonly users: readonly {
    readonly id: string;
    readonly name: string | null;
    readonly email: string;
  }[];
}

interface AuditLogsResponse {
  readonly success: boolean;
  readonly data: readonly AuditLog[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
  readonly filterOptions: FilterOptions;
}

export interface ExportParams {
  readonly format: 'csv' | 'json';
  readonly action?: string;
  readonly entity?: string;
  readonly userId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly limit?: number;
}

// ============================================
// Query Keys
// ============================================

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters: AuditLogFilters & { page?: number }) => [...auditLogKeys.lists(), filters] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Fetch audit logs with filters and pagination
 */
export function useAuditLogs(options?: {
  readonly filters?: AuditLogFilters;
  readonly page?: number;
  readonly limit?: number;
}) {
  const { filters = {}, page = 1, limit = 20 } = options ?? {};

  return useQuery({
    queryKey: auditLogKeys.list({ ...filters, page }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (filters.action) params.set('action', filters.action);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.search) params.set('search', filters.search);

      return apiClient.get<AuditLogsResponse>(`/api/admin/audit-logs?${params.toString()}`);
    },
  });
}

/**
 * Export audit logs to CSV or JSON
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (params: ExportParams) => {
      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob and create download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `audit-logs.${params.format}`;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
}
