/**
 * SessionProvider Component Tests
 * Unit tests for NextAuth session provider
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SessionProvider from '@/components/providers/SessionProvider';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}));

describe('SessionProvider', () => {
  it('renders children', () => {
    render(
      <SessionProvider>
        <div data-testid="child">Child content</div>
      </SessionProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('wraps children with NextAuth SessionProvider', () => {
    render(
      <SessionProvider>
        <div>Test content</div>
      </SessionProvider>
    );

    expect(screen.getByTestId('mock-session-provider')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <SessionProvider>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </SessionProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});
