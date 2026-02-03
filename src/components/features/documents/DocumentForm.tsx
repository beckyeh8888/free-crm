'use client';

/**
 * DocumentForm - Create/edit document modal
 * Supports text content input and file upload
 * WCAG 2.2 AAA Compliant
 */

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import type { Document } from '@/hooks/useDocuments';

export interface DocumentFormData {
  readonly name: string;
  readonly type: string;
  readonly content: string;
  readonly customerId: string;
}

interface DocumentFormProps {
  readonly document?: Document | null;
  readonly onSubmit: (data: DocumentFormData) => void;
  readonly onUpload?: (formData: FormData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
}

const typeOptions = [
  { value: 'contract', label: '合約' },
  { value: 'email', label: '郵件' },
  { value: 'meeting_notes', label: '會議記錄' },
  { value: 'quotation', label: '報價單' },
] as const;

type InputMode = 'text' | 'file';

interface FormFieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}

function FormField({ label, htmlFor, required, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

function getSubmitLabel(isSubmitting: boolean, isEdit: boolean): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新文件';
  return '建立文件';
}

export function DocumentForm({ document, onSubmit, onUpload, onClose, isSubmitting }: DocumentFormProps) {
  const isEdit = !!document;
  const [mode, setMode] = useState<InputMode>('text');
  const [formData, setFormData] = useState<DocumentFormData>({
    name: document?.name ?? '',
    type: document?.type ?? 'contract',
    content: document?.content ?? '',
    customerId: document?.customerId ?? '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof DocumentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode === 'file' && selectedFile && onUpload) {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('name', formData.name || selectedFile.name);
      fd.append('type', formData.type);
      if (formData.customerId) {
        fd.append('customerId', formData.customerId);
      }
      onUpload(fd);
    } else {
      onSubmit(formData);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        handleChange('name', file.name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        handleChange('name', file.name);
      }
    }
  };

  const canSubmit = formData.name.trim().length > 0 && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <dialog
        open
        aria-label={isEdit ? '編輯文件' : '新增文件'}
        className="relative bg-background-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl m-0 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? '編輯文件' : '新增文件'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        {!isEdit && (
          <div className="flex gap-1 px-5 pt-4" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'text'}
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                mode === 'text'
                  ? 'bg-accent-600 text-white'
                  : 'text-text-secondary hover:bg-background-hover'
              }`}
            >
              文字輸入
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'file'}
              onClick={() => setMode('file')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                mode === 'file'
                  ? 'bg-accent-600 text-white'
                  : 'text-text-secondary hover:bg-background-hover'
              }`}
            >
              檔案上傳
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="文件名稱" htmlFor="doc-name" required>
            <input
              id="doc-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input w-full"
              placeholder="輸入文件名稱"
              required
            />
          </FormField>

          <FormField label="文件類型" htmlFor="doc-type">
            <select
              id="doc-type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="form-input w-full"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          {mode === 'text' ? (
            <FormField label="文件內容" htmlFor="doc-content">
              <textarea
                id="doc-content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="form-input w-full"
                rows={8}
                placeholder="輸入文件內容（合約條文、郵件內容、會議記錄等）"
              />
            </FormField>
          ) : (
            <div>
              <label htmlFor="doc-file-upload" className="block text-sm font-medium text-text-secondary mb-1.5">
                上傳檔案
              </label>
              <button
                type="button"
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors min-h-[120px]
                  flex flex-col items-center justify-center gap-2 w-full bg-transparent
                  ${isDragOver ? 'border-accent-600 bg-accent-600/10' : 'border-border hover:border-accent-600/50'}
                `}
                aria-label="拖放或點擊上傳檔案"
              >
                {selectedFile ? (
                  <>
                    <FileText className="w-8 h-8 text-accent-600" />
                    <p className="text-sm text-text-primary font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-text-muted">
                      {(selectedFile.size / 1024).toFixed(0)} KB · {selectedFile.type || '未知類型'}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-text-muted" />
                    <p className="text-sm text-text-secondary">拖放檔案至此處</p>
                    <p className="text-xs text-text-muted">或點擊選擇檔案</p>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                id="doc-file-upload"
                type="file"
                onChange={handleFileSelect}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          )}

          <FormField label="關聯客戶 ID（選填）" htmlFor="doc-customer">
            <input
              id="doc-customer"
              type="text"
              value={formData.customerId}
              onChange={(e) => handleChange('customerId', e.target.value)}
              className="form-input w-full"
              placeholder="輸入客戶 ID"
            />
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(!!isSubmitting, isEdit)}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
