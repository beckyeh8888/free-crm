/**
 * ReportKPI Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { ReportKPI } from '@/components/features/reports/ReportKPI';

describe('ReportKPI Component', () => {
  it('renders label and value', () => {
    render(<ReportKPI label="營收" value="NT$1,000,000" />);

    expect(screen.getByText('營收')).toBeInTheDocument();
    expect(screen.getByText('NT$1,000,000')).toBeInTheDocument();
  });

  it('shows up arrow for positive trend', () => {
    render(<ReportKPI label="成長" value="100" trend={25} />);

    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it('shows down arrow for negative trend', () => {
    render(<ReportKPI label="成長" value="50" trend={-15} />);

    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it('shows no arrow when trend is 0', () => {
    render(<ReportKPI label="成長" value="100" trend={0} />);

    const trendEl = screen.getByText(/0%/);
    expect(trendEl).toBeInTheDocument();
    expect(trendEl.textContent).not.toContain('↑');
    expect(trendEl.textContent).not.toContain('↓');
  });

  it('does not show trend when undefined', () => {
    render(<ReportKPI label="指標" value="42" />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('applies green color for positive trend', () => {
    render(<ReportKPI label="Test" value="100" trend={10} />);

    const trendEl = screen.getByText(/10%/);
    expect(trendEl.className).toContain('text-[#22c55e]');
  });

  it('applies red color for negative trend', () => {
    render(<ReportKPI label="Test" value="100" trend={-10} />);

    const trendEl = screen.getByText(/10%/);
    expect(trendEl.className).toContain('text-[#ef4444]');
  });

  it('displays trendLabel when provided', () => {
    render(<ReportKPI label="Test" value="100" trend={5} trendLabel="vs 上月" />);

    expect(screen.getByText(/vs 上月/)).toBeInTheDocument();
  });
});
