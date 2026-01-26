/**
 * TextInput Stories
 *
 * Demonstrates all input states and variations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'UI/TextInput',
  component: TextInput,
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
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

// ============================================
// Basic Stories
// ============================================

/** Default input without label */
export const Default: Story = {
  args: {
    placeholder: '請輸入文字...',
  },
};

/** Input with label */
export const WithLabel: Story = {
  args: {
    label: '電子郵件',
    placeholder: 'your@email.com',
    type: 'email',
  },
};

/** Input with hint text */
export const WithHint: Story = {
  args: {
    label: '密碼',
    type: 'password',
    placeholder: '••••••••',
    hint: '至少 8 個字元，包含大小寫字母、數字及特殊字元',
  },
};

/** Input with error state */
export const WithError: Story = {
  args: {
    label: '電子郵件',
    value: 'invalid-email',
    error: '請輸入有效的電子郵件格式',
  },
};

/** Disabled input */
export const Disabled: Story = {
  args: {
    label: '使用者名稱',
    value: '無法編輯',
    disabled: true,
  },
};

// ============================================
// Size Stories
// ============================================

/** Small size */
export const Small: Story = {
  args: {
    label: '小型輸入框',
    placeholder: '小型',
    size: 'sm',
  },
};

/** Medium size (default) */
export const Medium: Story = {
  args: {
    label: '中型輸入框',
    placeholder: '中型',
    size: 'md',
  },
};

/** Large size */
export const Large: Story = {
  args: {
    label: '大型輸入框',
    placeholder: '大型',
    size: 'lg',
  },
};

// ============================================
// Edge Cases
// ============================================

/** Very long label and error message */
export const LongText: Story = {
  args: {
    label: '這是一個非常非常非常非常非常長的標籤文字用於測試換行情況',
    error: '這是一個非常非常非常非常非常長的錯誤訊息用於測試換行情況是否正常顯示',
    value: '這是一段非常非常非常非常非常長的輸入內容',
  },
};

/** All sizes showcase */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <TextInput label="Small" placeholder="Small input" size="sm" />
      <TextInput label="Medium" placeholder="Medium input" size="md" />
      <TextInput label="Large" placeholder="Large input" size="lg" />
    </div>
  ),
};

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <TextInput label="Normal" placeholder="Normal state" />
      <TextInput label="With Hint" placeholder="With hint" hint="This is a helpful hint" />
      <TextInput label="With Error" value="Invalid" error="This field has an error" />
      <TextInput label="Disabled" value="Cannot edit" disabled />
    </div>
  ),
};

// ============================================
// Interaction Tests
// ============================================

/** Type interaction test */
export const TypeTest: Story = {
  args: {
    label: '輸入測試',
    placeholder: '請輸入...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    // Clear and type new text
    await userEvent.clear(input);
    await userEvent.type(input, 'Hello World');

    // Verify input value
    await expect(input).toHaveValue('Hello World');
  },
};

/** Focus interaction test */
export const FocusTest: Story = {
  args: {
    label: '焦點測試',
    placeholder: '按 Tab 聚焦',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    // Tab to focus
    await userEvent.tab();

    // Verify focus
    await expect(input).toHaveFocus();
  },
};

/** Error state accessibility test */
export const ErrorAccessibilityTest: Story = {
  args: {
    label: '錯誤存取性測試',
    value: 'invalid',
    error: '這是錯誤訊息',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    // Verify aria-invalid is set
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // Verify error message exists
    const errorMessage = canvas.getByRole('alert');
    await expect(errorMessage).toBeInTheDocument();
  },
};
