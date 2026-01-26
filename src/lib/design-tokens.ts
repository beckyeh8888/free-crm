/**
 * Free CRM Design System - Design Tokens
 *
 * TypeScript definitions for the design system.
 * These values should match the CSS variables in globals.css.
 */

export const colors = {
  // Primary - Slate (石墨)
  primary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569', // Main
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Accent - Blue (強調色)
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Main
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic Colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Background
  background: {
    light: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
    darkSecondary: '#1e293b',
    darkTertiary: '#334155',
  },
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
  { key: 'dashboard', label: '儀表板', href: '/dashboard', icon: 'Home' },
  { key: 'customers', label: '客戶', href: '/customers', icon: 'Users' },
  { key: 'deals', label: '商機', href: '/deals', icon: 'Briefcase' },
  { key: 'documents', label: '文件', href: '/documents', icon: 'FileText' },
  { key: 'settings', label: '設定', href: '/settings', icon: 'Settings' },
] as const;

export type NavItem = (typeof navItems)[number];
export type NavKey = NavItem['key'];
