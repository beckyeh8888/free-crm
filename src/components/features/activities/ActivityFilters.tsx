'use client';

/**
 * ActivityFilters - Filter controls for activity feed
 * WCAG 2.2 AAA Compliant
 */

import { X } from 'lucide-react';
import type { ActivityFilters as Filters } from '@/hooks/useActivities';

// ============================================
// Types
// ============================================

interface ActivityFiltersProps {
  readonly filters: Filters;
  readonly onFiltersChange: (filters: Filters) => void;
  readonly filterOptions: {
    readonly actions: readonly string[];
    readonly entities: readonly string[];
  };
}

// ============================================
// Labels
// ============================================

const actionLabels: Record<string, string> = {
  create: '新增',
  update: '更新',
  delete: '刪除',
  read: '查看',
  export: '匯出',
  login: '登入',
  logout: '登出',
};

const entityLabels: Record<string, string> = {
  customer: '客戶',
  contact: '聯絡人',
  deal: '商機',
  document: '文件',
  user: '使用者',
  role: '角色',
  organization: '組織',
  report: '報表',
};

// ============================================
// Component
// ============================================

export function ActivityFilters({
  filters,
  onFiltersChange,
  filterOptions,
}: ActivityFiltersProps) {
  const hasFilters = filters.action || filters.entity || filters.startDate || filters.endDate;

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Action filter */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="activity-action-filter"
          className="text-xs text-text-muted"
        >
          動作類型
        </label>
        <select
          id="activity-action-filter"
          value={filters.action ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              action: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-600 min-w-[120px]"
        >
          <option value="">全部</option>
          {filterOptions.actions.map((action) => (
            <option key={action} value={action}>
              {actionLabels[action] ?? action}
            </option>
          ))}
        </select>
      </div>

      {/* Entity filter */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="activity-entity-filter"
          className="text-xs text-text-muted"
        >
          實體類型
        </label>
        <select
          id="activity-entity-filter"
          value={filters.entity ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              entity: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-600 min-w-[120px]"
        >
          <option value="">全部</option>
          {filterOptions.entities.map((entity) => (
            <option key={entity} value={entity}>
              {entityLabels[entity] ?? entity}
            </option>
          ))}
        </select>
      </div>

      {/* Start date filter */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="activity-start-date"
          className="text-xs text-text-muted"
        >
          開始日期
        </label>
        <input
          id="activity-start-date"
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              startDate: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-600"
        />
      </div>

      {/* End date filter */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="activity-end-date"
          className="text-xs text-text-muted"
        >
          結束日期
        </label>
        <input
          id="activity-end-date"
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              endDate: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-600"
        />
      </div>

      {/* Clear filters button */}
      {hasFilters && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-transparent">清除</span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-9 px-3 rounded-lg border border-border text-sm text-text-secondary hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-accent-600 flex items-center gap-1.5 transition-colors"
            aria-label="清除所有篩選條件"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            清除
          </button>
        </div>
      )}
    </div>
  );
}

export type { ActivityFiltersProps };
