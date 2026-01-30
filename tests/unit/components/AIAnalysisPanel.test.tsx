/**
 * AIAnalysisPanel Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAnalysisPanel } from '@/components/features/documents/AIAnalysisPanel';
import type { DocumentAnalysis } from '@/hooks/useDocuments';

function createMockAnalysis(overrides: Partial<DocumentAnalysis> = {}): DocumentAnalysis {
  return {
    id: 'analysis-1',
    summary: '這是一份合約摘要',
    sentiment: 'positive',
    keyPoints: JSON.stringify(['重點一', '重點二', '重點三']),
    actionItems: JSON.stringify(['待辦一', '待辦二']),
    entities: JSON.stringify({
      people: ['Alice', 'Bob'],
      companies: ['Acme Corp'],
      dates: ['2026-01-15'],
    }),
    confidence: 0.92,
    model: 'gpt-4',
    createdAt: '2026-01-15T00:00:00Z',
    documentId: 'doc-1',
    ...overrides,
  };
}

describe('AIAnalysisPanel Component', () => {
  describe('Empty state', () => {
    it('shows empty message when no analysis', () => {
      render(<AIAnalysisPanel />);

      expect(screen.getByText('尚未進行 AI 分析')).toBeInTheDocument();
    });

    it('shows CTA button when hasContent', () => {
      const onAnalyze = vi.fn();
      render(<AIAnalysisPanel onAnalyze={onAnalyze} hasContent />);

      const btn = screen.getByRole('button', { name: '開始分析' });
      expect(btn).toBeInTheDocument();
    });

    it('calls onAnalyze when CTA clicked', () => {
      const onAnalyze = vi.fn();
      render(<AIAnalysisPanel onAnalyze={onAnalyze} hasContent />);

      fireEvent.click(screen.getByRole('button', { name: '開始分析' }));
      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('shows content requirement message when no content', () => {
      render(<AIAnalysisPanel hasContent={false} />);

      expect(screen.getByText(/需要文件內容才能進行分析/)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading state when analyzing', () => {
      render(<AIAnalysisPanel isAnalyzing />);

      expect(screen.getByText('AI 分析中...')).toBeInTheDocument();
    });

    it('has loading role and aria-label', () => {
      render(<AIAnalysisPanel isAnalyzing />);

      expect(screen.getByRole('status', { name: '分析中' })).toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('shows analysis header', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });

    it('shows re-analyze button', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByRole('button', { name: '重新分析' })).toBeInTheDocument();
    });

    it('shows summary', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByText('這是一份合約摘要')).toBeInTheDocument();
    });

    it('shows key points as bullet list', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByText('重點一')).toBeInTheDocument();
      expect(screen.getByText('重點二')).toBeInTheDocument();
      expect(screen.getByText('重點三')).toBeInTheDocument();
    });

    it('shows action items', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByText('待辦一')).toBeInTheDocument();
      expect(screen.getByText('待辦二')).toBeInTheDocument();
    });

    it('shows entity tags', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('shows sentiment label in Chinese', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ sentiment: 'positive' })} />);

      expect(screen.getByText('正面')).toBeInTheDocument();
    });

    it('shows negative sentiment', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ sentiment: 'negative' })} />);

      expect(screen.getByText('負面')).toBeInTheDocument();
    });

    it('shows neutral sentiment', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ sentiment: 'neutral' })} />);

      expect(screen.getByText('中性')).toBeInTheDocument();
    });

    it('shows confidence percentage', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ confidence: 0.92 })} />);

      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('shows model name', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ model: 'gpt-4' })} />);

      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });
  });

  describe('Partial data handling', () => {
    it('handles null summary', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ summary: null })} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });

    it('handles empty keyPoints', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ keyPoints: '[]' })} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });

    it('handles null confidence', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ confidence: null })} />);

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('handles null model', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ model: null })} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });

    it('handles invalid JSON in keyPoints', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ keyPoints: 'not-json' })} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });

    it('handles invalid JSON in entities', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis({ entities: 'not-json' })} />);

      expect(screen.getByText('AI 分析結果')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('CTA button meets minimum touch target (44px)', () => {
      render(<AIAnalysisPanel onAnalyze={vi.fn()} hasContent />);

      const btn = screen.getByRole('button', { name: '開始分析' });
      expect(btn.className).toContain('min-h-[44px]');
    });

    it('re-analyze button meets minimum touch target (32px)', () => {
      render(<AIAnalysisPanel analysis={createMockAnalysis()} />);

      const btn = screen.getByRole('button', { name: '重新分析' });
      expect(btn.className).toContain('min-h-[32px]');
    });
  });
});
