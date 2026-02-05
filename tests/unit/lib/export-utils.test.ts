/**
 * Export Utilities Tests
 * Unit tests for CSV/JSON export helper functions
 *
 * @vitest-environment node
 */

// vitest globals are available via globals: true in vitest.config.ts
import {
  escapeCSV,
  formatDate,
  formatDateOnly,
  getStageLabel,
  formatCurrency,
  generateDealsCSV,
  generateDealsJSON,
  calculateStats,
  type DealExportData,
  type ReportStats,
} from '@/lib/export-utils';

// Mock design-tokens
vi.mock('@/lib/design-tokens', () => ({
  pipelineLabels: {
    lead: '潛在客戶',
    qualified: '符合資格',
    proposal: '提案中',
    negotiation: '協商中',
    closed_won: '成交',
    closed_lost: '失敗',
  },
}));

describe('Export Utilities', () => {
  describe('escapeCSV', () => {
    it('returns empty string for null', () => {
      expect(escapeCSV(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(escapeCSV(undefined)).toBe('');
    });

    it('converts number to string', () => {
      expect(escapeCSV(123)).toBe('123');
    });

    it('converts boolean to string', () => {
      expect(escapeCSV(true)).toBe('true');
      expect(escapeCSV(false)).toBe('false');
    });

    it('returns string as-is when no special chars', () => {
      expect(escapeCSV('Simple text')).toBe('Simple text');
    });

    it('escapes string with comma by wrapping in quotes', () => {
      expect(escapeCSV('Hello, World')).toBe('"Hello, World"');
    });

    it('escapes string with double quotes', () => {
      expect(escapeCSV('He said "hello"')).toBe('"He said ""hello"""');
    });

    it('escapes string with newline', () => {
      expect(escapeCSV('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('escapes string with carriage return', () => {
      expect(escapeCSV('Line1\rLine2')).toBe('"Line1\rLine2"');
    });

    it('escapes string with multiple special characters', () => {
      expect(escapeCSV('A "test", with\nspecial chars')).toBe('"A ""test"", with\nspecial chars"');
    });

    it('converts object to JSON string', () => {
      // Object with quotes gets escaped: each " becomes ""
      expect(escapeCSV({ key: 'value' })).toBe('"{""key"":""value""}"');
    });

    it('converts array to JSON string', () => {
      // Array with commas gets quoted
      expect(escapeCSV([1, 2, 3])).toBe('"[1,2,3]"');
    });
  });

  describe('formatDate', () => {
    it('formats date to YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2026-02-05T14:30:45.000Z');
      expect(formatDate(date)).toBe('2026-02-05 14:30:45');
    });

    it('handles midnight time', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      expect(formatDate(date)).toBe('2026-01-01 00:00:00');
    });

    it('handles end of day time', () => {
      const date = new Date('2026-12-31T23:59:59.000Z');
      expect(formatDate(date)).toBe('2026-12-31 23:59:59');
    });
  });

  describe('formatDateOnly', () => {
    it('returns empty string for null', () => {
      expect(formatDateOnly(null)).toBe('');
    });

    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2026-02-05T14:30:45.000Z');
      expect(formatDateOnly(date)).toBe('2026-02-05');
    });

    it('handles date at midnight', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      expect(formatDateOnly(date)).toBe('2026-01-01');
    });
  });

  describe('getStageLabel', () => {
    it('returns Chinese label for known stage', () => {
      expect(getStageLabel('lead')).toBe('潛在客戶');
      expect(getStageLabel('qualified')).toBe('符合資格');
      expect(getStageLabel('proposal')).toBe('提案中');
      expect(getStageLabel('negotiation')).toBe('協商中');
      expect(getStageLabel('closed_won')).toBe('成交');
      expect(getStageLabel('closed_lost')).toBe('失敗');
    });

    it('returns original stage for unknown stage', () => {
      expect(getStageLabel('unknown_stage')).toBe('unknown_stage');
    });
  });

  describe('formatCurrency', () => {
    it('returns empty string for null', () => {
      expect(formatCurrency(null)).toBe('');
    });

    it('formats number with locale separators', () => {
      expect(formatCurrency(1000000)).toBe('1,000,000');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('0');
    });

    it('formats small numbers', () => {
      expect(formatCurrency(999)).toBe('999');
    });

    it('formats decimal numbers', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234');
    });
  });

  describe('calculateStats', () => {
    const mockDeals: DealExportData[] = [
      {
        id: '1',
        title: 'Deal 1',
        value: 100000,
        stage: 'closed_won',
        probability: 100,
        closeDate: new Date('2026-02-01'),
        closedAt: new Date('2026-02-01'),
        createdAt: new Date('2026-01-01'),
        customerName: 'Customer 1',
        customerCompany: 'Company A',
      },
      {
        id: '2',
        title: 'Deal 2',
        value: 50000,
        stage: 'closed_won',
        probability: 100,
        closeDate: new Date('2026-02-15'),
        closedAt: new Date('2026-02-10'),
        createdAt: new Date('2026-01-10'),
        customerName: 'Customer 2',
        customerCompany: 'Company B',
      },
      {
        id: '3',
        title: 'Deal 3',
        value: 30000,
        stage: 'closed_lost',
        probability: 0,
        closeDate: null,
        closedAt: new Date('2026-02-05'),
        createdAt: new Date('2026-01-15'),
        customerName: 'Customer 3',
        customerCompany: 'Company C',
      },
      {
        id: '4',
        title: 'Deal 4',
        value: 75000,
        stage: 'proposal',
        probability: 50,
        closeDate: new Date('2026-03-01'),
        closedAt: null,
        createdAt: new Date('2026-01-20'),
        customerName: null,
        customerCompany: null,
      },
    ];

    it('calculates total deals', () => {
      const stats = calculateStats(mockDeals);
      expect(stats.totalDeals).toBe(4);
    });

    it('calculates won deals', () => {
      const stats = calculateStats(mockDeals);
      expect(stats.wonDeals).toBe(2);
    });

    it('calculates lost deals', () => {
      const stats = calculateStats(mockDeals);
      expect(stats.lostDeals).toBe(1);
    });

    it('calculates in progress deals', () => {
      const stats = calculateStats(mockDeals);
      expect(stats.inProgress).toBe(1);
    });

    it('calculates win rate', () => {
      const stats = calculateStats(mockDeals);
      // 2 won / 3 closed = 66.67% rounded to 67%
      expect(stats.winRate).toBe(67);
    });

    it('calculates total revenue from won deals', () => {
      const stats = calculateStats(mockDeals);
      expect(stats.totalRevenue).toBe(150000); // 100000 + 50000
    });

    it('handles empty deals array', () => {
      const stats = calculateStats([]);
      expect(stats.totalDeals).toBe(0);
      expect(stats.wonDeals).toBe(0);
      expect(stats.lostDeals).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.totalRevenue).toBe(0);
    });

    it('handles deals with null values', () => {
      const dealsWithNulls: DealExportData[] = [
        {
          id: '1',
          title: 'Deal',
          value: null,
          stage: 'closed_won',
          probability: 100,
          closeDate: null,
          closedAt: null,
          createdAt: new Date(),
          customerName: null,
          customerCompany: null,
        },
      ];
      const stats = calculateStats(dealsWithNulls);
      expect(stats.totalRevenue).toBe(0);
    });
  });

  describe('generateDealsCSV', () => {
    const mockDeals: DealExportData[] = [
      {
        id: '1',
        title: 'Test Deal',
        value: 50000,
        stage: 'proposal',
        probability: 50,
        closeDate: new Date('2026-03-01T00:00:00Z'),
        closedAt: null,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        customerName: '測試客戶',
        customerCompany: '測試公司',
      },
    ];

    const mockStats: ReportStats = {
      totalDeals: 1,
      inProgress: 1,
      wonDeals: 0,
      lostDeals: 0,
      winRate: 0,
      totalRevenue: 0,
    };

    it('starts with UTF-8 BOM', () => {
      const csv = generateDealsCSV(mockDeals, mockStats);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });

    it('includes header row', () => {
      const csv = generateDealsCSV(mockDeals, mockStats);
      expect(csv).toContain('建立日期,商機名稱,客戶名稱,客戶公司,金額 (NT$),階段,成功率 (%),預計結案,實際結案');
    });

    it('includes deal data row', () => {
      const csv = generateDealsCSV(mockDeals, mockStats);
      expect(csv).toContain('Test Deal');
      expect(csv).toContain('測試客戶');
      expect(csv).toContain('測試公司');
      expect(csv).toContain('提案中');
    });

    it('includes statistics section', () => {
      const csv = generateDealsCSV(mockDeals, mockStats);
      expect(csv).toContain('=== 報表統計 ===');
      expect(csv).toContain('總商機數');
      expect(csv).toContain('進行中');
      expect(csv).toContain('勝率');
      expect(csv).toContain('總營收 (NT$)');
    });
  });

  describe('generateDealsJSON', () => {
    const mockDeals: DealExportData[] = [
      {
        id: 'deal-1',
        title: 'JSON Test Deal',
        value: 75000,
        stage: 'negotiation',
        probability: 75,
        closeDate: new Date('2026-04-01T00:00:00Z'),
        closedAt: null,
        createdAt: new Date('2026-02-15T00:00:00Z'),
        customerName: 'JSON Customer',
        customerCompany: 'JSON Company',
      },
    ];

    const mockStats: ReportStats = {
      totalDeals: 1,
      inProgress: 1,
      wonDeals: 0,
      lostDeals: 0,
      winRate: 0,
      totalRevenue: 0,
    };

    it('returns valid JSON string', () => {
      const json = generateDealsJSON(mockDeals, mockStats);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes exportedAt timestamp', () => {
      const json = generateDealsJSON(mockDeals, mockStats);
      const data = JSON.parse(json);
      expect(data.exportedAt).toBeDefined();
    });

    it('includes stats object', () => {
      const json = generateDealsJSON(mockDeals, mockStats);
      const data = JSON.parse(json);
      expect(data.stats.totalDeals).toBe(1);
      expect(data.stats.inProgress).toBe(1);
      expect(data.stats.wonDeals).toBe(0);
    });

    it('includes deals array with proper fields', () => {
      const json = generateDealsJSON(mockDeals, mockStats);
      const data = JSON.parse(json);
      expect(data.deals).toHaveLength(1);
      expect(data.deals[0].id).toBe('deal-1');
      expect(data.deals[0].title).toBe('JSON Test Deal');
      expect(data.deals[0].stageLabel).toBe('協商中');
    });

    it('handles null closeDate', () => {
      const dealsWithNull: DealExportData[] = [
        {
          ...mockDeals[0],
          closeDate: null,
          closedAt: null,
        },
      ];
      const json = generateDealsJSON(dealsWithNull, mockStats);
      const data = JSON.parse(json);
      expect(data.deals[0].closeDate).toBeNull();
      expect(data.deals[0].closedAt).toBeNull();
    });

    it('formats dates as YYYY-MM-DD', () => {
      const json = generateDealsJSON(mockDeals, mockStats);
      const data = JSON.parse(json);
      expect(data.deals[0].closeDate).toBe('2026-04-01');
      expect(data.deals[0].createdAt).toBe('2026-02-15');
    });
  });
});
