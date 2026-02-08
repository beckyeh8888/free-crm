'use client';

/**
 * Projects Page - Project management with list view
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback } from 'react';
import { Plus, Search, FolderKanban, X } from 'lucide-react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type Project,
  type CreateProjectData,
} from '@/hooks/useProjects';
import type { ProjectStatus } from '@/lib/validation';

const statusFilters: { readonly key: string; readonly label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '進行中' },
  { key: 'completed', label: '已完成' },
  { key: 'on_hold', label: '暫停' },
  { key: 'cancelled', label: '已取消' },
];

const statusLabels: Record<string, string> = {
  active: '進行中',
  completed: '已完成',
  on_hold: '暫停',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  active: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  on_hold: 'text-amber-400 bg-amber-400/10',
  cancelled: 'text-text-muted bg-background-secondary',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data, isLoading } = useProjects({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter as ProjectStatus,
  });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const projects = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreate = useCallback((formData: CreateProjectData) => {
    createMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
    });
  }, [createMutation]);

  const handleEdit = useCallback((formData: CreateProjectData) => {
    if (!editingProject) return;
    updateMutation.mutate({ id: editingProject.id, ...formData }, {
      onSuccess: () => setEditingProject(null),
    });
  }, [editingProject, updateMutation]);

  const handleDelete = useCallback((projectId: string) => {
    if (!confirm('確定要刪除此專案？關聯的任務不會被刪除。')) return;
    deleteMutation.mutate(projectId, {
      onSuccess: () => {
        if (selectedProject?.id === projectId) setSelectedProject(null);
      },
    });
  }, [deleteMutation, selectedProject]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="搜尋專案..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input pl-9 w-full"
              aria-label="搜尋專案"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增專案</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1" role="tablist" aria-label="專案狀態篩選">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.key}
            onClick={() => {
              setStatusFilter(filter.key);
              setPage(1);
            }}
            className={`
              px-3 py-1.5 rounded-lg text-sm transition-colors min-h-[36px]
              ${
                statusFilter === filter.key
                  ? 'bg-accent-600 text-white'
                  : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Project List */}
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
        <ProjectListContent
          isLoading={isLoading}
          projects={projects as Project[]}
          search={search}
          onShowForm={() => setShowForm(true)}
          onSelectProject={setSelectedProject}
          onEditProject={setEditingProject}
          onDeleteProject={handleDelete}
        />
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            共 {pagination.total} 個專案
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
            >
              上一頁
            </button>
            <span className="px-3 py-1.5 text-sm text-text-muted">
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {(showForm || editingProject) && (
        <ProjectFormModal
          project={editingProject}
          onSubmit={editingProject ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingProject(null); }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Detail Panel */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEdit={() => setEditingProject(selectedProject)}
          onDelete={() => handleDelete(selectedProject.id)}
        />
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

interface ProjectListContentProps {
  readonly isLoading: boolean;
  readonly projects: readonly Project[];
  readonly search: string;
  readonly onShowForm: () => void;
  readonly onSelectProject: (project: Project) => void;
  readonly onEditProject: (project: Project) => void;
  readonly onDeleteProject: (projectId: string) => void;
}

function ProjectListContent({ isLoading, projects, search, onShowForm, onSelectProject, onEditProject, onDeleteProject }: ProjectListContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border-subtle">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="h-16 animate-pulse bg-background-hover/30" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center">
        <FolderKanban className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-muted">
          {search ? '找不到符合的專案' : '尚無專案'}
        </p>
        {!search && (
          <button
            type="button"
            onClick={onShowForm}
            className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
          >
            新增第一個專案
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 px-4 py-3 hover:bg-background-hover/50 transition-colors cursor-pointer group"
          onClick={() => onSelectProject(project)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProject(project); } }}
          aria-label={`專案: ${project.name}`}
        >
          {/* Color dot */}
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#3B82F6' }}
          />

          {/* Name + customer */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate font-medium">{project.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {project.customer && (
                <span className="text-xs text-text-muted truncate">{project.customer.name}</span>
              )}
              {project._count && (
                <span className="text-xs text-text-muted">{project._count.tasks} 任務</span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] ?? 'text-text-muted bg-background-secondary'}`}>
            {statusLabels[project.status] ?? project.status}
          </span>

          {/* Dates */}
          <span className="text-xs text-text-muted whitespace-nowrap hidden md:block">
            {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
          </span>

          {/* Actions (visible on hover) */}
          <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-background-hover min-w-[28px] min-h-[28px]"
              aria-label="編輯專案"
              title="編輯"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onDeleteProject(project.id)}
              className="p-1.5 rounded text-text-muted hover:text-error hover:bg-error/10 min-w-[28px] min-h-[28px]"
              aria-label="刪除專案"
              title="刪除"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Project Form Modal
// ============================================

interface ProjectFormModalProps {
  readonly project?: Project | null;
  readonly onSubmit: (data: CreateProjectData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
}

function ProjectFormModal({ project, onSubmit, onClose, isSubmitting }: ProjectFormModalProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'active');
  const [startDate, setStartDate] = useState(project?.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(project?.endDate?.split('T')[0] || '');
  const [color, setColor] = useState(project?.color || '#3B82F6');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-background-tertiary border border-border rounded-xl w-full max-w-md mx-4 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={project ? '編輯專案' : '新增專案'}
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {project ? '編輯專案' : '新增專案'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-xs font-medium text-text-secondary mb-1.5">
              專案名稱 *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input w-full"
              placeholder="輸入專案名稱"
            />
          </div>

          <div>
            <label htmlFor="project-desc" className="block text-xs font-medium text-text-secondary mb-1.5">
              說明
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="form-input w-full resize-none"
              placeholder="專案說明"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-status" className="block text-xs font-medium text-text-secondary mb-1.5">
                狀態
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="form-input w-full"
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="project-color" className="block text-xs font-medium text-text-secondary mb-1.5">
                顏色
              </label>
              <input
                id="project-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-border cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-start" className="block text-xs font-medium text-text-secondary mb-1.5">
                開始日期
              </label>
              <input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label htmlFor="project-end" className="block text-xs font-medium text-text-secondary mb-1.5">
                結束日期
              </label>
              <input
                id="project-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2.5 rounded-lg text-sm bg-accent-600 text-white hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? '儲存中...' : (project ? '更新' : '建立')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Project Detail Panel
// ============================================

interface ProjectDetailPanelProps {
  readonly project: Project;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function ProjectDetailPanel({ project, onClose, onEdit, onDelete }: ProjectDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-background-tertiary border-l border-border w-full max-w-md h-full overflow-auto p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="專案詳情"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary truncate">{project.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#3B82F6' }} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] ?? 'text-text-muted bg-background-secondary'}`}>
            {statusLabels[project.status] ?? project.status}
          </span>
          {project._count && (
            <span className="text-xs text-text-muted">{project._count.tasks} 任務</span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">說明</h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {/* Info */}
        <div className="space-y-2 mb-4">
          {project.customer && (
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">客戶</span>
              <span className="text-xs text-text-primary">{project.customer.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-xs text-text-muted">開始日期</span>
            <span className="text-xs text-text-primary">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-muted">結束日期</span>
            <span className="text-xs text-text-primary">{formatDate(project.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-muted">建立時間</span>
            <span className="text-xs text-text-primary">{formatDate(project.createdAt)}</span>
          </div>
        </div>

        <hr className="border-border-subtle mb-4" />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-background-hover transition-colors min-h-[44px]"
          >
            編輯
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2.5 rounded-lg text-sm text-error border border-error/30 hover:bg-error/10 transition-colors min-h-[44px]"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );
}
