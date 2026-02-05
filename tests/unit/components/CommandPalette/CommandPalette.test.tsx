/**
 * CommandPalette Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

import { CommandPalette } from '@/components/CommandPalette/CommandPalette';

// Mock hooks
const mockClose = vi.fn();
const mockPush = vi.fn();
const mockAddItem = vi.fn();

vi.mock('@/components/CommandPalette/CommandPaletteContext', () => ({
  useCommandPalette: vi.fn(() => ({
    isOpen: true,
    close: mockClose,
  })),
}));

vi.mock('@/hooks/usePlatform', () => ({
  usePlatform: vi.fn(() => ({
    modKey: '⌘',
    isMac: true,
  })),
}));

vi.mock('@/hooks/useRecentItems', () => ({
  useRecentItems: vi.fn(() => ({
    items: [
      { id: 'cust-1', type: 'customer', name: 'ACME Corp' },
      { id: 'deal-1', type: 'deal', name: 'Big Deal' },
    ],
    addItem: mockAddItem,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock('@/lib/commands', () => ({
  commands: [
    {
      id: 'nav-customers',
      label: '前往客戶列表',
      description: '開啟客戶管理頁面',
      icon: () => null,
      action: { path: '/customers' },
    },
    {
      id: 'nav-deals',
      label: '前往商機列表',
      description: '開啟商機管理頁面',
      icon: () => null,
      action: { path: '/deals' },
    },
  ],
  filterCommands: vi.fn((query: string) => {
    const all = [
      {
        id: 'nav-customers',
        label: '前往客戶列表',
        description: '開啟客戶管理頁面',
        icon: () => null,
        action: { path: '/customers' },
      },
      {
        id: 'nav-deals',
        label: '前往商機列表',
        description: '開啟商機管理頁面',
        icon: () => null,
        action: { path: '/deals' },
      },
    ];
    return all.filter((c) =>
      c.label.toLowerCase().includes(query.toLowerCase())
    );
  }),
}));

import { useCommandPalette } from '@/components/CommandPalette/CommandPaletteContext';
import { useRecentItems } from '@/hooks/useRecentItems';

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default values
    vi.mocked(useCommandPalette).mockReturnValue({
      isOpen: true,
      close: mockClose,
      open: vi.fn(),
      toggle: vi.fn(),
    });
    vi.mocked(useRecentItems).mockReturnValue({
      items: [
        { id: 'cust-1', type: 'customer' as const, name: 'ACME Corp', visitedAt: Date.now() },
        { id: 'deal-1', type: 'deal' as const, name: 'Big Deal', visitedAt: Date.now() },
      ],
      addItem: mockAddItem,
      removeItem: vi.fn(),
      clearAll: vi.fn(),
    } as unknown as ReturnType<typeof useRecentItems>);
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<CommandPalette />);

      expect(screen.getByRole('dialog', { name: '命令面板' })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      vi.mocked(useCommandPalette).mockReturnValue({
        isOpen: false,
        close: mockClose,
        open: vi.fn(),
        toggle: vi.fn(),
      });

      render(<CommandPalette />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<CommandPalette />);

      expect(screen.getByRole('textbox', { name: '搜尋' })).toBeInTheDocument();
    });

    it('renders keyboard hints', () => {
      render(<CommandPalette />);

      expect(screen.getByText('選擇')).toBeInTheDocument();
      expect(screen.getByText('開啟')).toBeInTheDocument();
      expect(screen.getByText('關閉')).toBeInTheDocument();
    });

    it('renders results listbox', () => {
      render(<CommandPalette />);

      expect(screen.getByRole('listbox', { name: '搜尋結果' })).toBeInTheDocument();
    });
  });

  describe('Recent Items', () => {
    it('shows recent items header when no query', () => {
      render(<CommandPalette />);

      expect(screen.getByText('最近項目')).toBeInTheDocument();
    });

    it('shows recent items', () => {
      render(<CommandPalette />);

      expect(screen.getByText('ACME Corp')).toBeInTheDocument();
      expect(screen.getByText('Big Deal')).toBeInTheDocument();
    });

    it('shows empty state when no recent items', () => {
      vi.mocked(useRecentItems).mockReturnValue({
        items: [],
        addItem: mockAddItem,
        removeItem: vi.fn(),
        clearAll: vi.fn(),
      } as unknown as ReturnType<typeof useRecentItems>);

      render(<CommandPalette />);

      expect(screen.getByText('尚無最近項目')).toBeInTheDocument();
    });
  });

  describe('Command Mode', () => {
    it('shows command header when query starts with >', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.change(input, { target: { value: '>' } });

      expect(screen.getByText('命令')).toBeInTheDocument();
    });

    it('shows all commands when query is just >', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.change(input, { target: { value: '>' } });

      expect(screen.getByText('前往客戶列表')).toBeInTheDocument();
      expect(screen.getByText('前往商機列表')).toBeInTheDocument();
    });

    it('shows command descriptions', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.change(input, { target: { value: '>' } });

      expect(screen.getByText('開啟客戶管理頁面')).toBeInTheDocument();
    });
  });

  describe('Close Actions', () => {
    it('calls close when Escape is pressed', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockClose).toHaveBeenCalled();
    });

    it('calls close when backdrop is clicked', () => {
      render(<CommandPalette />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Clear Search', () => {
    it('shows clear button when query exists', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByRole('button', { name: '清除搜尋' })).toBeInTheDocument();
    });

    it('clears query when clear button clicked', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' }) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test' } });

      fireEvent.click(screen.getByRole('button', { name: '清除搜尋' }));

      expect(input.value).toBe('');
    });

    it('does not show clear button when query is empty', () => {
      render(<CommandPalette />);

      expect(screen.queryByRole('button', { name: '清除搜尋' })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('moves selection down with ArrowDown', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      // Initial state: first item selected
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Arrow down
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const updatedOptions = screen.getAllByRole('option');
      expect(updatedOptions[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('moves selection up with ArrowUp', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      // Move down first
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Then up
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('does not move below last item', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      // Move down past the last item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Extra

      const options = screen.getAllByRole('option');
      // Last one should be selected
      expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
    });

    it('does not move above first item', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      // Try moving up from first
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('selects item on Enter', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should navigate to the first recent item
      expect(mockPush).toHaveBeenCalledWith('/customers/cust-1');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Item Selection', () => {
    it('navigates when recent item is clicked', () => {
      render(<CommandPalette />);

      fireEvent.click(screen.getByText('ACME Corp'));

      expect(mockPush).toHaveBeenCalledWith('/customers/cust-1');
      expect(mockClose).toHaveBeenCalled();
    });

    it('navigates when command is selected', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      fireEvent.change(input, { target: { value: '>' } });

      fireEvent.click(screen.getByText('前往客戶列表'));

      expect(mockPush).toHaveBeenCalledWith('/customers');
      expect(mockClose).toHaveBeenCalled();
    });

    it('updates selected index on mouse enter', () => {
      render(<CommandPalette />);

      const options = screen.getAllByRole('option');

      // Hover second item
      fireEvent.mouseEnter(options[1]);

      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has listbox role on results', () => {
      render(<CommandPalette />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('has option role on recent items', () => {
      render(<CommandPalette />);

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(2); // 2 recent items
    });

    it('has aria-selected on first item', () => {
      render(<CommandPalette />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('has autocomplete off on input', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('has spellcheck false on input', () => {
      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });
      expect(input).toHaveAttribute('spellcheck', 'false');
    });
  });

  describe('Search API', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('fetches search results after debounce and displays them', async () => {
      const mockSearchData = {
        data: {
          customers: [
            { id: 'c1', name: 'Test Customer', company: 'Test Co', type: 'company' },
          ],
          deals: [],
          contacts: [],
          documents: [],
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchData),
      });

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'test' } });
      });

      // Advance past the 200ms debounce and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?q=test'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );

      // Search results should appear
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    it('shows loading state while searching', async () => {
      // Use a promise that we control to keep the fetch pending
      let resolvePromise!: (value: unknown) => void;
      globalThis.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'loading' } });
      });

      // Advance past the 200ms debounce to trigger fetch (but fetch is still pending)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // isSearching should be true, showing loading state
      expect(screen.getByText('搜尋中...')).toBeInTheDocument();

      // Clean up: resolve the pending promise
      await act(async () => {
        resolvePromise({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { customers: [], deals: [], contacts: [], documents: [] },
            }),
        });
      });
    });

    it('shows empty state when search returns no results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { customers: [], deals: [], contacts: [], documents: [] },
          }),
      });

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'nonexistent' } });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(screen.getByText(/找不到符合/)).toBeInTheDocument();
    });

    it('handles search API error gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'error' } });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Search error:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('does not log AbortError when search is cancelled', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const abortError = new DOMException(
        'The operation was aborted.',
        'AbortError'
      );
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'abort' } });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // AbortError should NOT be logged
      expect(consoleError).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('adds search result to recent items and navigates when selected', async () => {
      const mockSearchData = {
        data: {
          customers: [
            {
              id: 'c1',
              name: 'Found Customer',
              company: null,
              type: 'individual',
            },
          ],
          deals: [],
          contacts: [],
          documents: [],
        },
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchData),
      });

      render(<CommandPalette />);

      const input = screen.getByRole('textbox', { name: '搜尋' });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'found' } });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(screen.getByText('Found Customer')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Found Customer'));

      expect(mockAddItem).toHaveBeenCalledWith({
        type: 'customer',
        id: 'c1',
        name: 'Found Customer',
      });
      expect(mockPush).toHaveBeenCalledWith('/customers/c1');
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
