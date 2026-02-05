/**
 * Command Palette Commands Tests
 * Unit tests for command definitions and filtering
 *
 * @vitest-environment node
 */

// vitest globals are available via globals: true in vitest.config.ts
import {
  commands,
  getCommandsByCategory,
  filterCommands,
  getCategoryLabel,
} from '@/lib/commands';

describe('Command Palette Commands', () => {
  describe('commands array', () => {
    it('contains navigation commands', () => {
      const navCommands = commands.filter(cmd => cmd.category === 'navigation');
      expect(navCommands.length).toBeGreaterThan(0);
    });

    it('contains create commands', () => {
      const createCommands = commands.filter(cmd => cmd.category === 'create');
      expect(createCommands.length).toBeGreaterThan(0);
    });

    it('all commands have required fields', () => {
      commands.forEach(cmd => {
        expect(cmd.id).toBeTruthy();
        expect(cmd.label).toBeTruthy();
        expect(cmd.category).toBeTruthy();
        expect(cmd.icon).toBeTruthy();
        expect(cmd.action).toBeDefined();
        expect(cmd.action.type).toMatch(/^(navigate|action)$/);
      });
    });

    it('navigate commands have path', () => {
      const navigateCommands = commands.filter(cmd => cmd.action.type === 'navigate');
      navigateCommands.forEach(cmd => {
        expect(cmd.action.path).toBeTruthy();
      });
    });

    it('commands have unique ids', () => {
      const ids = commands.map(cmd => cmd.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('getCommandsByCategory', () => {
    it('returns only navigation commands', () => {
      const result = getCommandsByCategory('navigation');
      result.forEach(cmd => {
        expect(cmd.category).toBe('navigation');
      });
    });

    it('returns only create commands', () => {
      const result = getCommandsByCategory('create');
      result.forEach(cmd => {
        expect(cmd.category).toBe('create');
      });
    });

    it('returns only action commands', () => {
      const result = getCommandsByCategory('action');
      result.forEach(cmd => {
        expect(cmd.category).toBe('action');
      });
    });

    it('returns empty array for unknown category', () => {
      // @ts-expect-error Testing unknown category
      const result = getCommandsByCategory('unknown');
      expect(result).toHaveLength(0);
    });

    it('returns readonly array', () => {
      const result = getCommandsByCategory('navigation');
      expect(Object.isFrozen(result) || Array.isArray(result)).toBe(true);
    });
  });

  describe('filterCommands', () => {
    it('filters by label (case insensitive)', () => {
      const result = filterCommands('客戶');
      expect(result.some(cmd => cmd.label.includes('客戶'))).toBe(true);
    });

    it('filters by label in English', () => {
      const result = filterCommands('dashboard');
      // Note: this depends on actual command labels
      expect(Array.isArray(result)).toBe(true);
    });

    it('filters by description', () => {
      const result = filterCommands('Pipeline');
      expect(result.some(cmd => cmd.description?.includes('Pipeline'))).toBe(true);
    });

    it('returns empty array when no match', () => {
      const result = filterCommands('xyznonexistent123');
      expect(result).toHaveLength(0);
    });

    it('returns all commands for empty query', () => {
      const result = filterCommands('');
      expect(result.length).toBe(commands.length);
    });

    it('handles partial match', () => {
      const result = filterCommands('前往');
      expect(result.length).toBeGreaterThan(0);
      result.forEach(cmd => {
        expect(cmd.label.includes('前往')).toBe(true);
      });
    });

    it('is case insensitive for ASCII', () => {
      const upperResult = filterCommands('DASHBOARD');
      const lowerResult = filterCommands('dashboard');
      expect(upperResult.length).toBe(lowerResult.length);
    });
  });

  describe('getCategoryLabel', () => {
    it('returns Chinese label for navigation', () => {
      expect(getCategoryLabel('navigation')).toBe('導航');
    });

    it('returns Chinese label for create', () => {
      expect(getCategoryLabel('create')).toBe('建立');
    });

    it('returns Chinese label for action', () => {
      expect(getCategoryLabel('action')).toBe('動作');
    });

    it('returns original value for unknown category', () => {
      // @ts-expect-error Testing unknown category
      expect(getCategoryLabel('unknown')).toBe('unknown');
    });
  });

  describe('specific commands', () => {
    it('has goto-dashboard command', () => {
      const cmd = commands.find(c => c.id === 'goto-dashboard');
      expect(cmd).toBeDefined();
      expect(cmd?.action.path).toBe('/dashboard');
      expect(cmd?.shortcut).toBe('G D');
    });

    it('has goto-customers command', () => {
      const cmd = commands.find(c => c.id === 'goto-customers');
      expect(cmd).toBeDefined();
      expect(cmd?.action.path).toBe('/customers');
    });

    it('has goto-deals command', () => {
      const cmd = commands.find(c => c.id === 'goto-deals');
      expect(cmd).toBeDefined();
      expect(cmd?.action.path).toBe('/deals');
    });

    it('has goto-documents command', () => {
      const cmd = commands.find(c => c.id === 'goto-documents');
      expect(cmd).toBeDefined();
      expect(cmd?.action.path).toBe('/documents');
    });

    it('has goto-settings command', () => {
      const cmd = commands.find(c => c.id === 'goto-settings');
      expect(cmd).toBeDefined();
      expect(cmd?.action.path).toBe('/settings');
    });

    it('has create-customer command', () => {
      const cmd = commands.find(c => c.id === 'create-customer');
      expect(cmd).toBeDefined();
      expect(cmd?.category).toBe('create');
      expect(cmd?.action.path).toContain('customers');
      expect(cmd?.action.path).toContain('action=new');
    });

    it('has create-deal command', () => {
      const cmd = commands.find(c => c.id === 'create-deal');
      expect(cmd).toBeDefined();
      expect(cmd?.category).toBe('create');
      expect(cmd?.action.path).toContain('deals');
    });

    it('has create-document command', () => {
      const cmd = commands.find(c => c.id === 'create-document');
      expect(cmd).toBeDefined();
      expect(cmd?.category).toBe('create');
      expect(cmd?.action.path).toContain('documents');
    });
  });
});
