/**
 * Deal Stage Change Email Template
 *
 * Sent when a deal moves to a different pipeline stage.
 */

import { Text, Link, Section } from '@react-email/components';
import { Layout } from './components/Layout';

interface DealStageChangeProps {
  readonly userName: string;
  readonly dealName: string;
  readonly dealId: string;
  readonly customerName: string;
  readonly previousStage: string;
  readonly newStage: string;
  readonly dealValue: string;
  readonly changedBy: string;
}

const stageLabels: Record<string, string> = {
  lead: '潛在客戶',
  qualified: '已確認',
  proposal: '提案中',
  negotiation: '議價中',
  closed_won: '成交',
  closed_lost: '流失',
};

const stageColors: Record<string, string> = {
  lead: '#94a3b8',
  qualified: '#38bdf8',
  proposal: '#a78bfa',
  negotiation: '#facc15',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

export function DealStageChange({
  userName,
  dealName,
  dealId,
  customerName,
  previousStage,
  newStage,
  dealValue,
  changedBy,
}: DealStageChangeProps) {
  const baseUrl = process.env.NEXTAUTH_URL ?? '';
  const dealUrl = `${baseUrl}/deals?id=${dealId}`;

  const prevLabel = stageLabels[previousStage] ?? previousStage;
  const newLabel = stageLabels[newStage] ?? newStage;
  const newColor = stageColors[newStage] ?? '#71717a';

  const isWon = newStage === 'closed_won';
  const isLost = newStage === 'closed_lost';

  return (
    <Layout preview={`商機階段更新：${dealName} → ${newLabel}`}>
      <Text style={styles.greeting}>您好，{userName}！</Text>

      <Text style={styles.paragraph}>
        {isWon
          ? '恭喜！以下商機已成交：'
          : isLost
            ? '以下商機階段已變更為流失：'
            : '以下商機的階段已更新：'}
      </Text>

      <Section style={styles.dealCard}>
        <Text style={styles.dealName}>{dealName}</Text>
        <Text style={styles.customerName}>客戶：{customerName}</Text>

        <Section style={styles.stageChange}>
          <Section style={styles.stageItem}>
            <Text style={styles.stageLabel}>原階段</Text>
            <Text style={{ ...styles.stageBadge, backgroundColor: stageColors[previousStage] ?? '#71717a' }}>
              {prevLabel}
            </Text>
          </Section>

          <Text style={styles.arrow}>→</Text>

          <Section style={styles.stageItem}>
            <Text style={styles.stageLabel}>新階段</Text>
            <Text style={{ ...styles.stageBadge, backgroundColor: newColor }}>
              {newLabel}
            </Text>
          </Section>
        </Section>

        <Section style={styles.dealMeta}>
          <Text style={styles.metaItem}>
            <span style={styles.metaLabel}>商機金額：</span>
            <span style={styles.metaValue}>{dealValue}</span>
          </Text>
          <Text style={styles.metaItem}>
            <span style={styles.metaLabel}>變更者：</span>
            <span style={styles.metaValue}>{changedBy}</span>
          </Text>
        </Section>
      </Section>

      <Section style={styles.buttonContainer}>
        <Link href={dealUrl} style={styles.button}>
          查看商機詳情
        </Link>
      </Section>

      {isWon && (
        <Text style={styles.congratsNote}>
          🎉 這是一個重要的里程碑！繼續保持！
        </Text>
      )}
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
  dealCard: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  dealName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#18181b',
    marginTop: 0,
    marginBottom: '4px',
  },
  customerName: {
    fontSize: '14px',
    color: '#71717a',
    marginTop: 0,
    marginBottom: '20px',
  },
  stageChange: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  stageItem: {
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  stageLabel: {
    fontSize: '12px',
    color: '#71717a',
    marginBottom: '8px',
  },
  stageBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
  },
  arrow: {
    fontSize: '24px',
    color: '#d4d4d8',
    margin: '0 16px',
    display: 'inline-block',
  },
  dealMeta: {
    borderTop: '1px solid #e4e4e7',
    paddingTop: '16px',
    marginTop: '16px',
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
  congratsNote: {
    fontSize: '14px',
    color: '#16a34a',
    textAlign: 'center' as const,
    fontWeight: '500',
  },
} as const;

export default DealStageChange;
