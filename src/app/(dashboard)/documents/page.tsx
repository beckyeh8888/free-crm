'use client';

/**
 * Documents Page - Calm CRM Dark Theme
 * Two-column layout (Desktop): List + Preview Panel
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUploadDocument,
  useDeleteDocument,
  useAnalyzeDocument,
  useDocumentDownload,
  type Document,
} from '@/hooks/useDocuments';
import { DocumentRow } from '@/components/features/documents/DocumentRow';
import { DocumentForm, type DocumentFormData } from '@/components/features/documents/DocumentForm';
import { DocumentPreview } from '@/components/features/documents/DocumentPreview';

// ============================================
// Constants
// ============================================

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'contract', label: '合約' },
  { key: 'email', label: '郵件' },
  { key: 'meeting_notes', label: '會議' },
  { key: 'quotation', label: '報價' },
] as const;

// ============================================
// Sub-components (avoid nested ternary S3358)
// ============================================

interface DocumentListContentProps {
  readonly isLoading: boolean;
  readonly documents: readonly Document[];
  readonly search: string;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onShowForm: () => void;
}

function DocumentListContent({
  isLoading,
  documents,
  search,
  selectedId,
  onSelect,
  onShowForm,
}: DocumentListContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border-subtle">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="h-14 animate-pulse bg-background-hover/30" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">
          {search ? '找不到符合的文件' : '尚無文件資料'}
        </p>
        {!search && (
          <button
            type="button"
            onClick={onShowForm}
            className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
          >
            新增第一份文件
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          isSelected={selectedId === doc.id}
          onClick={() => onSelect(doc.id)}
        />
      ))}
    </div>
  );
}

// ============================================
// Pagination Sub-component
// ============================================

interface PaginationBarProps {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
}

function PaginationBar({ page, totalPages, total, onPageChange }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
      <span className="text-xs text-text-muted">共 {total} 筆</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[32px]"
          aria-label="上一頁"
        >
          上一頁
        </button>
        <span className="text-xs text-text-muted px-2">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[32px]"
          aria-label="下一頁"
        >
          下一頁
        </button>
      </div>
    </div>
  );
}

// ============================================
// Empty Preview Panel
// ============================================

function EmptyPreview() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-text-muted">選擇文件以查看詳情</p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function DocumentsPage() {
  // State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Data hooks
  const { data: listData, isLoading } = useDocuments({
    page,
    limit: 20,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const { data: detailData } = useDocument(selectedId ?? '');

  // Mutation hooks
  const createMutation = useCreateDocument();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const analyzeMutation = useAnalyzeDocument();
  const downloadMutation = useDocumentDownload();

  // Derived data
  const documents = listData?.data ?? [];
  const pagination = listData?.pagination;
  const selectedDoc = detailData?.data;

  // Event handlers
  const handleCreate = useCallback((formData: DocumentFormData) => {
    createMutation.mutate(formData as unknown as Partial<Document>, {
      onSuccess: () => setShowForm(false),
    });
  }, [createMutation]);

  const handleUpload = useCallback((formData: FormData) => {
    uploadMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
    });
  }, [uploadMutation]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    deleteMutation.mutate(selectedId, {
      onSuccess: () => setSelectedId(null),
    });
  }, [selectedId, deleteMutation]);

  const handleAnalyze = useCallback(() => {
    if (!selectedId) return;
    analyzeMutation.mutate(selectedId);
  }, [selectedId, analyzeMutation]);

  const handleDownload = useCallback(() => {
    if (!selectedId) return;
    downloadMutation.mutate(selectedId);
  }, [selectedId, downloadMutation]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleShowForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((key: string) => {
    setTypeFilter(key);
    setPage(1);
  }, []);

  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Document List Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search + Add */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="search"
                placeholder="搜尋文件..."
                value={search}
                onChange={handleSearchChange}
                className="form-input pl-9 w-full"
                aria-label="搜尋文件"
              />
            </div>
            <button
              type="button"
              onClick={handleShowForm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
              aria-label="新增文件"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto" role="tablist" aria-label="文件類型篩選">
            {typeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={typeFilter === filter.key}
                onClick={() => handleTypeChange(filter.key)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors min-h-[32px]
                  ${typeFilter === filter.key
                    ? 'bg-accent-600 text-white'
                    : 'text-text-secondary hover:bg-background-hover'}
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-auto bg-background-tertiary border border-border rounded-xl flex flex-col">
            <div className="flex-1 overflow-auto">
              <DocumentListContent
                isLoading={isLoading}
                documents={documents}
                search={search}
                selectedId={selectedId}
                onSelect={handleSelect}
                onShowForm={handleShowForm}
              />
            </div>

            {/* Pagination */}
            {pagination && (
              <PaginationBar
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>

        {/* Preview Panel (Desktop) */}
        <div className="hidden lg:flex w-96 flex-col bg-background-tertiary border border-border rounded-xl p-5 overflow-auto">
          {selectedDoc ? (
            <DocumentPreview
              document={selectedDoc}
              onAnalyze={handleAnalyze}
              onEdit={() => {/* TODO: implement edit modal */}}
              onDelete={handleDelete}
              onDownload={handleDownload}
              isAnalyzing={analyzeMutation.isPending}
            />
          ) : (
            <EmptyPreview />
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {showForm && (
        <DocumentForm
          onSubmit={handleCreate}
          onUpload={handleUpload}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending || uploadMutation.isPending}
        />
      )}
    </>
  );
}
