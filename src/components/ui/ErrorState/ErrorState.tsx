/**
 * ErrorState Component - WCAG 2.2 AAA Compliant
 *
 * Displays error messages with optional retry functionality.
 */

import { ReactNode } from 'react';

export type ErrorType = 'generic' | 'network' | 'notFound' | 'unauthorized' | 'server';

export interface ErrorStateProps {
  /** Error type for predefined styling */
  readonly type?: ErrorType;
  /** Error title */
  readonly title?: string;
  /** Error description */
  readonly description?: string;
  /** Custom icon */
  readonly icon?: ReactNode;
  /** Retry callback */
  readonly onRetry?: () => void;
  /** Retry button text */
  readonly retryText?: string;
  /** Additional action */
  readonly action?: ReactNode;
}

const defaultContent: Record<ErrorType, { title: string; description: string }> = {
  generic: {
    title: '發生錯誤',
    description: '處理您的請求時發生問題，請稍後再試。',
  },
  network: {
    title: '網路連線錯誤',
    description: '無法連線到伺服器，請檢查網路連線後再試。',
  },
  notFound: {
    title: '找不到資源',
    description: '您要尋找的頁面或資源不存在。',
  },
  unauthorized: {
    title: '存取被拒絕',
    description: '您沒有權限存取此資源，請聯繫管理員。',
  },
  server: {
    title: '伺服器錯誤',
    description: '伺服器發生內部錯誤，我們正在處理中。',
  },
};

function DefaultIcon({ type }: { type: ErrorType }) {
  const iconClasses = 'w-16 h-16 text-red-400 dark:text-red-500';

  switch (type) {
    case 'network':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-1.414-3.536 5 5 0 011.414-3.536m-2.829 2.829l-2.829-2.829m0 0L3 3"
          />
        </svg>
      );
    case 'notFound':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'unauthorized':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      );
    case 'server':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
  }
}

export function ErrorState({
  type = 'generic',
  title,
  description,
  icon,
  onRetry,
  retryText = '重試',
  action,
}: ErrorStateProps) {
  const content = defaultContent[type];
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      {icon ? (
        <div className="mb-4" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div className="mb-4" aria-hidden="true">
          <DefaultIcon type={type} />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {displayTitle}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        {displayDescription}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="
              inline-flex items-center gap-2 px-4 py-2
              text-sm font-medium text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-600
              rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
              min-h-[44px] min-w-[44px]
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {retryText}
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

export default ErrorState;
