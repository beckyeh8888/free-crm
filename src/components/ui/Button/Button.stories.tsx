/**
 * Button Stories
 *
 * Demonstrates all button variants, sizes, and states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Button visual style',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    onClick: {
      action: 'clicked',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ============================================
// Basic Stories
// ============================================

/** Default primary button */
export const Default: Story = {
  args: {
    children: '按鈕',
    variant: 'primary',
    size: 'md',
  },
};

/** Disabled state */
export const Disabled: Story = {
  args: {
    children: '禁用按鈕',
    disabled: true,
  },
};

/** Loading state with spinner */
export const Loading: Story = {
  args: {
    children: '載入中...',
    loading: true,
  },
};

// ============================================
// Variant Stories
// ============================================

/** Primary variant (default) */
export const Primary: Story = {
  args: {
    children: '主要按鈕',
    variant: 'primary',
  },
};

/** Secondary variant */
export const Secondary: Story = {
  args: {
    children: '次要按鈕',
    variant: 'secondary',
  },
};

/** Danger variant for destructive actions */
export const Danger: Story = {
  args: {
    children: '危險操作',
    variant: 'danger',
  },
};

/** Ghost variant for subtle actions */
export const Ghost: Story = {
  args: {
    children: '幽靈按鈕',
    variant: 'ghost',
  },
};

// ============================================
// Size Stories
// ============================================

/** Small size */
export const Small: Story = {
  args: {
    children: '小型按鈕',
    size: 'sm',
  },
};

/** Medium size (default) */
export const Medium: Story = {
  args: {
    children: '中型按鈕',
    size: 'md',
  },
};

/** Large size */
export const Large: Story = {
  args: {
    children: '大型按鈕',
    size: 'lg',
  },
};

// ============================================
// Edge Cases
// ============================================

/** Very long text content */
export const LongText: Story = {
  args: {
    children: '這是一個非常非常非常非常非常長的按鈕文字內容用於測試溢出情況',
  },
};

/** All variants showcase */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

/** All sizes showcase */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// ============================================
// Interaction Tests
// ============================================

/** Click interaction test */
export const ClickTest: Story = {
  args: {
    children: '點擊測試',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Click the button
    await userEvent.click(button);

    // Verify onClick was called
    await expect(args.onClick).toHaveBeenCalled();
  },
};

/** Focus interaction test */
export const FocusTest: Story = {
  args: {
    children: '焦點測試',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Tab to focus the button
    await userEvent.tab();

    // Verify button is focused
    await expect(button).toHaveFocus();
  },
};

/** Disabled button should not respond to clicks */
export const DisabledClickTest: Story = {
  args: {
    children: '禁用測試',
    disabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Try to click disabled button
    await userEvent.click(button);

    // onClick should not be called
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
