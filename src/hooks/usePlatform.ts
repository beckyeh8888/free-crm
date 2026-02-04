/**
 * usePlatform Hook
 *
 * Detects user's operating system for cross-platform keyboard shortcuts.
 * Mac: ⌘ (Cmd), Windows/Linux: Ctrl
 */

'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

interface PlatformInfo {
  /** Whether the user is on macOS/iOS */
  readonly isMac: boolean;
  /** Display symbol for modifier key (⌘ or Ctrl) */
  readonly modKey: string;
  /** Full label for modifier key (Cmd or Ctrl) */
  readonly modKeyLabel: string;
  /** Check if modifier key is pressed in a keyboard event */
  readonly isModKeyPressed: (e: KeyboardEvent) => boolean;
}

// Detect Mac platform
function detectIsMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

// For useSyncExternalStore - platform doesn't change so we use a no-op subscribe
function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  return detectIsMac();
}

function getServerSnapshot(): boolean {
  return false; // Default to non-Mac for SSR
}

/**
 * Hook to detect platform and provide cross-platform keyboard utilities
 *
 * @example
 * ```tsx
 * const { isMac, modKey, isModKeyPressed } = usePlatform();
 *
 * // Display: "⌘K" on Mac, "Ctrl+K" on Windows
 * <span>{modKey}K</span>
 *
 * // Handle keyboard events
 * if (isModKeyPressed(event) && event.key === 'k') {
 *   openCommandPalette();
 * }
 * ```
 */
export function usePlatform(): PlatformInfo {
  // Use useSyncExternalStore to safely read browser APIs
  const isMac = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isModKeyPressed = useCallback(
    (e: KeyboardEvent): boolean => {
      return isMac ? e.metaKey : e.ctrlKey;
    },
    [isMac]
  );

  return useMemo(
    () => ({
      isMac,
      modKey: isMac ? '⌘' : 'Ctrl',
      modKeyLabel: isMac ? 'Cmd' : 'Ctrl',
      isModKeyPressed,
    }),
    [isMac, isModKeyPressed]
  );
}

export type { PlatformInfo };
