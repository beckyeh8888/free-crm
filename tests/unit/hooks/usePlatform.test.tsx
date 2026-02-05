/**
 * usePlatform Hook Tests
 * Unit tests for platform detection
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { usePlatform } from '@/hooks/usePlatform';

describe('usePlatform Hook', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('Platform Detection', () => {
    it('detects Mac platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      expect(result.current.isMac).toBe(true);
      expect(result.current.modKey).toBe('⌘');
      expect(result.current.modKeyLabel).toBe('Cmd');
    });

    it('detects iPhone platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      expect(result.current.isMac).toBe(true);
    });

    it('detects iPad platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      expect(result.current.isMac).toBe(true);
    });

    it('detects Windows platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      expect(result.current.isMac).toBe(false);
      expect(result.current.modKey).toBe('Ctrl');
      expect(result.current.modKeyLabel).toBe('Ctrl');
    });

    it('detects Linux platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      expect(result.current.isMac).toBe(false);
      expect(result.current.modKey).toBe('Ctrl');
    });
  });

  describe('isModKeyPressed', () => {
    it('checks metaKey on Mac', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      const eventWithMeta = { metaKey: true, ctrlKey: false } as KeyboardEvent;
      const eventWithCtrl = { metaKey: false, ctrlKey: true } as KeyboardEvent;

      expect(result.current.isModKeyPressed(eventWithMeta)).toBe(true);
      expect(result.current.isModKeyPressed(eventWithCtrl)).toBe(false);
    });

    it('checks ctrlKey on Windows', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      const eventWithMeta = { metaKey: true, ctrlKey: false } as KeyboardEvent;
      const eventWithCtrl = { metaKey: false, ctrlKey: true } as KeyboardEvent;

      expect(result.current.isModKeyPressed(eventWithMeta)).toBe(false);
      expect(result.current.isModKeyPressed(eventWithCtrl)).toBe(true);
    });

    it('returns false when no modifier pressed', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
        writable: true,
      });

      const { result } = renderHook(() => usePlatform());

      const eventNoMod = { metaKey: false, ctrlKey: false } as KeyboardEvent;

      expect(result.current.isModKeyPressed(eventNoMod)).toBe(false);
    });
  });

  describe('SSR Safety', () => {
    it('defaults to non-Mac when navigator is undefined', () => {
      // This is tricky to test in jsdom, but the hook should handle it
      // The getServerSnapshot function returns false
      const { result } = renderHook(() => usePlatform());

      // In jsdom, navigator exists, so we can't fully test SSR
      // But we verify the hook doesn't crash
      expect(result.current).toBeDefined();
      expect(typeof result.current.isMac).toBe('boolean');
    });
  });

  describe('Memoization', () => {
    it('returns stable isModKeyPressed function', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh)' },
        writable: true,
      });

      const { result, rerender } = renderHook(() => usePlatform());

      const firstFn = result.current.isModKeyPressed;
      rerender();
      const secondFn = result.current.isModKeyPressed;

      expect(firstFn).toBe(secondFn);
    });

    it('returns stable object reference', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows)' },
        writable: true,
      });

      const { result, rerender } = renderHook(() => usePlatform());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // The object should be memoized
      expect(firstResult).toBe(secondResult);
    });
  });
});
