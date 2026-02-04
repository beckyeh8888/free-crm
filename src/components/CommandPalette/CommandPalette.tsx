/**
 * CommandPalette Component
 *
 * A global command palette for quick navigation and actions.
 * Triggered by Cmd+K (Mac) / Ctrl+K (Windows) or clicking the search button.
 *
 * Features:
 * - Global search across customers, deals, contacts, documents
 * - Quick actions (create, navigate)
 * - Recent items
 * - Keyboard navigation (↑↓ Enter Escape)
 *
 * WCAG 2.2 AAA Compliant
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  DollarSign,
  UserCircle,
  FileText,
  Clock,
  Command,
  ArrowRight,
} from 'lucide-react';

import { useCommandPalette } from './CommandPaletteContext';
import { usePlatform } from '@/hooks/usePlatform';
import { useRecentItems, type RecentItemType } from '@/hooks/useRecentItems';
import { commands, filterCommands } from '@/lib/commands';

// Type icons mapping
const typeIcons: Record<RecentItemType, React.ElementType> = {
  customer: Users,
  deal: DollarSign,
  contact: UserCircle,
  document: FileText,
};

// Search result types
interface SearchResults {
  readonly customers: ReadonlyArray<{ id: string; name: string; company: string | null; type: string }>;
  readonly deals: ReadonlyArray<{ id: string; title: string; value: number; stage: string }>;
  readonly contacts: ReadonlyArray<{ id: string; name: string; email: string | null; customerName: string | null }>;
  readonly documents: ReadonlyArray<{ id: string; name: string; type: string }>;
}

// Unified result item for keyboard navigation
interface ResultItem {
  readonly id: string;
  readonly type: 'customer' | 'deal' | 'contact' | 'document' | 'command' | 'recent';
  readonly label: string;
  readonly description?: string;
  readonly path: string;
  readonly icon: React.ElementType;
}

/**
 * Main CommandPalette component
 */
