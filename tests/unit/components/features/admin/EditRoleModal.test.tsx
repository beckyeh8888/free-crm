/**
 * EditRoleModal Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EditRoleModal } from '@/components/features/admin/EditRoleModal';
import type { AdminRole } from '@/hooks/useAdminRoles';

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useAdminRoles', () => ({
  usePermissions: vi.fn(() => ({
    data: {
      data: {
        grouped: [
          {
            category: 'customers',
            name: '客戶管理',
            order: 0,
            permissions: [
              { code: 'customers:read', name: '查看客戶', category: 'customers', description: '' },
              { code: 'customers:create', name: '新增客戶', category: 'customers', description: '' },
            ],
          },
        ],
      },
    },
    isLoading: false,
  })),
  useUpdateRole: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

// Mock PermissionGroup
vi.mock('@/components/features/admin/PermissionGroup', () => ({
  PermissionGroup: ({
    category,
    permissions,
    onToggle,
    onToggleAll,
  }: {
    category: string;
    permissions: readonly { code: string; name: string }[];
    onToggle: (code: string) => void;
    onToggleAll: (category: string, codes: string[]) => void;
  }) => (
    <div data-testid={`permission-group-${category}`}>
      {permissions?.map((p) => (
        <button
          key={p.code}
          type="button"
          data-testid={`toggle-${p.code}`}
          onClick={() => onToggle(p.code)}
        >
          {p.name}
        </button>
      ))}
      <button
        type="button"
        data-testid={`toggle-all-${category}`}
        onClick={() => onToggleAll(category, permissions?.map((p) => p.code) || [])}
      >
        Toggle All {category}
      </button>
    </div>
  ),
}));

// Mock permissions lib
vi.mock('@/lib/permissions', () => ({
  PERMISSION_DEFINITIONS: [
    { code: 'customers:read' },
    { code: 'customers:create' },
  ],
  getPermissionsByCategory: vi.fn(() => []),
}));

import { useUpdateRole, usePermissions } from '@/hooks/useAdminRoles';
import { getPermissionsByCategory } from '@/lib/permissions';

const mockRole: AdminRole = {
  id: 'role-1',
  name: '銷售主管',
  description: '管理銷售團隊',
  isSystem: false,
  isDefault: false,
  organizationId: 'org-1',
  memberCount: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  permissions: [{ code: 'customers:read', name: '查看客戶', category: 'customers', description: '' }],
};

const systemRole: AdminRole = {
  ...mockRole,
  id: 'role-sys',
  name: '管理員',
  isSystem: true,
  isDefault: false,
};

describe('EditRoleModal', () => {
  const defaultProps = {
    role: mockRole,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    vi.mocked(usePermissions).mockReturnValue({
      data: {
        data: {
          grouped: [
            {
              category: 'customers',
              name: '客戶管理',
              order: 0,
              permissions: [
                { code: 'customers:read', name: '查看客戶', category: 'customers', description: '' },
                { code: 'customers:create', name: '新增客戶', category: 'customers', description: '' },
              ],
            },
          ],
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof usePermissions>);
    vi.mocked(useUpdateRole).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateRole>);
  });

  describe('Rendering', () => {
    it('renders dialog with title', () => {
      render(<EditRoleModal {...defaultProps} />);

      expect(screen.getByText('編輯角色')).toBeInTheDocument();
    });

    it('renders role name input with current value', () => {
      render(<EditRoleModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/角色名稱/) as HTMLInputElement;
      expect(nameInput.value).toBe('銷售主管');
    });

    it('renders description with current value', () => {
      render(<EditRoleModal {...defaultProps} />);

      const descInput = screen.getByLabelText('描述') as HTMLTextAreaElement;
      expect(descInput.value).toBe('管理銷售團隊');
    });

    it('renders permission groups', () => {
      render(<EditRoleModal {...defaultProps} />);

      expect(screen.getByTestId('permission-group-customers')).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(<EditRoleModal {...defaultProps} />);

      expect(screen.getByText('儲存變更')).toBeInTheDocument();
    });
  });

  describe('System Role', () => {
    it('shows system role label', () => {
      render(<EditRoleModal {...defaultProps} role={systemRole} />);

      expect(screen.getByText('系統角色（僅可編輯權限）')).toBeInTheDocument();
    });

    it('disables name input for system role', () => {
      render(<EditRoleModal {...defaultProps} role={systemRole} />);

      expect(screen.getByLabelText(/角色名稱/)).toBeDisabled();
    });

    it('disables description for system role', () => {
      render(<EditRoleModal {...defaultProps} role={systemRole} />);

      expect(screen.getByLabelText('描述')).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls mutateAsync on form submit', async () => {
      render(<EditRoleModal {...defaultProps} />);

      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            roleId: 'role-1',
          })
        );
      });
    });

    it('calls onSuccess and onClose after successful update', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      render(<EditRoleModal role={mockRole} onClose={onClose} onSuccess={onSuccess} />);

      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not close on error', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Failed'));
      const onClose = vi.fn();
      render(<EditRoleModal role={mockRole} onClose={onClose} />);

      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('submit disabled when name is empty', () => {
      render(<EditRoleModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '' },
      });

      expect(screen.getByText('儲存變更')).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading text when updating', () => {
      vi.mocked(useUpdateRole).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useUpdateRole>);

      render(<EditRoleModal {...defaultProps} />);

      expect(screen.getByText('儲存中...')).toBeInTheDocument();
    });
  });

  describe('Permission Fallback', () => {
    it('uses fallback permission groups when API data is null', () => {
      const mockFallbackPermissions = [
        { code: 'customers:read', name: '查看客戶', category: 'customers', description: '' },
      ];
      vi.mocked(usePermissions).mockReturnValue({
        data: null,
        isLoading: false,
      } as unknown as ReturnType<typeof usePermissions>);
      vi.mocked(getPermissionsByCategory).mockReturnValue(mockFallbackPermissions as never);

      render(<EditRoleModal {...defaultProps} />);

      // Fallback categories include: customers, deals, contacts, documents, reports, admin
      expect(screen.getByTestId('permission-group-customers')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-deals')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-contacts')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-documents')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-reports')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-admin')).toBeInTheDocument();
      expect(getPermissionsByCategory).toHaveBeenCalledWith('customers');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('deals');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('admin');
    });
  });

  describe('Category Toggle', () => {
    it('toggles individual permission via onToggle callback', async () => {
      render(<EditRoleModal {...defaultProps} />);

      // Click a single permission toggle button
      fireEvent.click(screen.getByTestId('toggle-customers:create'));

      // Submit form to verify the permission was added
      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              permissions: expect.arrayContaining(['customers:read', 'customers:create']),
            }),
          })
        );
      });
    });

    it('toggles all permissions in a category via onToggleAll callback', async () => {
      render(<EditRoleModal {...defaultProps} />);

      // Click the "Toggle All" button for customers category
      fireEvent.click(screen.getByTestId('toggle-all-customers'));

      // Both customers:read and customers:create should now be selected
      // (customers:read was already selected from mockRole, customers:create gets added)
      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              permissions: expect.arrayContaining(['customers:read', 'customers:create']),
            }),
          })
        );
      });
    });

    it('deselects all permissions when all are already selected', async () => {
      // Create a role where all customers permissions are already selected
      const roleWithAllPerms: AdminRole = {
        ...mockRole,
        permissions: [
          { code: 'customers:read', name: '查看客戶', category: 'customers', description: '' },
          { code: 'customers:create', name: '新增客戶', category: 'customers', description: '' },
        ],
      };

      render(<EditRoleModal {...defaultProps} role={roleWithAllPerms} />);

      // Toggle all customers - since all are selected, should deselect all
      fireEvent.click(screen.getByTestId('toggle-all-customers'));

      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              permissions: [],
            }),
          })
        );
      });
    });
  });

  describe('System Role Form Fields', () => {
    it('disables isDefault checkbox for system role', () => {
      render(<EditRoleModal {...defaultProps} role={systemRole} />);

      expect(screen.getByText('設為預設角色')).toBeInTheDocument();
      // The label container should have reduced opacity styling for system roles
      const label = screen.getByText('設為預設角色').closest('label');
      expect(label).toHaveClass('opacity-50');
      expect(label).toHaveClass('cursor-not-allowed');
    });

    it('renders default role description text', () => {
      render(<EditRoleModal {...defaultProps} role={systemRole} />);

      expect(screen.getByText('新成員加入時將自動使用此角色')).toBeInTheDocument();
    });

    it('allows toggling isDefault for non-system role', async () => {
      render(<EditRoleModal {...defaultProps} />);

      const defaultRoleLabel = screen.getByText('設為預設角色').closest('label')!;
      expect(defaultRoleLabel).not.toHaveClass('opacity-50');

      // Click the label to toggle the checkbox
      fireEvent.click(defaultRoleLabel);

      const form = screen.getByText('儲存變更').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isDefault: true,
            }),
          })
        );
      });
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<EditRoleModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<EditRoleModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
