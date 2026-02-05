'use client';

/**
 * Calendar Page - Monthly Calendar & Gantt Chart Views
 * Sprint 5: Calendar & Gantt Chart
 */

import { CalendarPage } from '@/components/features/calendar';

export default function CalendarRoute() {
  return (
    <div className="h-[calc(100vh-8rem)] p-6">
      <CalendarPage />
    </div>
  );
}
