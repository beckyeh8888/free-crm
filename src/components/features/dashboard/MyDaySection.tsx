'use client';

/**
 * MyDaySection - "My Day" dashboard widget for salespeople
 * Shows today's tasks, overdue items, and deals closing this week
 * WCAG 2.2 AAA Compliant
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Phone,
  Calendar,
  Mail,
  MessageSquare,
  Target,
  Flag,
  Clock,
  Handshake,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTasks, type Task } from '@/hooks/useTasks';
import { useDeals, type Deal } from '@/hooks/useDeals';

// ============================================
// Helpers
// ============================================

const taskTypeIcons: Record<string, typeof Phone> = {
  call: Phone,
  meeting: Calendar,
  email: Mail,
  follow_up: MessageSquare,
  milestone: Target,
  task: Flag,
};

function formatTime(dateStr: string | null, timeStr: string | null): string {
  if (timeStr) return timeStr;
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

function formatDealValue(value: number | null, currency: string): string {
  if (value == null) return '-';
  const prefix = currency === 'TWD' ? 'NT$' : currency;
  if (value >= 1000000) return `${prefix}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${prefix}${(value / 1000).toFixed(0)}K`;
  return `${prefix}${value.toLocaleString()}`;
}

function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // End of week (Sunday)
  const dayOfWeek = today.getDay();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - dayOfWeek));

  return { today, tomorrow, endOfWeek };
}

// ============================================
// Component
// ============================================

export function MyDaySection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { today, tomorrow, endOfWeek } = useMemo(() => getDateRanges(), []);

  // Today's tasks
  const { data: todayData, isLoading: todayLoading } = useTasks({
    assignedToId: userId,
    dueDateFrom: today.toISOString(),
    dueDateTo: tomorrow.toISOString(),
    limit: 10,
    sort: 'dueDate',
    order: 'asc',
  });

  // Overdue tasks
  const { data: overdueData, isLoading: overdueLoading } = useTasks({
    assignedToId: userId,
    dueDateTo: today.toISOString(),
    status: 'pending',
    limit: 10,
    sort: 'dueDate',
    order: 'asc',
  });

  // Deals closing this week
  const { data: dealsData, isLoading: dealsLoading } = useDeals({
    limit: 10,
  });

  const todayTasks = todayData?.data ?? [];
  const overdueTasks = (overdueData?.data ?? []).filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );

  // Filter deals closing this week (client-side since API doesn't have closeDate range filter)
  const closingDeals = useMemo(() => {
    const allDeals = (dealsData?.data ?? []) as Deal[];
    return allDeals.filter((d) => {
      if (!d.closeDate) return false;
      if (d.stage === 'closed_won' || d.stage === 'closed_lost') return false;
      const closeDate = new Date(d.closeDate);
      return closeDate >= today && closeDate <= endOfWeek;
    });
  }, [dealsData, today, endOfWeek]);

  const isLoading = todayLoading || overdueLoading || dealsLoading;
  const hasContent = overdueTasks.length > 0 || todayTasks.length > 0 || closingDeals.length > 0;

  if (isLoading) {
    return <MyDaySkeleton />;
  }

  if (!hasContent) {
    return null; // Don't show section if nothing for today
  }

  return (
    <section aria-labelledby="my-day-heading" className="bg-background-tertiary border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 id="my-day-heading" className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-600" aria-hidden="true" />
          我的一天
        </h2>
        <span className="text-xs text-text-muted">
          {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-error flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              逾期任務
              <span className="ml-auto text-xs bg-error/15 text-error px-1.5 py-0.5 rounded">
                {overdueTasks.length}
              </span>
            </h3>
            <div className="space-y-1">
              {overdueTasks.slice(0, 5).map((task) => (
                <TaskItem key={task.id} task={task} variant="overdue" />
              ))}
              {overdueTasks.length > 5 && (
                <Link href="/tasks?status=pending" className="text-xs text-error hover:text-error/80 transition-colors block pt-1">
                  查看全部 {overdueTasks.length} 項 →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-accent-600" aria-hidden="true" />
            今日待辦
            <span className="ml-auto text-xs bg-accent-600/15 text-accent-400 px-1.5 py-0.5 rounded">
              {todayTasks.length}
            </span>
          </h3>
          <div className="space-y-1">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-text-muted py-2">今天沒有排定的任務</p>
            ) : (
              <>
                {todayTasks.slice(0, 5).map((task) => (
                  <TaskItem key={task.id} task={task} variant="today" />
                ))}
                {todayTasks.length > 5 && (
                  <Link href="/tasks" className="text-xs text-accent-600 hover:text-accent-500 transition-colors block pt-1">
                    查看全部 {todayTasks.length} 項 →
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Deals Closing This Week */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-2">
            <Handshake className="w-4 h-4 text-amber-500" aria-hidden="true" />
            本週到期商機
            <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">
              {closingDeals.length}
            </span>
          </h3>
          <div className="space-y-1">
            {closingDeals.length === 0 ? (
              <p className="text-xs text-text-muted py-2">本週無到期商機</p>
            ) : (
              <>
                {closingDeals.slice(0, 5).map((deal) => (
                  <DealItem key={deal.id} deal={deal} />
                ))}
                {closingDeals.length > 5 && (
                  <Link href="/deals" className="text-xs text-amber-500 hover:text-amber-400 transition-colors block pt-1">
                    查看全部 {closingDeals.length} 筆 →
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Sub-components
// ============================================

interface TaskItemProps {
  readonly task: Task;
  readonly variant: 'overdue' | 'today';
}

function TaskItem({ task, variant }: TaskItemProps) {
  const Icon = taskTypeIcons[task.type] ?? Flag;
  const isOverdue = variant === 'overdue';

  return (
    <Link
      href={`/tasks`}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-sm ${
        isOverdue
          ? 'hover:bg-error/5'
          : 'hover:bg-background-hover'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-error' : 'text-text-muted'}`} aria-hidden="true" />
      <span className={`truncate flex-1 ${isOverdue ? 'text-error' : 'text-text-primary'}`}>
        {task.title}
      </span>
      {task.dueTime && (
        <span className="text-xs text-text-muted shrink-0">
          {formatTime(task.dueDate, task.dueTime)}
        </span>
      )}
      {isOverdue && task.dueDate && (
        <span className="text-[10px] text-error/70 shrink-0">
          {formatShortDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
}

interface DealItemProps {
  readonly deal: Deal;
}

function DealItem({ deal }: DealItemProps) {
  return (
    <Link
      href={`/deals?id=${deal.id}`}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background-hover transition-colors text-sm"
    >
      <span className="truncate flex-1 text-text-primary">{deal.title}</span>
      <span className="text-xs text-amber-400 shrink-0 font-medium">
        {formatDealValue(deal.value, deal.currency)}
      </span>
      <span className="text-[10px] text-text-muted shrink-0">
        {formatShortDate(deal.closeDate)}
      </span>
    </Link>
  );
}

// ============================================
// Skeleton
// ============================================

function MyDaySkeleton() {
  return (
    <div className="bg-background-tertiary border border-border rounded-xl p-5 animate-pulse">
      <div className="h-6 w-32 bg-background-hover rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-background-hover rounded" />
          <div className="h-8 bg-background-hover rounded" />
          <div className="h-8 bg-background-hover rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-background-hover rounded" />
          <div className="h-8 bg-background-hover rounded" />
          <div className="h-8 bg-background-hover rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-background-hover rounded" />
          <div className="h-8 bg-background-hover rounded" />
        </div>
      </div>
    </div>
  );
}
