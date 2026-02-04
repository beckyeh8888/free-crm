/**
 * EmptyState Stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyState } from './EmptyState';
import { Button } from '../Button';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/** Default empty state */
export const Default: Story = {
  args: {},
};

/** With description */
export const WithDescription: Story = {
  args: {
    title: '尚無客戶資料',
    description: '開始新增您的第一位客戶，建立客戶關係管理。',
  },
};

/** With action button */
export const WithAction: Story = {
  args: {
    title: '尚無客戶資料',
    description: '開始新增您的第一位客戶。',
    action: <Button>新增客戶</Button>,
  },
};

/** Custom icon */
export const CustomIcon: Story = {
  args: {
    title: '搜尋無結果',
    description: '嘗試使用不同的關鍵字搜尋。',
    icon: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
};

/** No documents */
export const NoDocuments: Story = {
  args: {
    title: '尚無文件',
    description: '上傳文件以開始 AI 分析。',
    icon: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    action: <Button>上傳文件</Button>,
  },
};

/** All variations */
export const AllVariations: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg">
        <EmptyState />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          title="尚無客戶資料"
          description="開始新增您的第一位客戶。"
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          title="尚無商機"
          description="建立商機追蹤銷售進度。"
          action={<Button size="sm">新增商機</Button>}
        />
      </div>
    </div>
  ),
};
