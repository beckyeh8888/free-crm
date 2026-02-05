/**
 * InviteUserModal Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { InviteUserModal } from '@/components/features/admin/InviteUserModal';

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
  useInviteUser: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

import { useInviteUser } from '@/hooks/useAdminUsers';

describe('InviteUserModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders dialog with aria-label', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '邀請使用者' })).toBeInTheDocument();
    });

    it('renders heading', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '邀請使用者' })).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
    });

    it('renders name input', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/姓名/)).toBeInTheDocument();
    });

    it('renders role select', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/角色/)).toBeInTheDocument();
    });

    it('renders role options with placeholder', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByText('選擇角色...')).toBeInTheDocument();
      expect(screen.getByText('管理員 (系統)')).toBeInTheDocument();
      expect(screen.getByText('成員')).toBeInTheDocument();
    });

    it('renders cancel and invite buttons', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('邀請')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting with empty fields', async () => {
      render(<InviteUserModal {...defaultProps} />);

      const form = screen.getByText('邀請').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(screen.getByText('請填寫所有必填欄位')).toBeInTheDocument();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls mutateAsync with form data', async () => {
      render(<InviteUserModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/電子郵件/), {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/姓名/), {
        target: { value: '新成員' },
      });
      fireEvent.change(screen.getByLabelText(/角色/), {
        target: { value: 'role-member' },
      });

      const form = screen.getByText('邀請').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: '新成員',
          roleId: 'role-member',
        });
      });
    });

    it('calls onSuccess and onClose after successful invite', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      render(<InviteUserModal onClose={onClose} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/電子郵件/), {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/姓名/), {
        target: { value: '新成員' },
      });
      fireEvent.change(screen.getByLabelText(/角色/), {
        target: { value: 'role-member' },
      });

      const form = screen.getByText('邀請').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error on submission failure', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('邀請失敗'));
      render(<InviteUserModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/電子郵件/), {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/姓名/), {
        target: { value: '新成員' },
      });
      fireEvent.change(screen.getByLabelText(/角色/), {
        target: { value: 'role-member' },
      });

      const form = screen.getByText('邀請').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(screen.getByText('邀請失敗')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading text when inviting', () => {
      vi.mocked(useInviteUser).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useInviteUser>);

      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByText('邀請中...')).toBeInTheDocument();
    });

    it('disables submit when inviting', () => {
      vi.mocked(useInviteUser).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useInviteUser>);

      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByText('邀請中...')).toBeDisabled();
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<InviteUserModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<InviteUserModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<InviteUserModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has required attribute on email input', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/電子郵件/)).toBeRequired();
    });

    it('has required attribute on name input', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/姓名/)).toBeRequired();
    });

    it('has required attribute on role select', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/角色/)).toBeRequired();
    });

    it('has type button on close button', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toHaveAttribute('type', 'button');
    });

    it('email input has type email', () => {
      render(<InviteUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/電子郵件/)).toHaveAttribute('type', 'email');
    });
  });
});
