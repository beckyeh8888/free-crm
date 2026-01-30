'use client';

/**
 * DocumentPreview - Right panel for document details and AI analysis
 * WCAG 2.2 AAA Compliant
 */

import {
  FileText,
  Mail,
  BookOpen,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  Pencil,
  Download,
} from 'lucide-react';
import type { Document, DocumentAnalysis } from '@/hooks/useDocuments';
import { AIAnalysisPanel } from './AIAnalysisPanel';

interface DocumentPreviewProps {
  readonly document: Document & {
    readonly analyses?: readonly DocumentAnalysis[];
  };
  readonly onAnalyze?: () => void;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly onDownload?: () => void;
  readonly isAnalyzing?: boolean;
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
  meeting_notes: '會議記錄',
  quotation: '報價單',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ActionButtonProps {
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly label: string;
  readonly onClick?: () => void;
  readonly variant?: 'default' | 'danger' | 'accent';
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default' }: ActionButtonProps) {
  const colorClasses = {
    default: 'text-text-secondary hover:text-text-primary hover:bg-background-hover',
    danger: 'text-text-secondary hover:text-error hover:bg-error/10',
    accent: 'text-accent-600 hover:text-accent-500 hover:bg-accent-600/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${colorClasses[variant]}`}
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function DocumentPreview({
  document,
  onAnalyze,
  onEdit,
  onDelete,
  onDownload,
  isAnalyzing,
}: DocumentPreviewProps) {
  const Icon = typeIcons[document.type] ?? FileText;
  const typeLabel = typeLabels[document.type] ?? document.type;
  const latestAnalysis = document.analyses?.[0] ?? null;
  const hasContent = !!document.content?.trim();
  const hasFile = !!document.filePath;

  return (
    <div className="flex flex-col h-full">
      {/* Document Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-text-primary truncate">
            {document.name}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {typeLabel}
            {document.customer?.name ? ` · ${document.customer.name}` : ''}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {formatDate(document.createdAt)}
            {document.fileSize ? ` · ${formatFileSize(document.fileSize)}` : ''}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 mb-4">
        <ActionButton icon={Pencil} label="編輯" onClick={onEdit} />
        <ActionButton icon={Sparkles} label="AI 分析" onClick={onAnalyze} variant="accent" />
        {hasFile && (
          <ActionButton icon={Download} label="下載檔案" onClick={onDownload} />
        )}
        <div className="flex-1" />
        <ActionButton icon={Trash2} label="刪除" onClick={onDelete} variant="danger" />
      </div>

      <hr className="border-border-subtle mb-4" />

      {/* Content Preview */}
      {hasContent && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">內容</h3>
          <div className="bg-background-secondary rounded-lg p-3 max-h-48 overflow-auto">
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {document.content}
            </p>
          </div>
        </div>
      )}

      {hasFile && !hasContent && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">檔案資訊</h3>
          <div className="bg-background-secondary rounded-lg p-3 flex items-center gap-3">
            <FileText className="w-8 h-8 text-text-muted" />
            <div>
              <p className="text-sm text-text-primary font-medium">{document.name}</p>
              <p className="text-xs text-text-muted">
                {document.mimeType ?? '未知類型'}
                {document.fileSize ? ` · ${formatFileSize(document.fileSize)}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasContent && !hasFile && (
        <div className="mb-4 py-6 text-center">
          <p className="text-sm text-text-muted">無文件內容</p>
        </div>
      )}

      <hr className="border-border-subtle mb-4" />

      {/* AI Analysis */}
      <div className="flex-1 overflow-auto">
        <AIAnalysisPanel
          analysis={latestAnalysis}
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
          hasContent={hasContent}
        />
      </div>
    </div>
  );
}
