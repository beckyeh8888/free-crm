'use client';

/**
 * Settings Page - Calm CRM Dark Theme
 * Profile + Security + Notifications
 * WCAG 2.2 AAA Compliant
 */

import { ProfileSection } from '@/components/features/settings/ProfileSection';
import { SecuritySection } from '@/components/features/settings/SecuritySection';
import { NotificationSection } from '@/components/features/settings/NotificationSection';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ProfileSection />
      <SecuritySection />
      <NotificationSection />
    </div>
  );
}
