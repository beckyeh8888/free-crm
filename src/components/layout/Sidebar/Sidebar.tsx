'use client';

/**
 * Sidebar - Collapsible navigation sidebar
 * Calm CRM Dark Theme - WCAG 2.2 AAA Compliant
 */

import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Handshake,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { SidebarItem } from './SidebarItem';
import { navItems } from '@/lib/design-tokens';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Handshake,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Shield,
};

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen
        bg-background border-r border-border
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
      aria-label="主要導航"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">FC</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-text-primary whitespace-nowrap">
              Free CRM
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon];
          return (
            <SidebarItem
              key={item.key}
              href={item.href}
              label={item.label}
              icon={IconComponent}
            />
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-3">
        {session?.user && (
          <div
            className={`
              flex items-center gap-3 px-2 py-2 rounded-lg
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {session.user.name || '使用者'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {session.user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`
            group relative flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg
            text-text-secondary hover:bg-error/15 hover:text-error
            transition-colors duration-200
            min-h-[44px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label="登出"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>登出</span>}

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <span
              className="
                absolute left-full ml-2 px-2 py-1
                bg-background-tertiary text-text-primary text-sm rounded border border-border
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

        {/* Collapse Toggle - merged into same section */}
        <button
          type="button"
          onClick={toggle}
          className={`
            group relative flex items-center w-full px-3 py-2.5 mt-2 rounded-lg
            text-text-muted hover:bg-background-hover hover:text-text-secondary
            transition-colors duration-200
            min-h-[44px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            ${isCollapsed ? 'justify-center' : 'gap-3'}
          `}
          aria-label={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收合</span>
            </>
          )}

          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <span
              className="
                absolute left-full ml-2 px-2 py-1
                bg-background-tertiary text-text-primary text-sm rounded border border-border
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-opacity duration-200
                whitespace-nowrap z-50
              "
              role="tooltip"
            >
              展開側邊欄
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
