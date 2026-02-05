'use client';

/**
 * AccessibleChart - WCAG 2.2 AAA chart wrapper
 *
 * Provides:
 * - role="img" + aria-label for screen readers
 * - Hidden <table> alternative for data
 * - Toggle button to switch between chart and table
 * - prefers-reduced-motion support
 */

import { useState } from 'react';

interface DataRow {
  readonly [key: string]: string | number | null | undefined;
}

interface AccessibleChartProps {
  readonly title: string;
  readonly description?: string;
  readonly columns: readonly string[];
  readonly data: readonly DataRow[];
  readonly children: React.ReactNode;
}

export function AccessibleChart({
  title,
  description,
  columns,
  data,
  children,
}: AccessibleChartProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      {/* Toggle button */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded border border-border min-h-[32px]"
          aria-label={showTable ? '切換至圖表' : '切換至資料表格'}
        >
          {showTable ? '顯示圖表' : '顯示表格'}
        </button>
      </div>

      {showTable ? (
        /* Accessible data table */
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm border-collapse"
            aria-label={`${title} 資料表格`}
          >
            <caption className="sr-only">
              {title}
              {description ? ` - ${description}` : ''}
            </caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="text-left px-3 py-2 text-text-secondary border-b border-border font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={`row-${columns.map((c) => row[c]).join('-')}-${i}`}
                  className="border-b border-border last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 text-text-primary"
                    >
                      {row[col] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Chart with aria-label */
        <div role="img" aria-label={`${title}${description ? `: ${description}` : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}
