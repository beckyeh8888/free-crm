'use client';

/**
 * DashboardLayout - Main layout wrapper for dashboard pages
 * Calm CRM Dark Theme - WCAG 2.2 AAA Compliant
 */

import { ReactNode } from 'react';
import { SidebarProvider, Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { CommandPaletteProvider, CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';

interface DashboardLayoutProps {
  readonly children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <CommandPaletteProvider>
      <KeyboardShortcutsProvider>
        <CommandPalette />
        <SidebarProvider>
          <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar (desktop only) */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <Header />

              {/* Main Content */}
              <main
                id="main-content"
                className="flex-1 overflow-auto pb-16 lg:pb-0"
                role="main"
                aria-label="主要內容"
              >
                <div className="p-4 lg:p-6">
                  {children}
                </div>
              </main>

              {/* Mobile Tab Bar */}
              <MobileTabBar />
            </div>
          </div>
        </SidebarProvider>
      </KeyboardShortcutsProvider>
    </CommandPaletteProvider>
  );
}

export default DashboardLayout;
