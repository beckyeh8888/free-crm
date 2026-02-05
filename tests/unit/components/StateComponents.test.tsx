/**
 * State Components Unit Tests
 * Tests for LoadingState, ErrorState, and EmptyState components
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingState, Skeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

describe('LoadingState Component', () => {
  describe('Rendering', () => {
    it('renders with default spinner variant', () => {
      render(<LoadingState />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-busy', 'true');
    });

    it('renders loading message', () => {
      render(<LoadingState />);

      // Default message appears in visible p element
      expect(screen.getByText('載入中...', { selector: 'p' })).toBeInTheDocument();
    });

    it('renders custom message', () => {
      render(<LoadingState message="Please wait..." />);

      // Message appears in visible p element and sr-only span
      expect(screen.getByText('Please wait...', { selector: 'p' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders spinner variant', () => {
      render(<LoadingState variant="spinner" />);

      const status = screen.getByRole('status');
      // Spinner uses aria-hidden="true" for decorative elements
      expect(status.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders dots variant', () => {
      render(<LoadingState variant="dots" />);

      // Dots variant renders 3 animated dots
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('renders skeleton variant', () => {
      render(<LoadingState variant="skeleton" skeletonLines={3} />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<LoadingState size="sm" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      render(<LoadingState size="md" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders large size', () => {
      render(<LoadingState size="lg" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Full Page Mode', () => {
    it('renders full page overlay when fullPage is true', () => {
      render(<LoadingState fullPage />);

      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has status role', () => {
      render(<LoadingState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      render(<LoadingState />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy true', () => {
      render(<LoadingState />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
    });

    it('has screen reader only announcement', () => {
      render(<LoadingState message="Loading data" />);

      const srOnly = screen.getByText('Loading data', { selector: '.sr-only' });
      expect(srOnly).toBeInTheDocument();
    });
  });

  describe('Children', () => {
    it('renders custom children', () => {
      render(
        <LoadingState>
          <span data-testid="custom-child">Custom content</span>
        </LoadingState>
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });
  });
});

describe('Skeleton Component', () => {
  it('renders with default props', () => {
    render(<Skeleton />);

    // Skeleton uses aria-hidden="true" for accessibility
    const skeleton = document.querySelector('[aria-hidden="true"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(<Skeleton width={200} height={40} />);

    const skeleton = document.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveStyle({ width: '200px', height: '40px' });
  });

  it('renders with custom className', () => {
    render(<Skeleton className="custom-class" />);

    const skeleton = document.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('is hidden from screen readers', () => {
    render(<Skeleton />);

    const skeleton = document.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('has pulse animation', () => {
    render(<Skeleton />);

    const skeleton = document.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('animate-pulse');
  });
});

describe('ErrorState Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ErrorState />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<ErrorState title="Custom Error" />);

      expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('renders custom description', () => {
      render(<ErrorState description="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Types', () => {
    it('renders generic error', () => {
      render(<ErrorState type="generic" />);

      expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    });

    it('renders network error', () => {
      render(<ErrorState type="network" />);

      expect(screen.getByText('網路連線錯誤')).toBeInTheDocument();
    });

    it('renders notFound error', () => {
      render(<ErrorState type="notFound" />);

      expect(screen.getByText('找不到資源')).toBeInTheDocument();
    });

    it('renders unauthorized error', () => {
      render(<ErrorState type="unauthorized" />);

      expect(screen.getByText('存取被拒絕')).toBeInTheDocument();
    });

    it('renders server error', () => {
      render(<ErrorState type="server" />);

      expect(screen.getByText('伺服器錯誤')).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('shows retry button when onRetry is provided', () => {
      render(<ErrorState onRetry={() => {}} />);

      expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
    });

    it('calls onRetry when clicked', () => {
      const handleRetry = vi.fn();
      render(<ErrorState onRetry={handleRetry} />);

      fireEvent.click(screen.getByRole('button', { name: '重試' }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('shows custom retry text', () => {
      render(<ErrorState onRetry={() => {}} retryText="Try Again" />);

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(<ErrorState />);

      expect(screen.queryByRole('button', { name: '重試' })).not.toBeInTheDocument();
    });
  });

  describe('Custom Actions', () => {
    it('renders custom action', () => {
      render(
        <ErrorState
          action={<button type="button">Go Home</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
    });
  });

  describe('Custom Icon', () => {
    it('renders custom icon', () => {
      render(
        <ErrorState
          icon={<span data-testid="custom-icon">!</span>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has alert role', () => {
      render(<ErrorState />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live assertive', () => {
      render(<ErrorState />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('retry button meets touch target size', () => {
      render(<ErrorState onRetry={() => {}} />);

      const button = screen.getByRole('button', { name: '重試' });
      expect(button.className).toContain('min-h-[44px]');
    });
  });
});

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('暫無資料')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<EmptyState title="No Results" />);

      expect(screen.getByText('No Results')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<EmptyState description="Try a different search" />);

      expect(screen.getByText('Try a different search')).toBeInTheDocument();
    });
  });

  describe('Custom Content', () => {
    it('renders custom icon', () => {
      render(
        <EmptyState
          icon={<span data-testid="custom-icon">📭</span>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders action', () => {
      render(
        <EmptyState
          action={<button type="button">Create New</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has status role', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label with title', () => {
      render(<EmptyState title="No Data" />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'No Data');
    });

    it('default icon is hidden from screen readers', () => {
      render(<EmptyState />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('custom icon container is hidden from screen readers', () => {
      render(
        <EmptyState
          icon={<span>Icon</span>}
        />
      );

      const iconContainer = document.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
