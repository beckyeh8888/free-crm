'use client';

/**
 * LoginHistoryModal - Login history table modal
 * WCAG 2.2 AAA Compliant
 */

import { X } from 'lucide-react';
import { useLoginHistory } from '@/hooks/useSettings';

interface LoginHistoryModalProps {
  readonly onClose: () => void;
}

const statusColors: Record<string, string> = {
  success: 'text-success',
  failed: 'text-error',
  blocked: 'text-warning',
};

export function LoginHistoryModal({ onClose }: LoginHistoryModalProps) {
  const { data, isLoading } = useLoginHistory({ limit: 20 });
  const entries = data?.data ?? [];
  const summary = data?.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <dialog
        open
        className="relative w-full max-w-2xl bg-background-tertiary border border-border rounded-xl shadow-xl p-0 max-h-[80vh] flex flex-col"
        aria-label="登入記錄"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">登入記錄</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="px-5 py-3 border-b border-border flex gap-6 flex-shrink-0 text-sm">
            <div>
              <span className="text-text-muted">總登入：</span>
              <span className="text-text-primary ml-1">{summary.totalLogins}</span>
            </div>
            <div>
              <span className="text-text-muted">成功：</span>
              <span className="text-success ml-1">{summary.successfulLogins}</span>
            </div>
            <div>
              <span className="text-text-muted">失敗：</span>
              <span className="text-error ml-1">{summary.failedAttempts}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="animate-pulse p-5 space-y-3">
              <div className="h-8 bg-background-hover rounded" />
              <div className="h-8 bg-background-hover rounded" />
              <div className="h-8 bg-background-hover rounded" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted">尚無登入記錄</p>
            </div>
          ) : (
            <table className="w-full text-sm" aria-label="登入記錄列表">
              <thead className="sticky top-0 bg-background-tertiary">
                <tr className="border-b border-border">
                  <th scope="col" className="text-left px-5 py-2.5 text-text-muted font-medium">時間</th>
                  <th scope="col" className="text-left px-3 py-2.5 text-text-muted font-medium">裝置</th>
                  <th scope="col" className="text-left px-3 py-2.5 text-text-muted font-medium">IP</th>
                  <th scope="col" className="text-left px-3 py-2.5 text-text-muted font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-5 py-2.5 text-text-secondary whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">
                      <div className="truncate max-w-[150px]">{entry.browser}</div>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary font-mono text-xs">
                      {entry.ip}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium ${statusColors[entry.status] ?? 'text-text-muted'}`}>
                        {entry.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
          >
            關閉
          </button>
        </div>
      </dialog>
    </div>
  );
}
