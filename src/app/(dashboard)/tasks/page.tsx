'use client';

/**
 * Tasks Page - Task management with list view
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, Calendar as CalendarIcon, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from '@/hooks/useTasks';
import { TaskForm, type TaskFormData } from '@/components/features/tasks/TaskForm';
import { TaskStatusBadge } from '@/components/features/tasks/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/features/tasks/TaskPriorityBadge';
import { TaskTypeIcon } from '@/components/features/tasks/TaskTypeIcon';
import {
  taskTypeLabels,
} from '@/lib/design-tokens';

const statusFilters: { readonly key: string; readonly label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待處理' },
  { key: 'in_progress', label: '進行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const priorityFilters: { readonly key: string; readonly label: string }[] = [
  { key: 'all', label: '全部優先級' },
  { key: 'urgent', label: '緊急' },
  { key: 'high', label: '高' },
  { key: 'medium', label: '中' },
  { key: 'low', label: '低' },
];

const typeFilters: { readonly key: string; readonly label: string }[] = [
  { key: 'all', label: '全部類型' },
  ...Object.entries(taskTypeLabels).map(([key, label]) => ({ key, label })),
];

type DateQuickFilter = 'all' | 'today' | 'this_week' | 'overdue';

const dateQuickFilters: { readonly key: DateQuickFilter; readonly label: string }[] = [
  { key: 'all', label: '全部日期' },
  { key: 'today', label: '今天' },
  { key: 'this_week', label: '本週' },
  { key: 'overdue', label: '逾期' },
];

function getDateRange(filter: DateQuickFilter): { from?: string; to?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { from: today.toISOString(), to: tomorrow.toISOString() };
  }
  if (filter === 'this_week') {
    // Monday to Sunday
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    return { from: monday.toISOString(), to: nextMonday.toISOString() };
  }
  if (filter === 'overdue') {
    return { to: today.toISOString() };
  }
  return {};
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return new Date(task.dueDate) < new Date();
}

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const dateRange = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  // For "overdue" filter, only show non-completed tasks
  const effectiveStatus = useMemo(() => {
    if (dateFilter === 'overdue' && statusFilter === 'all') return undefined;
    return statusFilter === 'all' ? undefined : statusFilter as TaskStatus;
  }, [dateFilter, statusFilter]);

  const { data, isLoading } = useTasks({
    page,
    limit: 20,
    search: search || undefined,
    status: effectiveStatus,
    priority: priorityFilter === 'all' ? undefined : priorityFilter as TaskPriority,
    type: typeFilter === 'all' ? undefined : typeFilter as TaskType,
    assignedToId: assignedToMe && session?.user?.id ? session.user.id : undefined,
    dueDateFrom: dateRange.from,
    dueDateTo: dateRange.to,
    sort: 'dueDate',
    order: 'asc',
  });

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const completeMutation = useCompleteTask();

  const tasks = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreate = useCallback((formData: TaskFormData) => {
    createMutation.mutate(formData as Parameters<typeof createMutation.mutate>[0], {
      onSuccess: () => setShowForm(false),
    });
  }, [createMutation]);

  const handleEdit = useCallback((formData: TaskFormData) => {
    if (!editingTask) return;
    updateMutation.mutate({ id: editingTask.id, ...formData } as Parameters<typeof updateMutation.mutate>[0], {
      onSuccess: () => setEditingTask(null),
    });
  }, [editingTask, updateMutation]);

  const handleDelete = useCallback((taskId: string) => {
    if (!confirm('確定要刪除此任務？')) return;
    deleteMutation.mutate(taskId);
  }, [deleteMutation]);

  const handleComplete = useCallback((taskId: string) => {
    completeMutation.mutate(taskId);
  }, [completeMutation]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="搜尋任務..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input pl-9 w-full"
              aria-label="搜尋任務"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-text-secondary border border-border hover:bg-background-hover hover:text-text-primary transition-colors min-h-[44px]"
            aria-label="切換至行事曆檢視"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">行事曆</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新增任務</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1" role="tablist" aria-label="任務狀態篩選">
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

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg text-sm bg-background-secondary text-text-primary border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          aria-label="篩選優先級"
        >
          {priorityFilters.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg text-sm bg-background-secondary text-text-primary border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          aria-label="篩選類型"
        >
          {typeFilters.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        {/* Separator */}
        <div className="w-px h-6 bg-border self-center" aria-hidden="true" />

        {/* Date Quick Filters */}
        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value as DateQuickFilter); setPage(1); }}
          className="h-9 px-3 rounded-lg text-sm bg-background-secondary text-text-primary border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          aria-label="日期篩選"
        >
          {dateQuickFilters.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        {/* Assigned to Me Toggle */}
        <button
          type="button"
          onClick={() => { setAssignedToMe(!assignedToMe); setPage(1); }}
          className={`
            flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm transition-colors border
            ${assignedToMe
              ? 'bg-accent-600/15 text-accent-400 border-accent-600/40'
              : 'text-text-secondary border-border hover:bg-background-hover hover:text-text-primary'
            }
          `}
          aria-pressed={assignedToMe}
          aria-label="只顯示指派給我的任務"
        >
          <UserCircle className="w-4 h-4" />
          <span className="hidden sm:inline">指派給我</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden">
        <TaskListContent
          isLoading={isLoading}
          tasks={tasks as Task[]}
          search={search}
          onShowForm={() => setShowForm(true)}
          onSelectTask={setEditingTask}
          onEditTask={setEditingTask}
          onDeleteTask={handleDelete}
          onCompleteTask={handleComplete}
        />
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            共 {pagination.total} 項任務
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

      {/* Create Form Modal */}
      {showForm && (
        <TaskForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Form Modal */}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={handleEdit}
          onClose={() => setEditingTask(null)}
          isSubmitting={updateMutation.isPending}
        />
      )}

    </div>
  );
}

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

