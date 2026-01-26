'use client';

/**
 * Sidebar - Collapsible navigation sidebar
 * WCAG 2.2 AAA Compliant
 */

import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from './SidebarContext';
import { SidebarItem } from './SidebarItem';

// Icons (inline SVG for simplicity)
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

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

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

const navItems = [
  { href: '/dashboard', label: '儀表板', icon: <HomeIcon className="w-5 h-5" /> },
  { href: '/customers', label: '客戶', icon: <UsersIcon className="w-5 h-5" /> },
  { href: '/deals', label: '商機', icon: <BriefcaseIcon className="w-5 h-5" /> },
  { href: '/documents', label: '文件', icon: <FileTextIcon className="w-5 h-5" /> },
  { href: '/settings', label: '設定', icon: <SettingsIcon className="w-5 h-5" /> },
];

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside
      className={`
        flex flex-col h-screen
        bg-white dark:bg-primary-900
        border-r border-primary-200 dark:border-primary-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
      aria-label="主要導航"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-primary-200 dark:border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FC</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-primary-900 dark:text-white whitespace-nowrap">
              Free CRM
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation">
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-primary-200 dark:border-primary-700 p-3">
        {session?.user && (
          <div
            className={`
              flex items-center gap-3 px-2 py-2 rounded-lg
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-200">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 dark:text-white truncate">
                  {session.user.name || '使用者'}
                </p>
                <p className="text-xs text-primary-500 dark:text-primary-400 truncate">
                  {session.user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className={`
            group relative flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg
            text-primary-600 hover:bg-error-light hover:text-error
            dark:text-primary-400 dark:hover:bg-error/20 dark:hover:text-error
            transition-colors duration-200
            min-h-[44px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label="登出"
        >
          <LogoutIcon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>登出</span>}

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <span
              className="
                absolute left-full ml-2 px-2 py-1
                bg-primary-900 text-white text-sm rounded
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-opacity duration-200
                whitespace-nowrap z-50
              "
              role="tooltip"
            >
              登出
            </span>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-primary-200 dark:border-primary-700 p-3">
        <button
          onClick={toggle}
          className="
            flex items-center justify-center w-full h-10 rounded-lg
            text-primary-500 hover:bg-primary-100 hover:text-primary-700
            dark:text-primary-400 dark:hover:bg-primary-800 dark:hover:text-primary-200
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
          "
          aria-label={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
