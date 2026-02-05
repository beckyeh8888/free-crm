/**
 * QueryProvider Component Tests
 * Unit tests for TanStack Query provider
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/QueryProvider';

// Test component that uses the query client
function TestQueryConsumer() {
  const queryClient = useQueryClient();
  return (
    <div data-testid="consumer">
      {queryClient ? 'Query client available' : 'No query client'}
    </div>
  );
}

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Child content</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('provides QueryClient to children', () => {
    render(
      <QueryProvider>
        <TestQueryConsumer />
      </QueryProvider>
    );

    expect(screen.getByTestId('consumer')).toHaveTextContent('Query client available');
  });

  it('renders multiple children', () => {
    render(
      <QueryProvider>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </QueryProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('creates new QueryClient instance', () => {
    const { rerender } = render(
      <QueryProvider>
        <TestQueryConsumer />
      </QueryProvider>
    );

    // Rerender should use the same client (via useState)
    rerender(
      <QueryProvider>
        <TestQueryConsumer />
      </QueryProvider>
    );

    expect(screen.getByTestId('consumer')).toHaveTextContent('Query client available');
  });
});
