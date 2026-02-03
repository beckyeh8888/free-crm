/**
 * CommandPalette Context
 *
 * Provides global state management for the command palette.
 * Allows any component to open/close the command palette.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface CommandPaletteContextValue {
  /** Whether the command palette is currently open */
  readonly isOpen: boolean;
  /** Open the command palette */
  readonly open: () => void;
  /** Close the command palette */
  readonly close: () => void;
  /** Toggle the command palette open/closed */
  readonly toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

interface CommandPaletteProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Provider component for command palette state
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <CommandPaletteProvider>
 *   <App />
 * </CommandPaletteProvider>
 * ```
 */
export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

/**
 * Hook to access command palette state and controls
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useCommandPalette();
 *
 * // Open on button click
 * <button onClick={open}>Open Command Palette</button>
 *
 * // Toggle with keyboard shortcut
 * if (isModKeyPressed(e) && e.key === 'k') {
 *   toggle();
 * }
 * ```
 */
export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }

  return context;
}
