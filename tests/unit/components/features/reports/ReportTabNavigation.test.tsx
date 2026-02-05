/**
 * ReportTabNavigation Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportTabNavigation } from '@/components/features/reports/ReportTabNavigation';

describe('ReportTabNavigation Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 tabs', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    expect(screen.getByText('銷售管線')).toBeInTheDocument();
    expect(screen.getByText('營收分析')).toBeInTheDocument();
    expect(screen.getByText('客戶分析')).toBeInTheDocument();
    expect(screen.getByText('任務活動')).toBeInTheDocument();
    expect(screen.getByText('團隊績效')).toBeInTheDocument();
  });

  it('uses tablist role', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('marks active tab as selected', () => {
    render(<ReportTabNavigation activeTab="revenue" onChange={mockOnChange} />);

    const tabs = screen.getAllByRole('tab');
    const revenueTab = tabs.find((t) => t.textContent === '營收分析');
    expect(revenueTab).toHaveAttribute('aria-selected', 'true');
  });

  it('marks non-active tabs as not selected', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    const tabs = screen.getAllByRole('tab');
    const otherTabs = tabs.filter((t) => t.textContent !== '銷售管線');
    otherTabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('calls onChange with correct tab key when clicked', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('營收分析'));
    expect(mockOnChange).toHaveBeenCalledWith('revenue');

    fireEvent.click(screen.getByText('客戶分析'));
    expect(mockOnChange).toHaveBeenCalledWith('customers');

    fireEvent.click(screen.getByText('任務活動'));
    expect(mockOnChange).toHaveBeenCalledWith('tasks');

    fireEvent.click(screen.getByText('團隊績效'));
    expect(mockOnChange).toHaveBeenCalledWith('team');
  });

  it('has aria-controls linking to panels', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'report-panel-pipeline');
    expect(tabs[1]).toHaveAttribute('aria-controls', 'report-panel-revenue');
  });

  it('has proper id attributes for tabs', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('id', 'report-tab-pipeline');
    expect(tabs[1]).toHaveAttribute('id', 'report-tab-revenue');
  });

  it('renders nav element with proper aria-label', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '報表類型');
  });

  it('active tab has highlighted styling', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    const tab = screen.getByText('銷售管線');
    expect(tab.className).toContain('text-[#0070f0]');
    expect(tab.className).toContain('border-b-2');
  });

  it('meets minimum touch target size', () => {
    render(<ReportTabNavigation activeTab="pipeline" onChange={mockOnChange} />);

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab) => {
      expect(tab.className).toContain('min-h-[44px]');
    });
  });
});
