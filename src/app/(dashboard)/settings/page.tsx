'use client';

/**
 * Settings Page - Calm CRM Dark Theme
 * Profile + Security + Notifications
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState({
    dealChanges: true,
    customerAssign: true,
    newDocuments: true,
    emailNotifs: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Section */}
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">個人資料</h2>
        <div className="space-y-0 divide-y divide-border-subtle">
          <SettingsRow label="姓名" value={session?.user?.name || '-'} />
          <SettingsRow
            label="電子郵件"
            value={session?.user?.email || '-'}
            badge="已驗證"
          />
          <SettingsRow label="時區" value="Asia/Taipei" />
          <SettingsRow label="語言" value="繁體中文" />
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">安全設定</h2>
        <div className="space-y-0 divide-y divide-border-subtle">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">密碼</p>
              <p className="text-xs text-text-muted">••••••••</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
            >
              變更
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">雙重驗證 (2FA)</p>
              <p className="text-xs text-text-muted">TOTP 驗證</p>
            </div>
            <ToggleSwitch enabled={false} onToggle={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">登入記錄</p>
              <p className="text-xs text-text-muted">查看最近的登入活動</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
            >
              查看
            </button>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">通知設定</h2>
        <div className="space-y-0 divide-y divide-border-subtle">
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-text-primary">商機階段變更</p>
            <ToggleSwitch
              enabled={notifications.dealChanges}
              onToggle={() => toggleNotification('dealChanges')}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-text-primary">客戶指派</p>
            <ToggleSwitch
              enabled={notifications.customerAssign}
              onToggle={() => toggleNotification('customerAssign')}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-text-primary">新文件</p>
            <ToggleSwitch
              enabled={notifications.newDocuments}
              onToggle={() => toggleNotification('newDocuments')}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-text-primary">Email 通知</p>
            <ToggleSwitch
              enabled={notifications.emailNotifs}
              onToggle={() => toggleNotification('emailNotifs')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  badge,
}: {
  readonly label: string;
  readonly value: string;
  readonly badge?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm text-text-primary">{value}</p>
        {badge && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-success/15 text-success">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  readonly enabled: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
        ${enabled ? 'bg-accent-600' : 'bg-[#333333]'}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200
          ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}
