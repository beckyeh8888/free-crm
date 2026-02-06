'use client';

/**
 * NotificationSection - Notification preference toggles
 * WCAG 2.2 AAA Compliant
 *
 * Connects to /api/account/notifications API for real persistence.
 */

import { useEffect, useState } from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreference,
} from '@/hooks/useSettings';

type EventType = NotificationPreference['eventType'];

interface LocalPreferences {
  readonly deal_stage_change: boolean;
  readonly task_reminder: boolean;
  readonly customer_assign: boolean;
  readonly new_document: boolean;
}

const eventLabels: Record<EventType, string> = {
  deal_stage_change: '商機階段變更',
  task_reminder: '任務提醒',
  customer_assign: '客戶指派',
  new_document: '新文件',
};

const defaultPrefs: LocalPreferences = {
  deal_stage_change: true,
  task_reminder: true,
  customer_assign: true,
  new_document: false,
};

export function NotificationSection() {
  const { data, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  // Local state for UI
  const [emailPrefs, setEmailPrefs] = useState<LocalPreferences>(defaultPrefs);
  const [inAppPrefs, setInAppPrefs] = useState<LocalPreferences>(defaultPrefs);

  // Sync from API response
  useEffect(() => {
    if (data?.data?.preferences) {
      const newEmailPrefs = { ...defaultPrefs };
      const newInAppPrefs = { ...defaultPrefs };

      for (const pref of data.data.preferences) {
        const key = pref.eventType as keyof LocalPreferences;
        if (pref.channel === 'email') {
          newEmailPrefs[key] = pref.enabled;
        } else if (pref.channel === 'in_app') {
          newInAppPrefs[key] = pref.enabled;
        }
      }

      setEmailPrefs(newEmailPrefs);
      setInAppPrefs(newInAppPrefs);
    }
  }, [data]);

  const togglePref = (channel: 'email' | 'in_app', eventType: EventType) => {
    const isEmail = channel === 'email';
    const currentPrefs = isEmail ? emailPrefs : inAppPrefs;
    const setPrefs = isEmail ? setEmailPrefs : setInAppPrefs;

    const newValue = !currentPrefs[eventType as keyof LocalPreferences];

    // Optimistic update
    setPrefs((prev) => ({ ...prev, [eventType]: newValue }));

    // Send to API
    updateMutation.mutate({
      preferences: [{ channel, eventType, enabled: newValue }],
    });
  };

  if (isLoading) {
    return (
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">通知設定</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-background-secondary rounded" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background-tertiary border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">通知設定</h2>

      {/* Email Notifications */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Email 通知
        </h3>
        <div className="space-y-0 divide-y divide-border-subtle">
          {(Object.keys(eventLabels) as EventType[]).map((eventType) => (
            <NotificationRow
              key={`email-${eventType}`}
              label={eventLabels[eventType]}
              enabled={emailPrefs[eventType as keyof LocalPreferences]}
              onToggle={() => togglePref('email', eventType)}
              disabled={updateMutation.isPending}
            />
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          系統通知
        </h3>
        <div className="space-y-0 divide-y divide-border-subtle">
          {(Object.keys(eventLabels) as EventType[]).map((eventType) => (
            <NotificationRow
              key={`in_app-${eventType}`}
              label={eventLabels[eventType]}
              enabled={inAppPrefs[eventType as keyof LocalPreferences]}
              onToggle={() => togglePref('in_app', eventType)}
              disabled={updateMutation.isPending}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// NotificationRow
// ============================================

interface NotificationRowProps {
  readonly label: string;
  readonly enabled: boolean;
  readonly onToggle: () => void;
  readonly disabled?: boolean;
}

function NotificationRow({ label, enabled, onToggle, disabled }: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-text-primary">{label}</p>
      <ToggleSwitch
        enabled={enabled}
        onToggle={onToggle}
        aria-label={`${label}通知開關`}
        disabled={disabled}
      />
    </div>
  );
}
