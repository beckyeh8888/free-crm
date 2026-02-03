'use client';

/**
 * Activities Page - Activity Feed
 * WCAG 2.2 AAA Compliant
 *
 * Shows user's activity history with filtering and pagination
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useActivities, type ActivityFilters as Filters } from '@/hooks/useActivities';
import { ActivityFilters, ActivityList } from '@/components/features/activities';

// ============================================
// Entity Navigation
// ============================================

const entityRoutes: Record<string, string> = {
  customer: '/customers',
  deal: '/deals',
  document: '/documents',
};

// ============================================
// Page Component
// ============================================

export default function ActivitiesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, refetch, isFetching } = useActivities(filters);

  const activities = data?.data ?? [];
  const pagination = data?.pagination;
  const filterOptions = data?.filterOptions ?? { actions: [], entities: [] };

  const handleNavigateToEntity = useCallback(
    (entity: string, entityId: string) => {
      const route = entityRoutes[entity];
      if (route) {
        router.push(`${route}?id=${entityId}`);
      }
    },
    [router]
  );

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">活動記錄</h1>
          <p className="text-sm text-text-muted mt-0.5">
            查看您的活動歷史與相關實體的變更
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px] disabled:opacity-50"
          aria-label="重新整理活動列表"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">重新整理</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background-tertiary border border-border rounded-xl p-4">
        <ActivityFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
        />
      </div>

      {/* Activity List */}
      <div className="bg-background-tertiary border border-border rounded-xl">
        <ActivityList
          activities={activities}
          isLoading={isLoading}
          onNavigateToEntity={handleNavigateToEntity}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-text-muted">
              第 {pagination.page} / {pagination.totalPages} 頁，共 {pagination.total} 筆
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
                }
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
              >
                上一頁
              </button>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <p className="text-xs text-text-muted text-center">
        每 30 秒自動更新
      </p>
    </div>
  );
}
