/**
 * useAdminUsers Hook Tests
 * Unit tests for admin user management hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useAdminUsers,
  useAdminUserDetail,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
  useSuspendUser,
  useActivateUser,
  adminUserKeys,
} from '@/hooks/useAdminUsers';
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

const mockUsers = [
  {
    memberId: 'member-1',
    userId: 'user-1',
    name: '張三',
    email: 'zhang@example.com',
    image: null,
    userStatus: 'active',
    memberStatus: 'active',
    role: { id: 'role-1', name: '管理員', isSystem: true },
    joinedAt: '2026-01-01T00:00:00Z',
    invitedAt: null,
    invitedBy: null,
    lastLoginAt: '2026-02-05T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    has2FA: true,
  },
  {
    memberId: 'member-2',
    userId: 'user-2',
    name: '李四',
    email: 'li@example.com',
    image: 'https://example.com/avatar.jpg',
    userStatus: 'active',
    memberStatus: 'active',
    role: { id: 'role-2', name: '一般成員', isSystem: true },
    joinedAt: '2026-01-15T00:00:00Z',
    invitedAt: '2026-01-10T00:00:00Z',
    invitedBy: 'user-1',
    lastLoginAt: '2026-02-04T15:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
    has2FA: false,
  },
  {
    memberId: 'member-3',
    userId: 'user-3',
    name: null,
    email: 'pending@example.com',
    image: null,
    userStatus: 'inactive',
    memberStatus: 'invited',
    role: { id: 'role-2', name: '一般成員', isSystem: true },
    joinedAt: '2026-02-01T00:00:00Z',
    invitedAt: '2026-02-01T00:00:00Z',
    invitedBy: 'user-1',
    lastLoginAt: null,
    createdAt: '2026-02-01T00:00:00Z',
    has2FA: false,
  },
];

const mockUserDetail = {
  ...mockUsers[0],
  emailVerified: '2026-01-01T00:00:00Z',
  security: {
    has2FA: true,
    twoFactorVerifiedAt: '2026-01-05T00:00:00Z',
    recentLogins: [
      {
        id: 'login-1',
        ip: '192.168.1.1',
        device: 'Desktop',
        browser: 'Chrome',
        location: 'Taipei, TW',
        status: 'success',
        createdAt: '2026-02-05T10:00:00Z',
      },
    ],
  },
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

describe('useAdminUsers Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('adminUserKeys', () => {
    it('generates correct query keys', () => {
      expect(adminUserKeys.all).toEqual(['admin-users']);
      expect(adminUserKeys.lists()).toEqual(['admin-users', 'list']);
      expect(adminUserKeys.list({ page: 1 })).toEqual(['admin-users', 'list', { page: 1 }]);
      expect(adminUserKeys.details()).toEqual(['admin-users', 'detail']);
      expect(adminUserKeys.detail('member-1')).toEqual(['admin-users', 'detail', 'member-1']);
    });
  });

  describe('useAdminUsers', () => {
    it('fetches users list with default options', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockUsers,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useAdminUsers(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20');
      expect(result.current.data?.data).toHaveLength(3);
    });

    it('fetches users with search filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockUsers[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useAdminUsers({ search: '張三' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users?search=%E5%BC%B5%E4%B8%89&page=1&limit=20');
    });

    it('fetches users with status filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockUsers[2]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useAdminUsers({ status: 'invited' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users?status=invited&page=1&limit=20');
    });

    it('fetches users with role filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockUsers[0]],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useAdminUsers({ roleId: 'role-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users?roleId=role-1&page=1&limit=20');
    });

    it('fetches users with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockUsers[1]],
        pagination: { page: 2, limit: 10, total: 15, totalPages: 2 },
      });

      const { result } = renderHook(
        () => useAdminUsers({ page: 2, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users?page=2&limit=10');
    });
  });

  describe('useAdminUserDetail', () => {
    it('fetches user detail by memberId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockUserDetail,
      });

      const { result } = renderHook(
        () => useAdminUserDetail('member-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users/member-1');
      expect(result.current.data?.data.name).toBe('張三');
      expect(result.current.data?.data.security.has2FA).toBe(true);
    });

    it('does not fetch when memberId is null', async () => {
      const { result } = renderHook(
        () => useAdminUserDetail(null),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('does not fetch when memberId is empty string', async () => {
      const { result } = renderHook(
        () => useAdminUserDetail(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useInviteUser', () => {
    it('invites a new user', async () => {
      const inviteData = {
        email: 'newuser@example.com',
        name: '新用戶',
        roleId: 'role-2',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: {
          memberId: 'member-new',
          userId: 'user-new',
          name: '新用戶',
          email: 'newuser@example.com',
        },
      });

      const { result } = renderHook(
        () => useInviteUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(inviteData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/admin/users', inviteData);
    });

    it('handles invite error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(
        () => useInviteUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        email: 'existing@example.com',
        name: '已存在',
        roleId: 'role-2',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateUser', () => {
    it('updates user information', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          memberId: 'member-1',
          userId: 'user-1',
          name: '張三（更新）',
          email: 'zhang@example.com',
        },
      });

      const { result } = renderHook(
        () => useUpdateUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        memberId: 'member-1',
        data: { name: '張三（更新）' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/users/member-1', {
        name: '張三（更新）',
      });
    });

    it('updates user role', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          memberId: 'member-2',
          userId: 'user-2',
          name: '李四',
          email: 'li@example.com',
        },
      });

      const { result } = renderHook(
        () => useUpdateUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        memberId: 'member-2',
        data: { roleId: 'role-1' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/users/member-2', {
        roleId: 'role-1',
      });
    });
  });

  describe('useDeleteUser', () => {
    it('deletes a user', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () => useDeleteUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('member-2');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/admin/users/member-2');
    });

    it('handles delete error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Cannot delete admin'));

      const { result } = renderHook(
        () => useDeleteUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('member-1');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useSuspendUser', () => {
    it('suspends a user', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          memberId: 'member-2',
          userId: 'user-2',
          name: '李四',
          email: 'li@example.com',
        },
      });

      const { result } = renderHook(
        () => useSuspendUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('member-2');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/users/member-2', {
        status: 'suspended',
      });
    });
  });

  describe('useActivateUser', () => {
    it('activates a suspended user', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: {
          memberId: 'member-2',
          userId: 'user-2',
          name: '李四',
          email: 'li@example.com',
        },
      });

      const { result } = renderHook(
        () => useActivateUser(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('member-2');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/users/member-2', {
        status: 'active',
      });
    });
  });
});
