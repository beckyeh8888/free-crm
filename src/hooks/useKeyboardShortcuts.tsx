/**
 * useKeyboardShortcuts Hook
 *
 * Registers global keyboard shortcuts for the application.
 * Handles Cmd+K (Mac) / Ctrl+K (Windows) to toggle command palette.
 */

'use client';

import React, { useEffect } from 'react';
import { usePlatform } from './usePlatform';
import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteContext';

/**
 * Hook that registers global keyboard shortcuts
 *
 * Currently supports:
 * - Cmd+K (Mac) / Ctrl+K (Windows): Toggle command palette
 *
 * @example
 * ```tsx
 * // In a provider component
 * export function KeyboardShortcutsProvider({ children }) {
 *   useKeyboardShortcuts();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useKeyboardShortcuts(): void {
  const { isModKeyPressed } = usePlatform();
  const { toggle } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as Element;
      const isInputField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.getAttribute('contenteditable') === 'true';

      // For Cmd/Ctrl+K, we want to capture even in input fields
      // to allow users to quickly open command palette
      if (isModKeyPressed(e) && e.key === 'k') {
        e.preventDefault();
        toggle();
        return;
      }

      // Other shortcuts should be ignored in input fields
      if (isInputField) {
        return;
      }

      // Add more shortcuts here as needed
      // Example: Escape to close modals (handled by modal itself)
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isModKeyPressed, toggle]);
}

/**
 * Provider component that enables keyboard shortcuts in the app
 */
interface KeyboardShortcutsProviderProps {
  readonly children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
