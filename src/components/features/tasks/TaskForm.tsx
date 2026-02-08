'use client';

/**
 * TaskForm - Create/Edit task modal form
 * Sprint 5: Calendar & Gantt Chart
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  taskTypeLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from '@/lib/design-tokens';
import { CustomerCombobox } from '@/components/ui/CustomerCombobox';
import type { Task } from '@/hooks/useTasks';

interface TaskFormProps {
  readonly task?: Task | null;
  readonly onSubmit: (data: TaskFormData) => void;
  readonly onClose: () => void;
  readonly isSubmitting?: boolean;
  readonly initialDate?: Date;
  readonly initialCustomerId?: string;
  readonly initialCustomerName?: string;
}

export interface TaskFormData {
  readonly title: string;
  readonly description: string;
  readonly type: string;
  readonly priority: string;
  readonly status: string;
  readonly startDate: string;
  readonly dueDate: string;
  readonly dueTime: string;
  readonly isAllDay: boolean;
  readonly progress: number;
  readonly projectId: string;
  readonly customerId: string;
  readonly dealId: string;
}

const typeOptions = Object.entries(taskTypeLabels);
const priorityOptions = Object.entries(taskPriorityLabels);
const statusOptions = Object.entries(taskStatusLabels);

function getSubmitLabel(isSubmitting: boolean | undefined, isEdit: boolean): string {
  if (isSubmitting) return '儲存中...';
  if (isEdit) return '更新';
  return '建立';
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function TaskForm({
  task,
  onSubmit,
  onClose,
  isSubmitting,
  initialDate,
  initialCustomerId,
  initialCustomerName,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'task',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    startDate: formatDate(task?.startDate) || formatDate(initialDate) || formatDate(new Date()),
    dueDate: formatDate(task?.dueDate) || formatDate(initialDate) || formatDate(new Date()),
    dueTime: task?.dueTime || '',
    isAllDay: task?.isAllDay ?? true,
    progress: task?.progress ?? 0,
    projectId: task?.project?.id || '',
    customerId: task?.customer?.id || initialCustomerId || '',
    dealId: task?.deal?.id || '',
  });

  const handleChange = (field: keyof TaskFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const dialogLabel = task ? '編輯任務' : '新增任務';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      <dialog
        open
        className="relative w-full max-w-lg bg-background-tertiary border border-border rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto"
        aria-label={dialogLabel}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-background-tertiary">
          <h2 className="text-lg font-semibold text-text-primary">
            {dialogLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background-hover transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-5 space-y-4"
        >
          {/* Title */}
          <label className="block">
            <span className="text-sm text-text-secondary mb-1 block">
              標題 <span className="text-error">*</span>
            </span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="form-input"
              required
            />
          </label>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">類型</span>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="form-input"
              >
                {typeOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">優先級</span>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="form-input"
              >
                {priorityOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">狀態</span>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input"
              >
                {statusOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">進度 (%)</span>
              <input
                type="number"
                value={formData.progress}
                onChange={(e) => handleChange('progress', Number(e.target.value))}
                className="form-input"
                min={0}
                max={100}
              />
            </label>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">開始日期</span>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="form-input"
              />
            </label>
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">截止日期</span>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="form-input"
              />
            </label>
          </div>

          {/* Time & All Day */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-text-secondary mb-1 block">時間</span>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleChange('dueTime', e.target.value)}
                className="form-input"
                disabled={formData.isAllDay}
              />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => handleChange('isAllDay', e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent-600 focus:ring-accent-600"
              />
              <span className="text-sm text-text-secondary">全天事件</span>
            </label>
          </div>

          {/* Description */}
          <label className="block">
            <span className="text-sm text-text-secondary mb-1 block">描述</span>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="form-input resize-none"
              rows={3}
            />
          </label>

          {/* Customer Picker */}
          <div className="block">
            <span className="text-sm text-text-secondary mb-1 block">客戶（選填）</span>
            <CustomerCombobox
              value={formData.customerId}
              initialName={task?.customer?.name ?? initialCustomerName}
              onChange={(id) => handleChange('customerId', id)}
            />
          </div>

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
              disabled={isSubmitting || !formData.title}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {getSubmitLabel(isSubmitting, !!task)}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
