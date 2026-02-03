/**
 * usePlatform Hook
 *
 * Detects user's operating system for cross-platform keyboard shortcuts.
 * Mac: ⌘ (Cmd), Windows/Linux: Ctrl
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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
// Detect Mac platform (runs once on module load, client-side only)
function detectIsMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function usePlatform(): PlatformInfo {
  // Initialize with detection function - safe for SSR as it returns false on server
  const [isMac, setIsMac] = useState(detectIsMac);

  // Re-check on mount in case hydration mismatch
  useEffect(() => {
    const detected = detectIsMac();
    if (detected === isMac) {
      return;
    }
    setIsMac(detected);
  }, [isMac]);

  const isModKeyPressed = useCallback(
    (e: KeyboardEvent): boolean => {
      return isMac ? e.metaKey : e.ctrlKey;
    },
    [isMac]
  );

  return {
    isMac,
    modKey: isMac ? '⌘' : 'Ctrl',
    modKeyLabel: isMac ? 'Cmd' : 'Ctrl',
    isModKeyPressed,
  };
}

export type { PlatformInfo };
