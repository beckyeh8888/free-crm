/**
 * Task Reminder Email Template
 *
 * Sent when a task is approaching or past its due date.
 */

import { Text, Link, Section } from '@react-email/components';
import { Layout } from './components/Layout';

interface TaskReminderProps {
  readonly userName: string;
  readonly taskTitle: string;
  readonly taskId: string;
  readonly dueDate: string;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly customerName?: string;
  readonly dealName?: string;
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

const priorityColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export function TaskReminder({
  userName,
  taskTitle,
  taskId,
  dueDate,
  priority,
  customerName,
  dealName,
}: TaskReminderProps) {
  const baseUrl = process.env.NEXTAUTH_URL ?? '';
  const taskUrl = `${baseUrl}/tasks?id=${taskId}`;
  const priorityLabel = priorityLabels[priority] ?? priority;
  const priorityColor = priorityColors[priority] ?? '#71717a';

  return (
    <Layout preview={`任務提醒：${taskTitle} 即將到期`}>
      <Text style={styles.greeting}>您好，{userName}！</Text>

      <Text style={styles.paragraph}>
        您有一項任務即將到期，請及時處理：
      </Text>

      <Section style={styles.taskCard}>
        <Text style={styles.taskTitle}>{taskTitle}</Text>

        <Section style={styles.taskMeta}>
          <Text style={styles.metaItem}>
            <span style={styles.metaLabel}>到期日：</span>
            <span style={styles.metaValue}>{dueDate}</span>
          </Text>

          <Text style={styles.metaItem}>
            <span style={styles.metaLabel}>優先級：</span>
            <span style={{ ...styles.priorityBadge, backgroundColor: priorityColor }}>
              {priorityLabel}
            </span>
          </Text>

          {customerName && (
            <Text style={styles.metaItem}>
              <span style={styles.metaLabel}>客戶：</span>
              <span style={styles.metaValue}>{customerName}</span>
            </Text>
          )}

          {dealName && (
            <Text style={styles.metaItem}>
              <span style={styles.metaLabel}>商機：</span>
              <span style={styles.metaValue}>{dealName}</span>
            </Text>
          )}
        </Section>
      </Section>

      <Section style={styles.buttonContainer}>
        <Link href={taskUrl} style={styles.button}>
          查看任務詳情
        </Link>
      </Section>

      <Text style={styles.footnote}>
        如需調整任務提醒頻率，請至設定頁面進行管理。
      </Text>
    </Layout>
  );
}

const styles = {
  greeting: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#18181b',
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#3f3f46',
    marginBottom: '24px',
  },
  taskCard: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  taskTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    marginTop: 0,
    marginBottom: '16px',
  },
  taskMeta: {
    margin: 0,
  },
  metaItem: {
    fontSize: '14px',
    color: '#52525b',
    margin: '8px 0',
  },
  metaLabel: {
    color: '#71717a',
  },
  metaValue: {
    color: '#18181b',
    fontWeight: '500',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
  },
  footnote: {
    fontSize: '12px',
    color: '#71717a',
    textAlign: 'center' as const,
  },
} as const;

export default TaskReminder;
