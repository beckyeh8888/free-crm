'use client';

/**
 * DashboardLayout - Main layout wrapper for dashboard pages
 * WCAG 2.2 AAA Compliant
 */

import { ReactNode } from 'react';
import { SidebarProvider, Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  readonly children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background-secondary dark:bg-primary-950 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main
            id="main-content"
            className="flex-1 overflow-auto"
            role="main"
            aria-label="主要內容"
          >
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
