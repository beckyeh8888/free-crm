'use client';

/**
 * Header - Top navigation bar
 * WCAG 2.2 AAA Compliant
 */

import { usePathname } from 'next/navigation';
import { useSidebar } from '../Sidebar';

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/dashboard': '儀表板',
  '/customers': '客戶管理',
  '/deals': '商機管理',
  '/documents': '文件管理',
  '/settings': '設定',
};

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { toggle, isCollapsed } = useSidebar();

  // Get current page title
  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    // Check for partial match (e.g., /customers/123)
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path + '/')) {
        return title;
      }
    }

    return 'Free CRM';
  };

  return (
    <header
      className="
        flex items-center justify-between h-16 px-4
        bg-white dark:bg-primary-900
        border-b border-primary-200 dark:border-primary-700
      "
      role="banner"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle (visible on mobile) */}
        <button
          type="button"
          onClick={toggle}
          className="
            lg:hidden flex items-center justify-center w-10 h-10 rounded-lg
            text-primary-600 hover:bg-primary-100
            dark:text-primary-400 dark:hover:bg-primary-800
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
          "
          aria-label={isCollapsed ? '展開選單' : '收合選單'}
          aria-expanded={!isCollapsed}
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg font-semibold text-primary-900 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <button
          type="button"
          className="
            flex items-center justify-center w-10 h-10 rounded-lg
            text-primary-500 hover:bg-primary-100 hover:text-primary-700
            dark:text-primary-400 dark:hover:bg-primary-800 dark:hover:text-primary-200
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
          "
          aria-label="搜尋"
        >
          <SearchIcon className="w-5 h-5" />
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          className="
            relative flex items-center justify-center w-10 h-10 rounded-lg
            text-primary-500 hover:bg-primary-100 hover:text-primary-700
            dark:text-primary-400 dark:hover:bg-primary-800 dark:hover:text-primary-200
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
          "
          aria-label="通知"
        >
          <BellIcon className="w-5 h-5" />
          {/* Notification badge (example) */}
          <span
            className="
              absolute top-1.5 right-1.5 w-2 h-2
              bg-error rounded-full
            "
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
