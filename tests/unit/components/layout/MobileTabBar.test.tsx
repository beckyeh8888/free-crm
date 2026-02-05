/**
 * MobileTabBar Component Tests
 * Unit tests for mobile bottom navigation
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('MobileTabBar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders navigation bar', () => {
    render(<MobileTabBar />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('行動導航')).toBeInTheDocument();
  });

  it('renders all tab items', () => {
    render(<MobileTabBar />);

    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('客戶')).toBeInTheDocument();
    expect(screen.getByText('商機')).toBeInTheDocument();
    expect(screen.getByText('更多')).toBeInTheDocument();
  });

  it('renders action button for add tab', () => {
    render(<MobileTabBar />);

    expect(screen.getByLabelText('新增')).toBeInTheDocument();
  });

  it('highlights active tab when on dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<MobileTabBar />);

    const homeLink = screen.getByText('首頁').closest('a');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('highlights active tab when on customers page', () => {
    mockUsePathname.mockReturnValue('/customers');
    render(<MobileTabBar />);

    const customersLink = screen.getByText('客戶').closest('a');
    expect(customersLink).toHaveAttribute('aria-current', 'page');
  });

  it('highlights active tab when on nested page', () => {
    mockUsePathname.mockReturnValue('/customers/123');
    render(<MobileTabBar />);

    const customersLink = screen.getByText('客戶').closest('a');
    expect(customersLink).toHaveAttribute('aria-current', 'page');
  });

  it('highlights active tab when on deals page', () => {
    mockUsePathname.mockReturnValue('/deals');
    render(<MobileTabBar />);

    const dealsLink = screen.getByText('商機').closest('a');
    expect(dealsLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not highlight non-active tabs', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<MobileTabBar />);

    const customersLink = screen.getByText('客戶').closest('a');
    expect(customersLink).not.toHaveAttribute('aria-current');
  });

  it('renders correct href for each tab', () => {
    render(<MobileTabBar />);

    expect(screen.getByText('首頁').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('客戶').closest('a')).toHaveAttribute('href', '/customers');
    expect(screen.getByText('商機').closest('a')).toHaveAttribute('href', '/deals');
    expect(screen.getByText('更多').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('has accessible touch targets (min 48x48)', () => {
    const { container } = render(<MobileTabBar />);

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      // Check that the link has min-w-[48px] min-h-[48px] classes or equivalent
      expect(link.className).toMatch(/min-[wh]-\[48px\]|w-12|h-12/);
    });
  });

  it('is hidden on large screens via lg:hidden class', () => {
    render(<MobileTabBar />);

    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('lg:hidden');
  });
});
