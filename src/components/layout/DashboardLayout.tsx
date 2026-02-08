'use client';

/**
 * DashboardLayout - Main layout wrapper for dashboard pages
 * Calm CRM Dark Theme - WCAG 2.2 AAA Compliant
 */

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar } from './Sidebar';
import { Header, setAIChatToggle, clearAIChatToggle } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { CommandPaletteProvider, CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';
import { AIChatPanel } from '@/components/features/ai';
import { QuickLogButton } from '@/components/features/quick-log/QuickLogButton';

interface DashboardLayoutProps {
  readonly children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const toggleAIChat = useCallback(() => {
    setIsAIChatOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    setAIChatToggle(toggleAIChat);
    return () => clearAIChatToggle();
  }, [toggleAIChat]);

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

              {/* Quick Log FAB */}
              <QuickLogButton className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30" />

              {/* Mobile Tab Bar */}
              <MobileTabBar />
            </div>
          </div>
        </SidebarProvider>

        {/* AI Chat Panel */}
        <AIChatPanel
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </KeyboardShortcutsProvider>
    </CommandPaletteProvider>
  );
}

export default DashboardLayout;