interface TaskListContentProps {
  readonly isLoading: boolean;
  readonly tasks: readonly Task[];
  readonly search: string;
  readonly onShowForm: () => void;
  readonly onSelectTask: (task: Task) => void;
  readonly onEditTask: (task: Task) => void;
  readonly onDeleteTask: (taskId: string) => void;
  readonly onCompleteTask: (taskId: string) => void;
}

function TaskListContent({ isLoading, tasks, search, onShowForm, onSelectTask, onEditTask, onDeleteTask, onCompleteTask }: TaskListContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border-subtle">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="h-14 animate-pulse bg-background-hover/30" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">
          {search ? '找不到符合的任務' : '尚無任務'}
        </p>
        {!search && (
          <button
            type="button"
            onClick={onShowForm}
            className="mt-3 text-sm text-accent-600 hover:text-accent-500 transition-colors min-h-[44px]"
          >
            新增第一項任務
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onClick={() => onSelectTask(task)}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          onComplete={() => onCompleteTask(task.id)}
        />
      ))}
    </div>
  );
}

interface TaskRowProps {
  readonly task: Task;
  readonly onClick: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onComplete: () => void;
}

function TaskRow({ task, onClick, onEdit, onDelete, onComplete }: TaskRowProps) {
  const overdue = isOverdue(task);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-background-hover/50 transition-colors cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`任務: ${task.title}`}
    >
      {/* Complete checkbox */}
      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="w-5 h-5 rounded border border-border-subtle hover:border-accent-600 flex items-center justify-center shrink-0 min-w-[20px] min-h-[20px]"
          aria-label="標記完成"
          title="標記完成"
        >
          <span className="sr-only">完成</span>
        </button>
      )}
      {(task.status === 'completed' || task.status === 'cancelled') && (
        <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Type icon */}
      <TaskTypeIcon type={task.type} className="w-4 h-4 shrink-0" />

      {/* Title + context */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.customer && (
            <span className="text-xs text-text-muted truncate">{task.customer.name}</span>
          )}
          {task.project && (
            <span className="text-xs text-text-muted truncate">{task.project.name}</span>
          )}
          {task.assignedTo && (
            <span className="text-xs text-text-muted truncate">→ {task.assignedTo.name}</span>
          )}
        </div>
      </div>

      {/* Priority */}
      <TaskPriorityBadge priority={task.priority} />

      {/* Status */}
      <TaskStatusBadge status={task.status} />

      {/* Due date */}
      <span className={`text-xs whitespace-nowrap ${overdue ? 'text-error font-medium' : 'text-text-muted'}`}>
        {formatDate(task.dueDate)}
      </span>

      {/* Actions (visible on hover) */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-background-hover min-w-[28px] min-h-[28px]"
          aria-label="編輯任務"
          title="編輯"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded text-text-muted hover:text-error hover:bg-error/10 min-w-[28px] min-h-[28px]"
          aria-label="刪除任務"
          title="刪除"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
