'use client';

/**
 * Admin Page - Calm CRM Dark Theme
 * Users + Roles + Audit tabs with full CRUD
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, Search, Shield, MoreVertical, Edit2, Trash2, UserX, UserCheck, Building2, Loader2, Users, FileText, Briefcase, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUsers, useDeleteUser, useSuspendUser, useActivateUser, type AdminUser } from '@/hooks/useAdminUsers';
import { useAdminRoles, useDeleteRole, type AdminRole } from '@/hooks/useAdminRoles';
import { useOrganization, useOrganizationStats, useUpdateOrganization } from '@/hooks/useOrganization';
import { useAuditLogs, type AuditLogFilters as AuditFilters } from '@/hooks/useAuditLogs';
import { statusColors } from '@/lib/design-tokens';
import { InviteUserModal, EditUserModal, ConfirmDialog, CreateRoleModal, EditRoleModal, AuditLogFilters, ACTION_LABELS, ENTITY_LABELS, ExportAuditLogsModal } from '@/components/features/admin';

type TabKey = 'users' | 'roles' | 'audit' | 'organization';

const tabs: readonly { readonly key: TabKey; readonly label: string }[] = [
  { key: 'users', label: '使用者' },
  { key: 'roles', label: '角色' },
  { key: 'audit', label: '審計日誌' },
  { key: 'organization', label: '組織' },
];

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
      {(activeTab === 'users' || activeTab === 'roles') && (
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
      {activeTab === 'organization' && <OrganizationTab />}
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<AdminRole | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminRoles({ includePermissions: true });
  const deleteMutation = useDeleteRole();

  const allRoles = data?.data ?? [];
  const roles = search
    ? allRoles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : allRoles;

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await deleteMutation.mutateAsync(deletingRole.id);
      setDeletingRole(null);
    } catch {
      // Error handled by mutation
    }
  };

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
    <>
      {/* Header with Create button */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增角色</span>
        </button>
      </div>

      {/* Role List */}
      <div className="bg-background-tertiary border border-border rounded-xl">
        {roles.length > 0 ? (
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

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === role.id ? null : role.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                    aria-label="操作選單"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === role.id && (
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
                            setEditingRole(role);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          編輯權限
                        </button>
                        {!role.isSystem && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingRole(role);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-background-hover transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            刪除
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">尚無角色</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSuccess={() => refetch()}
        />
      )}

      {deletingRole && (
        <ConfirmDialog
          title="刪除角色"
          message={`確定要刪除「${deletingRole.name}」角色嗎？此操作無法復原。該角色下的成員將需要重新分配角色。`}
          confirmLabel="刪除"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRole(null)}
        />
      )}
    </>
  );
}

