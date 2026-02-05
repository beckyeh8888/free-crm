/**
 * EditUserModal Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EditUserModal } from '@/components/features/admin/EditUserModal';
import type { AdminUser } from '@/hooks/useAdminUsers';

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useAdminRoles', () => ({
  useAdminRoles: vi.fn(() => ({
    data: {
      data: [
        { id: 'role-admin', name: '管理員', isSystem: true },
        { id: 'role-member', name: '成員', isSystem: false },
      ],
    },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useAdminUsers', () => ({
  useUpdateUser: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

import { useUpdateUser } from '@/hooks/useAdminUsers';

const mockUser: AdminUser = {
  memberId: 'member-1',
  userId: 'user-1',
  name: '王小明',
  email: 'wang@example.com',
  image: null,
  userStatus: 'active',
  memberStatus: 'active',
  role: { id: 'role-admin', name: '管理員', isSystem: true },
  joinedAt: '2026-01-01T00:00:00Z',
  invitedAt: null,
  invitedBy: null,
  lastLoginAt: '2026-02-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  has2FA: false,
};

describe('EditUserModal', () => {
  const defaultProps = {
    user: mockUser,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders dialog with aria-label', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '編輯使用者' })).toBeInTheDocument();
    });

    it('renders heading', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '編輯使用者' })).toBeInTheDocument();
    });

    it('renders user email as read-only', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('wang@example.com')).toBeInTheDocument();
    });

    it('renders name input with current value', () => {
      render(<EditUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('姓名') as HTMLInputElement;
      expect(nameInput.value).toBe('王小明');
    });

    it('renders role select', () => {
      render(<EditUserModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText('角色') as HTMLSelectElement;
      expect(roleSelect).toBeInTheDocument();
    });

    it('renders status select', () => {
      render(<EditUserModal {...defaultProps} />);

      const statusSelect = screen.getByLabelText('狀態') as HTMLSelectElement;
      expect(statusSelect.value).toBe('active');
    });

    it('renders role options', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('管理員 (系統)')).toBeInTheDocument();
      expect(screen.getByText('成員')).toBeInTheDocument();
    });

    it('renders status options', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('啟用')).toBeInTheDocument();
      expect(screen.getByText('已邀請')).toBeInTheDocument();
      expect(screen.getByText('停用')).toBeInTheDocument();
    });

    it('renders cancel and submit buttons', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('儲存')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls mutateAsync on submit', async () => {
      render(<EditUserModal {...defaultProps} />);

      const form = screen.getByText('儲存').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          memberId: 'member-1',
          data: expect.objectContaining({
            name: '王小明',
            roleId: 'role-admin',
            status: 'active',
          }),
        });
      });
    });

    it('calls onSuccess and onClose after successful update', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      render(<EditUserModal user={mockUser} onClose={onClose} onSuccess={onSuccess} />);

      const form = screen.getByText('儲存').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error on submission failure', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('更新失敗'));
      render(<EditUserModal {...defaultProps} />);

      const form = screen.getByText('儲存').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(screen.getByText('更新失敗')).toBeInTheDocument();
      });
    });

    it('changes name field', () => {
      render(<EditUserModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText('姓名'), {
        target: { value: '李大明' },
      });

      expect((screen.getByLabelText('姓名') as HTMLInputElement).value).toBe('李大明');
    });

    it('changes status field', () => {
      render(<EditUserModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText('狀態'), {
        target: { value: 'suspended' },
      });

      expect((screen.getByLabelText('狀態') as HTMLSelectElement).value).toBe('suspended');
    });
  });

  describe('Loading State', () => {
    it('shows loading text when updating', () => {
      vi.mocked(useUpdateUser).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useUpdateUser>);

      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('儲存中...')).toBeInTheDocument();
    });

    it('disables submit when updating', () => {
      vi.mocked(useUpdateUser).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useUpdateUser>);

      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('儲存中...')).toBeDisabled();
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<EditUserModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<EditUserModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<EditUserModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type button on close button', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toHaveAttribute('type', 'button');
    });
  });
});
