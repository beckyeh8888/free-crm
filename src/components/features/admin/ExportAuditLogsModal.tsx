'use client';

/**
 * ExportAuditLogsModal - Modal for exporting audit logs
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X, Download, Loader2, FileText, FileJson } from 'lucide-react';
import { useExportAuditLogs, type AuditLogFilters, type ExportParams } from '@/hooks/useAuditLogs';

interface ExportAuditLogsModalProps {
  readonly filters: AuditLogFilters;
  readonly onClose: () => void;
}

export function ExportAuditLogsModal({ filters, onClose }: ExportAuditLogsModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [limit, setLimit] = useState(1000);

  const exportMutation = useExportAuditLogs();

  const handleExport = async () => {
    const params: ExportParams = {
      format,
      limit,
      ...(filters.action && { action: filters.action }),
      ...(filters.entity && { entity: filters.entity }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    };

    try {
      await exportMutation.mutateAsync(params);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <dialog
        open
        role="dialog"
        aria-labelledby="export-title"
        className="relative w-full max-w-md bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-600/15 flex items-center justify-center">
              <Download className="w-4 h-4 text-accent-600" />
            </div>
            <h2 id="export-title" className="text-lg font-semibold text-text-primary">
              匯出審計日誌
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              匯出格式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-colors
                  ${format === 'csv'
                    ? 'border-accent-600 bg-accent-600/10'
                    : 'border-border hover:border-border-strong'}
                `}
              >
                <FileText className={`w-5 h-5 ${format === 'csv' ? 'text-accent-600' : 'text-text-muted'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${format === 'csv' ? 'text-accent-600' : 'text-text-primary'}`}>
                    CSV
                  </p>
                  <p className="text-xs text-text-muted">Excel 相容</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-colors
                  ${format === 'json'
                    ? 'border-accent-600 bg-accent-600/10'
                    : 'border-border hover:border-border-strong'}
                `}
              >
                <FileJson className={`w-5 h-5 ${format === 'json' ? 'text-accent-600' : 'text-text-muted'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${format === 'json' ? 'text-accent-600' : 'text-text-primary'}`}>
                    JSON
                  </p>
                  <p className="text-xs text-text-muted">程式處理</p>
                </div>
              </button>
            </div>
          </div>

          {/* Record Limit */}
          <div>
            <label htmlFor="export-limit" className="block text-sm font-medium text-text-secondary mb-1.5">
              最大筆數
            </label>
            <select
              id="export-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="form-input w-full"
            >
              <option value={100}>100 筆</option>
              <option value={500}>500 筆</option>
              <option value={1000}>1,000 筆</option>
              <option value={5000}>5,000 筆</option>
              <option value={10000}>10,000 筆</option>
            </select>
          </div>

          {/* Active Filters Info */}
          {Object.values(filters).some((v) => v) && (
            <div className="bg-background-secondary rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">將套用目前的篩選條件：</p>
              <ul className="text-xs text-text-secondary space-y-0.5">
                {filters.action && <li>• 操作類型: {filters.action}</li>}
                {filters.entity && <li>• 實體類型: {filters.entity}</li>}
                {filters.userId && <li>• 指定用戶</li>}
                {filters.startDate && <li>• 開始日期: {filters.startDate}</li>}
                {filters.endDate && <li>• 結束日期: {filters.endDate}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={exportMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px] disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                匯出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                匯出
              </>
            )}
          </button>
        </div>
      </dialog>
    </div>
  );
}
