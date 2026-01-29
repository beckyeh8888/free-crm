'use client';

/**
 * MobileTabBar - Bottom navigation bar for mobile
 * Calm CRM Dark Theme - WCAG 2.2 AAA Compliant
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Plus, Handshake, MoreHorizontal } from 'lucide-react';

interface TabItem {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly isAction?: boolean;
}

const tabs: readonly TabItem[] = [
  { key: 'home', label: '首頁', href: '/dashboard', icon: LayoutDashboard },
  { key: 'customers', label: '客戶', href: '/customers', icon: Users },
  { key: 'add', label: '新增', href: '/customers', icon: Plus, isAction: true },
  { key: 'deals', label: '商機', href: '/deals', icon: Handshake },
  { key: 'more', label: '更多', href: '/settings', icon: MoreHorizontal },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 left-0 right-0 z-40
        bg-background-secondary border-t border-border
        safe-area-inset-bottom
      "
      role="navigation"
      aria-label="行動導航"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="
                  flex items-center justify-center w-12 h-12 rounded-full
                  bg-accent-600 text-white
                  -mt-4 shadow-lg
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary
                "
                aria-label={tab.label}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] rounded-lg
                transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary
                ${isActive ? 'text-accent-600' : 'text-text-muted'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
