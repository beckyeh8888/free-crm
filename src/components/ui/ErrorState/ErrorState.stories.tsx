/**
 * ErrorState Stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { ErrorState } from './ErrorState';
import { Button } from '../Button';

const meta: Meta<typeof ErrorState> = {
  title: 'UI/ErrorState',
  component: ErrorState,
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
  args: {
    onRetry: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

/** Default generic error */
export const Default: Story = {
  args: {},
};

/** Network error */
export const NetworkError: Story = {
  args: {
    type: 'network',
  },
};

/** Not found error */
export const NotFound: Story = {
  args: {
    type: 'notFound',
  },
};

/** Unauthorized error */
export const Unauthorized: Story = {
  args: {
    type: 'unauthorized',
  },
};

/** Server error */
export const ServerError: Story = {
  args: {
    type: 'server',
  },
};

/** With retry button */
export const WithRetry: Story = {
  args: {
    type: 'network',
    onRetry: fn(),
  },
};

/** Custom retry text */
export const CustomRetryText: Story = {
  args: {
    type: 'generic',
    retryText: '重新載入',
    onRetry: fn(),
  },
};

/** Without retry */
export const WithoutRetry: Story = {
  args: {
    type: 'notFound',
    onRetry: undefined,
  },
};

/** Custom title and description */
export const CustomContent: Story = {
  args: {
    title: '連線逾時',
    description: '伺服器回應時間過長，請檢查網路或稍後再試。',
    onRetry: fn(),
  },
};

/** With additional action */
export const WithAction: Story = {
  args: {
    type: 'notFound',
    onRetry: undefined,
    action: (
      <Button variant="secondary" onClick={() => window.history.back()}>
        返回上一頁
      </Button>
    ),
  },
};

/** With retry and action */
export const WithRetryAndAction: Story = {
  args: {
    type: 'server',
    onRetry: fn(),
    action: (
      <Button variant="ghost" onClick={() => alert('支援已開啟')}>
        聯繫支援
      </Button>
    ),
  },
};

/** Custom icon */
export const CustomIcon: Story = {
  args: {
    title: '檔案損壞',
    description: '此檔案無法讀取，可能已損壞或格式不支援。',
    icon: (
      <svg
        className="w-16 h-16 text-orange-400"
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    onRetry: undefined,
  },
};

/** All error types */
export const AllErrorTypes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg">
        <ErrorState type="generic" />
      </div>
      <div className="border rounded-lg">
        <ErrorState type="network" />
      </div>
      <div className="border rounded-lg">
        <ErrorState type="notFound" />
      </div>
      <div className="border rounded-lg">
        <ErrorState type="unauthorized" />
      </div>
      <div className="border rounded-lg">
        <ErrorState type="server" />
      </div>
    </div>
  ),
};
