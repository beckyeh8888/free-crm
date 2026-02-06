'use client';

/**
 * SecuritySection - Password, 2FA, Login History
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { PasswordChangeModal } from './PasswordChangeModal';
import { TwoFactorSetupFlow } from './TwoFactorSetupFlow';
import { LoginHistoryModal } from './LoginHistoryModal';
import { useProfile, useDisable2FA } from '@/hooks/useSettings';

type ModalState =
  | { type: 'none' }
  | { type: 'password' }
  | { type: '2fa-setup' }
  | { type: 'login-history' };

export function SecuritySection() {
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const { data: profileData } = useProfile();
  const disableMutation = useDisable2FA();

  const has2FA = profileData?.data?.security?.has2FA ?? false;

  const handle2FAToggle = () => {
    if (has2FA) {
      // Disable 2FA requires password + token, show a simple prompt for now
      const password = prompt('請輸入密碼以停用 2FA');
      const token = prompt('請輸入 6 位數驗證碼');
      if (password && token) {
        disableMutation.mutate({ password, token });
      }
    } else {
      setModal({ type: '2fa-setup' });
    }
  };

  return (
    <>
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">安全設定</h2>
        <div className="space-y-0 divide-y divide-border-subtle">
          {/* Password */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">密碼</p>
              <p className="text-xs text-text-muted">••••••••</p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ type: 'password' })}
              className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
            >
              變更
            </button>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">雙重驗證 (2FA)</p>
              <p className="text-xs text-text-muted">
                {has2FA ? '已啟用 TOTP 驗證' : 'TOTP 驗證'}
              </p>
            </div>
            <ToggleSwitch
              enabled={has2FA}
              onToggle={handle2FAToggle}
              aria-label="雙重驗證開關"
            />
          </div>

          {/* Login History */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary">登入記錄</p>
              <p className="text-xs text-text-muted">查看最近的登入活動</p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ type: 'login-history' })}
              className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
            >
              查看
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {modal.type === 'password' && (
        <PasswordChangeModal onClose={() => setModal({ type: 'none' })} />
      )}
      {modal.type === '2fa-setup' && (
        <TwoFactorSetupFlow onClose={() => setModal({ type: 'none' })} />
      )}
      {modal.type === 'login-history' && (
        <LoginHistoryModal onClose={() => setModal({ type: 'none' })} />
      )}
    </>
  );
}
