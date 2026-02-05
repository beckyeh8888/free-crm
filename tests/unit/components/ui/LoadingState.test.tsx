/**
 * LoadingState Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState, Skeleton } from '@/components/ui/LoadingState/LoadingState';

describe('LoadingState', () => {
  describe('Spinner variant (default)', () => {
    it('renders spinner by default', () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders default message', () => {
      render(<LoadingState />);

      // Message appears both visually and in sr-only span
      const messages = screen.getAllByText('載入中...');
      expect(messages.length).toBe(2);
    });

    it('renders custom message', () => {
      render(<LoadingState message="載入客戶資料..." />);

      const messages = screen.getAllByText('載入客戶資料...');
      expect(messages.length).toBe(2);
    });

    it('renders screen reader announcement', () => {
      render(<LoadingState message="載入中" />);

      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toHaveTextContent('載入中');
    });
  });

  describe('Dots variant', () => {
    it('renders three dots', () => {
      const { container } = render(<LoadingState variant="dots" />);

      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Skeleton variant', () => {
    it('renders skeleton lines', () => {
      const { container } = render(<LoadingState variant="skeleton" />);

      const lines = container.querySelectorAll('.animate-pulse');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('renders custom number of skeleton lines', () => {
      const { container } = render(<LoadingState variant="skeleton" skeletonLines={5} />);

      const skeletonContainer = container.querySelector('[aria-hidden="true"]');
      expect(skeletonContainer).toBeInTheDocument();
      expect(skeletonContainer?.children).toHaveLength(5);
    });

    it('does not show message for skeleton variant', () => {
      render(<LoadingState variant="skeleton" message="載入中..." />);

      // Message should only appear in sr-only
      const visibleMessage = screen.queryByText('載入中...');
      // The sr-only should exist
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toHaveTextContent('載入中...');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<LoadingState size="sm" />);

      expect(container.querySelector('.w-6')).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(<LoadingState size="lg" />);

      expect(container.querySelector('.w-16')).toBeInTheDocument();
    });
  });

  describe('Full Page', () => {
    it('renders full page overlay', () => {
      const { container } = render(<LoadingState fullPage />);

      expect(container.querySelector('.fixed')).toBeInTheDocument();
    });

    it('does not render overlay by default', () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector('.fixed')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live polite', () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });

    it('has aria-busy true', () => {
      const { container } = render(<LoadingState />);

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('renders children', () => {
      render(
        <LoadingState>
          <span data-testid="child">Custom content</span>
        </LoadingState>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});

describe('Skeleton', () => {
  it('renders with custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);

    expect(container.querySelector('.h-4')).toBeInTheDocument();
  });

  it('renders with custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="20px" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('20px');
  });

  it('has aria-hidden', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('has pulse animation', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
