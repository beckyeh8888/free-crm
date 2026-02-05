/**
 * SidebarItem Component Tests
 * Tests for individual navigation item in the sidebar
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SidebarItem } from '@/components/layout/Sidebar/SidebarItem';
import type { LucideIcon } from 'lucide-react';

// Mock next/navigation
const mockPathname = vi.fn(() => '/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock SidebarContext
const mockIsCollapsed = vi.fn(() => false);
vi.mock('@/components/layout/Sidebar/SidebarContext', () => ({
  useSidebar: () => ({
    isCollapsed: mockIsCollapsed(),
  }),
}));

// Mock icon component
const MockIcon: LucideIcon = (props: Record<string, unknown>) => (
  <svg data-testid="mock-icon" {...props} />
) as unknown as ReturnType<LucideIcon>;
MockIcon.displayName = 'MockIcon';

describe('SidebarItem', () => {
  const defaultProps = {
    href: '/dashboard',
    label: '儀表板',
    icon: MockIcon,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
    mockIsCollapsed.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('renders a link with correct href', () => {
      render(<SidebarItem {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders label text', () => {
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByText('儀表板')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('marks link as current page when active', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
    });

    it('marks link as current for nested routes', () => {
      mockPathname.mockReturnValue('/dashboard/settings');
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark as current when on different page', () => {
      mockPathname.mockReturnValue('/customers');
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByRole('link')).not.toHaveAttribute('aria-current');
    });

    it('renders active indicator bar when active', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<SidebarItem {...defaultProps} />);

      const indicator = document.querySelector('[aria-hidden="true"]');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    it('shows tooltip when collapsed', () => {
      mockIsCollapsed.mockReturnValue(true);
      render(<SidebarItem {...defaultProps} />);

      expect(screen.getByRole('tooltip')).toHaveTextContent('儀表板');
    });

    it('does not show tooltip when expanded', () => {
      mockIsCollapsed.mockReturnValue(false);
      render(<SidebarItem {...defaultProps} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Different Items', () => {
    it('renders customers item correctly', () => {
      mockPathname.mockReturnValue('/customers');
      render(<SidebarItem href="/customers" label="客戶" icon={MockIcon} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/customers');
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('客戶')).toBeInTheDocument();
    });

    it('renders inactive item correctly', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<SidebarItem href="/customers" label="客戶" icon={MockIcon} />);

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('aria-current');
    });
  });
});
