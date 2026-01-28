/**
 * Dashboard Layout - Wraps all dashboard pages with sidebar and header
 */

import { DashboardLayout } from '@/components/layout';

export default function Layout({ children }: { readonly children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
