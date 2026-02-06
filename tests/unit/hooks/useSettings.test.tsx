/**
 * useSettings Hook Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useSetup2FA,
  useVerify2FA,
  useDisable2FA,
  useLoginHistory,
} from '@/hooks/useSettings';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockProfile = {
  success: true,
  data: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    status: 'active',
    emailVerified: '2026-01-01T00:00:00Z',
    security: { has2FA: false, twoFactorVerifiedAt: null },
    organizations: [],
  },
};

describe('useSettings Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProfile', () => {
    it('calls apiClient.get with correct URL', () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProfile);

      renderHook(() => useProfile(), { wrapper: createWrapper() });

      expect(apiClient.get).toHaveBeenCalledWith('/api/account/profile');
    });

    it('returns profile data on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.data?.data?.name).toBe('Test User');
      });
    });
  });

  describe('useUpdateProfile', () => {
    it('calls apiClient.patch with correct URL and data', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true, data: {} });

      const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ name: 'Updated Name' });
      });

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith('/api/account/profile', {
          name: 'Updated Name',
        });
      });
    });
  });

  describe('useChangePassword', () => {
    it('calls apiClient.post with correct URL', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: {} });

      const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({
          currentPassword: 'old',
          newPassword: 'New1234!',
          confirmPassword: 'New1234!',
        });
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/account/password', {
          currentPassword: 'old',
          newPassword: 'New1234!',
          confirmPassword: 'New1234!',
        });
      });
    });
  });

  describe('useSetup2FA', () => {
    it('calls apiClient.post with correct URL', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { qrCode: 'data:image/png;base64,...', secret: 'ABC123', backupCodes: [] },
      });

      const { result } = renderHook(() => useSetup2FA(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate(undefined);
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/account/2fa/setup', {});
      });
    });
  });

  describe('useVerify2FA', () => {
    it('calls apiClient.post with correct URL and token', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { success: true, message: '2FA 已成功啟用', enabledAt: '2026-01-01' },
      });

      const { result } = renderHook(() => useVerify2FA(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ token: '123456' });
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/account/2fa/verify', {
          token: '123456',
        });
      });
    });
  });

  describe('useDisable2FA', () => {
    it('calls apiClient.post with correct URL and data', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { success: true, message: '2FA 已停用' },
      });

      const { result } = renderHook(() => useDisable2FA(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ password: 'pass', token: '123456' });
      });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/account/2fa/disable', {
          password: 'pass',
          token: '123456',
        });
      });
    });
  });

  describe('useLoginHistory', () => {
    it('calls apiClient.get with correct URL', () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: [], pagination: {} });

      renderHook(() => useLoginHistory(), { wrapper: createWrapper() });

      expect(apiClient.get).toHaveBeenCalledWith('/api/account/login-history', {});
    });

    it('passes page and limit params', () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: [], pagination: {} });

      renderHook(() => useLoginHistory({ page: 2, limit: 10 }), { wrapper: createWrapper() });

      expect(apiClient.get).toHaveBeenCalledWith('/api/account/login-history', {
        page: '2',
        limit: '10',
      });
    });
  });
});
