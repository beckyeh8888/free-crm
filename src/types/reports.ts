/**
 * Report API Response Types
 * Sprint 6: Reports & Charts
 *
 * All types are readonly for immutability (SonarCloud S6759).
 */

// ============================================
// Common Types
// ============================================

export type ReportGroupBy = 'week' | 'month' | 'quarter';

export interface ReportDateRange {
  readonly startDate: string;
  readonly endDate: string;
}

// ============================================
// Sales Pipeline Report
// ============================================

export interface PipelineFunnelItem {
  readonly stage: string;
  readonly count: number;
  readonly value: number;
}

export interface PipelineConversionRate {
  readonly from: string;
  readonly to: string;
  readonly rate: number;
}

export interface SalesPipelineSummary {
  readonly totalDeals: number;
  readonly totalValue: number;
  readonly winRate: number;
  readonly avgDealValue: number;
  readonly avgDaysToClose: number;
}

export interface SalesPipelineReport {
  readonly funnel: readonly PipelineFunnelItem[];
  readonly conversionRates: readonly PipelineConversionRate[];
  readonly summary: SalesPipelineSummary;
}

// ============================================
// Revenue Report
// ============================================

export interface RevenueTrendItem {
  readonly period: string;
  readonly wonValue: number;
  readonly lostValue: number;
  readonly dealCount: number;
}

export interface RevenueSummary {
  readonly totalRevenue: number;
  readonly totalLost: number;
  readonly growthRate: number;
  readonly avgDealSize: number;
  readonly periodCount: number;
}

export interface RevenueReport {
  readonly trends: readonly RevenueTrendItem[];
  readonly summary: RevenueSummary;
}

// ============================================
// Customer Analytics Report
// ============================================

export interface CustomerGrowthItem {
  readonly period: string;
  readonly newCustomers: number;
  readonly totalCustomers: number;
}

export interface CustomerStatusItem {
  readonly status: string;
  readonly count: number;
}

export interface TopCustomerItem {
  readonly id: string;
  readonly name: string;
  readonly company: string | null;
  readonly revenue: number;
  readonly dealCount: number;
}

export interface CustomerSummary {
  readonly totalCustomers: number;
  readonly activeCustomers: number;
  readonly newCustomersThisPeriod: number;
  readonly avgRevenuePerCustomer: number;
}

export interface CustomerAnalyticsReport {
  readonly growth: readonly CustomerGrowthItem[];
  readonly statusDistribution: readonly CustomerStatusItem[];
  readonly topCustomersByRevenue: readonly TopCustomerItem[];
  readonly summary: CustomerSummary;
}

// ============================================
// Task Activity Report
// ============================================

export interface TaskCompletionItem {
  readonly period: string;
  readonly completed: number;
  readonly created: number;
}

export interface TaskDistributionItem {
  readonly label: string;
  readonly value: number;
}

export interface TaskSummary {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly completionRate: number;
  readonly overdueTasks: number;
  readonly avgCompletionDays: number;
}

export interface TaskActivityReport {
  readonly completionTrend: readonly TaskCompletionItem[];
  readonly statusDistribution: readonly TaskDistributionItem[];
  readonly priorityDistribution: readonly TaskDistributionItem[];
  readonly typeDistribution: readonly TaskDistributionItem[];
  readonly summary: TaskSummary;
}

// ============================================
// Team Performance Report
// ============================================

export interface TeamMemberMetrics {
  readonly deals: number;
  readonly wonDeals: number;
  readonly winRate: number;
  readonly revenue: number;
  readonly tasks: number;
  readonly completedTasks: number;
}

export interface TeamMemberPerformance {
  readonly userId: string;
  readonly name: string;
  readonly image: string | null;
  readonly metrics: TeamMemberMetrics;
}

export interface TeamSummary {
  readonly totalMembers: number;
  readonly totalRevenue: number;
  readonly totalDeals: number;
  readonly avgWinRate: number;
  readonly topPerformer: string | null;
}

export interface TeamPerformanceReport {
  readonly members: readonly TeamMemberPerformance[];
  readonly summary: TeamSummary;
}

// ============================================
// Report API Response Wrapper
// ============================================

export interface ReportApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
}
