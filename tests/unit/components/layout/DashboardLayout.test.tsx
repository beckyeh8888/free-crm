/**
 * DashboardLayout Component Tests
 * Unit tests for main dashboard layout
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Mock child components
vi.mock('@/components/layout/Sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

vi.mock('@/components/layout/MobileTabBar', () => ({
  MobileTabBar: () => <div data-testid="mobile-tab-bar">Mobile Tab Bar</div>,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPaletteProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-palette-provider">{children}</div>
  ),
  CommandPalette: () => <div data-testid="command-palette">Command Palette</div>,
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  KeyboardShortcutsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="keyboard-shortcuts-provider">{children}</div>
  ),
}));

describe('DashboardLayout', () => {
  it('renders children', () => {
    render(
      <DashboardLayout>
        <div data-testid="page-content">Page Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders sidebar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders header', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders mobile tab bar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('mobile-tab-bar')).toBeInTheDocument();
  });

  it('renders command palette', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
  });

  it('wraps content with providers', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('command-palette-provider')).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-shortcuts-provider')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('has accessible main content area', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('aria-label', '主要內容');
    expect(main).toHaveAttribute('id', 'main-content');
  });
});
