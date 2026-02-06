/**
 * Inngest Functions
 *
 * Background job handlers for async processing
 *
 * Multi-tenant: Functions operate within organization context
 */

import { inngest } from './client';
import { prisma } from '../prisma';
import { sendEmail } from '../email';
import { render } from '@react-email/components';
import { TaskReminder } from '@/emails/TaskReminder';
import { DealStageChange } from '@/emails/DealStageChange';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

/**
 * Document Analysis Function
 *
 * Triggered when: document/analyze.requested event is sent
 * Steps:
 * 1. Fetch document from database
 * 2. Perform AI analysis (placeholder for actual AI integration)
 * 3. Save analysis results
 * 4. Log audit event
 */
export const analyzeDocument = inngest.createFunction(
  {
    id: 'analyze-document',
    retries: 3,
    onFailure: async ({ error, event }) => {
      // Log failure to audit log
      console.error('Document analysis failed:', error);

      // Access event data safely
      const eventData = event.data as Record<string, unknown>;
      const documentId = eventData?.documentId as string | undefined;
      const userId = eventData?.userId as string | undefined;
      const organizationId = eventData?.organizationId as string | undefined;

      if (documentId) {
        await prisma.auditLog.create({
          data: {
            action: 'update',
            entity: 'document_analysis',
            entityId: documentId,
            userId: userId,
            organizationId: organizationId,
            details: JSON.stringify({
              status: 'failed',
              error: error.message,
            }),
          },
        });
      }
    },
  },
  { event: 'document/analyze.requested' },
  async ({ event, step }) => {
    const { documentId, userId, analysisType } = event.data;
    // organizationId and options are available in event.data but currently unused
    // They can be accessed via event.data.organizationId and event.data.options if needed

    // Step 1: Fetch document
    const document = await step.run('fetch-document', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          name: true,
          content: true,
          type: true,
          organizationId: true,
          customer: {
            select: {
              createdById: true,
              assignedToId: true,
            },
          },
        },
      });

      if (!doc) {
        throw new Error('Document not found');
      }

      // Verify access - user should be in the organization or have customer access
      let hasAccess = false;

      // Check via customer
      if (doc.customer) {
        hasAccess =
          doc.customer.createdById === userId ||
          doc.customer.assignedToId === userId;
      }

      // Check via organization membership
      if (!hasAccess) {
        const membership = await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId,
              organizationId: doc.organizationId,
            },
          },
        });
        hasAccess = membership?.status === 'active';
      }

      if (!hasAccess) {
        throw new Error('Unauthorized access to document');
      }

      return doc;
    });

    // Step 2: Perform AI analysis
    // Note: Current implementation uses placeholder analysis.
    // For production, integrate with AI service (OpenAI, Anthropic, etc.)
    // See: ISO 42001 AI Management requirements
    const analysisResult = await step.run('ai-analysis', async () => {
      // Placeholder implementation - returns mock analysis data
      const content = document.content || '';

      return {
        summary: `分析摘要：${document.name} 文件包含 ${content.length} 個字元。`,
        entities: JSON.stringify({
          people: [],
          companies: [],
          dates: [],
        }),
        sentiment: 'neutral' as const,
        keyPoints: JSON.stringify([
          '這是自動生成的分析結果',
          '實際 AI 整合待實作',
        ]),
        actionItems: JSON.stringify([]),
        confidence: 0.85,
        model: 'placeholder-v1',
      };
    });

    // Step 3: Save analysis to database
    const analysis = await step.run('save-analysis', async () => {
      return prisma.documentAnalysis.create({
        data: {
          documentId,
          summary: analysisResult.summary,
          entities: analysisResult.entities,
          sentiment: analysisResult.sentiment,
          keyPoints: analysisResult.keyPoints,
          actionItems: analysisResult.actionItems,
          confidence: analysisResult.confidence,
          model: analysisResult.model,
        },
      });
    });

    // Step 4: Log audit event
    await step.run('log-audit', async () => {
      await prisma.auditLog.create({
        data: {
          action: 'create',
          entity: 'document_analysis',
          entityId: analysis.id,
          userId,
          organizationId: document.organizationId,
          details: JSON.stringify({
            documentId,
            analysisType,
            confidence: analysisResult.confidence,
            model: analysisResult.model,
          }),
        },
      });
    });

    // Send completion event
    await inngest.send({
      name: 'document/analyze.completed',
      data: {
        documentId,
        analysisId: analysis.id,
        userId,
        organizationId: document.organizationId,
      },
    });

    return {
      success: true,
      analysisId: analysis.id,
      documentId,
    };
  }
);

// ============================================
// Notification Functions (Sprint 7)
// ============================================

/**
 * Send Task Reminder Email
 *
 * Triggered when: task/reminder.due event is sent
 */
export const sendTaskReminderEmail = inngest.createFunction(
  {
    id: 'send-task-reminder',
    retries: 3,
  },
  { event: 'task/reminder.due' },
  async ({ event, step }) => {
    const { taskId, userId, taskTitle, dueDate, priority, customerName, dealName } = event.data;

    // Step 1: Check user's notification preferences
    const shouldSend = await step.run('check-preferences', async () => {
      const pref = await prisma.notificationPreference.findUnique({
        where: {
          userId_channel_eventType: {
            userId,
            channel: 'email',
            eventType: 'task_reminder',
          },
        },
      });
      // Default to true if no preference set
      return pref?.enabled ?? true;
    });

    if (!shouldSend) {
      return { success: true, skipped: true, reason: 'User disabled email notifications' };
    }

    // Step 2: Get user details
    const user = await step.run('get-user', async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: 'User not found or no email' };
    }

    // Step 3: Render and send email
    await step.run('send-email', async () => {
      const html = await render(
        TaskReminder({
          userName: user.name ?? '使用者',
          taskTitle,
          taskId,
          dueDate,
          priority,
          customerName,
          dealName,
        })
      );

      return sendEmail({
        to: user.email,
        subject: `📋 任務提醒：${taskTitle}`,
        html,
      });
    });

    return { success: true, taskId };
  }
);

