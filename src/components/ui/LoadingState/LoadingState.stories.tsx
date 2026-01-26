/**
 * LoadingState Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState, Skeleton } from './LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'UI/LoadingState',
  component: LoadingState,
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
type Story = StoryObj<typeof LoadingState>;

/** Default spinner loading */
export const Default: Story = {
  args: {},
};

/** Spinner variant */
export const Spinner: Story = {
  args: {
    variant: 'spinner',
    message: '正在載入資料...',
  },
};

/** Dots variant */
export const Dots: Story = {
  args: {
    variant: 'dots',
    message: '處理中...',
  },
};

/** Skeleton variant */
export const SkeletonVariant: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 4,
  },
};

/** Small size */
export const Small: Story = {
  args: {
    size: 'sm',
    message: '載入中',
  },
};

/** Large size */
export const Large: Story = {
  args: {
    size: 'lg',
    message: '正在載入大量資料...',
  },
};

/** Custom message */
export const CustomMessage: Story = {
  args: {
    message: '正在連接伺服器，請稍候...',
  },
};

/** Without message */
export const WithoutMessage: Story = {
  args: {
    message: '',
  },
};

/** Full page loading (shown in viewport) */
export const FullPage: Story = {
  args: {
    fullPage: true,
    message: '頁面載入中...',
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

/** All variants comparison */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-12">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4 text-gray-500">Spinner</h3>
        <LoadingState variant="spinner" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4 text-gray-500">Dots</h3>
        <LoadingState variant="dots" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4 text-gray-500">Skeleton</h3>
        <LoadingState variant="skeleton" skeletonLines={3} />
      </div>
    </div>
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <LoadingState size="sm" message="" />
        <p className="text-xs text-gray-500 mt-2">Small</p>
      </div>
      <div className="text-center">
        <LoadingState size="md" message="" />
        <p className="text-xs text-gray-500 mt-2">Medium</p>
      </div>
      <div className="text-center">
        <LoadingState size="lg" message="" />
        <p className="text-xs text-gray-500 mt-2">Large</p>
      </div>
    </div>
  ),
};

/** Custom skeleton layout */
export const CustomSkeleton: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <Skeleton className="rounded-full" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={200} className="rounded-lg" />
      <div className="space-y-2">
        <Skeleton height={12} />
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
      </div>
    </div>
  ),
};

/** Card skeleton */
export const CardSkeleton: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden">
      <Skeleton height={160} />
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="70%" />
        <Skeleton height={14} />
        <Skeleton height={14} width="90%" />
        <div className="flex gap-2 pt-2">
          <Skeleton height={32} width={80} className="rounded-md" />
          <Skeleton height={32} width={80} className="rounded-md" />
        </div>
      </div>
    </div>
  ),
};

/** Table skeleton */
export const TableSkeleton: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b">
        <Skeleton height={16} width="25%" />
        <Skeleton height={16} width="25%" />
        <Skeleton height={16} width="25%" />
        <Skeleton height={16} width="25%" />
      </div>
      {/* Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b last:border-b-0">
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="25%" />
        </div>
      ))}
    </div>
  ),
};
