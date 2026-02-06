'use client';

/**
 * TwoFactorSetupFlow - 2FA setup wizard (QR → Verify → Done)
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useSetup2FA, useVerify2FA } from '@/hooks/useSettings';

interface TwoFactorSetupFlowProps {
  readonly onClose: () => void;
}

type FlowStep =
  | { type: 'setup' }
  | { type: 'verify'; qrCode: string; secret: string; backupCodes: readonly string[] }
  | { type: 'done' };

export function TwoFactorSetupFlow({ onClose }: TwoFactorSetupFlowProps) {
  const [step, setStep] = useState<FlowStep>({ type: 'setup' });
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const setupMutation = useSetup2FA();
  const verifyMutation = useVerify2FA();

  const handleSetup = () => {
    setupMutation.mutate(undefined, {
      onSuccess: (data) => {
        setStep({
          type: 'verify',
          qrCode: data.data.qrCode,
          secret: data.data.secret,
          backupCodes: data.data.backupCodes,
        });
      },
      onError: () => {
        setError('設定失敗，請稍後再試');
      },
    });
  };

  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    verifyMutation.mutate(
      { token },
      {
        onSuccess: () => {
          setStep({ type: 'done' });
        },
        onError: () => {
          setError('驗證碼不正確，請重新輸入');
        },
      }
    );
  };

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <dialog
        open
        className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
        aria-label="設定雙重驗證"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">設定雙重驗證</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {step.type === 'setup' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-text-secondary">
                雙重驗證可為您的帳號提供額外的安全保護。
                啟用後，登入時需輸入驗證碼。
              </p>
              <button
                type="button"
                onClick={handleSetup}
                disabled={setupMutation.isPending}
                className="w-full px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {setupMutation.isPending ? '設定中...' : '開始設定'}
              </button>
              {error && <p className="text-sm text-error" role="alert">{error}</p>}
            </div>
          )}

          {step.type === 'verify' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-3">
                  使用驗證器 App 掃描 QR Code
                </p>
                <div className="bg-white p-3 rounded-lg inline-block">
                  <img
                    src={step.qrCode}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Secret */}
              <div>
                <p className="text-xs text-text-muted mb-1">或手動輸入密鑰：</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background-hover rounded p-2 text-text-secondary break-all">
                    {step.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(step.secret)}
                    className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary transition-colors"
                    aria-label="複製密鑰"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verify Token */}
              <form onSubmit={handleVerify} className="space-y-3">
                <label className="block">
                  <span className="text-sm text-text-secondary mb-1 block">
                    輸入 6 位數驗證碼
                  </span>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input text-center text-lg tracking-widest"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                    placeholder="000000"
                  />
                </label>

                {error && <p className="text-sm text-error" role="alert">{error}</p>}

                <button
                  type="submit"
                  disabled={verifyMutation.isPending || token.length !== 6}
                  className="w-full px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {verifyMutation.isPending ? '驗證中...' : '驗證並啟用'}
                </button>
              </form>
            </div>
          )}

          {step.type === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <span className="text-success text-xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">2FA 已啟用</h3>
              <p className="text-sm text-text-secondary">
                雙重驗證已成功啟用，下次登入時需輸入驗證碼。
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
