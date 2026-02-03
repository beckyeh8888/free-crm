/**
 * useRecentItems Hook
 *
 * Manages recently visited items in localStorage for quick access.
 * Used by the command palette to show recent customers, deals, etc.
 */

'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'free-crm-recent-items';
const MAX_ITEMS = 10;

type RecentItemType = 'customer' | 'deal' | 'contact' | 'document';

interface RecentItem {
  readonly type: RecentItemType;
  readonly id: string;
  readonly name: string;
  readonly visitedAt: number;
}

/**
 * Load recent items from localStorage
 * Safe for SSR - returns empty array on server
 */
function loadRecentItems(): RecentItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as RecentItem[];
    // Validate and sort by most recent
    return parsed
      .filter(
        (item): item is RecentItem =>
          typeof item.type === 'string' &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.visitedAt === 'number'
      )
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

interface UseRecentItemsReturn {
  /** List of recently visited items, sorted by most recent first */
  readonly items: ReadonlyArray<RecentItem>;
  /** Add an item to recent history (or update if exists) */
  readonly addItem: (item: { type: RecentItemType; id: string; name: string }) => void;
  /** Remove a specific item from history */
  readonly removeItem: (type: RecentItemType, id: string) => void;
  /** Clear all recent items */
  readonly clearAll: () => void;
}

/**
 * Hook to manage recently visited items
 *
 * @example
 * ```tsx
 * const { items, addItem, clearAll } = useRecentItems();
 *
 * // Add item when user visits a customer
 * addItem({ type: 'customer', id: customer.id, name: customer.name });
 *
 * // Display recent items
 * items.map(item => <RecentItemRow key={`${item.type}-${item.id}`} item={item} />)
 * ```
 */
export function useRecentItems(): UseRecentItemsReturn {
  // Use lazy initializer to load from localStorage (safe for SSR)
  const [items, setItems] = useState<RecentItem[]>(loadRecentItems);

  // Save to localStorage whenever items change
  const saveItems = useCallback((newItems: RecentItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // localStorage might be full or disabled
      console.warn('Failed to save recent items to localStorage');
    }
  }, []);

  const addItem = useCallback(
    (item: { type: RecentItemType; id: string; name: string }) => {
      setItems((currentItems) => {
        // Remove existing item with same type+id
        const filtered = currentItems.filter(
          (existing) => !(existing.type === item.type && existing.id === item.id)
        );

        // Add new item at the beginning
        const newItem: RecentItem = {
          ...item,
          visitedAt: Date.now(),
        };

        const newItems = [newItem, ...filtered].slice(0, MAX_ITEMS);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        } catch {
          console.warn('Failed to save recent items to localStorage');
        }

        return newItems;
      });
    },
    []
  );

  const removeItem = useCallback(
    (type: RecentItemType, id: string) => {
      setItems((currentItems) => {
        const newItems = currentItems.filter(
          (item) => !(item.type === type && item.id === id)
        );
        saveItems(newItems);
        return newItems;
      });
    },
    [saveItems]
  );

  const clearAll = useCallback(() => {
    saveItems([]);
  }, [saveItems]);

  return {
    items,
    addItem,
    removeItem,
    clearAll,
  };
}

export type { RecentItem, RecentItemType };
