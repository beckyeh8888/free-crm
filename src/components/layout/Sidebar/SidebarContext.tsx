'use client';

/**
 * Sidebar Context - Manages sidebar collapse state
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  ReactNode,
} from 'react';

interface SidebarContextType {
  readonly isCollapsed: boolean;
  readonly toggle: () => void;
  readonly expand: () => void;
  readonly collapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-collapsed';

// Custom hook to subscribe to localStorage changes
function useLocalStorageState(key: string, defaultValue: boolean): [boolean, (value: boolean) => void] {
  // Subscribe to storage changes
  const subscribe = useCallback((callback: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    globalThis.addEventListener('storage', handleStorage);
    return () => globalThis.removeEventListener('storage', handleStorage);
  }, [key]);

  // Get current value from localStorage
  const getSnapshot = useCallback(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === 'true';
  }, [key, defaultValue]);

  // Server snapshot (always default)
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const storedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Setter that updates localStorage
  const setValue = useCallback((newValue: boolean) => {
    localStorage.setItem(key, String(newValue));
    // Dispatch storage event for same-tab updates
    globalThis.dispatchEvent(new StorageEvent('storage', { key }));
  }, [key]);

  return [storedValue, setValue];
}

export function SidebarProvider({ children }: { readonly children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorageState(STORAGE_KEY, false);

  const toggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, [setIsCollapsed]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ isCollapsed, toggle, expand, collapse }),
    [isCollapsed, toggle, expand, collapse]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
