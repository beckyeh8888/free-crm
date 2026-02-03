'use client';

/**
 * EditRoleModal - Modal for editing role permissions
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Loader2, Shield } from 'lucide-react';
import { usePermissions, useUpdateRole, type AdminRole } from '@/hooks/useAdminRoles';
import { PermissionGroup } from './PermissionGroup';
import { PERMISSION_DEFINITIONS, getPermissionsByCategory } from '@/lib/permissions';

interface EditRoleModalProps {
  readonly role: AdminRole;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function EditRoleModal({ role, onClose, onSuccess }: EditRoleModalProps) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    role.permissions?.forEach((p) => initial.add(p.code));
    return initial;
  });
  const [isDefault, setIsDefault] = useState(role.isDefault);

  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions();
  const updateMutation = useUpdateRole();

  // Reset form when role changes
  useEffect(() => {
    setName(role.name);
    setDescription(role.description || '');
    setIsDefault(role.isDefault);
    const perms = new Set<string>();
    role.permissions?.forEach((p) => perms.add(p.code));
    setSelectedPermissions(perms);
  }, [role]);

  // Group permissions by category
  const permissionGroups = useMemo(() => {
    if (permissionsData?.data?.grouped) {
      return permissionsData.data.grouped;
    }
    // Fallback to local definitions
    const categories = ['customers', 'deals', 'contacts', 'documents', 'reports', 'admin'];
    return categories.map((category) => ({
      category,
      name: category,
      order: categories.indexOf(category),
      permissions: getPermissionsByCategory(category),
    }));
  }, [permissionsData]);

  const handleTogglePermission = useCallback((code: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const handleToggleCategory = useCallback((category: string, codes: readonly string[]) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = codes.every((code) => next.has(code));

      if (allSelected) {
        codes.forEach((code) => next.delete(code));
      } else {
        codes.forEach((code) => next.add(code));
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        roleId: role.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: Array.from(selectedPermissions),
          isDefault,
        },
      });
      onSuccess?.();
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const totalPermissions = PERMISSION_DEFINITIONS.length;
  const selectedCount = selectedPermissions.size;
  const isSystemRole = role.isSystem;

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
        role="dialog"
        aria-labelledby="edit-role-title"
        className="relative w-full max-w-2xl max-h-[90vh] bg-background-tertiary border border-border rounded-xl shadow-xl p-0 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center">
              <Shield className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <h2 id="edit-role-title" className="text-lg font-semibold text-text-primary">
                編輯角色
              </h2>
              {isSystemRole && (
                <span className="text-xs text-accent-600">系統角色（僅可編輯權限）</span>
              )}
            </div>
          </div>
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label htmlFor="role-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                  角色名稱 <span className="text-error">*</span>
                </label>
                <input
                  id="role-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：銷售主管"
                  required
                  maxLength={50}
                  disabled={isSystemRole}
                  className="form-input w-full disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="role-description" className="block text-sm font-medium text-text-secondary mb-1.5">
                  描述
                </label>
                <textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="角色的職責描述..."
                  rows={2}
                  maxLength={200}
                  disabled={isSystemRole}
                  className="form-input w-full resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <label className={`flex items-center gap-3 ${isSystemRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={isSystemRole}
                  className="sr-only"
                />
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${isDefault ? 'bg-accent-600 border-accent-600' : 'border-border-strong bg-transparent'}
                  `}
                >
                  {isDefault && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-sm text-text-primary">設為預設角色</span>
                  <p className="text-xs text-text-muted">新成員加入時將自動使用此角色</p>
                </div>
              </label>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-secondary">
                  權限設定
                </h3>
                <span className="text-xs text-text-muted">
                  已選擇 {selectedCount}/{totalPermissions} 個權限
                </span>
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {permissionGroups.map((group) => (
                    <PermissionGroup
                      key={group.category}
                      category={group.category}
                      permissions={group.permissions}
                      selectedPermissions={selectedPermissions}
                      onToggle={handleTogglePermission}
                      onToggleAll={handleToggleCategory}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px] disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                '儲存變更'
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
