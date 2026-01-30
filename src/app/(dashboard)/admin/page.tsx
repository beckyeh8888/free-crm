'use client';

/**
 * Admin Page - Calm CRM Dark Theme
 * Users + Roles + Audit tabs
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { statusColors } from '@/lib/design-tokens';

type TabKey = 'users' | 'roles' | 'audit';

const tabs: readonly { readonly key: TabKey; readonly label: string }[] = [
  { key: 'users', label: '使用者' },
  { key: 'roles', label: '角色' },
  { key: 'audit', label: '審計日誌' },
];

interface AdminUser {
  readonly id: string;
  readonly name: string | null;
  readonly email: string;
  readonly status: string;
  readonly role?: string;
}

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

        {activeTab === 'users' && (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">邀請使用者</span>
          </button>
        )}
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
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'audit' && <AuditTab />}
    </div>
  );
}

const USER_SKELETON_KEYS = ['u-1', 'u-2', 'u-3', 'u-4', 'u-5'] as const;
const ROLE_SKELETON_KEYS = ['r-1', 'r-2', 'r-3', 'r-4'] as const;
const AUDIT_SKELETON_KEYS = ['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6', 'a-7', 'a-8'] as const;

function UsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get<{ readonly success: boolean; readonly data: readonly AdminUser[] }>('/api/admin/users'),
  });

  const users = data?.data ?? [];

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
    <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
      {users.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {users.map((user) => {
            const initials = (user.name || user.email)
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const color = statusColors[user.status as keyof typeof statusColors] || statusColors.inactive;

            return (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
                <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                </div>
                {user.role && (
                  <span className="px-2 py-0.5 rounded text-xs border border-border text-text-secondary">
                    {user.role}
                  </span>
                )}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-label={`狀態: ${user.status}`}
                />
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
  );
}

function RolesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => apiClient.get<{ readonly success: boolean; readonly data: readonly { readonly id: string; readonly name: string; readonly description: string | null; readonly isSystem: boolean }[] }>('/api/admin/roles'),
  });

  const roles = data?.data ?? [];

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
    <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
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
            {role.isSystem && (
              <span className="px-2 py-0.5 rounded text-xs bg-accent-600/15 text-accent-600">
                系統
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
    <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
      <div className="divide-y divide-border-subtle">
        {logs.map((log) => {
          const time = new Date(log.createdAt).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const userName = log.user?.name || log.user?.email || '系統';
          const initials = userName.slice(0, 2).toUpperCase();

          return (
            <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 min-h-[48px]">
              <span className="text-xs text-text-muted w-12">{time}</span>
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
