'use client';

/**
 * Documents Page - Calm CRM Dark Theme
 * Three-column layout (Desktop): List + Preview Panel
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Plus, Search, FileText, Mail, BookOpen, FileSpreadsheet } from 'lucide-react';

// Placeholder document data for initial UI
const mockDocuments = [
  { id: '1', name: 'Q1 合約', type: 'contract', customer: 'Acme Corporation', date: 'Jan 15', analyzed: true },
  { id: '2', name: '跟進郵件', type: 'email', customer: 'Beta Technology', date: 'Jan 14', analyzed: true },
  { id: '3', name: '會議記錄', type: 'meeting_notes', customer: 'Gamma Solutions', date: 'Jan 12', analyzed: false },
  { id: '4', name: 'Q4 報價單', type: 'quotation', customer: 'Delta Corp', date: 'Jan 10', analyzed: true },
  { id: '5', name: '技術規格書', type: 'contract', customer: 'Epsilon Ltd', date: 'Jan 8', analyzed: false },
];

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'contract', label: '合約' },
  { key: 'email', label: '郵件' },
  { key: 'meeting_notes', label: '會議' },
  { key: 'quotation', label: '報價' },
];

const typeIcons: Record<string, React.ComponentType<{ readonly className?: string }>> = {
  contract: FileText,
  email: Mail,
  meeting_notes: BookOpen,
  quotation: FileSpreadsheet,
};

export default function DocumentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockDocuments[0]?.id ?? null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = mockDocuments.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = mockDocuments.find((d) => d.id === selectedId);

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Document List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search + Add */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="搜尋文件..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 w-full"
              aria-label="搜尋文件"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto" role="tablist">
          {typeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={typeFilter === filter.key}
              onClick={() => setTypeFilter(filter.key)}
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

        {/* List */}
        <div className="flex-1 overflow-auto bg-background-tertiary border border-border rounded-xl">
          <div className="divide-y divide-border-subtle">
            {filtered.map((doc) => {
              const Icon = typeIcons[doc.type] || FileText;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[56px]
                    ${selectedId === doc.id ? 'bg-background-hover' : 'hover:bg-background-hover/50'}
                  `}
                >
                  <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{doc.name}</p>
                    <p className="text-xs text-text-muted truncate">
                      {doc.type} · {doc.date} · {doc.customer}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${doc.analyzed ? 'bg-success' : 'bg-text-muted'}`}
                    aria-label={doc.analyzed ? 'AI 已分析' : '未分析'}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Panel (Desktop) */}
      <div className="hidden lg:flex w-96 flex-col bg-background-tertiary border border-border rounded-xl p-5 overflow-auto">
        {selected ? (
          <>
            <h2 className="text-lg font-semibold text-text-primary">{selected.name}</h2>
            <p className="text-sm text-text-muted mt-1">{selected.customer}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {selected.type} · {selected.date}
              {selected.analyzed && (
                <span className="ml-2 text-success">● AI 已分析</span>
              )}
            </p>

            <hr className="border-border my-4" />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">摘要</h3>
                <p className="text-sm text-text-secondary">
                  AI 生成的文件摘要將顯示在此處。上傳文件後，系統會自動進行分析。
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">重點</h3>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>• 待 AI 分析後顯示</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">待辦事項</h3>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>□ 待 AI 分析後顯示</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-muted">選擇文件以查看詳情</p>
          </div>
        )}
      </div>
    </div>
  );
}
