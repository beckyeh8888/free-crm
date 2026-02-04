/**
 * Select Stories
 *
 * Demonstrates all select states and variations.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from '@storybook/test';
import { Select } from './Select';

const basicOptions = [
  { value: 'option1', label: '選項一' },
  { value: 'option2', label: '選項二' },
  { value: 'option3', label: '選項三' },
];

const customerTypeOptions = [
  { value: 'B2B', label: 'B2B 企業客戶' },
  { value: 'B2C', label: 'B2C 個人客戶' },
];

const statusOptions = [
  { value: 'active', label: '活躍' },
  { value: 'inactive', label: '停用' },
  { value: 'lead', label: '潛在客戶' },
];

// Generate many options for testing
const manyOptions = Array.from({ length: 30 }, (_, i) => ({
  value: `option${i + 1}`,
  label: `選項 ${i + 1}`,
}));

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

// ============================================
// Basic Stories
// ============================================

/** Default select without placeholder */
export const Default: Story = {
  args: {
    options: basicOptions,
  },
};

/** Select with placeholder */
export const WithPlaceholder: Story = {
  args: {
    label: '客戶類型',
    options: customerTypeOptions,
    placeholder: '請選擇客戶類型',
  },
};

/** Select with error state */
export const WithError: Story = {
  args: {
    label: '狀態',
    options: statusOptions,
    placeholder: '請選擇',
    error: '此欄位為必填',
  },
};

/** Disabled select */
export const Disabled: Story = {
  args: {
    label: '客戶類型',
    options: customerTypeOptions,
    value: 'B2B',
    disabled: true,
  },
};

// ============================================
// Size Stories
// ============================================

/** Small size */
export const Small: Story = {
  args: {
    label: '小型下拉選單',
    options: basicOptions,
    size: 'sm',
  },
};

/** Medium size (default) */
export const Medium: Story = {
  args: {
    label: '中型下拉選單',
    options: basicOptions,
    size: 'md',
  },
};

/** Large size */
export const Large: Story = {
  args: {
    label: '大型下拉選單',
    options: basicOptions,
    size: 'lg',
  },
};

// ============================================
// Edge Cases
// ============================================

/** Many options (30+) */
export const ManyOptions: Story = {
  args: {
    label: '多選項測試',
    options: manyOptions,
    placeholder: '請選擇（共 30 個選項）',
  },
};

/** With disabled options */
export const WithDisabledOptions: Story = {
  args: {
    label: '含禁用選項',
    options: [
      { value: 'active', label: '可選擇' },
      { value: 'disabled1', label: '已禁用選項', disabled: true },
      { value: 'other', label: '其他選項' },
      { value: 'disabled2', label: '另一個禁用選項', disabled: true },
    ],
    placeholder: '請選擇',
  },
};

/** All sizes showcase */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select label="Small" options={basicOptions} size="sm" />
      <Select label="Medium" options={basicOptions} size="md" />
      <Select label="Large" options={basicOptions} size="lg" />
    </div>
  ),
};

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Select label="Normal" options={basicOptions} placeholder="請選擇" />
      <Select label="With Value" options={basicOptions} value="option1" />
      <Select label="With Error" options={basicOptions} error="此欄位必填" />
      <Select label="Disabled" options={basicOptions} value="option1" disabled />
    </div>
  ),
};

// ============================================
// Interaction Tests
// ============================================

/** Select interaction test */
export const SelectTest: Story = {
  args: {
    label: '選擇測試',
    options: basicOptions,
    placeholder: '請選擇',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox');

    // Select an option
    await userEvent.selectOptions(select, 'option2');

    // Verify selection
    await expect(select).toHaveValue('option2');
  },
};

/** Focus interaction test */
export const FocusTest: Story = {
  args: {
    label: '焦點測試',
    options: basicOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox');

    // Tab to focus
    await userEvent.tab();

    // Verify focus
    await expect(select).toHaveFocus();
  },
};
