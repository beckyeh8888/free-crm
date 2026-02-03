'use client';

/**
 * AIAnalysisPanel - Display AI analysis results
 * Handles empty, loading, and result states
 * WCAG 2.2 AAA Compliant
 */

import { Sparkles, AlertCircle } from 'lucide-react';
import type { DocumentAnalysis } from '@/hooks/useDocuments';

interface AIAnalysisPanelProps {
  readonly analysis?: DocumentAnalysis | null;
  readonly onAnalyze?: () => void;
  readonly isAnalyzing?: boolean;
  readonly hasContent?: boolean;
}

const sentimentLabels: Record<string, string> = {
  positive: '正面',
  negative: '負面',
  neutral: '中性',
};

const sentimentColors: Record<string, string> = {
  positive: 'text-success',
  negative: 'text-error',
  neutral: 'text-text-muted',
};

function safeParseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // ignored
    }
  }
  return [];
}

interface EntitiesData {
  readonly people?: readonly string[];
  readonly companies?: readonly string[];
  readonly dates?: readonly string[];
}

function safeParseEntities(value: unknown): EntitiesData {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as EntitiesData;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return parsed as EntitiesData;
    } catch {
      // ignored
    }
  }
  return {};
}

function renderEmptyState(onAnalyze?: () => void, hasContent?: boolean) {
  return (
    <div className="text-center py-6">
      <Sparkles className="w-8 h-8 text-text-muted mx-auto mb-3" />
      <p className="text-sm text-text-muted mb-3">尚未進行 AI 分析</p>
      {hasContent ? (
        <button
          type="button"
          onClick={onAnalyze}
          className="px-4 py-2 rounded-lg bg-accent-600 text-white text-sm hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          開始分析
        </button>
      ) : (
        <p className="text-xs text-text-muted flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          需要文件內容才能進行分析
        </p>
      )}
    </div>
  );
}

function renderLoadingState() {
  return (
    <output className="py-6 block" aria-label="分析中">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent-600 animate-pulse" />
        <span className="text-sm text-accent-600 font-medium">AI 分析中...</span>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-background-hover/50 rounded animate-pulse" />
        <div className="h-4 bg-background-hover/50 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-background-hover/50 rounded animate-pulse w-1/2" />
      </div>
    </output>
  );
}

function renderEntityTags(entities: EntitiesData) {
  const allTags: Array<{ readonly label: string; readonly category: string }> = [];

  entities.people?.forEach((p) => allTags.push({ label: p, category: 'people' }));
  entities.companies?.forEach((c) => allTags.push({ label: c, category: 'company' }));
  entities.dates?.forEach((d) => allTags.push({ label: d, category: 'date' }));

  if (allTags.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        實體
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <span
            key={`${tag.category}-${tag.label}`}
            className="px-2 py-0.5 rounded-full text-xs bg-background-hover text-text-secondary"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AIAnalysisPanel({ analysis, onAnalyze, isAnalyzing, hasContent }: AIAnalysisPanelProps) {
  if (isAnalyzing) {
    return renderLoadingState();
  }

  if (!analysis) {
    return renderEmptyState(onAnalyze, hasContent);
  }

  const keyPoints = safeParseArray(analysis.keyPoints);
  const actionItems = safeParseArray(analysis.actionItems);
  const entities = safeParseEntities(analysis.entities);
  const sentimentLabel = analysis.sentiment ? sentimentLabels[analysis.sentiment] ?? analysis.sentiment : null;
  const sentimentColor = analysis.sentiment ? sentimentColors[analysis.sentiment] ?? 'text-text-muted' : '';

  return (
    <div className="space-y-4">
      {/* Header with re-analyze button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-600" />
          <h3 className="text-sm font-semibold text-text-primary">AI 分析結果</h3>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          className="text-xs text-accent-600 hover:text-accent-500 transition-colors min-h-[32px] px-2"
        >
          重新分析
        </button>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            摘要
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {analysis.summary}
          </p>
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            重點
          </h4>
          <ul className="space-y-1">
            {keyPoints.map((point) => (
              <li key={point} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-accent-600 mt-1.5 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            待辦事項
          </h4>
          <ul className="space-y-1">
            {actionItems.map((item) => (
              <li key={item} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-text-muted mt-0.5 flex-shrink-0">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Entities */}
      {renderEntityTags(entities)}

      {/* Sentiment & Confidence */}
      <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
        {sentimentLabel && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">情感:</span>
            <span className={`text-xs font-medium ${sentimentColor}`}>{sentimentLabel}</span>
          </div>
        )}
        {analysis.confidence != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">信心度:</span>
            <span className="text-xs font-medium text-text-secondary">
              {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
        )}
        {analysis.model && (
          <span className="text-xs text-text-muted ml-auto">{analysis.model}</span>
        )}
      </div>
    </div>
  );
}
