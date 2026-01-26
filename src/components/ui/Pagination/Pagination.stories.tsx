/**
 * Pagination Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onPageChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/** Default pagination */
export const Default: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
  },
};

/** First page */
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
  },
};

/** Last page */
export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
  },
};

/** Many pages (100+) */
export const ManyPages: Story = {
  args: {
    currentPage: 50,
    totalPages: 100,
  },
};

/** Few pages */
export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
  },
};

/** Single page (hidden) */
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
  },
};

/** Small size */
export const Small: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    size: 'sm',
  },
};

/** Large size */
export const Large: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    size: 'lg',
  },
};

/** Disabled */
export const Disabled: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    disabled: true,
  },
};

/** Without first/last buttons */
export const WithoutFirstLast: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    showFirstLast: false,
  },
};

/** Without prev/next buttons */
export const WithoutPrevNext: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    showPrevNext: false,
  },
};

/** Minimal (page numbers only) */
export const Minimal: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    showFirstLast: false,
    showPrevNext: false,
  },
};

/** More visible pages */
export const MoreVisiblePages: Story = {
  args: {
    currentPage: 25,
    totalPages: 50,
    visiblePages: 7,
  },
};

/** Interactive demo */
export const Interactive: Story = {
  render: function InteractivePagination() {
    const [page, setPage] = useState(1);
    return (
      <div className="space-y-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          目前頁碼: {page} / 20
        </div>
        <Pagination
          currentPage={page}
          totalPages={20}
          onPageChange={setPage}
        />
      </div>
    );
  },
};

/** Click test */
export const ClickTest: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click next page button
    const nextButton = canvas.getByLabelText('前往下一頁');
    await userEvent.click(nextButton);
    await expect(args.onPageChange).toHaveBeenCalledWith(6);

    // Click previous page button
    const prevButton = canvas.getByLabelText('前往上一頁');
    await userEvent.click(prevButton);
    await expect(args.onPageChange).toHaveBeenCalledWith(4);

    // Click a specific page
    const page7 = canvas.getByLabelText('前往第 7 頁');
    await userEvent.click(page7);
    await expect(args.onPageChange).toHaveBeenCalledWith(7);
  },
};

/** Keyboard navigation test */
export const KeyboardNavigation: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Focus first button and navigate
    const firstButton = canvas.getByLabelText('前往第一頁');
    await firstButton.focus();
    await expect(firstButton).toHaveFocus();

    // Tab to next button
    await userEvent.tab();
    const prevButton = canvas.getByLabelText('前往上一頁');
    await expect(prevButton).toHaveFocus();

    // Press Enter
    await userEvent.keyboard('{Enter}');
    await expect(args.onPageChange).toHaveBeenCalledWith(4);
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gray-500 mb-2">Small</p>
        <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} size="sm" />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Medium (Default)</p>
        <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} size="md" />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Large</p>
        <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} size="lg" />
      </div>
    </div>
  ),
};
