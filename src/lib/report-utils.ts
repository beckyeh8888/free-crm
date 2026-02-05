/**
 * Report Utility Functions
 * Sprint 6: Reports & Charts
 *
 * Data transformation, period grouping, and calculation utilities.
 */

import type {
  ReportGroupBy,
  PipelineFunnelItem,
  PipelineConversionRate,
  RevenueTrendItem,
} from '@/types/reports';

// ============================================
// Period Grouping
// ============================================

/**
 * Format a date to a period string based on groupBy.
 * - week: "2026-W06"
 * - month: "2026-01"
 * - quarter: "2026-Q1"
 */
export function dateToPeriod(date: Date, groupBy: ReportGroupBy): string {
  const year = date.getFullYear();

  if (groupBy === 'week') {
    const weekNumber = getISOWeekNumber(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  if (groupBy === 'quarter') {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
  }

  // month (default)
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get ISO 8601 week number for a date.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Generate all period labels between start and end dates.
 */
export function generatePeriodLabels(
  startDate: Date,
  endDate: Date,
  groupBy: ReportGroupBy
): string[] {
  const labels: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const label = dateToPeriod(current, groupBy);
    if (!labels.includes(label)) {
      labels.push(label);
    }

    if (groupBy === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (groupBy === 'quarter') {
      current.setMonth(current.getMonth() + 3);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return labels;
}

// ============================================
// Conversion Rate Calculations
// ============================================

const PIPELINE_STAGE_ORDER = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
] as const;

/**
 * Calculate stage-to-stage conversion rates from funnel data.
 */
export function calculateConversionRates(
  funnel: readonly PipelineFunnelItem[]
): PipelineConversionRate[] {
  const stageMap = new Map<string, number>();
  for (const item of funnel) {
    stageMap.set(item.stage, item.count);
  }

  const rates: PipelineConversionRate[] = [];

  for (let i = 0; i < PIPELINE_STAGE_ORDER.length - 1; i++) {
    const from = PIPELINE_STAGE_ORDER[i];
    const to = PIPELINE_STAGE_ORDER[i + 1];
    const fromCount = stageMap.get(from) ?? 0;
    const toCount = stageMap.get(to) ?? 0;

    rates.push({
      from,
      to,
      rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0,
    });
  }

  return rates;
}

// ============================================
// Growth Rate Calculations
// ============================================

/**
 * Calculate growth rate between two values.
 * Returns percentage change (e.g., 25 for 25% growth).
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Calculate revenue growth rate from trend data.
 * Compares the last period to the previous period.
 */
export function calculateRevenueGrowth(
  trends: readonly RevenueTrendItem[]
): number {
  if (trends.length < 2) return 0;

  const current = trends[trends.length - 1].wonValue;
  const previous = trends[trends.length - 2].wonValue;

  return calculateGrowthRate(current, previous);
}

// ============================================
// Date Utilities for Reports
// ============================================

/**
 * Calculate the number of days between two dates.
 */
export function daysBetween(start: Date, end: Date): number {
  const diffMs = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get the start of a period (month/quarter/year) for a given date.
 */
export function getStartOfPeriod(
  date: Date,
  period: 'month' | 'quarter' | 'year'
): Date {
  const d = new Date(date);

  if (period === 'year') {
    return new Date(d.getFullYear(), 0, 1);
  }

  if (period === 'quarter') {
    const quarter = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), quarter * 3, 1);
  }

  // month
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get the end of a period (month/quarter/year) for a given date.
 */
export function getEndOfPeriod(
  date: Date,
  period: 'month' | 'quarter' | 'year'
): Date {
  const start = getStartOfPeriod(date, period);

  if (period === 'year') {
    return new Date(start.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
  }

  if (period === 'quarter') {
    return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
  }

  // month
  return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format a number as currency (TWD).
 */
export function formatCurrency(value: number): string {
  return `NT$${value.toLocaleString('zh-TW')}`;
}

/**
 * Format a number as percentage.
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

/**
 * Format a large number with abbreviation (e.g., 1.2M, 340K).
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

// ============================================
// Period Label Formatting
// ============================================

/**
 * Format a period string for display.
 * "2026-01" → "2026年1月"
 * "2026-Q1" → "2026年Q1"
 * "2026-W06" → "2026年第6週"
 */
export function formatPeriodLabel(period: string): string {
  const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    return `${weekMatch[1]}年第${Number(weekMatch[2])}週`;
  }

  const quarterMatch = period.match(/^(\d{4})-Q(\d)$/);
  if (quarterMatch) {
    return `${quarterMatch[1]}年Q${quarterMatch[2]}`;
  }

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return `${monthMatch[1]}年${Number(monthMatch[2])}月`;
  }

  return period;
}
