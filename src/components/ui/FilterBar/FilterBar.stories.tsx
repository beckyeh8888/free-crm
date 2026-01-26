/**
 * FilterBar Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import { FilterBar, FilterField, FilterValues } from './FilterBar';
import { Button } from '../Button';

const meta: Meta<typeof FilterBar> = {
  title: 'UI/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onChange: fn(),
    onSubmit: fn(),
    onClear: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

// Default fields for customer filtering
const defaultFields: FilterField[] = [
  {
    key: 'search',
    label: '搜尋',
    type: 'search',
    placeholder: '輸入客戶名稱或電子郵件',
    width: '250px',
  },
  {
    key: 'type',
    label: '類型',
    type: 'select',
    placeholder: '全部類型',
    width: '150px',
    options: [
      { value: 'B2B', label: 'B2B' },
      { value: 'B2C', label: 'B2C' },
    ],
  },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    placeholder: '全部狀態',
    width: '150px',
    options: [
      { value: 'active', label: '活躍' },
      { value: 'inactive', label: '停用' },
      { value: 'lead', label: '潛在' },
    ],
  },
];

/** Default filter bar */
export const Default: Story = {
  args: {
    fields: defaultFields,
    values: {},
  },
};

/** With preset values */
export const WithValues: Story = {
  args: {
    fields: defaultFields,
    values: {
      search: '測試客戶',
      type: 'B2B',
      status: 'active',
    },
  },
};

/** With submit button */
export const WithSubmit: Story = {
  args: {
    fields: defaultFields,
    values: {},
    showSubmit: true,
    submitText: '搜尋',
  },
};

/** Loading state */
export const Loading: Story = {
  args: {
    fields: defaultFields,
    values: { search: '載入中...' },
    showSubmit: true,
    loading: true,
  },
};

/** Disabled state */
export const Disabled: Story = {
  args: {
    fields: defaultFields,
    values: { search: '已禁用' },
    disabled: true,
  },
};

/** Vertical layout */
export const VerticalLayout: Story = {
  args: {
    fields: defaultFields,
    values: {},
    layout: 'vertical',
    showSubmit: true,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

/** Compact mode */
export const Compact: Story = {
  args: {
    fields: defaultFields,
    values: {},
    compact: true,
    showSubmit: true,
  },
};

/** Search only */
export const SearchOnly: Story = {
  args: {
    fields: [
      {
        key: 'search',
        label: '搜尋',
        type: 'search',
        placeholder: '搜尋...',
        width: '300px',
      },
    ],
    values: {},
    showClear: false,
  },
};

/** Many filters */
export const ManyFilters: Story = {
  args: {
    fields: [
      { key: 'search', label: '搜尋', type: 'search', placeholder: '關鍵字', width: '200px' },
      {
        key: 'category',
        label: '分類',
        type: 'select',
        placeholder: '選擇分類',
        width: '150px',
        options: [
          { value: 'tech', label: '科技' },
          { value: 'retail', label: '零售' },
          { value: 'finance', label: '金融' },
          { value: 'healthcare', label: '醫療' },
        ],
      },
      {
        key: 'region',
        label: '地區',
        type: 'select',
        placeholder: '選擇地區',
        width: '150px',
        options: [
          { value: 'north', label: '北部' },
          { value: 'central', label: '中部' },
          { value: 'south', label: '南部' },
          { value: 'east', label: '東部' },
        ],
      },
      {
        key: 'size',
        label: '規模',
        type: 'select',
        placeholder: '選擇規模',
        width: '150px',
        options: [
          { value: 'small', label: '小型' },
          { value: 'medium', label: '中型' },
          { value: 'large', label: '大型' },
        ],
      },
    ],
    values: {},
    showSubmit: true,
  },
};

/** With additional actions */
export const WithActions: Story = {
  args: {
    fields: defaultFields,
    values: {},
    actions: (
      <Button variant="primary">
        + 新增客戶
      </Button>
    ),
  },
};

/** Interactive demo */
export const Interactive: Story = {
  render: function InteractiveFilterBar() {
    const [values, setValues] = useState<FilterValues>({});
    const [submitted, setSubmitted] = useState<FilterValues | null>(null);

    return (
      <div className="space-y-4">
        <FilterBar
          fields={defaultFields}
          values={values}
          onChange={setValues}
          onSubmit={() => setSubmitted({ ...values })}
          onClear={() => setSubmitted(null)}
          showSubmit={true}
        />
        {submitted && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              已提交的篩選條件:
            </p>
            <pre className="text-xs text-gray-600 dark:text-gray-400">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  },
};

/** Type test */
export const TypeTest: Story = {
  args: {
    fields: defaultFields,
    values: {},
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Type in search field
    const searchInput = canvas.getByPlaceholderText('輸入客戶名稱或電子郵件');
    await userEvent.type(searchInput, '測試');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/** Select test */
export const SelectTest: Story = {
  args: {
    fields: defaultFields,
    values: {},
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Select type
    const typeSelect = canvas.getByLabelText('類型');
    await userEvent.selectOptions(typeSelect, 'B2B');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/** Combined with DataTable preview */
export const CombinedPreview: Story = {
  render: function CombinedPreview() {
    const [values, setValues] = useState<FilterValues>({});

    return (
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <FilterBar
            fields={defaultFields}
            values={values}
            onChange={setValues}
            showSubmit={true}
            actions={<Button variant="primary">+ 新增</Button>}
          />
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400">
          [DataTable 會在這裡顯示]
        </div>
      </div>
    );
  },
};
