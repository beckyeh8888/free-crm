/**
 * EmptyState Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<EmptyState />);

    expect(screen.getByText('暫無資料')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="沒有客戶" />);

    expect(screen.getByText('沒有客戶')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState description="請新增第一筆資料" />);

    expect(screen.getByText('請新增第一筆資料')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(<EmptyState icon={<span data-testid="custom-icon">Icon</span>} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default SVG icon when no icon provided', () => {
    const { container } = render(<EmptyState />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState action={<button type="button">新增</button>} />
    );

    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument();
  });

  it('does not render action container when not provided', () => {
    const { container } = render(<EmptyState />);

    // No action wrapper
    const actionDiv = container.querySelector('.mt-2');
    expect(actionDiv).not.toBeInTheDocument();
  });

  it('has aria-label matching title', () => {
    render(<EmptyState title="測試標題" />);

    expect(screen.getByLabelText('測試標題')).toBeInTheDocument();
  });

  it('renders output element', () => {
    const { container } = render(<EmptyState />);

    expect(container.querySelector('output')).toBeInTheDocument();
  });
});
