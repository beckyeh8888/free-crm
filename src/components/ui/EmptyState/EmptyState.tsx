/**
 * EmptyState Component - WCAG 2.2 AAA Compliant
 *
 * Displays when there is no data to show.
 */

import { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Title text */
  readonly title?: string;
  /** Description text */
  readonly description?: string;
  /** Custom icon */
  readonly icon?: ReactNode;
  /** Action button or link */
  readonly action?: ReactNode;
}

export function EmptyState({
  title = '暫無資料',
  description,
  icon,
  action,
}: EmptyStateProps) {
  // Use <output> element instead of div with role="status" for better accessibility
  return (
    <output
      className="flex flex-col items-center justify-center py-12 px-4 text-center block"
      aria-label={title}
    >
      {icon ? (
        <div className="mb-4 text-gray-400 dark:text-gray-500" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <svg
          className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </output>
  );
}

export default EmptyState;
