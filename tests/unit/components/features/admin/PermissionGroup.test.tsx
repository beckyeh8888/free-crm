/**
 * PermissionGroup Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PermissionGroup } from '@/components/features/admin/PermissionGroup';

// Mock permissions lib
vi.mock('@/lib/permissions', () => ({
  PERMISSION_CATEGORIES: {
    customers: { name: '客戶管理' },
    deals: { name: '商機管理' },
  },
}));

const mockPermissions = [
  { code: 'customers:read', name: '查看客戶', description: '可以查看客戶列表和詳情' },
  { code: 'customers:create', name: '新增客戶', description: '可以新增客戶' },
  { code: 'customers:update', name: '編輯客戶', description: '可以編輯客戶資料' },
];

describe('PermissionGroup', () => {
  const defaultProps = {
    category: 'customers',
    permissions: mockPermissions,
    selectedPermissions: new Set<string>(),
    onToggle: vi.fn(),
    onToggleAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders category name', () => {
      render(<PermissionGroup {...defaultProps} />);

      expect(screen.getByText('客戶管理')).toBeInTheDocument();
    });

    it('renders permission count', () => {
      render(<PermissionGroup {...defaultProps} />);

      expect(screen.getByText('0/3')).toBeInTheDocument();
    });

    it('renders all permission items', () => {
      render(<PermissionGroup {...defaultProps} />);

      expect(screen.getByText('查看客戶')).toBeInTheDocument();
      expect(screen.getByText('新增客戶')).toBeInTheDocument();
      expect(screen.getByText('編輯客戶')).toBeInTheDocument();
    });

    it('renders permission descriptions', () => {
      render(<PermissionGroup {...defaultProps} />);

      expect(screen.getByText('可以查看客戶列表和詳情')).toBeInTheDocument();
    });

    it('renders checkboxes for each permission', () => {
      render(<PermissionGroup {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });
  });

  describe('Selection', () => {
    it('shows selected state for checked permissions', () => {
      const selected = new Set(['customers:read']);
      render(<PermissionGroup {...defaultProps} selectedPermissions={selected} />);

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('shows all selected count', () => {
      const selected = new Set(['customers:read', 'customers:create', 'customers:update']);
      render(<PermissionGroup {...defaultProps} selectedPermissions={selected} />);

      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('calls onToggle when a permission is clicked', () => {
      const onToggle = vi.fn();
      render(<PermissionGroup {...defaultProps} onToggle={onToggle} />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(onToggle).toHaveBeenCalledWith('customers:read');
    });

    it('calls onToggleAll when header is clicked', () => {
      const onToggleAll = vi.fn();
      render(<PermissionGroup {...defaultProps} onToggleAll={onToggleAll} />);

      fireEvent.click(screen.getByRole('button', { name: /全選 客戶管理/ }));

      expect(onToggleAll).toHaveBeenCalledWith(
        'customers',
        ['customers:read', 'customers:create', 'customers:update']
      );
    });

    it('shows 取消全選 when all selected', () => {
      const selected = new Set(['customers:read', 'customers:create', 'customers:update']);
      render(<PermissionGroup {...defaultProps} selectedPermissions={selected} />);

      expect(screen.getByRole('button', { name: /取消全選 客戶管理/ })).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables all checkboxes when disabled', () => {
      render(<PermissionGroup {...defaultProps} disabled />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });

    it('disables header button when disabled', () => {
      render(<PermissionGroup {...defaultProps} disabled />);

      expect(screen.getByRole('button', { name: /全選 客戶管理/ })).toBeDisabled();
    });
  });

  describe('Unknown Category', () => {
    it('uses raw category name if not in PERMISSION_CATEGORIES', () => {
      render(<PermissionGroup {...defaultProps} category="unknown" />);

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });
});
