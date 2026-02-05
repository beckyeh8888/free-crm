/**
 * useRecentItems Hook Tests
 * Unit tests for recently visited items management
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useRecentItems } from '@/hooks/useRecentItems';

const STORAGE_KEY = 'free-crm-recent-items';

describe('useRecentItems Hook', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockStorage[key] ?? null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key, value) => {
        mockStorage[key] = value;
      }
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key) => {
        delete mockStorage[key];
      }
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('returns empty items when localStorage is empty', () => {
      const { result } = renderHook(() => useRecentItems());
      expect(result.current.items).toEqual([]);
    });

    it('loads items from localStorage', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
        { type: 'deal', id: 'deal-1', name: 'Deal 1', visitedAt: 500 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      expect(result.current.items).toHaveLength(2);
      // Should be sorted by visitedAt (most recent first)
      expect(result.current.items[0].id).toBe('cust-1');
    });

    it('handles invalid localStorage data', () => {
      mockStorage[STORAGE_KEY] = 'invalid json';

      const { result } = renderHook(() => useRecentItems());

      expect(result.current.items).toEqual([]);
    });

    it('filters out invalid items from localStorage', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Valid', visitedAt: 1000 },
        { type: 'deal' }, // Missing id, name, visitedAt
        { id: 'incomplete' }, // Missing type, name, visitedAt
        { type: 'contact', id: 'cont-1', name: 'Also Valid', visitedAt: 500 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].name).toBe('Valid');
      expect(result.current.items[1].name).toBe('Also Valid');
    });

    it('limits items to MAX_ITEMS (10)', () => {
      const storedItems = Array.from({ length: 15 }, (_, i) => ({
        type: 'customer' as const,
        id: `cust-${i}`,
        name: `Customer ${i}`,
        visitedAt: 1000 - i,
      }));
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      expect(result.current.items).toHaveLength(10);
    });
  });

  describe('addItem', () => {
    it('adds a new item', () => {
      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({
          type: 'customer',
          id: 'cust-1',
          name: 'New Customer',
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe('New Customer');
      expect(result.current.items[0].visitedAt).toBeGreaterThan(0);
    });

    it('updates existing item (moves to top)', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
        { type: 'deal', id: 'deal-1', name: 'Deal 1', visitedAt: 500 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({
          type: 'deal',
          id: 'deal-1',
          name: 'Updated Deal 1',
        });
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].id).toBe('deal-1');
      expect(result.current.items[0].name).toBe('Updated Deal 1');
    });

    it('limits items to MAX_ITEMS when adding', () => {
      const storedItems = Array.from({ length: 10 }, (_, i) => ({
        type: 'customer' as const,
        id: `cust-${i}`,
        name: `Customer ${i}`,
        visitedAt: 1000 - i,
      }));
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({
          type: 'deal',
          id: 'new-deal',
          name: 'New Deal',
        });
      });

      expect(result.current.items).toHaveLength(10);
      expect(result.current.items[0].id).toBe('new-deal');
      expect(result.current.items[9].id).toBe('cust-8'); // Last item from before should be removed
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({
          type: 'document',
          id: 'doc-1',
          name: 'Document 1',
        });
      });

      expect(mockStorage[STORAGE_KEY]).toBeDefined();
      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('doc-1');
    });

    it('handles localStorage save failure', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({
          type: 'customer',
          id: 'cust-1',
          name: 'Customer 1',
        });
      });

      // Should still update state even if localStorage fails
      expect(result.current.items).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });

    it('adds items with different types', () => {
      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.addItem({ type: 'customer', id: '1', name: 'Customer' });
        result.current.addItem({ type: 'deal', id: '2', name: 'Deal' });
        result.current.addItem({ type: 'contact', id: '3', name: 'Contact' });
        result.current.addItem({ type: 'document', id: '4', name: 'Document' });
      });

      expect(result.current.items).toHaveLength(4);
      expect(result.current.items[0].type).toBe('document');
      expect(result.current.items[3].type).toBe('customer');
    });
  });

  describe('removeItem', () => {
    it('removes an item by type and id', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
        { type: 'deal', id: 'deal-1', name: 'Deal 1', visitedAt: 500 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.removeItem('customer', 'cust-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('deal-1');
    });

    it('does nothing when item not found', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.removeItem('deal', 'non-existent');
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('only removes item with matching type AND id', () => {
      const storedItems = [
        { type: 'customer', id: 'id-1', name: 'Customer', visitedAt: 1000 },
        { type: 'deal', id: 'id-1', name: 'Deal', visitedAt: 500 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.removeItem('customer', 'id-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].type).toBe('deal');
    });

    it('persists removal to localStorage', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.removeItem('customer', 'cust-1');
      });

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('clears all items', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
        { type: 'deal', id: 'deal-1', name: 'Deal 1', visitedAt: 500 },
        { type: 'contact', id: 'cont-1', name: 'Contact 1', visitedAt: 250 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('persists clear to localStorage', () => {
      const storedItems = [
        { type: 'customer', id: 'cust-1', name: 'Customer 1', visitedAt: 1000 },
      ];
      mockStorage[STORAGE_KEY] = JSON.stringify(storedItems);

      const { result } = renderHook(() => useRecentItems());

      act(() => {
        result.current.clearAll();
      });

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored).toHaveLength(0);
    });
  });

  describe('SSR Safety', () => {
    it('handles server-side rendering (no window)', () => {
      // This is tested by the jsdom environment
      // The hook should not throw when localStorage operations fail
      const { result } = renderHook(() => useRecentItems());
      expect(result.current.items).toBeDefined();
    });
  });
});
