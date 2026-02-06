/**
 * Welcome Email Template
 *
 * Sent when a new user registers or is invited to the system.
 */

import { Text, Link, Section } from '@react-email/components';
import { Layout } from './components/Layout';

interface WelcomeEmailProps {
  readonly userName: string;
  readonly organizationName?: string;
  readonly invitedBy?: string;
}

export function WelcomeEmail({
  userName,
  organizationName,
  invitedBy,
}: WelcomeEmailProps) {
  const baseUrl = process.env.NEXTAUTH_URL ?? '';
  const dashboardUrl = `${baseUrl}/`;
  const settingsUrl = `${baseUrl}/settings`;

  const isInvited = Boolean(invitedBy);

  return (
    <Layout preview={`歡迎加入 Free CRM${organizationName ? ` - ${organizationName}` : ''}`}>
      <Text style={styles.greeting}>
        {isInvited ? `歡迎加入，${userName}！` : `您好，${userName}！`}
      </Text>

      {isInvited ? (
        <Text style={styles.paragraph}>
          {invitedBy} 已邀請您加入 <strong>{organizationName}</strong> 的 Free CRM 團隊。
          您現在可以開始使用系統管理客戶關係了。
        </Text>
      ) : (
        <Text style={styles.paragraph}>
          感謝您註冊 Free CRM！我們很高興能夠協助您管理客戶關係，提升業務效率。
        </Text>
      )}

      <Section style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>開始使用</Text>

        <Section style={styles.featureItem}>
          <Text style={styles.featureIcon}>👥</Text>
          <Section style={styles.featureContent}>
            <Text style={styles.featureName}>客戶管理</Text>
            <Text style={styles.featureDesc}>
              集中管理所有客戶資訊，追蹤互動歷程
            </Text>
          </Section>
        </Section>

        <Section style={styles.featureItem}>
          <Text style={styles.featureIcon}>💼</Text>
          <Section style={styles.featureContent}>
            <Text style={styles.featureName}>商機追蹤</Text>
            <Text style={styles.featureDesc}>
              視覺化管道追蹤商機進度，提高成交率
            </Text>
          </Section>
        </Section>

        <Section style={styles.featureItem}>
          <Text style={styles.featureIcon}>📋</Text>
          <Section style={styles.featureContent}>
            <Text style={styles.featureName}>任務管理</Text>
            <Text style={styles.featureDesc}>
              安排後續任務，確保不遺漏任何跟進
            </Text>
          </Section>
        </Section>

        <Section style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <Section style={styles.featureContent}>
            <Text style={styles.featureName}>數據報表</Text>
            <Text style={styles.featureDesc}>
              即時分析業績表現，做出明智決策
            </Text>
          </Section>
        </Section>
      </Section>

      <Section style={styles.buttonContainer}>
        <Link href={dashboardUrl} style={styles.primaryButton}>
          進入系統
        </Link>
        <Link href={settingsUrl} style={styles.secondaryButton}>
          設定個人資料
        </Link>
      </Section>

      <Text style={styles.helpText}>
        如有任何問題，請隨時聯繫我們的支援團隊。
      </Text>
    </Layout>
  );
}

const styles = {
  greeting: {
    fontSize: '24px',
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
  featuresCard: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  featuresTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    marginTop: 0,
    marginBottom: '20px',
  },
  featureItem: {
    display: 'flex',
    marginBottom: '16px',
  },
  featureIcon: {
    fontSize: '24px',
    marginRight: '12px',
    lineHeight: '1',
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181b',
    marginTop: 0,
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: '13px',
    color: '#71717a',
    margin: 0,
  },
  buttonContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  primaryButton: {
    display: 'inline-block',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    marginRight: '12px',
  },
  secondaryButton: {
    display: 'inline-block',
    backgroundColor: '#ffffff',
    color: '#3b82f6',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    border: '1px solid #3b82f6',
  },
  helpText: {
    fontSize: '13px',
    color: '#71717a',
    textAlign: 'center' as const,
  },
} as const;

export default WelcomeEmail;
