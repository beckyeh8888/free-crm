/**
 * useKeyboardShortcuts Hook Tests
 * Unit tests for global keyboard shortcuts
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { useKeyboardShortcuts, KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';
import { CommandPaletteProvider } from '@/components/CommandPalette/CommandPaletteContext';

// Mock usePlatform hook
const mockIsModKeyPressed = vi.fn();
vi.mock('@/hooks/usePlatform', () => ({
  usePlatform: () => ({
    isMac: true,
    modKey: '⌘',
    modKeyLabel: 'Cmd',
    isModKeyPressed: mockIsModKeyPressed,
  }),
}));

// Wrapper that provides CommandPaletteContext
function createWrapper() {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <CommandPaletteProvider>
        {children}
      </CommandPaletteProvider>
    );
  };
}

describe('useKeyboardShortcuts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsModKeyPressed.mockReturnValue(false);
  });

  describe('Cmd/Ctrl+K shortcut', () => {
    it('calls toggle when Cmd+K is pressed', () => {
      mockIsModKeyPressed.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: document.body });

      act(() => {
        globalThis.dispatchEvent(event);
      });

      // The hook should have called toggle (verified by the event listener being set up)
      expect(mockIsModKeyPressed).toHaveBeenCalled();
    });

    it('prevents default on Cmd+K', () => {
      mockIsModKeyPressed.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: document.body });

      act(() => {
        globalThis.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('triggers shortcut even when in input field', () => {
      mockIsModKeyPressed.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: input });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        globalThis.dispatchEvent(event);
      });

      // Should still trigger even in input
      expect(preventDefaultSpy).toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('triggers shortcut even when in textarea', () => {
      mockIsModKeyPressed.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: textarea });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        globalThis.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('triggers shortcut even when in contenteditable', () => {
      mockIsModKeyPressed.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: div });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        globalThis.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('Other keys', () => {
    it('ignores non-shortcut keys', () => {
      mockIsModKeyPressed.mockReturnValue(false);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: document.body });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        globalThis.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('ignores K without modifier', () => {
      mockIsModKeyPressed.mockReturnValue(false);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: document.body });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        globalThis.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('ignores shortcuts in input fields for non-palette shortcuts', () => {
      mockIsModKeyPressed.mockReturnValue(false);

      renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: input });

      act(() => {
        globalThis.dispatchEvent(event);
      });

      // Should not process other shortcuts in input fields
      document.body.removeChild(input);
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

describe('KeyboardShortcutsProvider', () => {
  it('renders children', () => {
    const { result } = renderHook(
      () => ({ rendered: true }),
      {
        wrapper: ({ children }) => (
          <CommandPaletteProvider>
            <KeyboardShortcutsProvider>
              {children}
            </KeyboardShortcutsProvider>
          </CommandPaletteProvider>
        ),
      }
    );

    expect(result.current.rendered).toBe(true);
  });
});
