'use client';

/**
 * DeleteConfirmModal - Reusable delete confirmation dialog
 * WCAG 2.2 AAA Compliant
 */

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  readonly entityType: string;
  readonly entityName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isDeleting: boolean;
  readonly warningMessage?: string;
}

export function DeleteConfirmModal({
  entityType,
  entityName,
  onConfirm,
  onCancel,
  isDeleting,
  warningMessage,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <dialog
        open
        className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-5"
        aria-label="確認刪除"
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            確認刪除{entityType}？
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary mb-2">
            您確定要刪除{entityType}「{entityName}」嗎？此操作無法復原。
          </p>

          {/* Warning */}
          {warningMessage && (
            <p className="text-sm text-warning mb-4">
              {warningMessage}
            </p>
          )}

          {!warningMessage && <div className="mb-4" />}

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-error text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
