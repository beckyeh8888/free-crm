/**
 * GanttHeader Component Tests
 * Unit tests for time axis header
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { GanttHeader } from '@/components/features/gantt/GanttHeader';

describe('GanttHeader', () => {
  describe('Week View', () => {
    it('renders daily labels for week view', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-07');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="week"
        />
      );

      // Should show day numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      // Should show day of week
      expect(screen.getByText('日')).toBeInTheDocument();
    });

    it('shows task column header', () => {
      render(
        <GanttHeader
          startDate={new Date('2026-02-01')}
          endDate={new Date('2026-02-07')}
          timeRange="week"
        />
      );

      expect(screen.getByText('任務')).toBeInTheDocument();
    });
  });

  describe('Month View', () => {
    it('renders weekly labels for month view', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="month"
        />
      );

      // Should show week labels (date format)
      expect(screen.getByText('2/1')).toBeInTheDocument();
      // Should show "週" sublabel
      expect(screen.getAllByText('週').length).toBeGreaterThan(0);
    });
  });

  describe('Quarter View', () => {
    it('renders monthly labels for quarter view', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-03-31');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="quarter"
        />
      );

      // Should show month labels
      expect(screen.getByText('1月')).toBeInTheDocument();
      expect(screen.getByText('2月')).toBeInTheDocument();
      expect(screen.getByText('3月')).toBeInTheDocument();
    });
  });

  describe('Year View', () => {
    it('renders quarterly labels for year view', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="year"
        />
      );

      // Should show Q1, Q2, Q3, Q4
      expect(screen.getByText('Q1')).toBeInTheDocument();
      expect(screen.getByText('Q2')).toBeInTheDocument();
      expect(screen.getByText('Q3')).toBeInTheDocument();
      expect(screen.getByText('Q4')).toBeInTheDocument();
      // Should show year
      expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('has correct structure', () => {
      const { container } = render(
        <GanttHeader
          startDate={new Date('2026-02-01')}
          endDate={new Date('2026-02-07')}
          timeRange="week"
        />
      );

      // Should have flex container
      expect(container.querySelector('.flex')).toBeInTheDocument();
      // Should have task column with fixed width
      expect(container.querySelector('.w-64')).toBeInTheDocument();
    });

    it('renders labels with correct width percentages', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-02');

      const { container } = render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="week"
        />
      );

      // Each day should have 50% width (2 days total)
      const labelDivs = container.querySelectorAll('[style*="width"]');
      expect(labelDivs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single day range', () => {
      const singleDay = new Date('2026-02-15');

      render(
        <GanttHeader
          startDate={singleDay}
          endDate={singleDay}
          timeRange="week"
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('handles cross-month range', () => {
      const startDate = new Date('2026-01-28');
      const endDate = new Date('2026-02-03');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="week"
        />
      );

      // Should show days from both months
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles cross-year range', () => {
      const startDate = new Date('2025-12-01');
      const endDate = new Date('2026-03-31');

      render(
        <GanttHeader
          startDate={startDate}
          endDate={endDate}
          timeRange="quarter"
        />
      );

      // Should show months from both years
      expect(screen.getByText('12月')).toBeInTheDocument();
      expect(screen.getByText('1月')).toBeInTheDocument();
    });
  });
});