export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { modKey } = usePlatform();
  const { items: recentItems, addItem } = useRecentItems();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if showing commands mode (query starts with ">")
  const isCommandMode = query.startsWith('>');
  const commandQuery = isCommandMode ? query.slice(1).trim() : '';

  // Get filtered commands when in command mode
  const filteredCommands = useMemo(() => {
    if (!isCommandMode) return [];
    return commandQuery ? filterCommands(commandQuery) : commands;
  }, [isCommandMode, commandQuery]);

  // Build flat list of all navigable items for keyboard navigation
  const allItems = useMemo((): ResultItem[] => {
    const items: ResultItem[] = [];

    if (isCommandMode) {
      // Command mode: show commands
      filteredCommands.forEach((cmd) => {
        items.push({
          id: cmd.id,
          type: 'command',
          label: cmd.label,
          description: cmd.description,
          path: cmd.action.path || '',
          icon: cmd.icon,
        });
      });
    } else if (query && searchResults) {
      // Search mode: show search results
      searchResults.customers.forEach((c) => {
        items.push({
          id: c.id,
          type: 'customer',
          label: c.name,
          description: c.company || undefined,
          path: `/customers/${c.id}`,
          icon: Users,
        });
      });
      searchResults.deals.forEach((d) => {
        items.push({
          id: d.id,
          type: 'deal',
          label: d.title,
          description: `$${d.value.toLocaleString()} • ${d.stage}`,
          path: `/deals/${d.id}`,
          icon: DollarSign,
        });
      });
      searchResults.contacts.forEach((c) => {
        items.push({
          id: c.id,
          type: 'contact',
          label: c.name,
          description: c.customerName || c.email || undefined,
          path: `/contacts/${c.id}`,
          icon: UserCircle,
        });
      });
      searchResults.documents.forEach((d) => {
        items.push({
          id: d.id,
          type: 'document',
          label: d.name,
          description: d.type,
          path: `/documents/${d.id}`,
          icon: FileText,
        });
      });
    } else {
      // No query: show recent items
      recentItems.forEach((item) => {
        const pathMap: Record<RecentItemType, string> = {
          customer: `/customers/${item.id}`,
          deal: `/deals/${item.id}`,
          contact: `/contacts/${item.id}`,
          document: `/documents/${item.id}`,
        };
        items.push({
          id: `recent-${item.type}-${item.id}`,
          type: 'recent',
          label: item.name,
          description: item.type,
          path: pathMap[item.type],
          icon: typeIcons[item.type],
        });
      });
    }

    return items;
  }, [isCommandMode, filteredCommands, query, searchResults, recentItems]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults(null);
      setSelectedIndex(0);
      // Small delay to ensure portal is mounted
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  // Search API call with debounce
  useEffect(() => {
    if (!query || isCommandMode) {
      setSearchResults(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 200); // 200ms debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, isCommandMode]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: ResultItem) => {
      // Add to recent items if it's a resource (not a command)
      if (item.type !== 'command' && item.type !== 'recent') {
        addItem({
          type: item.type as RecentItemType,
          id: item.id,
          name: item.label,
        });
      }

      // Navigate and close
      router.push(item.path);
      close();
    },
    [addItem, router, close]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (allItems[selectedIndex]) {
            handleSelect(allItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [allItems, selectedIndex, handleSelect, close]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Don't render anything if closed or no document (SSR)
  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const hasResults = allItems.length > 0;
  const showEmptyState = query && !isSearching && !hasResults && !isCommandMode;
  const showRecentHeader = !query && !isCommandMode && recentItems.length > 0;

  return createPortal(
    <dialog
      open
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-transparent m-0 p-0 max-w-none max-h-none w-full h-full"
      aria-label="命令面板"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 bg-background-tertiary border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        style={{
          animation: 'scale-in 150ms ease-out',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`搜尋或輸入 > 執行命令...`}
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-base outline-none min-h-[44px]"
            aria-label="搜尋"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-text-muted hover:text-text-primary rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="清除搜尋"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List - Custom command palette requires ARIA roles for accessibility */}
        {/* NOSONAR: S6819 - Native <select> cannot support custom command palette design with search, icons, and keyboard navigation */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto"
          role="listbox"
          aria-label="搜尋結果"
        >
          {/* Loading state */}
          {isSearching && (
            <div className="px-4 py-8 text-center text-text-muted">
              <div className="animate-pulse">搜尋中...</div>
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className="px-4 py-8 text-center text-text-muted">
              找不到符合「{query}」的結果
            </div>
          )}

          {/* Recent items header */}
          {showRecentHeader && (
            <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3 h-3" />
              最近項目
            </div>
          )}

          {/* Command mode header */}
          {isCommandMode && (
            <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Command className="w-3 h-3" />
              命令
            </div>
          )}

          {/* Results */}
          {/* NOSONAR: S6819 - Native <option> cannot support buttons with icons, descriptions, and custom interactions */}
          {!isSearching &&
            allItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  data-index={index}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors min-h-[48px]
                    ${isSelected ? 'bg-accent-600/20 border-l-2 border-accent-600' : 'hover:bg-background-hover border-l-2 border-transparent'}
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-accent-600' : 'text-text-muted'}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-text-muted truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-accent-600 flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}

          {/* No recent items */}
          {!query && !isCommandMode && recentItems.length === 0 && (
            <div className="px-4 py-8 text-center text-text-muted">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>尚無最近項目</p>
              <p className="text-xs mt-1">訪問客戶、商機或文件後會顯示在這裡</p>
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-hover rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-background-hover rounded text-[10px]">↓</kbd>
              <span className="ml-1">選擇</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-hover rounded text-[10px]">↵</kbd>
              <span className="ml-1">開啟</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background-hover rounded text-[10px]">esc</kbd>
              <span className="ml-1">關閉</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background-hover rounded text-[10px]">{modKey}K</kbd>
          </div>
        </div>
      </div>

    </dialog>,
    document.body
  );
}
