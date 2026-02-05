/**
 * Sidebar Component Tests
 * Tests for collapsible navigation sidebar
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';

// Mock next-auth
const mockSession = vi.fn(() => ({
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession() }),
  signOut: vi.fn(),
}));

// Mock next/navigation (needed by SidebarItem)
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock SidebarContext
const mockIsCollapsed = vi.fn(() => false);
const mockToggle = vi.fn();

vi.mock('@/components/layout/Sidebar/SidebarContext', () => ({
  useSidebar: () => ({
    isCollapsed: mockIsCollapsed(),
    toggle: mockToggle,
  }),
}));

// Mock SidebarItem
vi.mock('@/components/layout/Sidebar/SidebarItem', () => ({
  SidebarItem: ({
    href,
    label,
  }: {
    href: string;
    label: string;
    icon: unknown;
  }) => (
    <a href={href} data-testid={`sidebar-item-${label}`}>
      {label}
    </a>
  ),
}));

// Mock design tokens
vi.mock('@/lib/design-tokens', () => ({
  navItems: [
    { key: 'dashboard', label: '儀表板', href: '/dashboard', icon: 'LayoutDashboard' },
    { key: 'customers', label: '客戶', href: '/customers', icon: 'Users' },
    { key: 'deals', label: '商機', href: '/deals', icon: 'Handshake' },
  ],
}));

import { signOut } from 'next-auth/react';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCollapsed.mockReturnValue(false);
    mockSession.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
  });

  describe('Rendering', () => {
    it('renders sidebar with navigation landmark', () => {
      render(<Sidebar />);

      expect(screen.getByLabelText('主要導航')).toBeInTheDocument();
    });

    it('renders brand name when expanded', () => {
      render(<Sidebar />);

      expect(screen.getByText('Free CRM')).toBeInTheDocument();
    });

    it('renders brand logo FC', () => {
      render(<Sidebar />);

      expect(screen.getByText('FC')).toBeInTheDocument();
    });

    it('hides brand name when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      expect(screen.queryByText('Free CRM')).not.toBeInTheDocument();
    });

    it('renders navigation role', () => {
      render(<Sidebar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('renders all nav items', () => {
      render(<Sidebar />);

      expect(screen.getByTestId('sidebar-item-儀表板')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-item-客戶')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-item-商機')).toBeInTheDocument();
    });

    it('renders correct hrefs for nav items', () => {
      render(<Sidebar />);

      expect(screen.getByTestId('sidebar-item-儀表板')).toHaveAttribute('href', '/dashboard');
      expect(screen.getByTestId('sidebar-item-客戶')).toHaveAttribute('href', '/customers');
      expect(screen.getByTestId('sidebar-item-商機')).toHaveAttribute('href', '/deals');
    });
  });

  describe('User Section', () => {
    it('renders user name when expanded', () => {
      render(<Sidebar />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders user email when expanded', () => {
      render(<Sidebar />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders user initial in avatar', () => {
      render(<Sidebar />);

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('hides user info when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });

    it('shows email initial when no name', () => {
      mockSession.mockReturnValue({
        user: {
          name: null,
          email: 'test@example.com',
        },
      });
      render(<Sidebar />);

      // Should show 'T' from email initial
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('shows 使用者 when no name', () => {
      mockSession.mockReturnValue({
        user: {
          name: null,
          email: 'test@example.com',
        },
      });
      render(<Sidebar />);

      expect(screen.getByText('使用者')).toBeInTheDocument();
    });

    it('does not show user section when no session', () => {
      mockSession.mockReturnValue(null);
      render(<Sidebar />);

      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  describe('Logout', () => {
    it('renders logout button', () => {
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
    });

    it('shows 登出 text when expanded', () => {
      render(<Sidebar />);

      expect(screen.getByText('登出')).toBeInTheDocument();
    });

    it('calls signOut when logout is clicked', () => {
      render(<Sidebar />);

      fireEvent.click(screen.getByRole('button', { name: '登出' }));

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('shows tooltip when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      const tooltips = screen.getAllByRole('tooltip');
      const logoutTooltip = tooltips.find((t) => t.textContent === '登出');
      expect(logoutTooltip).toBeInTheDocument();
    });
  });

  describe('Collapse Toggle', () => {
    it('shows 收合 button when expanded', () => {
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: '收合側邊欄' })).toBeInTheDocument();
      expect(screen.getByText('收合')).toBeInTheDocument();
    });

    it('shows 展開側邊欄 button when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: '展開側邊欄' })).toBeInTheDocument();
    });

    it('calls toggle when collapse button is clicked', () => {
      render(<Sidebar />);

      fireEvent.click(screen.getByRole('button', { name: '收合側邊欄' }));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('has aria-expanded true when expanded', () => {
      mockIsCollapsed.mockReturnValue(false);
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: '收合側邊欄' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('has aria-expanded false when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: '展開側邊欄' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    });

    it('shows expand tooltip when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<Sidebar />);

      const tooltips = screen.getAllByRole('tooltip');
      const expandTooltip = tooltips.find((t) => t.textContent === '展開側邊欄');
      expect(expandTooltip).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has type button on all buttons', () => {
      render(<Sidebar />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
