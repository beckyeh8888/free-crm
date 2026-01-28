/**
 * DataTable Component Unit Tests
 * Tests for DataTable component with various states
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, Column } from '@/components/ui/DataTable';

interface TestData {
  id: number;
  name: string;
  email: string;
  status: string;
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'active' },
];

const mockColumns: Column<TestData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status' },
];

const keyExtractor = (row: TestData) => row.id;

describe('DataTable Component', () => {
  describe('Rendering', () => {
    it('renders data rows', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders correct number of rows', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      // 3 data rows + 1 header row
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4);
    });

    it('renders with caption for accessibility', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          caption="Customer list"
        />
      );

      // Caption is sr-only but should be in the DOM
      expect(screen.getByText('Customer list')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no data', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getByText('暫無資料')).toBeInTheDocument();
    });

    it('shows custom empty title', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          emptyTitle="No customers found"
        />
      );

      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });

    it('shows custom empty description', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          emptyDescription="Try adjusting your filters"
        />
      );

      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });

    it('shows empty action when provided', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          emptyAction={<button type="button">Add Customer</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Add Customer' })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          loading
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-busy', 'true');
    });

    it('shows custom number of skeleton rows', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          loading
          skeletonRows={3}
        />
      );

      // 3 skeleton rows + 1 header row
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4);
    });

    it('shows loading caption', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          loading
          caption="Customer list"
        />
      );

      expect(screen.getByText('Customer list - 載入中')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when error is provided', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          error="Failed to load data"
        />
      );

      expect(screen.getByText('載入資料失敗')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('shows retry button in error state', () => {
      const handleRetry = vi.fn();
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          error="Error"
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /重試/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const handleRetry = vi.fn();
      render(
        <DataTable
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          error="Error"
          onRetry={handleRetry}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /重試/i }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Row Interactions', () => {
    it('calls onRowClick when row is clicked', () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={handleRowClick}
        />
      );

      // When onRowClick is provided, data rows have role="button"
      const clickableRows = screen.getAllByRole('button');
      fireEvent.click(clickableRows[0]);

      expect(handleRowClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('supports keyboard navigation for clickable rows', () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={handleRowClick}
        />
      );

      // When onRowClick is provided, data rows have role="button"
      const clickableRows = screen.getAllByRole('button');

      // Enter key
      fireEvent.keyDown(clickableRows[0], { key: 'Enter' });
      expect(handleRowClick).toHaveBeenCalledTimes(1);

      // Space key
      fireEvent.keyDown(clickableRows[0], { key: ' ' });
      expect(handleRowClick).toHaveBeenCalledTimes(2);
    });

    it('makes rows focusable when clickable', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={() => {}}
        />
      );

      // When onRowClick is provided, data rows have role="button"
      const clickableRows = screen.getAllByRole('button');
      expect(clickableRows[0]).toHaveAttribute('tabindex', '0');
    });

    it('rows have button role when clickable', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={() => {}}
        />
      );

      // Data rows should have role="button" when clickable
      const clickableRows = screen.getAllByRole('button');
      expect(clickableRows.length).toBeGreaterThan(0);
      expect(clickableRows[0]).toHaveAttribute('role', 'button');
    });
  });

  describe('Styling Options', () => {
    it('applies striped rows', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          striped
        />
      );

      const rows = screen.getAllByRole('row');
      // Odd row (index 1 from data = second row in table)
      expect(rows[2].className).toContain('bg-primary-50');
    });

    it('applies compact mode', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          compact
        />
      );

      // Check that compact padding is applied
      const cells = screen.getAllByRole('cell');
      expect(cells[0].className).toContain('px-4 py-2');
    });

    it('disables hover effect when hoverable is false', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          hoverable={false}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows[1].className).not.toContain('hover:bg-primary-100');
    });
  });

  describe('Custom Renderers', () => {
    it('uses custom cell renderer', () => {
      const customColumns: Column<TestData>[] = [
        { key: 'id', header: 'ID' },
        {
          key: 'status',
          header: 'Status',
          render: (value) => (
            <span data-testid="custom-status">
              Status: {String(value)}
            </span>
          ),
        },
      ];

      render(
        <DataTable
          columns={customColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getAllByTestId('custom-status')).toHaveLength(3);
      // There are 2 rows with 'active' status in mockData
      expect(screen.getAllByText('Status: active')).toHaveLength(2);
    });

    it('passes row data to custom renderer', () => {
      const customColumns: Column<TestData>[] = [
        {
          key: 'name',
          header: 'Name',
          render: (_, row) => (
            <span data-testid="custom-name">
              {row.name} ({row.email})
            </span>
          ),
        },
      ];

      render(
        <DataTable
          columns={customColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
    });
  });

  describe('Column Options', () => {
    it('applies column width', () => {
      const columnsWithWidth: Column<TestData>[] = [
        { key: 'id', header: 'ID', width: '100px' },
        { key: 'name', header: 'Name' },
      ];

      render(
        <DataTable
          columns={columnsWithWidth}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      const headerCells = screen.getAllByRole('columnheader');
      expect(headerCells[0]).toHaveStyle({ width: '100px' });
    });

    it('applies text alignment', () => {
      const columnsWithAlign: Column<TestData>[] = [
        { key: 'id', header: 'ID', align: 'right' },
        { key: 'name', header: 'Name', align: 'center' },
      ];

      render(
        <DataTable
          columns={columnsWithAlign}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      const headerCells = screen.getAllByRole('columnheader');
      expect(headerCells[0].className).toContain('text-right');
      expect(headerCells[1].className).toContain('text-center');
    });

    it('applies truncate style', () => {
      const columnsWithTruncate: Column<TestData>[] = [
        { key: 'email', header: 'Email', truncate: true },
      ];

      render(
        <DataTable
          columns={columnsWithTruncate}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells[0].className).toContain('truncate');
    });
  });

  describe('Nested Keys', () => {
    it('supports nested object keys', () => {
      interface NestedData {
        id: number;
        user: {
          name: string;
          email: string;
        };
      }

      const nestedData: NestedData[] = [
        { id: 1, user: { name: 'John', email: 'john@example.com' } },
      ];

      const nestedColumns: Column<NestedData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'user.name', header: 'User Name' },
      ];

      render(
        <DataTable
          columns={nestedColumns}
          data={nestedData}
          keyExtractor={(row) => row.id}
        />
      );

      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table role', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has scope="col" on header cells', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );

      const headerCells = screen.getAllByRole('columnheader');
      headerCells.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });
});
