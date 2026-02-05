'use client';

/**
 * TaskDetailModal - View task details modal
 * Sprint 5: Calendar & Gantt Chart
 */

import { X, Calendar, Clock, User, FolderKanban, Building2, Edit2 } from 'lucide-react';
import { TaskTypeIcon } from './TaskTypeIcon';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { CalendarEvent } from '@/hooks/useCalendar';

interface TaskDetailModalProps {
  readonly event: CalendarEvent;
  readonly onClose: () => void;
  readonly onEdit?: () => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  return timeString;
}

export function TaskDetailModal({ event, onClose, onEdit }: TaskDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      <dialog
        open
        className="relative w-full max-w-md bg-background-tertiary border border-border rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto"
        aria-label="任務詳情"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-background-tertiary">
          <div className="flex items-center gap-3">
            <TaskTypeIcon type={event.type} className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-text-primary">
              任務詳情
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
                aria-label="編輯"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
              aria-label="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-text-primary">
              {event.title}
            </h3>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            <TaskStatusBadge status={event.status} />
            <TaskPriorityBadge priority={event.priority} />
          </div>

          {/* Progress */}
          {event.progress !== undefined && event.progress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-secondary">進度</span>
                <span className="text-sm font-medium text-text-primary">{event.progress}%</span>
              </div>
              <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-600 rounded-full transition-all"
                  style={{ width: `${event.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-text-secondary">日期：</span>
              <span className="text-text-primary">
                {event.start === event.end
                  ? formatDate(event.start)
                  : `${formatDate(event.start)} ~ ${formatDate(event.end)}`}
              </span>
            </div>
            {event.time && !event.isAllDay && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">時間：</span>
                <span className="text-text-primary">{formatTime(event.time)}</span>
              </div>
            )}
          </div>

          {/* Related Info */}
          <div className="space-y-3 pt-2 border-t border-border">
            {event.assignee && (
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">負責人：</span>
                <span className="text-text-primary">{event.assignee.name || '未指派'}</span>
              </div>
            )}
            {event.project && (
              <div className="flex items-center gap-3 text-sm">
                <FolderKanban className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">專案：</span>
                <span className="text-text-primary">{event.project.name}</span>
              </div>
            )}
            {event.customer && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">客戶：</span>
                <span className="text-text-primary">{event.customer.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              關閉
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 transition-colors min-h-[44px] flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                編輯任務
              </button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
