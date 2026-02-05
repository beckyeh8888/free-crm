/**
 * AccessibleChart Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibleChart } from '@/components/features/reports/AccessibleChart';

const mockColumns = ['期間', '營收', '商機數'];
const mockData = [
  { '期間': '2026年1月', '營收': 'NT$100,000', '商機數': 5 },
  { '期間': '2026年2月', '營收': 'NT$150,000', '商機數': 8 },
];

describe('AccessibleChart Component', () => {
  it('renders chart view by default', () => {
    render(
      <AccessibleChart title="Test Chart" columns={mockColumns} data={mockData}>
        <div data-testid="chart">Chart Content</div>
      </AccessibleChart>
    );

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders chart with role="img" and aria-label', () => {
    render(
      <AccessibleChart title="Revenue Chart" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveAttribute('aria-label', 'Revenue Chart');
  });

  it('includes description in aria-label when provided', () => {
    render(
      <AccessibleChart
        title="Revenue Chart"
        description="Total: NT$250,000"
        columns={mockColumns}
        data={mockData}
      >
        <div>Chart</div>
      </AccessibleChart>
    );

    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveAttribute('aria-label', 'Revenue Chart: Total: NT$250,000');
  });

  it('shows toggle button', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    expect(screen.getByText('顯示表格')).toBeInTheDocument();
  });

  it('switches to table view when toggle clicked', () => {
    render(
      <AccessibleChart title="Test Chart" columns={mockColumns} data={mockData}>
        <div data-testid="chart">Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    // Table should be visible
    expect(screen.getByRole('table')).toBeInTheDocument();
    // Chart should not be visible
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    // Button label changes
    expect(screen.getByText('顯示圖表')).toBeInTheDocument();
  });

  it('renders table with correct headers', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    mockColumns.forEach((col) => {
      expect(screen.getByText(col)).toBeInTheDocument();
    });
  });

  it('renders table with correct data', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    expect(screen.getByText('2026年1月')).toBeInTheDocument();
    expect(screen.getByText('NT$100,000')).toBeInTheDocument();
    expect(screen.getByText('NT$150,000')).toBeInTheDocument();
  });

  it('table has proper aria-label', () => {
    render(
      <AccessibleChart title="Revenue Chart" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Revenue Chart 資料表格');
  });

  it('table has caption for screen readers', () => {
    render(
      <AccessibleChart title="Revenue Chart" description="Summary" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    const caption = screen.getByText('Revenue Chart - Summary');
    expect(caption).toBeInTheDocument();
    expect(caption.className).toContain('sr-only');
  });

  it('switches back to chart view when toggle clicked again', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div data-testid="chart">Chart</div>
      </AccessibleChart>
    );

    // Switch to table
    fireEvent.click(screen.getByText('顯示表格'));
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Switch back to chart
    fireEvent.click(screen.getByText('顯示圖表'));
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('toggle button has correct aria-label', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    const button = screen.getByText('顯示表格');
    expect(button).toHaveAttribute('aria-label', '切換至資料表格');

    fireEvent.click(button);
    expect(screen.getByText('顯示圖表')).toHaveAttribute('aria-label', '切換至圖表');
  });

  it('table headers have scope="col"', () => {
    render(
      <AccessibleChart title="Test" columns={mockColumns} data={mockData}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });

  it('displays dash for null/undefined values', () => {
    const dataWithNull = [
      { '期間': '2026年1月', '營收': null, '商機數': undefined },
    ];

    render(
      <AccessibleChart title="Test" columns={mockColumns} data={dataWithNull}>
        <div>Chart</div>
      </AccessibleChart>
    );

    fireEvent.click(screen.getByText('顯示表格'));

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
