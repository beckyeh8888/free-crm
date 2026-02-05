/**
 * useAdminRoles Hook Tests
 * Unit tests for admin role management hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useAdminRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  adminRoleKeys,
  permissionKeys,
} from '@/hooks/useAdminRoles';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockRoles = [
  {
    id: 'role-1',
    name: '系統管理員',
    description: '擁有所有權限的系統角色',
    isSystem: true,
    isDefault: false,
    organizationId: null,
    memberCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    permissionCount: 50,
  },
  {
    id: 'role-2',
    name: '一般成員',
    description: '預設成員角色',
    isSystem: true,
    isDefault: true,
    organizationId: null,
    memberCount: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    permissionCount: 20,
  },
  {
    id: 'role-3',
    name: '自訂角色',
    description: '組織自訂的角色',
    isSystem: false,
    isDefault: false,
    organizationId: 'org-1',
    memberCount: 3,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    permissionCount: 15,
  },
];

const mockPermissions = {
  grouped: [
    {
      category: 'customer',
      name: '客戶管理',
      order: 1,
      permissions: [
        {
          code: 'customer:read',
          name: '檢視客戶',
          category: 'customer',
          description: '可以檢視客戶資料',
        },
        {
          code: 'customer:create',
          name: '新增客戶',
          category: 'customer',
          description: '可以建立新客戶',
        },
        {
          code: 'customer:update',
          name: '編輯客戶',
          category: 'customer',
          description: '可以編輯客戶資料',
        },
        {
          code: 'customer:delete',
          name: '刪除客戶',
          category: 'customer',
          description: '可以刪除客戶',
        },
      ],
    },
    {
      category: 'deal',
      name: '商機管理',
      order: 2,
      permissions: [
        {
          code: 'deal:read',
          name: '檢視商機',
          category: 'deal',
          description: '可以檢視商機資料',
        },
        {
          code: 'deal:create',
          name: '新增商機',
          category: 'deal',
          description: '可以建立新商機',
        },
      ],
    },
  ],
  totalCount: 6,
  categories: [
    { key: 'customer', name: '客戶管理', order: 1 },
    { key: 'deal', name: '商機管理', order: 2 },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useAdminRoles Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Keys', () => {
    it('adminRoleKeys generates correct keys', () => {
      expect(adminRoleKeys.all).toEqual(['admin-roles']);
      expect(adminRoleKeys.lists()).toEqual(['admin-roles', 'list']);
      expect(adminRoleKeys.list({ includeSystem: true })).toEqual(['admin-roles', 'list', { includeSystem: true }]);
      expect(adminRoleKeys.details()).toEqual(['admin-roles', 'detail']);
      expect(adminRoleKeys.detail('role-1')).toEqual(['admin-roles', 'detail', 'role-1']);
    });

    it('permissionKeys generates correct keys', () => {
      expect(permissionKeys.all).toEqual(['admin-permissions']);
      expect(permissionKeys.grouped()).toEqual(['admin-permissions', 'grouped']);
    });
  });

  describe('useAdminRoles', () => {
    it('fetches roles with default options', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRoles,
        pagination: { page: 1, limit: 100, total: 3 },
      });

      const { result } = renderHook(
        () => useAdminRoles(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/roles?includeSystem=true&includePermissions=false');
      expect(result.current.data?.data).toHaveLength(3);
    });

    it('fetches roles excluding system roles', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockRoles[2]],
        pagination: { page: 1, limit: 100, total: 1 },
      });

      const { result } = renderHook(
        () => useAdminRoles({ includeSystem: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/roles?includeSystem=false&includePermissions=false');
    });

    it('fetches roles with permissions included', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRoles.map(r => ({
          ...r,
          permissions: [{ code: 'customer:read', name: '檢視客戶', category: 'customer', description: '' }],
        })),
        pagination: { page: 1, limit: 100, total: 3 },
      });

      const { result } = renderHook(
        () => useAdminRoles({ includePermissions: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/roles?includeSystem=true&includePermissions=true');
    });
  });

  describe('usePermissions', () => {
    it('fetches permissions grouped by category', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockPermissions,
      });

      const { result } = renderHook(
        () => usePermissions(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/permissions?groupByCategory=true');
      expect(result.current.data?.data.grouped).toHaveLength(2);
      expect(result.current.data?.data.totalCount).toBe(6);
    });

    it('returns permission categories', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockPermissions,
      });

      const { result } = renderHook(
        () => usePermissions(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data.categories).toContainEqual({
        key: 'customer',
        name: '客戶管理',
        order: 1,
      });
    });
  });

  describe('useCreateRole', () => {
    it('creates a new role', async () => {
      const newRole = {
        name: '新角色',
        description: '新建立的角色',
        permissions: ['customer:read', 'customer:create'],
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: {
          id: 'role-new',
          ...newRole,
          isSystem: false,
          isDefault: false,
          organizationId: 'org-1',
          memberCount: 0,
          createdAt: '2026-02-05T00:00:00Z',
          updatedAt: '2026-02-05T00:00:00Z',
        },
      });

      const { result } = renderHook(
        () => useCreateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newRole);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/admin/roles', newRole);
    });

    it('creates a default role', async () => {
      const newRole = {
        name: '預設新角色',
        permissions: ['customer:read'],
        isDefault: true,
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: {
          id: 'role-new',
          name: '預設新角色',
          description: null,
          isSystem: false,
          isDefault: true,
          organizationId: 'org-1',
          memberCount: 0,
          createdAt: '2026-02-05T00:00:00Z',
          updatedAt: '2026-02-05T00:00:00Z',
        },
      });

      const { result } = renderHook(
        () => useCreateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newRole);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/admin/roles', newRole);
    });

    it('handles create error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Role name already exists'));

      const { result } = renderHook(
        () => useCreateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        name: '系統管理員',
        permissions: [],
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateRole', () => {
    it('updates role name', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockRoles[2],
          name: '更新的角色名稱',
        },
      });

      const { result } = renderHook(
        () => useUpdateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        roleId: 'role-3',
        data: { name: '更新的角色名稱' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/roles/role-3', {
        name: '更新的角色名稱',
      });
    });

    it('updates role permissions', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockRoles[2],
          permissionCount: 3,
        },
      });

      const { result } = renderHook(
        () => useUpdateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        roleId: 'role-3',
        data: { permissions: ['customer:read', 'customer:create', 'deal:read'] },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/roles/role-3', {
        permissions: ['customer:read', 'customer:create', 'deal:read'],
      });
    });

    it('updates role description', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          ...mockRoles[2],
          description: '更新的角色描述',
        },
      });

      const { result } = renderHook(
        () => useUpdateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        roleId: 'role-3',
        data: { description: '更新的角色描述' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('handles update error for system role', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Cannot modify system role'));

      const { result } = renderHook(
        () => useUpdateRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        roleId: 'role-1',
        data: { name: '修改系統角色' },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDeleteRole', () => {
    it('deletes a role', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () => useDeleteRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('role-3');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/admin/roles/role-3');
    });

    it('handles delete error for system role', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Cannot delete system role'));

      const { result } = renderHook(
        () => useDeleteRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('role-1');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('handles delete error for role with members', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Cannot delete role with assigned members'));

      const { result } = renderHook(
        () => useDeleteRole(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('role-2');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
