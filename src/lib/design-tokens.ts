/**
 * Free CRM Design System - Design Tokens
 * Calm CRM Dark Theme
 *
 * These values should match the CSS variables in globals.css.
 */

export const colors = {
  // Background
  background: {
    page: '#0d0d0d',
    surface: '#111111',
    card: '#1a1a1a',
    hover: '#262626',
  },

  // Borders
  border: {
    default: '#2a2a2a',
    subtle: '#1f1f1f',
  },

  // Text
  text: {
    primary: '#fafafa',
    secondary: '#a0a0a0',
    muted: '#666666',
  },

  // Accent - Calm CRM Blue
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#0070f0', // Main
    700: '#005cc4',
    800: '#004999',
    900: '#003875',
  },

  // Semantic Colors
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.15)',
  warning: '#eab308',
  warningLight: 'rgba(234, 179, 8, 0.15)',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#0070f0',
  infoLight: 'rgba(0, 112, 240, 0.15)',
} as const;

export const pipelineColors = {
  lead: '#6366f1',
  qualified: '#8b5cf6',
  proposal: '#0070f0',
  negotiation: '#eab308',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
} as const;

export const pipelineLabels: Record<string, string> = {
  lead: '潛在客戶',
  qualified: '已確認',
  proposal: '提案中',
  negotiation: '談判中',
  closed_won: '成交',
  closed_lost: '失敗',
};

export const statusColors = {
  active: '#22c55e',
  inactive: '#666666',
  lead: '#eab308',
  invited: '#0070f0',
  suspended: '#ef4444',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
} as const;

export const typography = {
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1440px',
  '2xl': '1920px',
  '3xl': '2560px',
  '4k': '3840px',
} as const;

export const layout = {
  sidebar: {
    width: '240px',
    collapsedWidth: '64px',
  },
  header: {
    height: '64px',
  },
  maxContentWidth: '1280px',
} as const;

// Navigation items for the sidebar
export const navItems = [
  { key: 'dashboard', label: '儀表板', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'customers', label: '客戶', href: '/customers', icon: 'Users' },
  { key: 'deals', label: '商機', href: '/deals', icon: 'Handshake' },
  { key: 'documents', label: '文件', href: '/documents', icon: 'FileText' },
  { key: 'reports', label: '報表', href: '/reports', icon: 'BarChart3' },
  { key: 'settings', label: '設定', href: '/settings', icon: 'Settings' },
  { key: 'admin', label: '管理', href: '/admin', icon: 'Shield' },
] as const;

export type NavItem = (typeof navItems)[number];
export type NavKey = NavItem['key'];
