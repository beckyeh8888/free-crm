/**
 * Pagination Component Unit Tests
 * Tests for Pagination component with various configurations
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination Component', () => {
  describe('Rendering', () => {
    it('renders navigation landmark', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('navigation', { name: '分頁導航' })).toBeInTheDocument();
    });

    it('renders page buttons', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往第 1 頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往第 2 頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往第 5 頁' })).toBeInTheDocument();
    });

    it('returns null when totalPages is 1', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 0', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPageChange={() => {}}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation Buttons', () => {
    it('renders first/last buttons by default', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往第一頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往最後一頁' })).toBeInTheDocument();
    });

    it('renders prev/next buttons by default', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往上一頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往下一頁' })).toBeInTheDocument();
    });

    it('hides first/last buttons when showFirstLast is false', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
          showFirstLast={false}
        />
      );

      expect(screen.queryByRole('button', { name: '前往第一頁' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '前往最後一頁' })).not.toBeInTheDocument();
    });

    it('hides prev/next buttons when showPrevNext is false', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
          showPrevNext={false}
        />
      );

      expect(screen.queryByRole('button', { name: '前往上一頁' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '前往下一頁' })).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('disables first and prev buttons on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往第一頁' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '前往上一頁' })).toBeDisabled();
    });

    it('disables last and next buttons on last page', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往最後一頁' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '前往下一頁' })).toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Page Change Callbacks', () => {
    it('calls onPageChange with correct page when clicking page button', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '前往第 3 頁' }));
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with 1 when clicking first button', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '前往第一頁' }));
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with totalPages when clicking last button', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '前往最後一頁' }));
      expect(handlePageChange).toHaveBeenCalledWith(5);
    });

    it('calls onPageChange with currentPage - 1 when clicking prev', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '前往上一頁' }));
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with currentPage + 1 when clicking next', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '前往下一頁' }));
      expect(handlePageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Current Page Indicator', () => {
    it('marks current page with aria-current', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const currentPageButton = screen.getByRole('button', { name: '前往第 3 頁' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark other pages with aria-current', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const otherPageButton = screen.getByRole('button', { name: '前往第 1 頁' });
      expect(otherPageButton).not.toHaveAttribute('aria-current');
    });
  });

  describe('Ellipsis Display', () => {
    it('shows ellipsis when there are many pages', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      // Ellipsis should be present (may be one or two depending on position)
      const ellipses = screen.getAllByText('⋯');
      expect(ellipses.length).toBeGreaterThan(0);
    });

    it('does not show ellipsis when all pages fit', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      // No ellipsis should be present
      expect(screen.queryByText('⋯')).not.toBeInTheDocument();
    });

    it('ellipsis elements are hidden from screen readers', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      const ellipses = screen.getAllByText('⋯');
      ellipses.forEach((ellipsis) => {
        expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
          size="sm"
        />
      );

      const button = screen.getByRole('button', { name: '前往第 1 頁' });
      expect(button.className).toContain('min-w-[32px]');
    });

    it('renders medium size (default)', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
          size="md"
        />
      );

      const button = screen.getByRole('button', { name: '前往第 1 頁' });
      expect(button.className).toContain('min-w-[44px]');
    });

    it('renders large size', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
          size="lg"
        />
      );

      const button = screen.getByRole('button', { name: '前往第 1 頁' });
      expect(button.className).toContain('min-w-[52px]');
    });
  });

  describe('Accessibility', () => {
    it('has navigation role with label', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('navigation', { name: '分頁導航' })).toBeInTheDocument();
    });

    it('all page buttons have aria-label', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const pageButtons = [1, 2, 3, 4, 5];
      pageButtons.forEach((page) => {
        expect(screen.getByRole('button', { name: `前往第 ${page} 頁` })).toBeInTheDocument();
      });
    });

    it('navigation buttons have aria-labels', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '前往第一頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往上一頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往下一頁' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '前往最後一頁' })).toBeInTheDocument();
    });

    it('buttons have focus ring styles', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: '前往第 1 頁' });
      expect(button.className).toContain('focus:ring-2');
    });
  });

  describe('Page Range Calculation', () => {
    it('shows first page when on page 1', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      expect(screen.getByRole('button', { name: '前往第 1 頁' })).toBeInTheDocument();
    });

    it('shows last page when on last page', () => {
      render(
        <Pagination
          currentPage={10}
          totalPages={10}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      expect(screen.getByRole('button', { name: '前往第 10 頁' })).toBeInTheDocument();
    });

    it('shows correct range when in middle', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={() => {}}
          visiblePages={5}
        />
      );

      // Should show pages around current page
      expect(screen.getByRole('button', { name: '前往第 5 頁' })).toBeInTheDocument();
    });
  });
});
