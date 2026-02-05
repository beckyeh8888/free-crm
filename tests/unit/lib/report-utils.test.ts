/**
 * Report Utils Tests
 * Unit tests for report utility functions
 *
 * @vitest-environment node
 */

import {
  dateToPeriod,
  getISOWeekNumber,
  generatePeriodLabels,
  calculateConversionRates,
  calculateGrowthRate,
  calculateRevenueGrowth,
  daysBetween,
  getStartOfPeriod,
  getEndOfPeriod,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatPeriodLabel,
} from '@/lib/report-utils';

describe('dateToPeriod', () => {
  it('formats date as month period', () => {
    expect(dateToPeriod(new Date('2026-03-15'), 'month')).toBe('2026-03');
  });

  it('formats date as quarter period', () => {
    expect(dateToPeriod(new Date('2026-03-15'), 'quarter')).toBe('2026-Q1');
    expect(dateToPeriod(new Date('2026-06-15'), 'quarter')).toBe('2026-Q2');
    expect(dateToPeriod(new Date('2026-09-15'), 'quarter')).toBe('2026-Q3');
    expect(dateToPeriod(new Date('2026-12-15'), 'quarter')).toBe('2026-Q4');
  });

  it('formats date as week period', () => {
    const result = dateToPeriod(new Date('2026-02-05'), 'week');
    expect(result).toMatch(/^2026-W\d{2}$/);
  });

  it('pads month with leading zero', () => {
    expect(dateToPeriod(new Date('2026-01-05'), 'month')).toBe('2026-01');
  });
});

describe('getISOWeekNumber', () => {
  it('returns correct week number for Jan 1 2026', () => {
    const week = getISOWeekNumber(new Date('2026-01-01'));
    expect(week).toBe(1);
  });

  it('returns week number in valid range', () => {
    const week = getISOWeekNumber(new Date('2026-06-15'));
    expect(week).toBeGreaterThan(0);
    expect(week).toBeLessThanOrEqual(53);
  });
});

describe('generatePeriodLabels', () => {
  it('generates monthly labels', () => {
    const labels = generatePeriodLabels(
      new Date('2026-01-01'),
      new Date('2026-03-31'),
      'month'
    );
    expect(labels).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('generates quarterly labels', () => {
    const labels = generatePeriodLabels(
      new Date('2026-01-01'),
      new Date('2026-12-31'),
      'quarter'
    );
    expect(labels).toEqual(['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4']);
  });

  it('generates weekly labels', () => {
    const labels = generatePeriodLabels(
      new Date('2026-02-01'),
      new Date('2026-02-14'),
      'week'
    );
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toMatch(/^2026-W\d{2}$/);
  });

  it('returns at least one label for same day range', () => {
    const labels = generatePeriodLabels(
      new Date('2026-01-15'),
      new Date('2026-01-15'),
      'month'
    );
    expect(labels).toEqual(['2026-01']);
  });
});

describe('calculateConversionRates', () => {
  it('calculates conversion rates from funnel data', () => {
    const funnel = [
      { stage: 'lead', count: 100, value: 0 },
      { stage: 'qualified', count: 50, value: 0 },
      { stage: 'proposal', count: 30, value: 0 },
      { stage: 'negotiation', count: 20, value: 0 },
      { stage: 'closed_won', count: 10, value: 0 },
    ];

    const rates = calculateConversionRates(funnel);
    expect(rates).toHaveLength(4);
    expect(rates[0]).toEqual({ from: 'lead', to: 'qualified', rate: 50 });
    expect(rates[1]).toEqual({ from: 'qualified', to: 'proposal', rate: 60 });
  });

  it('returns 0 rate when from-stage count is 0', () => {
    const funnel = [
      { stage: 'lead', count: 0, value: 0 },
      { stage: 'qualified', count: 5, value: 0 },
      { stage: 'proposal', count: 0, value: 0 },
      { stage: 'negotiation', count: 0, value: 0 },
      { stage: 'closed_won', count: 0, value: 0 },
    ];

    const rates = calculateConversionRates(funnel);
    expect(rates[0].rate).toBe(0);
  });

  it('handles empty funnel', () => {
    const rates = calculateConversionRates([]);
    expect(rates).toHaveLength(4);
    rates.forEach((r) => expect(r.rate).toBe(0));
  });
});

describe('calculateGrowthRate', () => {
  it('calculates positive growth', () => {
    expect(calculateGrowthRate(150, 100)).toBe(50);
  });

  it('calculates negative growth', () => {
    expect(calculateGrowthRate(50, 100)).toBe(-50);
  });

  it('returns 100 when previous is 0 and current > 0', () => {
    expect(calculateGrowthRate(100, 0)).toBe(100);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateGrowthRate(0, 0)).toBe(0);
  });

  it('returns 0 when no change', () => {
    expect(calculateGrowthRate(100, 100)).toBe(0);
  });
});

describe('calculateRevenueGrowth', () => {
  it('calculates growth from trends', () => {
    const trends = [
      { period: '2026-01', wonValue: 100, lostValue: 0, dealCount: 1 },
      { period: '2026-02', wonValue: 150, lostValue: 0, dealCount: 1 },
    ];
    expect(calculateRevenueGrowth(trends)).toBe(50);
  });

  it('returns 0 for single period', () => {
    const trends = [
      { period: '2026-01', wonValue: 100, lostValue: 0, dealCount: 1 },
    ];
    expect(calculateRevenueGrowth(trends)).toBe(0);
  });

  it('returns 0 for empty trends', () => {
    expect(calculateRevenueGrowth([])).toBe(0);
  });
});

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    expect(daysBetween(new Date('2026-02-01'), new Date('2026-02-10'))).toBe(9);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween(new Date('2026-02-01'), new Date('2026-02-01'))).toBe(0);
  });

  it('is symmetric', () => {
    const a = new Date('2026-01-01');
    const b = new Date('2026-03-01');
    expect(daysBetween(a, b)).toBe(daysBetween(b, a));
  });
});