/**
 * Send Deal Stage Change Notification
 *
 * Triggered when: deal/stage.changed event is sent
 */
export const sendDealNotification = inngest.createFunction(
  {
    id: 'send-deal-notification',
    retries: 3,
  },
  { event: 'deal/stage.changed' },
  async ({ event, step }) => {
    const {
      dealId,
      dealName,
      userId,
      customerName,
      previousStage,
      newStage,
      dealValue,
      currency,
      changedByName,
    } = event.data;

    // Step 1: Check user's notification preferences
    const shouldSend = await step.run('check-preferences', async () => {
      const pref = await prisma.notificationPreference.findUnique({
        where: {
          userId_channel_eventType: {
            userId,
            channel: 'email',
            eventType: 'deal_stage_change',
          },
        },
      });
      return pref?.enabled ?? true;
    });

    if (!shouldSend) {
      return { success: true, skipped: true, reason: 'User disabled email notifications' };
    }

    // Step 2: Get user details
    const user = await step.run('get-user', async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: 'User not found or no email' };
    }

    // Step 3: Format deal value
    const formattedValue = new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency || 'TWD',
      maximumFractionDigits: 0,
    }).format(dealValue);

    // Step 4: Render and send email
    await step.run('send-email', async () => {
      const html = await render(
        DealStageChange({
          userName: user.name ?? '使用者',
          dealName,
          dealId,
          customerName,
          previousStage,
          newStage,
          dealValue: formattedValue,
          changedBy: changedByName,
        })
      );

      const stageLabels: Record<string, string> = {
        lead: '潛在客戶',
        qualified: '已確認',
        proposal: '提案中',
        negotiation: '議價中',
        closed_won: '成交',
        closed_lost: '流失',
      };

      return sendEmail({
        to: user.email,
        subject: `💼 商機更新：${dealName} → ${stageLabels[newStage] ?? newStage}`,
        html,
      });
    });

    return { success: true, dealId };
  }
);

/**
 * Send Welcome Email
 *
 * Triggered when: user/created event is sent
 */
export const sendWelcomeEmailFn = inngest.createFunction(
  {
    id: 'send-welcome-email',
    retries: 3,
  },
  { event: 'user/created' },
  async ({ event, step }) => {
    const { userId, userName, userEmail, organizationName, invitedBy } = event.data;

    // Render and send email
    await step.run('send-email', async () => {
      const html = await render(
        WelcomeEmail({
          userName: userName || '使用者',
          organizationName,
          invitedBy,
        })
      );

      return sendEmail({
        to: userEmail,
        subject: invitedBy
          ? `歡迎加入 ${organizationName} - Free CRM`
          : '歡迎使用 Free CRM',
        html,
      });
    });

    return { success: true, userId };
  }
);

/**
 * Check Task Reminders (Cron)
 *
 * Runs every 15 minutes to scan for tasks due soon
 */
export const checkTaskReminders = inngest.createFunction(
  {
    id: 'check-task-reminders',
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    // Step 1: Find tasks due in the next hour that haven't been reminded
    const tasks = await step.run('find-due-tasks', async () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const result = await prisma.task.findMany({
        where: {
          status: { in: ['pending', 'in_progress'] },
          dueDate: {
            gte: now,
            lte: oneHourLater,
          },
          reminderAt: null, // Not yet reminded
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          assignedToId: true,
          customerId: true,
          dealId: true,
        },
        take: 100, // Process up to 100 at a time
      });

      // Fetch related customer/deal names separately
      const customerIds = result.map((t) => t.customerId).filter(Boolean) as string[];
      const dealIds = result.map((t) => t.dealId).filter(Boolean) as string[];

      const [customers, deals] = await Promise.all([
        customerIds.length > 0
          ? prisma.customer.findMany({
              where: { id: { in: customerIds } },
              select: { id: true, name: true },
            })
          : [],
        dealIds.length > 0
          ? prisma.deal.findMany({
              where: { id: { in: dealIds } },
              select: { id: true, title: true },
            })
          : [],
      ]);

      const customerMap = new Map(customers.map((c) => [c.id, c.name]));
      const dealMap = new Map(deals.map((d) => [d.id, d.title]));

      return result.map((task) => ({
        ...task,
        customerName: task.customerId ? customerMap.get(task.customerId) : undefined,
        dealName: task.dealId ? dealMap.get(task.dealId) : undefined,
      }));
    });

    if (tasks.length === 0) {
      return { success: true, tasksProcessed: 0 };
    }

    // Step 2: Send reminder events for each task
    await step.run('send-reminders', async () => {
      const events = tasks
        .filter((task) => task.assignedToId)
        .map((task) => ({
          name: 'task/reminder.due' as const,
          data: {
            taskId: task.id,
            userId: task.assignedToId!,
            taskTitle: task.title,
            dueDate: task.dueDate ? String(task.dueDate) : '',
            priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
            customerName: task.customerName,
            dealName: task.dealName,
          },
        }));

      if (events.length > 0) {
        await inngest.send(events);
      }

      // Mark tasks as reminded
      const taskIds = tasks.map((t) => t.id);
      await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          reminderAt: new Date(),
        },
      });
    });

    return { success: true, tasksProcessed: tasks.length };
  }
);

// Export all functions for the serve handler
export const functions = [
  analyzeDocument,
  sendTaskReminderEmail,
  sendDealNotification,
  sendWelcomeEmailFn,
  checkTaskReminders,
];
