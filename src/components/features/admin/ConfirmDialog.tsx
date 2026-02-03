'use client';

/**
 * ConfirmDialog - Confirmation dialog for destructive actions
 * WCAG 2.2 AAA Compliant
 */

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'danger' | 'warning' | 'info';
  readonly isLoading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = '取消',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'text-error',
      button: 'bg-error hover:bg-error/90',
    },
    warning: {
      icon: 'text-warning',
      button: 'bg-warning hover:bg-warning/90',
    },
    info: {
      icon: 'text-accent-600',
      button: 'bg-accent-600 hover:bg-accent-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <dialog
        open
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center ${styles.icon}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p id="confirm-message" className="text-sm text-text-secondary">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? '處理中...' : confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}
