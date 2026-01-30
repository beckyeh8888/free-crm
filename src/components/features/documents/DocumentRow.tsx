'use client';

/**
 * DocumentRow - Document list item component
 * WCAG 2.2 AAA Compliant
 */

import { FileText, Mail, BookOpen, FileSpreadsheet } from 'lucide-react';
import type { Document } from '@/hooks/useDocuments';

interface DocumentRowProps {
  readonly document: Document;
  readonly isSelected?: boolean;
  readonly onClick?: () => void;
}

const typeIcons: Record<string, React.ComponentType<{ readonly className?: string }>> = {
  contract: FileText,
  email: Mail,
  meeting_notes: BookOpen,
  quotation: FileSpreadsheet,
};

const typeLabels: Record<string, string> = {
  contract: '合約',
  email: '郵件',
  meeting_notes: '會議',
  quotation: '報價',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export function DocumentRow({ document, isSelected, onClick }: DocumentRowProps) {
  const Icon = typeIcons[document.type] ?? FileText;
  const typeLabel = typeLabels[document.type] ?? document.type;
  const hasAnalysis = (document._count?.analyses ?? 0) > 0;
  const customerName = document.customer?.name;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[56px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2
        ${isSelected ? 'bg-background-hover' : 'hover:bg-background-hover/50'}
      `}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {document.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {typeLabel}
          {customerName ? ` · ${customerName}` : ''}
          {' · '}
          {formatDate(document.createdAt)}
          {document.fileSize ? ` · ${formatFileSize(document.fileSize)}` : ''}
        </p>
      </div>
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAnalysis ? 'bg-success' : 'bg-text-muted'}`}
        aria-label={hasAnalysis ? 'AI 已分析' : '未分析'}
        role="img"
      />
    </button>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
