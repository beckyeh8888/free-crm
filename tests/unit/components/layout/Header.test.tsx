/**
 * Header Component Tests
 * Tests for top navigation bar
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '@/components/layout/Header/Header';

// Mock next/navigation
const mockPathname = vi.fn(() => '/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock SidebarContext
const mockToggle = vi.fn();
const mockIsCollapsed = vi.fn(() => false);
vi.mock('@/components/layout/Sidebar', () => ({
  useSidebar: () => ({
    toggle: mockToggle,
    isCollapsed: mockIsCollapsed(),
  }),
}));

// Mock CommandPalette
const mockOpenCommandPalette = vi.fn();
vi.mock('@/components/CommandPalette', () => ({
  useCommandPalette: () => ({
    open: mockOpenCommandPalette,
  }),
}));

// Mock usePlatform
vi.mock('@/hooks/usePlatform', () => ({
  usePlatform: () => ({
    isMac: false,
    modKey: 'Ctrl',
    modKeyLabel: 'Ctrl',
    isModKeyPressed: (e: KeyboardEvent) => e.ctrlKey,
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
    mockIsCollapsed.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('renders header with banner role', () => {
      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders page title for dashboard', () => {
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('儀表板');
    });

    it('renders notification button', () => {
      render(<Header />);

      expect(screen.getByRole('button', { name: '通知' })).toBeInTheDocument();
    });

    it('renders search button with keyboard shortcut', () => {
      render(<Header />);

      expect(screen.getByRole('button', { name: '搜尋 (Ctrl+K)' })).toBeInTheDocument();
    });

    it('renders keyboard shortcut hint', () => {
      render(<Header />);

      expect(screen.getByText('CtrlK')).toBeInTheDocument();
    });
  });

  describe('Page Titles', () => {
    it('shows 客戶管理 for /customers', () => {
      mockPathname.mockReturnValue('/customers');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('客戶管理');
    });

    it('shows 商機管理 for /deals', () => {
      mockPathname.mockReturnValue('/deals');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('商機管理');
    });

    it('shows 設定 for /settings', () => {
      mockPathname.mockReturnValue('/settings');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('設定');
    });

    it('shows 系統管理 for /admin', () => {
      mockPathname.mockReturnValue('/admin');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('系統管理');
    });

    it('shows parent title for nested routes', () => {
      mockPathname.mockReturnValue('/customers/123');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('客戶管理');
    });

    it('shows Free CRM for unknown routes', () => {
      mockPathname.mockReturnValue('/unknown');
      render(<Header />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Free CRM');
    });
  });

  describe('Menu Toggle', () => {
    it('renders menu toggle button', () => {
      render(<Header />);

      expect(screen.getByRole('button', { name: '收合選單' })).toBeInTheDocument();
    });

    it('shows 展開選單 when sidebar is collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Header />);

      expect(screen.getByRole('button', { name: '展開選單' })).toBeInTheDocument();
    });

    it('calls toggle when menu button is clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: '收合選單' }));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('has aria-expanded true when sidebar is expanded', () => {
      mockIsCollapsed.mockReturnValue(false);
      render(<Header />);

      expect(screen.getByRole('button', { name: '收合選單' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('has aria-expanded false when sidebar is collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Header />);

      expect(screen.getByRole('button', { name: '展開選單' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    });
  });

  describe('Search Button', () => {
    it('calls openCommandPalette when search is clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: '搜尋 (Ctrl+K)' }));

      expect(mockOpenCommandPalette).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type button on all buttons', () => {
      render(<Header />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