describe('getStartOfPeriod', () => {
  it('returns start of month', () => {
    const result = getStartOfPeriod(new Date('2026-03-15'), 'month');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // March = 2
    expect(result.getDate()).toBe(1);
  });

  it('returns start of quarter', () => {
    const result = getStartOfPeriod(new Date('2026-05-15'), 'quarter');
    expect(result.getMonth()).toBe(3); // April = 3 (Q2 start)
    expect(result.getDate()).toBe(1);
  });

  it('returns start of year', () => {
    const result = getStartOfPeriod(new Date('2026-06-15'), 'year');
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });
});

describe('getEndOfPeriod', () => {
  it('returns end of month', () => {
    const result = getEndOfPeriod(new Date('2026-02-15'), 'month');
    expect(result.getDate()).toBe(28); // Feb 2026
  });

  it('returns end of quarter', () => {
    const result = getEndOfPeriod(new Date('2026-01-15'), 'quarter');
    expect(result.getMonth()).toBe(2); // March = end of Q1
  });

  it('returns end of year', () => {
    const result = getEndOfPeriod(new Date('2026-06-15'), 'year');
    expect(result.getMonth()).toBe(11); // December
  });
});

describe('formatCurrency', () => {
  it('formats number as TWD currency', () => {
    expect(formatCurrency(1000)).toContain('NT$');
    expect(formatCurrency(1000)).toContain('1,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('NT$0');
  });
});

describe('formatPercentage', () => {
  it('formats number as percentage', () => {
    expect(formatPercentage(75)).toBe('75%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0%');
  });
});

describe('formatCompactNumber', () => {
  it('formats millions', () => {
    expect(formatCompactNumber(1500000)).toBe('1.5M');
  });

  it('formats thousands', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
  });

  it('formats small numbers without abbreviation', () => {
    expect(formatCompactNumber(999)).toBe('999');
  });
});

describe('formatPeriodLabel', () => {
  it('formats month period', () => {
    expect(formatPeriodLabel('2026-01')).toBe('2026年1月');
    expect(formatPeriodLabel('2026-12')).toBe('2026年12月');
  });

  it('formats quarter period', () => {
    expect(formatPeriodLabel('2026-Q1')).toBe('2026年Q1');
  });

  it('formats week period', () => {
    expect(formatPeriodLabel('2026-W06')).toBe('2026年第6週');
  });

  it('returns raw string for unrecognized format', () => {
    expect(formatPeriodLabel('unknown')).toBe('unknown');
  });
});
