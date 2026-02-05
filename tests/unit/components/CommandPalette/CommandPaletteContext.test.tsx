/**
 * CommandPaletteContext Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  CommandPaletteProvider,
  useCommandPalette,
} from '@/components/CommandPalette/CommandPaletteContext';

function TestConsumer() {
  const { isOpen, open, close, toggle } = useCommandPalette();
  return (
    <div>
      <span data-testid="state">{isOpen ? 'open' : 'closed'}</span>
      <button type="button" onClick={open} data-testid="open">Open</button>
      <button type="button" onClick={close} data-testid="close">Close</button>
      <button type="button" onClick={toggle} data-testid="toggle">Toggle</button>
    </div>
  );
}

describe('CommandPaletteContext', () => {
  describe('CommandPaletteProvider', () => {
    it('provides default closed state', () => {
      render(
        <CommandPaletteProvider>
          <TestConsumer />
        </CommandPaletteProvider>
      );

      expect(screen.getByTestId('state')).toHaveTextContent('closed');
    });

    it('opens palette', () => {
      render(
        <CommandPaletteProvider>
          <TestConsumer />
        </CommandPaletteProvider>
      );

      fireEvent.click(screen.getByTestId('open'));

      expect(screen.getByTestId('state')).toHaveTextContent('open');
    });

    it('closes palette', () => {
      render(
        <CommandPaletteProvider>
          <TestConsumer />
        </CommandPaletteProvider>
      );

      fireEvent.click(screen.getByTestId('open'));
      expect(screen.getByTestId('state')).toHaveTextContent('open');

      fireEvent.click(screen.getByTestId('close'));
      expect(screen.getByTestId('state')).toHaveTextContent('closed');
    });

    it('toggles palette', () => {
      render(
        <CommandPaletteProvider>
          <TestConsumer />
        </CommandPaletteProvider>
      );

      fireEvent.click(screen.getByTestId('toggle'));
      expect(screen.getByTestId('state')).toHaveTextContent('open');

      fireEvent.click(screen.getByTestId('toggle'));
      expect(screen.getByTestId('state')).toHaveTextContent('closed');
    });
  });

  describe('useCommandPalette', () => {
    it('throws when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useCommandPalette must be used within a CommandPaletteProvider'
      );

      consoleError.mockRestore();
    });
  });
});
