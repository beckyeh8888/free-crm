/**
 * SidebarContext Tests
 * Tests for sidebar collapse state management
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { SidebarProvider, useSidebar } from '@/components/layout/Sidebar/SidebarContext';

// Test helper component
function TestConsumer() {
  const { isCollapsed, toggle, expand, collapse } = useSidebar();
  return (
    <div>
      <span data-testid="collapsed">{String(isCollapsed)}</span>
      <button type="button" data-testid="toggle" onClick={toggle}>Toggle</button>
      <button type="button" data-testid="expand" onClick={expand}>Expand</button>
      <button type="button" data-testid="collapse" onClick={collapse}>Collapse</button>
    </div>
  );
}

describe('SidebarContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('SidebarProvider', () => {
    it('provides default state (not collapsed)', () => {
      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('false');
    });

    it('reads initial state from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true');

      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('true');
    });

    it('toggles collapsed state', () => {
      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('false');

      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('true');
    });

    it('expands sidebar', () => {
      localStorage.setItem('sidebar-collapsed', 'true');

      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('true');

      act(() => {
        fireEvent.click(screen.getByTestId('expand'));
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('false');
    });

    it('collapses sidebar', () => {
      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('false');

      act(() => {
        fireEvent.click(screen.getByTestId('collapse'));
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('true');
    });

    it('persists state to localStorage on toggle', () => {
      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('toggle'));
      });

      expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
    });
  });

  describe('useSidebar', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useSidebar must be used within a SidebarProvider'
      );

      spy.mockRestore();
    });
  });
});
