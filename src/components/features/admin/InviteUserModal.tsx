'use client';

/**
 * InviteUserModal - Invite new user to organization
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { useInviteUser, type InviteUserData } from '@/hooks/useAdminUsers';

interface InviteUserModalProps {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [formData, setFormData] = useState<InviteUserData>({
    email: '',
    name: '',
    roleId: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useAdminRoles();
  const inviteMutation = useInviteUser();

  const roles = rolesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.name || !formData.roleId) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      await inviteMutation.mutateAsync(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀請失敗');
    }
  };

  const handleChange = (field: keyof InviteUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <dialog
        open
        className="relative w-full max-w-md bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
        aria-label="邀請使用者"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            邀請使用者
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm text-text-secondary block">
              電子郵件 <span className="text-error">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="form-input w-full"
              placeholder="user@example.com"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-name" className="text-sm text-text-secondary block">
              姓名 <span className="text-error">*</span>
            </label>
            <input
              id="invite-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input w-full"
              placeholder="王小明"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-role" className="text-sm text-text-secondary block">
              角色 <span className="text-error">*</span>
            </label>
            <select
              id="invite-role"
              value={formData.roleId}
              onChange={(e) => handleChange('roleId', e.target.value)}
              className="form-input w-full"
              required
              disabled={rolesLoading}
            >
              <option value="">選擇角色...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                  {role.isSystem ? ' (系統)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
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
              disabled={inviteMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {inviteMutation.isPending ? '邀請中...' : '邀請'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
