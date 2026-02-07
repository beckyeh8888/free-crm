'use client';

/**
 * AIInsightsCard - Dashboard AI Sales Insights
 * WCAG 2.2 AAA Compliant
 *
 * Displays AI-powered sales analysis on the dashboard.
 * Only renders when AI is configured and insights feature is enabled.
 */

import { Sparkles, AlertTriangle, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAI';
import { useAIStatus } from '@/hooks/useAISettings';

export function AIInsightsCard() {
  const { isConfigured, isLoading: isStatusLoading } = useAIStatus();

  const {
    data: insightsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAIInsights(isConfigured);

  // Don't render if AI is not configured or status still loading
  if (isStatusLoading || !isConfigured) return null;

  const insights = insightsData?.data;

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text-primary">AI 銷售洞察</h3>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="
            w-8 h-8 flex items-center justify-center rounded-md
            text-text-muted hover:text-text-secondary hover:bg-background-hover
            disabled:opacity-50
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
          "
          aria-label="重新整理洞察"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
          <span className="ml-2 text-sm text-text-muted">正在分析...</span>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted">無法取得洞察分析</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="
              mt-2 text-xs text-accent-500 hover:text-accent-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 rounded
            "
          >
            重試
          </button>
        </div>
      )}

      {/* Content */}
      {insights && !isLoading && (
        <div className="space-y-4">
          {/* Summary */}
          {insights.summary && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {insights.summary}
            </p>
          )}

          {/* At-Risk Deals */}
          {insights.atRiskDeals && insights.atRiskDeals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
                <span className="text-xs font-medium text-text-secondary">
                  需關注商機
                </span>
              </div>
              <ul className="space-y-2" >
                {insights.atRiskDeals.slice(0, 3).map((deal) => (
                  <li
                    key={deal.dealId}
                    className="px-3 py-2 rounded-lg bg-background-tertiary border border-border"
                  >
                    <p className="text-xs font-medium text-text-primary">{deal.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{deal.reason}</p>
                    <p className="text-xs text-accent-500 mt-0.5">{deal.suggestedAction}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Insights */}
          {insights.keyInsights && insights.keyInsights.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-accent-500" aria-hidden="true" />
                <span className="text-xs font-medium text-text-secondary">
                  關鍵洞察
                </span>
              </div>
              <ul className="space-y-1.5" >
                {insights.keyInsights.map((insight) => (
                  <li
                    key={insight}
                    className="text-xs text-text-secondary pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text-muted"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!insights && !isLoading && !isError && (
        <div className="text-center py-6">
          <Sparkles className="w-6 h-6 text-text-muted mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-text-muted">點擊重新整理取得 AI 洞察</p>
        </div>
      )}
    </div>
  );
}
