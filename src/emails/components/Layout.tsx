/**
 * Shared Email Layout Component
 *
 * Provides consistent styling for all email templates.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface LayoutProps {
  readonly preview: string;
  readonly children: ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="zh-TW">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Free CRM</Text>
          </Section>

          {/* Preview text (hidden but used by email clients) */}
          <Text style={styles.preview}>{preview}</Text>

          {/* Main Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              此郵件由 Free CRM 系統自動發送。
            </Text>
            <Text style={styles.footerText}>
              如需調整通知設定，請至{' '}
              <Link href={`${process.env.NEXTAUTH_URL ?? ''}/settings`} style={styles.link}>
                設定頁面
              </Link>
              {' '}管理您的偏好。
            </Text>
            <Text style={styles.copyright}>
              © {new Date().getFullYear()} Free CRM. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f4f4f5',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    maxWidth: '600px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  header: {
    backgroundColor: '#18181b',
    padding: '24px',
    textAlign: 'center' as const,
  },
  logo: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  preview: {
    display: 'none',
    maxHeight: 0,
    overflow: 'hidden',
  },
  content: {
    padding: '32px 24px',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0',
  },
  footer: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#71717a',
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0 0 8px 0',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  copyright: {
    color: '#a1a1aa',
    fontSize: '11px',
    marginTop: '16px',
  },
} as const;
