'use client';

/**
 * PasswordChangeModal - Change password form modal
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '@/hooks/useSettings';

interface PasswordChangeModalProps {
  readonly onClose: () => void;
}

export function PasswordChangeModal({ onClose }: PasswordChangeModalProps) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changeMutation = useChangePassword();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('新密碼與確認密碼不一致');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('密碼至少 8 個字元');
      return;
    }

    changeMutation.mutate(form, {
      onSuccess: () => {
        setSuccess(true);
      },
      onError: () => {
        setError('密碼變更失敗，請確認目前密碼是否正確');
      },
    });
  };

  const toggleShow = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
        <dialog
          open
          className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-5"
          aria-label="密碼已更新"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">密碼已更新</h3>
            <p className="text-sm text-text-secondary mb-4">您的密碼已成功變更。</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
            >
              完成
            </button>
          </div>
        </dialog>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <dialog
        open
        className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
        aria-label="變更密碼"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">變更密碼</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PasswordField
            label="目前密碼"
            value={form.currentPassword}
            onChange={(v) => setForm((p) => ({ ...p, currentPassword: v }))}
            show={showPasswords.current}
            onToggleShow={() => toggleShow('current')}
          />
          <PasswordField
            label="新密碼"
            value={form.newPassword}
            onChange={(v) => setForm((p) => ({ ...p, newPassword: v }))}
            show={showPasswords.new}
            onToggleShow={() => toggleShow('new')}
            hint="至少 8 字元，含大小寫字母、數字和特殊符號"
          />
          <PasswordField
            label="確認新密碼"
            value={form.confirmPassword}
            onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
            show={showPasswords.confirm}
            onToggleShow={() => toggleShow('confirm')}
          />

          {error && (
            <p className="text-sm text-error" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={changeMutation.isPending || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {changeMutation.isPending ? '變更中...' : '確認變更'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

// ============================================
// PasswordField
// ============================================

interface PasswordFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly show: boolean;
  readonly onToggleShow: () => void;
  readonly hint?: string;
}

function PasswordField({ label, value, onChange, show, onToggleShow, hint }: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="text-sm text-text-secondary mb-1 block">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input pr-10"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary"
          aria-label={show ? '隱藏密碼' : '顯示密碼'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </label>
  );
}
