'use client';

/**
 * EditUserModal - Edit user information and role
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { useUpdateUser, type AdminUser, type UpdateUserData } from '@/hooks/useAdminUsers';

interface EditUserModalProps {
  readonly user: AdminUser;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

// Inner component with form state - will remount when user.memberId changes
function EditUserModalForm({ user, onClose, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({
    name: user.name ?? '',
    roleId: user.role.id,
    status: user.memberStatus as 'active' | 'invited' | 'suspended',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useAdminRoles();
  const updateMutation = useUpdateUser();

  const roles = rolesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      await updateMutation.mutateAsync({
        memberId: user.memberId,
        data: formData,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
    }
  };

  const handleChange = (field: keyof UpdateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const statusOptions = [
    { value: 'active', label: '啟用' },
    { value: 'invited', label: '已邀請' },
    { value: 'suspended', label: '停用' },
  ];

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
        aria-label="編輯使用者"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            編輯使用者
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

          {/* User info (read-only) */}
          <div className="p-3 rounded-lg bg-background-secondary">
            <p className="text-sm text-text-muted">電子郵件</p>
            <p className="text-sm text-text-primary">{user.email}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-name" className="text-sm text-text-secondary block">
              姓名
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name ?? ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input w-full"
              placeholder="王小明"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-role" className="text-sm text-text-secondary block">
              角色
            </label>
            <select
              id="edit-role"
              value={formData.roleId ?? ''}
              onChange={(e) => handleChange('roleId', e.target.value)}
              className="form-input w-full"
              disabled={rolesLoading}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                  {role.isSystem ? ' (系統)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-status" className="text-sm text-text-secondary block">
              狀態
            </label>
            <select
              id="edit-status"
              value={formData.status ?? 'active'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="form-input w-full"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {updateMutation.isPending ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

// Main component - uses key prop to reset form state when user changes
export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  return (
    <EditUserModalForm
      key={user.memberId}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
