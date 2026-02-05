/**
 * Chart Theme Constants
 * Recharts color/font constants aligned with design-tokens dark theme.
 */

import { colors, pipelineColors } from '@/lib/design-tokens';

export const chartColors = {
  primary: colors.accent[600],
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  muted: colors.text.muted,

  // Pipeline stages
  pipeline: pipelineColors,

  // Chart-specific palette (for multi-series)
  series: [
    '#0070f0', // accent
    '#22c55e', // green
    '#eab308', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
  ],
} as const;

export const chartTheme = {
  // Axis styles
  axis: {
    stroke: colors.border.default,
    tick: {
      fill: colors.text.muted,
      fontSize: 12,
    },
  },

  // Grid
  grid: {
    stroke: colors.border.subtle,
    strokeDasharray: '3 3',
  },

  // Tooltip
  tooltip: {
    backgroundColor: colors.background.card,
    border: `1px solid ${colors.border.default}`,
    borderRadius: 8,
    color: colors.text.primary,
    fontSize: 13,
  },

  // Legend
  legend: {
    color: colors.text.secondary,
    fontSize: 13,
  },
} as const;
