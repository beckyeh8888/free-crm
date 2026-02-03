/**
 * DataTable Component - WCAG 2.2 AAA Compliant
 *
 * A flexible data table component for displaying tabular data.
 */

import { ReactNode } from 'react';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../LoadingState';
import { ErrorState } from '../ErrorState';

export interface Column<T> {
  /** Column key (must match data property) */
  readonly key: keyof T | string;
  /** Column header label */
  readonly header: string;
  /** Custom cell renderer */
  readonly render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  /** Column width (CSS value) */
  readonly width?: string;
  /** Text alignment */
  readonly align?: 'left' | 'center' | 'right';
  /** Whether to truncate long text */
  readonly truncate?: boolean;
  /** Sortable column */
  readonly sortable?: boolean;
}

// Pre-defined skeleton row IDs to avoid array index in keys
const SKELETON_ROW_IDS = ['skel-row-1', 'skel-row-2', 'skel-row-3', 'skel-row-4', 'skel-row-5', 'skel-row-6', 'skel-row-7', 'skel-row-8', 'skel-row-9', 'skel-row-10'] as const;

export interface DataTableProps<T> {
  /** Column definitions */
  readonly columns: readonly Column<T>[];
  /** Data rows */
  readonly data: readonly T[];
  /** Unique key extractor */
  readonly keyExtractor: (row: T, index: number) => string | number;
  /** Loading state */
  readonly loading?: boolean;
  /** Error state */
  readonly error?: string | null;
  /** Empty state title */
  readonly emptyTitle?: string;
  /** Empty state description */
  readonly emptyDescription?: string;
  /** Empty state action */
  readonly emptyAction?: ReactNode;
  /** Row click handler */
  readonly onRowClick?: (row: T, index: number) => void;
  /** Retry callback for error state */
  readonly onRetry?: () => void;
  /** Striped rows */
  readonly striped?: boolean;
  /** Hover effect on rows */
  readonly hoverable?: boolean;
  /** Compact mode */
  readonly compact?: boolean;
  /** Caption for accessibility */
  readonly caption?: string;
  /** Number of skeleton rows to show when loading */
  readonly skeletonRows?: number;
}

function getCellValue<T>(row: T, key: keyof T | string): T[keyof T] | undefined {
  if (typeof key === 'string' && key.includes('.')) {
    // Support nested keys like 'user.name'
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value as T[keyof T];
  }
  return row[key as keyof T];
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  emptyTitle = '暫無資料',
  emptyDescription,
  emptyAction,
  onRowClick,
  onRetry,
  striped = false,
  hoverable = true,
  compact = false,
  caption,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
  const headerPadding = compact ? 'px-4 py-3' : 'px-6 py-4';

  // Error state
  if (error) {
    return (
      <div className="border border-primary-200 dark:border-primary-700 rounded-lg">
        <ErrorState
          type="generic"
          title="載入資料失敗"
          description={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden">
        <table className="w-full" role="table" aria-busy="true">
          {caption && <caption className="sr-only">{caption} - 載入中</caption>}
          <thead className="bg-primary-50 dark:bg-primary-800 border-b border-primary-200 dark:border-primary-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    ${headerPadding}
                    text-left text-sm font-semibold
                    text-primary-900 dark:text-primary-100
                  `}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-200 dark:divide-primary-700">
            {SKELETON_ROW_IDS.slice(0, skeletonRows).map((id, idx) => (
              <tr key={id}>
                {columns.map((column) => (
                  <td key={String(column.key)} className={cellPadding}>
                    <Skeleton height={16} width={idx % 2 === 0 ? '80%' : '60%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="border border-primary-200 dark:border-primary-700 rounded-lg">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  // Data table
  return (
    <div className="border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-primary-50 dark:bg-primary-800 border-b border-primary-200 dark:border-primary-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    ${headerPadding}
                    text-sm font-semibold
                    text-primary-900 dark:text-primary-100
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                  style={{ width: column.width }}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-200 dark:divide-primary-700 bg-white dark:bg-primary-900">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-primary-50 dark:bg-primary-800/50' : ''}
                  ${hoverable ? 'hover:bg-primary-100 dark:hover:bg-primary-800' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  transition-colors
                `}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row, rowIndex);
                        }
                      }
                    : undefined
                }
                aria-label={onRowClick ? '點擊查看詳情' : undefined}
              >
                {columns.map((column) => {
                  const value = getCellValue(row, column.key);
                  const cellContent = column.render
                    ? column.render(value as T[keyof T], row, rowIndex)
                    : String(value ?? '');

                  return (
                    <td
                      key={String(column.key)}
                      className={`
                        ${cellPadding}
                        text-sm text-primary-700 dark:text-primary-300
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : 'text-left'}
                        ${column.truncate ? 'truncate max-w-xs' : ''}
                      `}
                      style={{ width: column.width }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
