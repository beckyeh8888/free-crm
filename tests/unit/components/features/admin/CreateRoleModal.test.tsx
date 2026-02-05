/**
 * CreateRoleModal Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CreateRoleModal } from '@/components/features/admin/CreateRoleModal';

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
          {
            category: 'deals',
            name: '商機管理',
            order: 1,
            permissions: [
              { code: 'deals:read', name: '查看商機', category: 'deals', description: '' },
            ],
          },
        ],
      },
    },
    isLoading: false,
  })),
  useCreateRole: vi.fn(() => ({
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
    selectedPermissions: Set<string>;
    onToggle: (code: string) => void;
    onToggleAll: (category: string, codes: string[]) => void;
  }) => (
    <div data-testid={`permission-group-${category}`}>
      {permissions.map((p) => (
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
        onClick={() => onToggleAll(category, permissions.map((p) => p.code))}
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
    { code: 'deals:read' },
  ],
  getPermissionsByCategory: vi.fn(() => []),
}));

import { useCreateRole, usePermissions } from '@/hooks/useAdminRoles';
import { getPermissionsByCategory } from '@/lib/permissions';

describe('CreateRoleModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    vi.mocked(useCreateRole).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateRole>);
  });

  describe('Rendering', () => {
    it('renders dialog with title', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText('建立新角色')).toBeInTheDocument();
    });

    it('renders role name input', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByLabelText(/角色名稱/)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByLabelText('描述')).toBeInTheDocument();
    });

    it('renders default role checkbox', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText('設為預設角色')).toBeInTheDocument();
    });

    it('renders permission groups', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByTestId('permission-group-customers')).toBeInTheDocument();
      expect(screen.getByTestId('permission-group-deals')).toBeInTheDocument();
    });

    it('renders permission count', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText(/0\/3 個權限/)).toBeInTheDocument();
    });

    it('renders cancel and submit buttons', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('建立角色')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submit is disabled when name is empty', () => {
      render(<CreateRoleModal {...defaultProps} />);

      const submitButton = screen.getByText('建立角色');
      expect(submitButton).toBeDisabled();
    });

    it('submit is enabled when name is filled', () => {
      render(<CreateRoleModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '銷售主管' },
      });

      const submitButton = screen.getByText('建立角色');
      expect(submitButton).not.toBeDisabled();
    });

    it('calls mutateAsync on form submit', async () => {
      render(<CreateRoleModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '銷售主管' },
      });
      fireEvent.change(screen.getByLabelText('描述'), {
        target: { value: '管理銷售團隊' },
      });

      // Submit form
      const form = screen.getByText('建立角色').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '銷售主管',
            description: '管理銷售團隊',
          })
        );
      });
    });

    it('calls onSuccess and onClose after successful creation', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      render(<CreateRoleModal onClose={onClose} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '銷售主管' },
      });

      const form = screen.getByText('建立角色').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not close on submission error', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Failed'));
      const onClose = vi.fn();
      render(<CreateRoleModal {...defaultProps} onClose={onClose} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '銷售主管' },
      });

      const form = screen.getByText('建立角色').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading text when creating', () => {
      vi.mocked(useCreateRole).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useCreateRole>);

      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText('建立中...')).toBeInTheDocument();
    });

    it('disables cancel when creating', () => {
      vi.mocked(useCreateRole).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useCreateRole>);

      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByText('取消')).toBeDisabled();
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<CreateRoleModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<CreateRoleModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<CreateRoleModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type button on close button', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '關閉' })).toHaveAttribute('type', 'button');
    });

    it('has required attribute on name input', () => {
      render(<CreateRoleModal {...defaultProps} />);

      expect(screen.getByLabelText(/角色名稱/)).toBeRequired();
    });
  });

  describe('Permission Fallback', () => {
    afterEach(() => {
      // Restore default usePermissions mock so subsequent tests get grouped data
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
              {
                category: 'deals',
                name: '商機管理',
                order: 1,
                permissions: [
                  { code: 'deals:read', name: '查看商機', category: 'deals', description: '' },
                ],
              },
            ],
          },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof usePermissions>);
    });

    it('uses getPermissionsByCategory when permissionsData.data.grouped is null', () => {
      vi.mocked(usePermissions).mockReturnValue({
        data: { data: { grouped: null } },
        isLoading: false,
      } as unknown as ReturnType<typeof usePermissions>);

      vi.mocked(getPermissionsByCategory).mockImplementation((category: string) => {
        if (category === 'customers') {
          return [
            { code: 'customers:read', name: '查看客戶', category: 'customers', description: '' },
          ] as ReturnType<typeof getPermissionsByCategory>;
        }
        return [] as ReturnType<typeof getPermissionsByCategory>;
      });

      render(<CreateRoleModal {...defaultProps} />);

      expect(getPermissionsByCategory).toHaveBeenCalledWith('customers');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('deals');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('contacts');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('documents');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('reports');
      expect(getPermissionsByCategory).toHaveBeenCalledWith('admin');
      // The customers group should render with the fallback permission
      expect(screen.getByTestId('permission-group-customers')).toBeInTheDocument();
    });

    it('uses getPermissionsByCategory when permissionsData is null', () => {
      vi.mocked(usePermissions).mockReturnValue({
        data: null,
        isLoading: false,
      } as unknown as ReturnType<typeof usePermissions>);

      vi.mocked(getPermissionsByCategory).mockReturnValue(
        [] as unknown as ReturnType<typeof getPermissionsByCategory>
      );

      render(<CreateRoleModal {...defaultProps} />);

      expect(getPermissionsByCategory).toHaveBeenCalled();
    });
  });

  describe('Category Toggle', () => {
    it('selects all permissions in a category when toggle-all is clicked', () => {
      render(<CreateRoleModal {...defaultProps} />);

      // Initially 0 permissions selected
      expect(screen.getByText(/0\/3 個權限/)).toBeInTheDocument();

      // Click toggle-all for customers (has 2 permissions: customers:read, customers:create)
      fireEvent.click(screen.getByTestId('toggle-all-customers'));

      // Now 2 permissions should be selected
      expect(screen.getByText(/2\/3 個權限/)).toBeInTheDocument();
    });

    it('deselects all permissions in a category when all are already selected', () => {
      render(<CreateRoleModal {...defaultProps} />);

      // Select all customers
      fireEvent.click(screen.getByTestId('toggle-all-customers'));
      expect(screen.getByText(/2\/3 個權限/)).toBeInTheDocument();

      // Click toggle-all again to deselect all
      fireEvent.click(screen.getByTestId('toggle-all-customers'));
      expect(screen.getByText(/0\/3 個權限/)).toBeInTheDocument();
    });

    it('selects remaining permissions when some are already selected', () => {
      render(<CreateRoleModal {...defaultProps} />);

      // Select one permission individually
      fireEvent.click(screen.getByTestId('toggle-customers:read'));
      expect(screen.getByText(/1\/3 個權限/)).toBeInTheDocument();

      // Toggle all in customers - should select the remaining one too
      fireEvent.click(screen.getByTestId('toggle-all-customers'));
      expect(screen.getByText(/2\/3 個權限/)).toBeInTheDocument();
    });
  });

  describe('isDefault Toggle', () => {
    it('toggles isDefault when the label is clicked', () => {
      render(<CreateRoleModal {...defaultProps} />);

      // Click the label text to toggle the checkbox
      fireEvent.click(screen.getByText('設為預設角色'));

      // The hidden checkbox should now be checked (the visual div changes style)
      const checkbox = screen.getByRole('checkbox', { hidden: true });
      expect(checkbox).toBeChecked();
    });

    it('submits with isDefault true when checkbox is checked', async () => {
      render(<CreateRoleModal {...defaultProps} />);

      // Fill in required name
      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '預設角色' },
      });

      // Toggle isDefault via label click
      fireEvent.click(screen.getByText('設為預設角色'));

      // Submit the form
      const form = screen.getByText('建立角色').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '預設角色',
            isDefault: true,
          })
        );
      });
    });

    it('submits with isDefault false when checkbox is not checked', async () => {
      render(<CreateRoleModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/角色名稱/), {
        target: { value: '一般角色' },
      });

      const form = screen.getByText('建立角色').closest('form')!;
      fireEvent.submit(form);

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '一般角色',
            isDefault: false,
          })
        );
      });
    });
  });
});
