/**
 * DataTable Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import { DataTable, Column } from './DataTable';
import { Button } from '../Button';

// Sample data types
interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  type: 'B2B' | 'B2C';
  status: 'active' | 'inactive' | 'lead';
  createdAt: string;
}

// Sample data
const sampleCustomers: Customer[] = [
  { id: '1', name: '張三', email: 'zhang@example.com', company: '科技有限公司', type: 'B2B', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: '李四', email: 'li@example.com', company: '創新科技', type: 'B2B', status: 'active', createdAt: '2024-01-14' },
  { id: '3', name: '王五', email: 'wang@example.com', company: '', type: 'B2C', status: 'lead', createdAt: '2024-01-13' },
  { id: '4', name: '趙六', email: 'zhao@example.com', company: '數位行銷公司', type: 'B2B', status: 'inactive', createdAt: '2024-01-12' },
  { id: '5', name: '陳七', email: 'chen@example.com', company: '電商平台', type: 'B2B', status: 'active', createdAt: '2024-01-11' },
];

// Generate many rows for ManyRows story
const manyCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  name: `客戶 ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  company: i % 3 === 0 ? '' : `公司 ${i + 1}`,
  type: i % 2 === 0 ? 'B2B' : 'B2C',
  status: i % 3 === 0 ? 'lead' : i % 3 === 1 ? 'active' : 'inactive',
  createdAt: `2024-01-${String(15 - (i % 15)).padStart(2, '0')}`,
}));

// Long text data
const longTextCustomers: Customer[] = [
  {
    id: '1',
    name: '這是一個非常非常長的客戶名稱用來測試文字溢位的情況',
    email: 'verylongemailaddress.that.should.overflow@extremely-long-domain-name.example.com',
    company: '這是一個非常長的公司名稱，用來測試當公司名稱超過欄位寬度時的顯示效果，看看是否會正確換行或截斷',
    type: 'B2B',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: '短名',
    email: 'short@ex.com',
    company: '短公司',
    type: 'B2C',
    status: 'lead',
    createdAt: '2024-01-14',
  },
];

// Column definitions
const columns: Column<Customer>[] = [
  { key: 'name', header: '客戶名稱', width: '150px' },
  { key: 'email', header: '電子郵件' },
  { key: 'company', header: '公司', render: (value) => value || '-' },
  {
    key: 'type',
    header: '類型',
    width: '80px',
    align: 'center',
    render: (value) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'B2B'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    key: 'status',
    header: '狀態',
    width: '100px',
    align: 'center',
    render: (value) => {
      const statusColors = {
        active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        lead: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      };
      const statusLabels = { active: '活躍', inactive: '停用', lead: '潛在' };
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value as keyof typeof statusColors]}`}>
          {statusLabels[value as keyof typeof statusLabels]}
        </span>
      );
    },
  },
  { key: 'createdAt', header: '建立日期', width: '120px', align: 'right' },
];

const meta: Meta<typeof DataTable<Customer>> = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onRowClick: fn(),
    onRetry: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<Customer>>;

/** Default table with data */
export const Default: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    caption: '客戶列表',
  },
};

/** Empty state (0 rows) */
export const Empty: Story = {
  args: {
    columns,
    data: [],
    keyExtractor: (row) => row.id,
    emptyTitle: '尚無客戶資料',
    emptyDescription: '開始新增您的第一位客戶，建立客戶關係管理。',
    emptyAction: <Button>新增客戶</Button>,
  },
};

/** Many rows (30+) */
export const ManyRows: Story = {
  args: {
    columns,
    data: manyCustomers,
    keyExtractor: (row) => row.id,
    caption: '大量客戶資料',
  },
};

/** Long text handling */
export const LongText: Story = {
  args: {
    columns: columns.map((col) =>
      col.key === 'name' || col.key === 'email' || col.key === 'company'
        ? { ...col, truncate: true }
        : col
    ),
    data: longTextCustomers,
    keyExtractor: (row) => row.id,
    caption: '長文字測試',
  },
};

/** Loading state (skeleton) */
export const Loading: Story = {
  args: {
    columns,
    data: [],
    keyExtractor: (row) => row.id,
    loading: true,
    skeletonRows: 5,
  },
};

/** Error state */
export const Error: Story = {
  args: {
    columns,
    data: [],
    keyExtractor: (row) => row.id,
    error: '無法載入客戶資料，請檢查網路連線後再試。',
    onRetry: fn(),
  },
};

/** Striped rows */
export const Striped: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    striped: true,
  },
};

/** Without hover effect */
export const NoHover: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    hoverable: false,
  },
};

/** Compact mode */
export const Compact: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    compact: true,
  },
};

/** Clickable rows */
export const ClickableRows: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    onRowClick: fn(),
  },
};

/** Row click test */
export const RowClickTest: Story = {
  args: {
    columns,
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
    onRowClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click first row
    const firstRow = canvas.getByRole('button', { name: /張三/i }).closest('tr');
    if (firstRow) {
      await userEvent.click(firstRow);
      await expect(args.onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', name: '張三' }),
        0
      );
    }
  },
};

/** With custom cell rendering */
export const CustomRendering: Story = {
  args: {
    columns: [
      {
        key: 'name',
        header: '客戶',
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                {row.name[0]}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
            </div>
          </div>
        ),
      },
      { key: 'company', header: '公司', render: (value) => value || '-' },
      {
        key: 'status',
        header: '狀態',
        width: '100px',
        render: (value) => {
          const isActive = value === 'active';
          return (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              {isActive ? '活躍' : value === 'lead' ? '潛在' : '停用'}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: '操作',
        width: '150px',
        align: 'right',
        render: (_, row) => (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); alert(`編輯 ${row.name}`); }}>
              編輯
            </Button>
            <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); alert(`刪除 ${row.name}`); }}>
              刪除
            </Button>
          </div>
        ),
      },
    ],
    data: sampleCustomers,
    keyExtractor: (row) => row.id,
  },
};

/** All states comparison */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">正常狀態</h3>
        <DataTable
          columns={columns.slice(0, 3)}
          data={sampleCustomers.slice(0, 3)}
          keyExtractor={(row) => row.id}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">載入中</h3>
        <DataTable
          columns={columns.slice(0, 3)}
          data={[]}
          keyExtractor={(row) => row.id}
          loading
          skeletonRows={3}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">空狀態</h3>
        <DataTable
          columns={columns.slice(0, 3)}
          data={[]}
          keyExtractor={(row) => row.id}
          emptyTitle="尚無資料"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">錯誤狀態</h3>
        <DataTable
          columns={columns.slice(0, 3)}
          data={[]}
          keyExtractor={(row) => row.id}
          error="載入失敗"
        />
      </div>
    </div>
  ),
};
