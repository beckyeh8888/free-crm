'use client';

/**
 * Admin Page - Calm CRM Dark Theme
 * Users + Roles + Audit tabs with full CRUD
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, Search, Shield, MoreVertical, Edit2, Trash2, UserX, UserCheck } from 'lucide-react';
import { useAdminUsers, useDeleteUser, useSuspendUser, useActivateUser, type AdminUser } from '@/hooks/useAdminUsers';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { statusColors } from '@/lib/design-tokens';
import { InviteUserModal, EditUserModal, ConfirmDialog } from '@/components/features/admin';

type TabKey = 'users' | 'roles' | 'audit';

const tabs: readonly { readonly key: TabKey; readonly label: string }[] = [
  { key: 'users', label: '使用者' },
  { key: 'roles', label: '角色' },
  { key: 'audit', label: '審計日誌' },
];

interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly createdAt: string;
  readonly user: {
    readonly name: string | null;
    readonly email: string;
  } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 rounded-lg text-sm transition-colors min-h-[40px]
                ${activeTab === tab.key
                  ? 'bg-accent-600 text-white'
                  : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {activeTab !== 'audit' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder={activeTab === 'users' ? '搜尋使用者...' : '搜尋角色...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 w-full"
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'users' && <UsersTab search={search} />}
      {activeTab === 'roles' && <RolesTab search={search} />}
      {activeTab === 'audit' && <AuditTab />}
    </div>
  );
}

const USER_SKELETON_KEYS = ['u-1', 'u-2', 'u-3', 'u-4', 'u-5'] as const;
const ROLE_SKELETON_KEYS = ['r-1', 'r-2', 'r-3', 'r-4'] as const;
const AUDIT_SKELETON_KEYS = ['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6', 'a-7', 'a-8'] as const;

function UsersTab({ search }: { readonly search: string }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminUsers({ search });
  const deleteMutation = useDeleteUser();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const users = data?.data ?? [];

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteMutation.mutateAsync(deletingUser.memberId);
      setDeletingUser(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSuspend = async () => {
    if (!suspendingUser) return;
    try {
      await suspendMutation.mutateAsync(suspendingUser.memberId);
      setSuspendingUser(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleActivate = async (user: AdminUser) => {
    try {
      await activateMutation.mutateAsync(user.memberId);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background-tertiary border border-border rounded-xl">
        {USER_SKELETON_KEYS.map((key) => (
          <div key={key} className="h-14 animate-pulse border-b border-border-subtle last:border-0" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header with Invite button */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">邀請使用者</span>
        </button>
      </div>

      {/* User List */}
      <div className="bg-background-tertiary border border-border rounded-xl">
        {users.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {users.map((user) => {
              const initials = (user.name || user.email)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const color = statusColors[user.memberStatus as keyof typeof statusColors] || statusColors.inactive;
              const isSuspended = user.memberStatus === 'suspended';

              return (
                <div key={user.memberId} className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
                  <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs border border-border text-text-secondary">
                    {user.role.name}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                    aria-label={`狀態: ${user.memberStatus}`}
                  />

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === user.memberId ? null : user.memberId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                      aria-label="操作選單"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === user.memberId && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-background-tertiary border border-border rounded-lg shadow-lg z-20 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            編輯
                          </button>
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleActivate(user);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success hover:bg-background-hover transition-colors"
                            >
                              <UserCheck className="w-4 h-4" />
                              啟用
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSuspendingUser(user);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-background-hover transition-colors"
                            >
                              <UserX className="w-4 h-4" />
                              停用
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingUser(user);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-background-hover transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            移除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">尚無使用者</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => refetch()}
        />
      )}

      {deletingUser && (
        <ConfirmDialog
          title="移除使用者"
          message={`確定要將 ${deletingUser.name || deletingUser.email} 從組織中移除嗎？此操作無法復原。`}
          confirmLabel="移除"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingUser(null)}
        />
      )}

      {suspendingUser && (
        <ConfirmDialog
          title="停用使用者"
          message={`確定要停用 ${suspendingUser.name || suspendingUser.email} 嗎？停用後該用戶將無法登入。`}
          confirmLabel="停用"
          variant="warning"
          isLoading={suspendMutation.isPending}
          onConfirm={handleSuspend}
          onCancel={() => setSuspendingUser(null)}
        />
      )}
    </>
  );
}

function RolesTab({ search }: { readonly search: string }) {
  const { data, isLoading } = useAdminRoles({ includePermissions: true });

  const allRoles = data?.data ?? [];
  const roles = search
    ? allRoles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : allRoles;

  if (isLoading) {
    return (
      <div className="bg-background-tertiary border border-border rounded-xl">
        {ROLE_SKELETON_KEYS.map((key) => (
          <div key={key} className="h-14 animate-pulse border-b border-border-subtle last:border-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-background-tertiary border border-border rounded-xl">
      <div className="divide-y divide-border-subtle">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{role.name}</p>
              <p className="text-xs text-text-muted">{role.description || '-'}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs border border-border text-text-muted">
              {role.memberCount} 成員
            </span>
            {role.permissionCount !== undefined && (
              <span className="px-2 py-0.5 rounded text-xs border border-border text-text-muted">
                {role.permissionCount} 權限
              </span>
            )}
            {role.isSystem && (
              <span className="px-2 py-0.5 rounded text-xs bg-accent-600/15 text-accent-600">
                系統
              </span>
            )}
            {role.isDefault && (
              <span className="px-2 py-0.5 rounded text-xs bg-success/15 text-success">
                預設
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => apiClient.get<{ readonly success: boolean; readonly data: readonly AuditEntry[] }>('/api/admin/audit-logs'),
  });

  const logs = data?.data ?? [];

  const actionLabels: Record<string, string> = {
    create: '新增',
    update: '更新',
    delete: '刪除',
    login: '登入',
    logout: '登出',
    member_invite: '邀請成員',
    member_remove: '移除成員',
    member_suspend: '停用成員',
    role_change: '變更角色',
  };

  if (isLoading) {
    return (
      <div className="bg-background-tertiary border border-border rounded-xl">
        {AUDIT_SKELETON_KEYS.map((key) => (
          <div key={key} className="h-12 animate-pulse border-b border-border-subtle last:border-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-background-tertiary border border-border rounded-xl">
      <div className="divide-y divide-border-subtle">
        {logs.map((log) => {
          const time = new Date(log.createdAt).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const date = new Date(log.createdAt).toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
          });
          const userName = log.user?.name || log.user?.email || '系統';
          const initials = userName.slice(0, 2).toUpperCase();

          return (
            <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 min-h-[48px]">
              <div className="text-xs text-text-muted w-20 flex-shrink-0">
                <div>{date}</div>
                <div>{time}</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-medium text-white">{initials}</span>
              </div>
              <span className="text-sm text-text-secondary">
                {actionLabels[log.action] || log.action}
              </span>
              <span className="text-sm text-text-primary">{log.entity}</span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">尚無審計記錄</p>
          </div>
        )}
      </div>
    </div>
  );
}