function AuditTab() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);

  const { data, isLoading } = useAuditLogs({ filters, page, limit: 20 });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;
  const filterOptions = data?.filterOptions;

  const handleFilterChange = (newFilters: AuditFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-background-tertiary rounded-lg animate-pulse w-24" />
        <div className="bg-background-tertiary border border-border rounded-xl">
          {AUDIT_SKELETON_KEYS.map((key) => (
            <div key={key} className="h-12 animate-pulse border-b border-border-subtle last:border-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AuditLogFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[40px] self-start"
        >
          <Download className="w-4 h-4" />
          匯出
        </button>
      </div>

      {/* Log List */}
      <div className="bg-background-tertiary border border-border rounded-xl">
        {isLoading ? (
          <div className="divide-y divide-border-subtle">
            {AUDIT_SKELETON_KEYS.map((key) => (
              <div key={key} className="h-12 animate-pulse" />
            ))}
          </div>
        ) : logs.length > 0 ? (
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
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-sm text-text-primary">
                    {ENTITY_LABELS[log.entity] || log.entity}
                  </span>
                  {log.entityId && (
                    <span className="text-xs text-text-muted truncate max-w-[100px]">
                      #{log.entityId.slice(0, 8)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">
              {Object.values(filters).some((v) => v) ? '沒有符合篩選條件的記錄' : '尚無審計記錄'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            共 {pagination.total} 筆，第 {pagination.page}/{pagination.totalPages} 頁
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="上一頁"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="下一頁"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportAuditLogsModal
          filters={filters}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

const ORG_SKELETON_KEYS = ['o-1', 'o-2', 'o-3'] as const;

function OrganizationTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const { data: orgData, isLoading: orgLoading } = useOrganization();
  const { data: statsData, isLoading: statsLoading } = useOrganizationStats();
  const updateMutation = useUpdateOrganization();

  const organization = orgData?.data;
  const stats = statsData?.data;

  const handleEdit = () => {
    if (organization) {
      setEditName(organization.name);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      await updateMutation.mutateAsync({ name: editName.trim() });
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName('');
  };

  if (orgLoading || statsLoading) {
    return (
      <div className="space-y-4">
        {ORG_SKELETON_KEYS.map((key) => (
          <div key={key} className="h-32 bg-background-tertiary border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const planLabels: Record<string, { name: string; color: string }> = {
    free: { name: 'Free', color: 'text-text-muted' },
    pro: { name: 'Pro', color: 'text-accent-600' },
    enterprise: { name: 'Enterprise', color: 'text-success' },
  };

  const plan = planLabels[organization?.plan || 'free'] || planLabels.free;

  return (
    <div className="space-y-4">
      {/* Organization Info */}
      <div className="bg-background-tertiary border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">組織資訊</h3>
          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-background-hover transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              編輯
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="org-name" className="block text-sm text-text-secondary mb-1.5">
                組織名稱
              </label>
              <input
                id="org-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="form-input w-full max-w-md"
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || !editName.trim()}
                className="px-4 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[40px] disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                儲存
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[40px]"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-medium text-text-primary">{organization?.name}</p>
                <p className="text-sm text-text-muted">@{organization?.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div>
                <p className="text-xs text-text-muted">方案</p>
                <p className={`text-sm font-medium ${plan.color}`}>{plan.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">建立日期</p>
                <p className="text-sm text-text-primary">
                  {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString('zh-TW') : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-background-tertiary border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">用量統計</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Members */}
          <div className="bg-background-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">成員</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{stats?.counts.members || 0}</p>
            {stats?.limits.members !== -1 && (
              <div className="mt-2">
                <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-600 rounded-full"
                    style={{ width: `${Math.min(stats?.usage.membersUsage || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {stats?.counts.members}/{stats?.limits.members}
                </p>
              </div>
            )}
          </div>

          {/* Customers */}
          <div className="bg-background-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">客戶</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{stats?.counts.customers || 0}</p>
            {stats?.limits.customers !== -1 && (
              <div className="mt-2">
                <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-600 rounded-full"
                    style={{ width: `${Math.min(stats?.usage.customersUsage || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {stats?.counts.customers}/{stats?.limits.customers}
                </p>
              </div>
            )}
          </div>

          {/* Deals */}
          <div className="bg-background-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">商機</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{stats?.counts.deals || 0}</p>
            <div className="flex gap-2 mt-2 text-xs text-text-muted">
              <span className="text-success">{stats?.dealBreakdown.won || 0} 成交</span>
              <span>{stats?.dealBreakdown.open || 0} 進行中</span>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-background-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">文件</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{stats?.counts.documents || 0}</p>
            {stats?.limits.documents !== -1 && (
              <div className="mt-2">
                <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-600 rounded-full"
                    style={{ width: `${Math.min(stats?.usage.documentsUsage || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {stats?.counts.documents}/{stats?.limits.documents}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Breakdown */}
      <div className="bg-background-tertiary border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">成員狀態</h3>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold text-success">{stats?.memberBreakdown.active || 0}</p>
            <p className="text-xs text-text-muted">啟用中</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-warning">{stats?.memberBreakdown.suspended || 0}</p>
            <p className="text-xs text-text-muted">已停用</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-text-secondary">{stats?.memberBreakdown.invited || 0}</p>
            <p className="text-xs text-text-muted">待邀請</p>
          </div>
        </div>
      </div>
    </div>
  );
}
