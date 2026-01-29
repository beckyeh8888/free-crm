'use client';

/**
 * SidebarItem - Individual navigation item in the sidebar
 * Calm CRM Dark Theme
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export interface SidebarItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export function SidebarItem({ href, label, icon: Icon }: SidebarItemProps) {
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
            ? 'bg-background-hover text-text-primary'
            : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-600 rounded-r"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <span
        className={`
          flex-shrink-0
          ${isActive ? 'text-accent-600' : ''}
        `}
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" />
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
            bg-background-tertiary text-text-primary text-sm rounded border border-border
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-opacity duration-200
            whitespace-nowrap z-50
          "
          role="tooltip"
        >
          {label}
        </span>
      )}
    </Link>
  );
}
