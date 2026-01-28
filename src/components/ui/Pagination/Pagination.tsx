/**
 * Pagination Component - WCAG 2.2 AAA Compliant
 *
 * Displays pagination controls for navigating through pages of data.
 */

export interface PaginationProps {
  /** Current page (1-indexed) */
  readonly currentPage: number;
  /** Total number of pages */
  readonly totalPages: number;
  /** Callback when page changes */
  readonly onPageChange: (page: number) => void;
  /** Number of visible page buttons (default: 5) */
  readonly visiblePages?: number;
  /** Show first/last buttons */
  readonly showFirstLast?: boolean;
  /** Show prev/next buttons */
  readonly showPrevNext?: boolean;
  /** Disabled state */
  readonly disabled?: boolean;
  /** Size variant */
  readonly size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    button: 'min-w-[32px] h-8 text-sm',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'min-w-[44px] h-11 text-base',
    icon: 'w-5 h-5',
  },
  lg: {
    button: 'min-w-[52px] h-13 text-lg',
    icon: 'w-6 h-6',
  },
};

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDoubleLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  );
}

function ChevronDoubleRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5,
  showFirstLast = true,
  showPrevNext = true,
  disabled = false,
  size = 'md',
}: PaginationProps) {
  // Calculate visible page range
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= visiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(visiblePages / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if near edges
    if (currentPage <= halfVisible) {
      end = visiblePages;
    } else if (currentPage > totalPages - halfVisible) {
      start = totalPages - visiblePages + 1;
    }

    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const sizes = sizeClasses[size];

  const baseButtonClasses = `
    ${sizes.button}
    inline-flex items-center justify-center px-3
    font-medium rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const navButtonClasses = `
    ${baseButtonClasses}
    text-gray-600 dark:text-gray-400
    hover:bg-gray-100 dark:hover:bg-gray-800
    disabled:hover:bg-transparent dark:disabled:hover:bg-transparent
  `;

  const pageButtonClasses = (isActive: boolean) => `
    ${baseButtonClasses}
    ${
      isActive
        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }
  `;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-center gap-1"
      role="navigation"
      aria-label="分頁導航"
    >
      {/* First page button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || isFirstPage}
          className={navButtonClasses}
          aria-label="前往第一頁"
        >
          <ChevronDoubleLeftIcon className={sizes.icon} />
        </button>
      )}

      {/* Previous page button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || isFirstPage}
          className={navButtonClasses}
          aria-label="前往上一頁"
        >
          <ChevronLeftIcon className={sizes.icon} />
        </button>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          // For ellipsis: use position-based key (start/end) to avoid array index
          if (page === 'ellipsis') {
            const isStartEllipsis = index < pageNumbers.length / 2;
            return (
              <span
                key={isStartEllipsis ? 'ellipsis-start' : 'ellipsis-end'}
                className={`${sizes.button} inline-flex items-center justify-center px-2 text-gray-400 dark:text-gray-500`}
                aria-hidden="true"
              >
                ⋯
              </span>
            );
          }
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={pageButtonClasses(page === currentPage)}
              aria-label={`前往第 ${page} 頁`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next page button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || isLastPage}
          className={navButtonClasses}
          aria-label="前往下一頁"
        >
          <ChevronRightIcon className={sizes.icon} />
        </button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || isLastPage}
          className={navButtonClasses}
          aria-label="前往最後一頁"
        >
          <ChevronDoubleRightIcon className={sizes.icon} />
        </button>
      )}
    </nav>
  );
}

export default Pagination;
