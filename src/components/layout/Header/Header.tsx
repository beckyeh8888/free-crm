'use client';

/**
 * Header - Top navigation bar
 * Calm CRM Dark Theme - WCAG 2.2 AAA Compliant
 */

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Menu } from 'lucide-react';
import { useSidebar } from '../Sidebar';
import { useCommandPalette } from '@/components/CommandPalette';
import { usePlatform } from '@/hooks/usePlatform';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/features/notifications';

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/dashboard': '儀表板',
  '/customers': '客戶管理',
  '/deals': '商機管理',
  '/calendar': '行事曆',
  '/documents': '文件管理',
  '/reports': '報表分析',
  '/settings': '設定',
  '/admin': '系統管理',
};

export function Header() {
  const pathname = usePathname();
  const { toggle, isCollapsed } = useSidebar();
  const { open: openCommandPalette } = useCommandPalette();
  const { modKey } = usePlatform();

  // Notification state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const { data: countData } = useUnreadNotificationCount();
  const unreadCount = countData?.data?.count ?? 0;

  // Get current page title
  const getPageTitle = () => {
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

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
        bg-background
        border-b border-border
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
            text-text-secondary hover:bg-background-hover hover:text-text-primary
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
          aria-label={isCollapsed ? '展開選單' : '收合選單'}
          aria-expanded={!isCollapsed}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg font-semibold text-text-primary">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search / CMD+K Button */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="
            flex items-center gap-2 h-10 px-3 rounded-lg
            text-text-muted hover:bg-background-hover hover:text-text-secondary
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
          aria-label={`搜尋 (${modKey}+K)`}
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs text-text-muted border border-border rounded px-1.5 py-0.5">
            {modKey}K
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            ref={bellRef}
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="
              relative flex items-center justify-center w-10 h-10 rounded-lg
              text-text-secondary hover:bg-background-hover hover:text-text-primary
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            "
            aria-label={`通知${unreadCount > 0 ? ` (${unreadCount} 則未讀)` : ''}`}
            aria-expanded={isNotifOpen}
            aria-haspopup="dialog"
          >
            <Bell className="w-5 h-5" />
            {/* Dynamic badge */}
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                  flex items-center justify-center
                  bg-error text-white text-[10px] font-bold
                  rounded-full px-1
                "
                aria-hidden="true"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            bellRef={bellRef}
          />
        </div>
      </div>
    </header>
  );
}
