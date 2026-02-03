/**
 * Export Utilities
 * CSV/JSON export helper functions
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

import { pipelineLabels } from './design-tokens';

// ============================================
// Types
// ============================================

export interface DealExportData {
  readonly id: string;
  readonly title: string;
  readonly value: number | null;
  readonly stage: string;
  readonly probability: number;
  readonly closeDate: Date | null;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
  readonly customerName: string | null;
  readonly customerCompany: string | null;
}

export interface ReportStats {
  readonly totalDeals: number;
  readonly inProgress: number;
  readonly wonDeals: number;
  readonly lostDeals: number;
  readonly winRate: number;
  readonly totalRevenue: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Escape a value for CSV format
 * Handles special characters: comma, quotes, newlines
 */
export function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle objects and arrays by converting to JSON
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Escape double quotes and wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

/**
 * Format a date for display
 * Returns YYYY-MM-DD HH:mm:ss format
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Format a date for display (date only)
 * Returns YYYY-MM-DD format
 */
export function formatDateOnly(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Get Chinese label for pipeline stage
 */
export function getStageLabel(stage: string): string {
  return pipelineLabels[stage] || stage;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '';
  return value.toLocaleString('zh-TW');
}

// ============================================
// CSV Generation
// ============================================

/**
 * Generate CSV content for deals report
 * Includes UTF-8 BOM for Excel compatibility
 */
export function generateDealsCSV(
  deals: readonly DealExportData[],
  stats: ReportStats
): string {
  const headers = [
    '建立日期',
    '商機名稱',
    '客戶名稱',
    '客戶公司',
    '金額 (NT$)',
    '階段',
    '成功率 (%)',
    '預計結案',
    '實際結案',
  ];

  const rows = deals.map((deal) => [
    escapeCSV(formatDateOnly(deal.createdAt)),
    escapeCSV(deal.title),
    escapeCSV(deal.customerName),
    escapeCSV(deal.customerCompany),
    escapeCSV(formatCurrency(deal.value)),
    escapeCSV(getStageLabel(deal.stage)),
    escapeCSV(deal.probability),
    escapeCSV(formatDateOnly(deal.closeDate)),
    escapeCSV(formatDateOnly(deal.closedAt)),
  ]);

  // Add summary section
  const summaryRows = [
    [], // Empty row as separator
    ['', '', '', '', '=== 報表統計 ===', '', '', '', ''],
    ['', '', '', '', '總商機數', String(stats.totalDeals), '', '', ''],
    ['', '', '', '', '進行中', String(stats.inProgress), '', '', ''],
    ['', '', '', '', '成交數', String(stats.wonDeals), '', '', ''],
    ['', '', '', '', '失敗數', String(stats.lostDeals), '', '', ''],
    ['', '', '', '', '勝率', `${stats.winRate}%`, '', '', ''],
    ['', '', '', '', '總營收 (NT$)', formatCurrency(stats.totalRevenue), '', '', ''],
  ];

  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const headerRow = headers.join(',');
  const dataRows = rows.map((row) => row.join(',')).join('\n');
  const summary = summaryRows.map((row) => row.join(',')).join('\n');

  return bom + headerRow + '\n' + dataRows + '\n' + summary;
}

/**
 * Generate JSON content for deals report
 */
export function generateDealsJSON(
  deals: readonly DealExportData[],
  stats: ReportStats
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    stats: {
      totalDeals: stats.totalDeals,
      inProgress: stats.inProgress,
      wonDeals: stats.wonDeals,
      lostDeals: stats.lostDeals,
      winRate: stats.winRate,
      totalRevenue: stats.totalRevenue,
    },
    deals: deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      customerName: deal.customerName,
      customerCompany: deal.customerCompany,
      value: deal.value,
      stage: deal.stage,
      stageLabel: getStageLabel(deal.stage),
      probability: deal.probability,
      closeDate: deal.closeDate ? formatDateOnly(deal.closeDate) : null,
      closedAt: deal.closedAt ? formatDateOnly(deal.closedAt) : null,
      createdAt: formatDateOnly(deal.createdAt),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Calculate report statistics from deals
 */
export function calculateStats(
  deals: readonly DealExportData[]
): ReportStats {
  const wonDeals = deals.filter((d) => d.stage === 'closed_won').length;
  const lostDeals = deals.filter((d) => d.stage === 'closed_lost').length;
  const closedDeals = wonDeals + lostDeals;
  const inProgress = deals.length - closedDeals;
  const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;
  const totalRevenue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  return {
    totalDeals: deals.length,
    inProgress,
    wonDeals,
    lostDeals,
    winRate,
    totalRevenue,
  };
}
