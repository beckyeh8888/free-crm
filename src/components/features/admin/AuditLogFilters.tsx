'use client';

/**
 * AuditLogFilters - Filter controls for audit logs
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback } from 'react';
import { X, Filter, Calendar, User, Activity, FileText } from 'lucide-react';
import type { FilterOptions, AuditLogFilters as FilterType } from '@/hooks/useAuditLogs';

interface AuditLogFiltersProps {
  readonly filters: FilterType;
  readonly filterOptions?: FilterOptions;
  readonly onFilterChange: (filters: FilterType) => void;
  readonly onClear: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  create: '新增',
  read: '讀取',
  update: '更新',
  delete: '刪除',
  export: '匯出',
  login: '登入',
  logout: '登出',
  permission_change: '權限變更',
  role_change: '角色變更',
  member_invite: '邀請成員',
  member_suspend: '停用成員',
  member_remove: '移除成員',
  '2fa_enable': '啟用 2FA',
  '2fa_disable': '停用 2FA',
  password_change: '變更密碼',
  password_reset: '重設密碼',
};

const ENTITY_LABELS: Record<string, string> = {
  customer: '客戶',
  deal: '商機',
  contact: '聯絡人',
  document: '文件',
  user: '用戶',
  role: '角色',
  organization: '組織',
  audit_log_export: '日誌匯出',
};

export function AuditLogFilters({
  filters,
  filterOptions,
  onFilterChange,
  onClear,
}: AuditLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const handleChange = useCallback(
    (key: keyof FilterType, value: string) => {
      onFilterChange({
        ...filters,
        [key]: value || undefined,
      });
    },
    [filters, onFilterChange]
  );

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]
            ${isExpanded || hasActiveFilters
              ? 'bg-accent-600/15 text-accent-600 border border-accent-600/30'
              : 'bg-background-secondary text-text-secondary hover:bg-background-hover border border-border'}
          `}
        >
          <Filter className="w-4 h-4" />
          篩選
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-accent-600 text-white text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors min-h-[40px]"
          >
            <X className="w-4 h-4" />
            清除篩選
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="bg-background-tertiary border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                開始日期
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="form-input w-full text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                結束日期
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="form-input w-full text-sm"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <Activity className="w-3.5 h-3.5" />
                操作類型
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleChange('action', e.target.value)}
                className="form-input w-full text-sm"
              >
                <option value="">全部操作</option>
                {filterOptions?.actions.map((action) => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                實體類型
              </label>
              <select
                value={filters.entity || ''}
                onChange={(e) => handleChange('entity', e.target.value)}
                className="form-input w-full text-sm"
              >
                <option value="">全部實體</option>
                {filterOptions?.entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {ENTITY_LABELS[entity] || entity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Filter */}
          {filterOptions?.users && filterOptions.users.length > 0 && (
            <div className="max-w-xs">
              <label className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <User className="w-3.5 h-3.5" />
                用戶
              </label>
              <select
                value={filters.userId || ''}
                onChange={(e) => handleChange('userId', e.target.value)}
                className="form-input w-full text-sm"
              >
                <option value="">全部用戶</option>
                {filterOptions.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export labels for use in other components
export { ACTION_LABELS, ENTITY_LABELS };
