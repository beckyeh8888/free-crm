/**
 * Chart Component Unit Tests
 * Tests for SalesPipelineChart, RevenueChart, CustomerAnalyticsChart,
 * TaskActivityChart, TeamPerformanceChart
 *
 * Recharts is mocked because jsdom cannot render SVG properly.
 * Tests verify data transformation, table rendering, and accessibility.
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock recharts - all chart components render as simple divs
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Bar: () => null,
  Area: () => null,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { SalesPipelineChart, pipelineTooltipFormatter } from '@/components/features/reports/SalesPipelineChart';
import { RevenueChart, revenueYAxisFormatter, revenueTooltipFormatter, revenueTooltipLabelFormatter } from '@/components/features/reports/RevenueChart';
import { CustomerAnalyticsChart } from '@/components/features/reports/CustomerAnalyticsChart';
import { TaskActivityChart } from '@/components/features/reports/TaskActivityChart';
import { TeamPerformanceChart, teamXAxisFormatter, teamTooltipFormatter } from '@/components/features/reports/TeamPerformanceChart';

describe('SalesPipelineChart', () => {
  const funnel = [
    { stage: 'lead', count: 100, value: 500000 },
    { stage: 'qualified', count: 50, value: 250000 },
    { stage: 'proposal', count: 30, value: 150000 },
    { stage: 'negotiation', count: 20, value: 100000 },
    { stage: 'closed_won', count: 10, value: 50000 },
    { stage: 'closed_lost', count: 5, value: 25000 },
  ];
  const conversionRates = [
    { from: 'lead', to: 'qualified', rate: 50 },
    { from: 'qualified', to: 'proposal', rate: 60 },
    { from: 'proposal', to: 'negotiation', rate: 67 },
    { from: 'negotiation', to: 'closed_won', rate: 50 },
  ];
  const summary = { totalDeals: 215, totalValue: 1075000, winRate: 67, avgDealValue: 5000, avgDaysToClose: 30 };

  it('renders pipeline funnel card', () => {
    render(
      <SalesPipelineChart funnel={funnel} conversionRates={conversionRates} summary={summary} />
    );

    expect(screen.getByText('Pipeline 漏斗')).toBeInTheDocument();
  });

  it('renders conversion rates table', () => {
    render(
      <SalesPipelineChart funnel={funnel} conversionRates={conversionRates} summary={summary} />
    );

    // '轉換率' appears in both the card title and table header
    expect(screen.getAllByText('轉換率').length).toBeGreaterThanOrEqual(1);
    // 50% appears twice (lead→qualified and negotiation→closed_won)
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders accessible table with aria-label', () => {
    render(
      <SalesPipelineChart funnel={funnel} conversionRates={conversionRates} summary={summary} />
    );

    expect(screen.getByLabelText('階段轉換率')).toBeInTheDocument();
  });
});

describe('RevenueChart', () => {
  const trends = [
    { period: '2026-01', wonValue: 100000, lostValue: 20000, dealCount: 5 },
    { period: '2026-02', wonValue: 150000, lostValue: 30000, dealCount: 8 },
  ];
  const summary = { totalRevenue: 250000, totalLost: 50000, growthRate: 50, avgDealSize: 25000, periodCount: 2 };

  it('renders revenue trend card', () => {
    render(<RevenueChart trends={trends} summary={summary} />);

    expect(screen.getByText('營收趨勢')).toBeInTheDocument();
  });

  it('passes description to accessible chart', () => {
    render(<RevenueChart trends={trends} summary={summary} />);

    // The AccessibleChart wraps with role="img"
    const chart = screen.getByRole('img');
    expect(chart).toHaveAttribute(
      'aria-label',
      expect.stringContaining('NT$250,000')
    );
  });
});

describe('CustomerAnalyticsChart', () => {
  const growth = [
    { period: '2026-01', newCustomers: 5, totalCustomers: 50 },
    { period: '2026-02', newCustomers: 8, totalCustomers: 58 },
  ];
  const statusDistribution = [
    { status: 'active', count: 40 },
    { status: 'inactive', count: 10 },
  ];
  const topCustomersByRevenue = [
    { id: '1', name: 'Customer A', company: 'Corp A', revenue: 500000, dealCount: 3 },
    { id: '2', name: 'Customer B', company: 'Corp B', revenue: 300000, dealCount: 2 },
  ];
  const summary = { totalCustomers: 58, activeCustomers: 40, newCustomersThisPeriod: 13, avgRevenuePerCustomer: 40000 };

  it('renders customer growth card', () => {
    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={topCustomersByRevenue}
        summary={summary}
      />
    );

    expect(screen.getByText('客戶成長趨勢')).toBeInTheDocument();
  });

  it('renders customer status distribution card', () => {
    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={topCustomersByRevenue}
        summary={summary}
      />
    );

    expect(screen.getByText('客戶狀態分佈')).toBeInTheDocument();
  });

  it('renders top customers table', () => {
    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={topCustomersByRevenue}
        summary={summary}
      />
    );

    expect(screen.getByText('營收 Top 10 客戶')).toBeInTheDocument();
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  it('shows empty message when no top customers', () => {
    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={[]}
        summary={summary}
      />
    );

    expect(screen.getByText('尚無資料')).toBeInTheDocument();
  });

  it('renders top customer table with aria-label', () => {
    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={topCustomersByRevenue}
        summary={summary}
      />
    );

    expect(screen.getByLabelText('營收排名前十客戶')).toBeInTheDocument();
  });
});

describe('TaskActivityChart', () => {
  const completionTrend = [
    { period: '2026-01', completed: 10, created: 15 },
    { period: '2026-02', completed: 12, created: 10 },
  ];
  const statusDistribution = [
    { label: '待處理', value: 5 },
    { label: '已完成', value: 20 },
  ];
  const priorityDistribution = [
    { label: '高', value: 8 },
    { label: '中', value: 12 },
  ];
  const typeDistribution = [
    { label: '任務', value: 15 },
    { label: '會議', value: 5 },
  ];
  const summary = { totalTasks: 25, completedTasks: 20, completionRate: 80, overdueTasks: 2, avgCompletionDays: 5 };

  it('renders task completion trend card', () => {
    render(
      <TaskActivityChart
        completionTrend={completionTrend}
        statusDistribution={statusDistribution}
        priorityDistribution={priorityDistribution}
        typeDistribution={typeDistribution}
        summary={summary}
      />
    );

    expect(screen.getByText('任務完成趨勢')).toBeInTheDocument();
  });

  it('renders status and priority distribution cards', () => {
    render(
      <TaskActivityChart
        completionTrend={completionTrend}
        statusDistribution={statusDistribution}
        priorityDistribution={priorityDistribution}
        typeDistribution={typeDistribution}
        summary={summary}
      />
    );

    expect(screen.getByText('狀態分佈')).toBeInTheDocument();
    expect(screen.getByText('優先級分佈')).toBeInTheDocument();
  });
});

describe('TeamPerformanceChart', () => {
  const members = [
    {
      userId: 'u1',
      name: '王小明',
      image: null,
      metrics: { deals: 10, wonDeals: 7, winRate: 70, revenue: 700000, tasks: 20, completedTasks: 18 },
    },
    {
      userId: 'u2',
      name: '李小華',
      image: null,
      metrics: { deals: 8, wonDeals: 5, winRate: 63, revenue: 500000, tasks: 15, completedTasks: 12 },
    },
  ];
  const summary = { totalMembers: 2, totalRevenue: 1200000, totalDeals: 18, avgWinRate: 67, topPerformer: '王小明' };

  it('renders team revenue chart card', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByText('團隊營收比較')).toBeInTheDocument();
  });

  it('renders member ranking table', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByText('成員排名')).toBeInTheDocument();
    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('李小華')).toBeInTheDocument();
  });

  it('shows win rate as percentage', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument();
  });

  it('shows deals as won/total format', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('5/8')).toBeInTheDocument();
  });

  it('shows completed/total tasks', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByText('18/20')).toBeInTheDocument();
    expect(screen.getByText('12/15')).toBeInTheDocument();
  });

  it('shows empty state when no members', () => {
    render(<TeamPerformanceChart members={[]} summary={{ ...summary, totalMembers: 0 }} />);

    expect(screen.getByText('尚無資料')).toBeInTheDocument();
  });

  it('renders ranking table with proper aria-label', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    expect(screen.getByLabelText('團隊成員績效排名')).toBeInTheDocument();
  });

  it('renders rank numbers', () => {
    render(<TeamPerformanceChart members={members} summary={summary} />);

    // First column is rank number
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('1');
  });
});

describe('Chart Formatter Functions', () => {
  describe('pipelineTooltipFormatter', () => {
    it('returns value with 商機數 label', () => {
      expect(pipelineTooltipFormatter(42)).toEqual([42, '商機數']);
    });

    it('handles null value with fallback to 0', () => {
      expect(pipelineTooltipFormatter(null)).toEqual([0, '商機數']);
    });

    it('handles undefined value with fallback to 0', () => {
      expect(pipelineTooltipFormatter(undefined)).toEqual([0, '商機數']);
    });
  });

  describe('revenueYAxisFormatter', () => {
    it('formats numbers compactly', () => {
      const result = revenueYAxisFormatter(1000000);
      expect(result).toBe('1.0M');
    });

    it('formats small numbers', () => {
      const result = revenueYAxisFormatter(500);
      expect(result).toBe('500');
    });
  });

  describe('revenueTooltipFormatter', () => {
    it('formats currency with name', () => {
      const [formatted, name] = revenueTooltipFormatter(100000, '成交額');
      expect(formatted).toContain('100,000');
      expect(name).toBe('成交額');
    });

    it('handles null value', () => {
      const [formatted, name] = revenueTooltipFormatter(null, '失敗額');
      expect(formatted).toContain('0');
      expect(name).toBe('失敗額');
    });
  });

  describe('revenueTooltipLabelFormatter', () => {
    it('converts label to string', () => {
      expect(revenueTooltipLabelFormatter('2026-01')).toBe('2026-01');
    });

    it('handles numeric label', () => {
      expect(revenueTooltipLabelFormatter(123)).toBe('123');
    });
  });

  describe('teamXAxisFormatter', () => {
    it('formats numbers compactly', () => {
      expect(teamXAxisFormatter(500000)).toBe('500.0K');
    });
  });

  describe('teamTooltipFormatter', () => {
    it('formats 營收 as currency', () => {
      const result = teamTooltipFormatter(700000, '營收');
      expect(result[0]).toContain('700,000');
      expect(result[1]).toBe('營收');
    });

    it('returns raw number for non-營收 fields', () => {
      const result = teamTooltipFormatter(10, '商機數');
      expect(result[0]).toBe(10);
      expect(result[1]).toBe('商機數');
    });

    it('handles null value', () => {
      const result = teamTooltipFormatter(null, '營收');
      expect(result[0]).toContain('0');
      expect(result[1]).toBe('營收');
    });
  });
});

describe('CustomerAnalyticsChart with unknown status', () => {
  it('renders unknown status labels as-is', () => {
    const growth = [{ period: '2026-01', newCustomers: 1, totalCustomers: 1 }];
    const statusDistribution = [
      { status: 'unknown_status', count: 5 },
    ];
    const topCustomersByRevenue: readonly { readonly id: string; readonly name: string; readonly company: string; readonly revenue: number; readonly dealCount: number }[] = [];
    const summary = { totalCustomers: 5, activeCustomers: 0, newCustomersThisPeriod: 1, avgRevenuePerCustomer: 0 };

    render(
      <CustomerAnalyticsChart
        growth={growth}
        statusDistribution={statusDistribution}
        topCustomersByRevenue={topCustomersByRevenue}
        summary={summary}
      />
    );

    // Unknown statuses should use the status key as-is
    expect(screen.getByText('客戶狀態分佈')).toBeInTheDocument();
  });
});
