'use client';

/**
 * SidebarItem - Individual navigation item in the sidebar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';

export interface SidebarItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
}

export function SidebarItem({ href, label, icon }: SidebarItemProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-200 ease-in-out
        min-h-[44px]
        ${
          isActive
            ? 'bg-primary-100 text-primary-900 dark:bg-primary-800 dark:text-primary-100'
            : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900 dark:text-primary-400 dark:hover:bg-primary-800/50 dark:hover:text-primary-100'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon */}
      <span
        className={`
          flex-shrink-0 w-5 h-5
          ${isActive ? 'text-accent-600 dark:text-accent-400' : ''}
        `}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Label */}
      <span
        className={`
          whitespace-nowrap overflow-hidden transition-all duration-200
          ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
        `}
      >
        {label}
      </span>

      {/* Tooltip (shown when collapsed) */}
      {isCollapsed && (
        <span
          className="
            absolute left-full ml-2 px-2 py-1
            bg-primary-900 text-white text-sm rounded
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-opacity duration-200
            whitespace-nowrap z-50
            dark:bg-primary-700
          "
          role="tooltip"
        >
          {label}
        </span>
      )}
    </Link>
  );
}
