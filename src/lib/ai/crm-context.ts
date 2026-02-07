/**
 * CRM Context Builder
 *
 * Fetches relevant CRM data based on the user's query and formats it
 * as context for the AI assistant.
 */

import { prisma } from '@/lib/prisma';

/**
 * Build CRM context based on the latest user message.
 * Uses keyword matching to determine which data to fetch.
 */
export async function getCRMContext(
  organizationId: string,
  userId: string,
  query: string
): Promise<string> {
  const parts: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Deal filter: through customer's organizationId
  const orgDealFilter = { customer: { organizationId } };

  // Customer context
  if (matchesKeywords(lowerQuery, ['客戶', 'customer', '公司', 'company', '聯絡'])) {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true, company: true, status: true, email: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    if (customers.length > 0) {
      parts.push(formatCustomers(customers));
    }
  }

  // Deal context
  if (matchesKeywords(lowerQuery, ['商機', 'deal', '成交', '管道', 'pipeline', '收入', '營收', '金額'])) {
    const deals = await prisma.deal.findMany({
      where: orgDealFilter,
      select: {
        id: true, title: true, stage: true, value: true, currency: true,
        probability: true, closeDate: true,
        customer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    });
    if (deals.length > 0) {
      parts.push(formatDeals(deals));
    }
  }

  // Task context
  if (matchesKeywords(lowerQuery, ['任務', 'task', '待辦', '逾期', '提醒', '行事曆'])) {
    const tasks = await prisma.task.findMany({
      where: {
        organizationId,
        status: { in: ['pending', 'in_progress'] },
      },
      select: {
        id: true, title: true, type: true, priority: true,
        status: true, dueDate: true,
        customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
    if (tasks.length > 0) {
      parts.push(formatTasks(tasks));
    }
  }

  // Closing this month
  if (matchesKeywords(lowerQuery, ['本月', '這個月', 'this month', '到期', '即將'])) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const closingDeals = await prisma.deal.findMany({
      where: {
        ...orgDealFilter,
        closeDate: { gte: startOfMonth, lte: endOfMonth },
        stage: { not: 'closed_won' },
      },
      select: {
        title: true, value: true, currency: true, stage: true,
        closeDate: true, probability: true,
        customer: { select: { name: true } },
      },
      orderBy: { closeDate: 'asc' },
    });
    if (closingDeals.length > 0) {
      parts.push(`## 本月到期商機\n${closingDeals.map((d) =>
        `- **${d.title}**（${d.customer?.name ?? '未知'}）: ${d.currency} ${d.value?.toLocaleString() ?? 0}，階段：${d.stage}，機率：${d.probability ?? 0}%`
      ).join('\n')}`);
    }
  }

  // Inactive customers
  if (matchesKeywords(lowerQuery, ['不活躍', '沒互動', 'inactive', '閒置', '流失'])) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactive = await prisma.customer.findMany({
      where: {
        organizationId,
        status: 'active',
        updatedAt: { lt: thirtyDaysAgo },
      },
      select: { name: true, company: true, email: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });
    if (inactive.length > 0) {
      parts.push(`## 超過 30 天未互動的客戶\n${inactive.map((c) =>
        `- **${c.name}**（${c.company ?? ''}）- 最後更新：${c.updatedAt.toLocaleDateString('zh-TW')}`
      ).join('\n')}`);
    }
  }

  // General summary if no specific match
  if (parts.length === 0) {
    const [customerCount, dealCount, taskCount] = await Promise.all([
      prisma.customer.count({ where: { organizationId } }),
      prisma.deal.count({ where: orgDealFilter }),
      prisma.task.count({ where: { organizationId, status: { in: ['pending', 'in_progress'] } } }),
    ]);
    parts.push(`## 系統概覽\n- 客戶數：${customerCount}\n- 商機數：${dealCount}\n- 待辦任務：${taskCount}`);
  }

  // Limit total context length
  const combined = parts.join('\n\n');
  if (combined.length > 4000) {
    return combined.substring(0, 4000) + '\n\n（資料已截斷）';
  }
  return combined;
}

// ============================================
// Helpers
// ============================================

function matchesKeywords(query: string, keywords: string[]): boolean {
  return keywords.some((kw) => query.includes(kw));
}

interface CustomerData {
  readonly name: string;
  readonly company: string | null;
  readonly status: string;
  readonly email: string | null;
}

function formatCustomers(customers: readonly CustomerData[]): string {
  return `## 客戶列表（最近 ${customers.length} 筆）\n${customers.map((c) =>
    `- **${c.name}**${c.company ? `（${c.company}）` : ''} - 狀態：${c.status}${c.email ? ` - ${c.email}` : ''}`
  ).join('\n')}`;
}

interface DealData {
  readonly title: string;
  readonly stage: string;
  readonly value: number | null;
  readonly currency: string;
  readonly probability: number | null;
  readonly closeDate: Date | null;
  readonly customer: { readonly name: string } | null;
}

function formatDeals(deals: readonly DealData[]): string {
  const stageLabels: Record<string, string> = {
    lead: '線索', qualification: '評估', proposal: '提案',
    negotiation: '議價', closed_won: '成交', closed_lost: '失敗',
  };
  return `## 商機列表（最近 ${deals.length} 筆）\n${deals.map((d) =>
    `- **${d.title}**（${d.customer?.name ?? '未知'}）: ${d.currency} ${d.value?.toLocaleString() ?? 0}，階段：${stageLabels[d.stage] ?? d.stage}，機率：${d.probability ?? 0}%`
  ).join('\n')}`;
}

interface TaskData {
  readonly title: string;
  readonly type: string;
  readonly priority: string;
  readonly status: string;
  readonly dueDate: Date | null;
  readonly customer: { readonly name: string } | null;
}

function formatTasks(tasks: readonly TaskData[]): string {
  const now = new Date();
  return `## 待辦任務（${tasks.length} 筆）\n${tasks.map((t) => {
    const overdue = t.dueDate && new Date(t.dueDate) < now ? ' ⚠️ 逾期' : '';
    const due = t.dueDate ? ` 到期：${new Date(t.dueDate).toLocaleDateString('zh-TW')}` : '';
    return `- **${t.title}**（${t.priority}）${due}${overdue}${t.customer ? ` - ${t.customer.name}` : ''}`;
  }).join('\n')}`;
}
