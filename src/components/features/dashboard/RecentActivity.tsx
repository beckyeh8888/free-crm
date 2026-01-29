'use client';

/**
 * RecentActivity - Shows recent audit log entries
 * Matches Pencil ActivityItem component design
 */

interface ActivityEntry {
  readonly id: string;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly details: string | null;
  readonly createdAt: string;
  readonly user: {
    readonly name: string | null;
    readonly email: string;
  } | null;
}

interface RecentActivityProps {
  readonly activities: readonly ActivityEntry[];
}

const actionLabels: Record<string, string> = {
  create: '新增了',
  update: '更新了',
  delete: '刪除了',
  read: '查看了',
  login: '登入了',
  logout: '登出了',
};

const entityLabels: Record<string, string> = {
  customer: '客戶',
  contact: '聯絡人',
  deal: '商機',
  document: '文件',
  user: '使用者',
  role: '角色',
  organization: '組織',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="bg-background-tertiary border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">近期活動</h2>
      <div className="space-y-3">
        {activities.map((activity) => {
          const userName = activity.user?.name || activity.user?.email || '系統';
          const actionLabel = actionLabels[activity.action] || activity.action;
          const entityLabel = entityLabels[activity.entity] || activity.entity;
          const timeStr = formatRelativeTime(activity.createdAt);

          return (
            <div key={activity.id} className="flex items-start gap-3">
              {/* Timeline dot */}
              <div className="mt-1.5 w-2 h-2 rounded-full bg-accent-600 flex-shrink-0" aria-hidden="true" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary">
                  <span className="text-text-primary font-medium">{userName}</span>
                  {' '}{actionLabel}{' '}
                  <span className="text-text-primary">{entityLabel}</span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">{timeStr}</p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">尚無活動記錄</p>
        )}
      </div>
    </section>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '剛剛';
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}
