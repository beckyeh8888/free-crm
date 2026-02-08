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
import { createInAppNotification } from '../notification-service';
import { render } from '@react-email/components';
import { TaskReminder } from '@/emails/TaskReminder';
import { DealStageChange } from '@/emails/DealStageChange';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { generateText } from 'ai';
import { getAIModel, isAIConfigured, isFeatureEnabled } from '@/lib/ai/provider';
import { getDocumentAnalysisPrompt } from '@/lib/ai/prompts/document';
import { handleAIError } from '@/lib/ai/errors';
import { getFileBuffer } from '@/lib/storage';
import { extractText, isSupportedMimeType } from '@/lib/document-parser';
import { chunkText } from '@/lib/rag/chunker';
import { generateEmbeddings, isEmbeddingConfigured } from '@/lib/ai/embedding';
import { invalidateEmbeddingCache } from '@/lib/rag/vector-search';
import { ragQuery } from '@/lib/rag/pipeline';
import { classifyDocument } from '@/lib/rag/classifier';

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
    idempotency: 'event.data.documentId + "-" + event.data.userId',
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
    const { documentId, userId, organizationId, analysisType } = event.data;

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
    const analysisResult = await step.run('ai-analysis', async () => {
      const content = document.content || '';

      // Check if AI is configured for this organization
      const aiConfigured = await isAIConfigured(organizationId);

      if (!aiConfigured) {
        return {
          summary: `「${document.name}」文件包含 ${content.length} 個字元。請至設定頁面配置 AI 服務以啟用智能分析。`,
          entities: JSON.stringify({ people: [], companies: [], dates: [] }),
          sentiment: 'neutral' as const,
          keyPoints: JSON.stringify(['AI 服務尚未設定，目前僅提供基本資訊']),
          actionItems: JSON.stringify(['前往「設定 → AI 功能」配置 API Key']),
          confidence: 0,
          model: 'none',
        };
      }

      try {
        const model = await getAIModel(organizationId);
        const systemPrompt = getDocumentAnalysisPrompt(analysisType);

        // Fetch RAG context from related documents (only if RAG feature enabled)
        let ragContext = '';
        const ragEnabled = await isFeatureEnabled(organizationId, 'rag');
        if (ragEnabled) {
          try {
            const ragResult = await ragQuery(organizationId, content.slice(0, 500), { topK: 3 });
            if (ragResult?.context) {
              ragContext = `\n\n---\n相關文件上下文：\n${ragResult.context}`;
            }
          } catch {
            // RAG failure is non-blocking
          }
        }

        const result = await generateText({
          model,
          system: systemPrompt,
          prompt: `${content}${ragContext}`,
          maxOutputTokens: 2000,
        });

        const parsed = JSON.parse(result.text);

        return {
          summary: parsed.summary || '',
          entities: JSON.stringify(parsed.entities || { people: [], companies: [], dates: [] }),
          sentiment: (parsed.sentiment || 'neutral') as 'positive' | 'negative' | 'neutral',
          keyPoints: JSON.stringify(parsed.keyPoints || []),
          actionItems: JSON.stringify(parsed.actionItems || []),
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
          model: result.response?.modelId || 'unknown',
        };
      } catch (err) {
        const errorMsg = handleAIError(err);
        return {
          summary: `分析失敗：${errorMsg}`,
          entities: JSON.stringify({ people: [], companies: [], dates: [] }),
          sentiment: 'neutral' as const,
          keyPoints: JSON.stringify([]),
          actionItems: JSON.stringify([]),
          confidence: 0,
          model: 'error',
        };
      }
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
// RAG Pipeline: Text Extraction + Chunking
// ============================================

/**
 * Extract Text from Document File
 *
 * Triggered when: document/text.extract event is sent (after file upload)
 * Steps:
 * 1. Download file from MinIO
 * 2. Extract text using document-parser
 * 3. Chunk the extracted text
 * 4. Save chunks and update document
 * 5. Optionally trigger embedding
 */
export const extractDocumentText = inngest.createFunction(
  {
    id: 'extract-document-text',
    retries: 2,
    idempotency: 'event.data.documentId',
    onFailure: async ({ error, event }) => {
      console.error('Document text extraction failed:', error);
      const eventData = event.data as Record<string, unknown>;
      const documentId = eventData?.documentId as string | undefined;

      if (documentId) {
        await prisma.document.update({
          where: { id: documentId },
          data: { extractionStatus: 'failed' },
        });
      }
    },
  },
  { event: 'document/text.extract' },
  async ({ event, step }) => {
    const { documentId, organizationId, filePath, mimeType } = event.data;

    // Step 1: Mark as processing and validate
    await step.run('mark-processing', async () => {
      await prisma.document.update({
        where: { id: documentId },
        data: { extractionStatus: 'processing' },
      });
    });

    // Step 2: Check MIME type support
    const supported = isSupportedMimeType(mimeType);
    if (!supported) {
      await step.run('mark-unsupported', async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: { extractionStatus: 'unsupported' },
        });
      });
      return { success: false, reason: 'unsupported_mime_type', mimeType };
    }

    // Step 3: Download file and extract text
    const extractionResult = await step.run('extract-text', async () => {
      const buffer = await getFileBuffer(filePath);
      const result = await extractText(buffer, mimeType);

      if (!result) {
        // Likely a scanned PDF or empty file
        await prisma.document.update({
          where: { id: documentId },
          data: { extractionStatus: 'unsupported' },
        });
        return null;
      }

      // Save extracted text to Document.content
      await prisma.document.update({
        where: { id: documentId },
        data: {
          content: result.text,
          extractionStatus: 'completed',
          extractedAt: new Date(),
        },
      });

      return { wordCount: result.wordCount, textLength: result.text.length };
    });

    if (!extractionResult) {
      return { success: false, reason: 'no_text_extracted' };
    }

    // Step 4: Chunk the extracted text
    const chunkResult = await step.run('chunk-text', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true },
      });

      if (!doc?.content) return { chunkCount: 0 };

      const chunks = chunkText(doc.content);

      // Delete old chunks if re-processing
      await prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      // Bulk insert chunks
      if (chunks.length > 0) {
        await prisma.documentChunk.createMany({
          data: chunks.map((chunk) => ({
            documentId,
            organizationId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          })),
        });
      }

      return { chunkCount: chunks.length };
    });

    // Step 5: Send completion event
    await inngest.send({
      name: 'document/text.extract.completed',
      data: {
        documentId,
        organizationId,
        wordCount: extractionResult.wordCount,
        chunkCount: chunkResult.chunkCount,
      },
    });

    // Step 6: Auto-classify document type
    await step.run('auto-classify', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true, type: true },
      });

      if (!doc?.content) return;

      const classifiedType = await classifyDocument(organizationId, doc.content);
      if (classifiedType && classifiedType !== doc.type) {
        await prisma.document.update({
          where: { id: documentId },
          data: { type: classifiedType },
        });
      }
    });

    // Step 7: Auto-trigger embedding if configured
    await step.run('trigger-embedding', async () => {
      // Only trigger if chunks were created
      if (chunkResult.chunkCount > 0) {
        await inngest.send({
          name: 'document/embed.requested',
          data: { documentId, organizationId },
        });
      }
    });

    return {
      success: true,
      documentId,
      wordCount: extractionResult.wordCount,
      chunkCount: chunkResult.chunkCount,
    };
  }
);

// ============================================
// RAG Pipeline: Embedding Generation
// ============================================

/**
 * Generate Embeddings for Document Chunks
 *
 * Triggered when: document/embed.requested event is sent (after text extraction + chunking)
 * Steps:
 * 1. Check embedding is configured
 * 2. Load document chunks
 * 3. Generate embeddings in batches
 * 4. Save embeddings to chunks
 * 5. Send completion event
 */
export const embedDocumentChunks = inngest.createFunction(
  {
    id: 'embed-document-chunks',
    retries: 2,
    idempotency: 'event.data.documentId',
    onFailure: async ({ error, event }) => {
      console.error('Document embedding failed:', error);
      const eventData = event.data as Record<string, unknown>;
      const documentId = eventData?.documentId as string | undefined;
      const organizationId = eventData?.organizationId as string | undefined;

      if (documentId) {
        await prisma.auditLog.create({
          data: {
            action: 'update',
            entity: 'document_embedding',
            entityId: documentId,
            organizationId,
            details: JSON.stringify({
              status: 'failed',
              error: error.message,
            }),
          },
        });
      }
    },
  },
  { event: 'document/embed.requested' },
  async ({ event, step }) => {
    const { documentId, organizationId } = event.data;

    // Step 1: Check embedding is configured
    const configured = await step.run('check-embedding-config', async () => {
      return isEmbeddingConfigured(organizationId);
    });

    if (!configured) {
      return { success: false, reason: 'embedding_not_configured' };
    }

    // Step 2: Load chunks without embeddings
    const chunks = await step.run('load-chunks', async () => {
      return prisma.documentChunk.findMany({
        where: { documentId },
        select: { id: true, content: true },
        orderBy: { chunkIndex: 'asc' },
      });
    });

    if (chunks.length === 0) {
      return { success: false, reason: 'no_chunks' };
    }

    // Step 3: Generate embeddings in batches (max 50 per batch for API limits)
    const BATCH_SIZE = 50;
    let embeddedCount = 0;
    let embeddingModel = '';

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      await step.run(`embed-batch-${batchIndex}`, async () => {
        const texts = batch.map((c) => c.content);
        const result = await generateEmbeddings(organizationId, texts);

        if (!result) {
          throw new Error('Embedding generation returned null');
        }

        embeddingModel = result.model;

        // Update each chunk with its embedding
        for (let j = 0; j < batch.length; j++) {
          await prisma.documentChunk.update({
            where: { id: batch[j].id },
            data: {
              embedding: JSON.stringify(result.embeddings[j]),
              embeddingModel: result.model,
              embeddingDims: result.dimensions,
              embeddedAt: new Date(),
            },
          });
        }

        embeddedCount += batch.length;
      });
    }

    // Step 4: Invalidate embedding cache for this org
    await step.run('invalidate-cache', async () => {
      invalidateEmbeddingCache(organizationId);
    });

    // Step 5: Send completion event
    await inngest.send({
      name: 'document/embed.completed',
      data: {
        documentId,
        organizationId,
        chunkCount: embeddedCount,
        embeddingModel,
      },
    });

    return {
      success: true,
      documentId,
      chunksEmbedded: embeddedCount,
      embeddingModel,
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

    // Step 1: Create in-app notification (independent of email preference)
    await step.run('create-in-app-notification', async () => {
      await createInAppNotification({
        userId,
        type: 'task_reminder',
        title: '任務提醒',
        message: `任務「${taskTitle}」即將到期`,
        linkUrl: '/calendar',
        metadata: { taskId, dueDate, priority },
      });
    });

    // Step 2: Check user's email notification preferences
    const shouldSendEmail = await step.run('check-email-preferences', async () => {
      const pref = await prisma.notificationPreference.findUnique({
        where: {
          userId_channel_eventType: {
            userId,
            channel: 'email',
            eventType: 'task_reminder',
          },
        },
      });
      return pref?.enabled ?? true;
    });

    if (!shouldSendEmail) {
      return { success: true, emailSkipped: true, inAppCreated: true };
    }

    // Step 3: Get user details
    const user = await step.run('get-user', async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: 'User not found or no email' };
    }

    // Step 4: Render and send email
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

    const stageLabels: Record<string, string> = {
      lead: '潛在客戶',
      qualified: '已確認',
      proposal: '提案中',
      negotiation: '議價中',
      closed_won: '成交',
      closed_lost: '流失',
    };

    // Step 1: Create in-app notification (independent of email preference)
    await step.run('create-in-app-notification', async () => {
      await createInAppNotification({
        userId,
        type: 'deal_stage_change',
        title: '商機階段變更',
        message: `${dealName} 已從${stageLabels[previousStage] ?? previousStage}變更為${stageLabels[newStage] ?? newStage}`,
        linkUrl: `/deals`,
        metadata: { dealId, previousStage, newStage },
      });
    });

    // Step 2: Check user's email notification preferences
    const shouldSendEmail = await step.run('check-email-preferences', async () => {
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

    if (!shouldSendEmail) {
      return { success: true, emailSkipped: true, inAppCreated: true };
    }

    // Step 3: Get user details
    const user = await step.run('get-user', async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: 'User not found or no email' };
    }

    // Step 4: Format deal value
    const formattedValue = new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency || 'TWD',
      maximumFractionDigits: 0,
    }).format(dealValue);

    // Step 5: Render and send email
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

// ============================================
// Completion Event Handlers (Sprint E)
// ============================================

/**
 * Handle Document Analysis Completion
 *
 * Triggered when: document/analyze.completed event is sent
 * Creates an in-app notification for the user who requested the analysis.
 */
export const handleAnalyzeCompleted = inngest.createFunction(
  {
    id: 'handle-analyze-completed',
    retries: 2,
  },
  { event: 'document/analyze.completed' },
  async ({ event, step }) => {
    const { documentId, userId, organizationId } = event.data;

    if (!userId) return { success: false, reason: 'no_user_id' };

    await step.run('create-notification', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { name: true },
      });

      await createInAppNotification({
        userId,
        type: 'document_analysis',
        title: '文件分析完成',
        message: `「${doc?.name ?? '文件'}」的 AI 分析已完成`,
        linkUrl: `/documents?id=${documentId}`,
        metadata: { documentId, organizationId },
      });
    });

    return { success: true, documentId };
  }
);

/**
 * Handle Document Embedding Completion
 *
 * Triggered when: document/embed.completed event is sent
 * Creates an in-app notification that embedding is ready.
 */
export const handleEmbedCompleted = inngest.createFunction(
  {
    id: 'handle-embed-completed',
    retries: 2,
  },
  { event: 'document/embed.completed' },
  async ({ event, step }) => {
    const { documentId, organizationId, chunkCount } = event.data;

    await step.run('create-notification', async () => {
      // Find organization owner/admin to notify
      const admins = await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: { name: { in: ['owner', 'admin'] } },
          status: 'active',
        },
        select: { userId: true },
        take: 3,
      });

      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { name: true },
      });

      for (const admin of admins) {
        await createInAppNotification({
          userId: admin.userId,
          type: 'document_embedding',
          title: '文件索引完成',
          message: `「${doc?.name ?? '文件'}」已完成向量索引（${chunkCount} 個區塊）`,
          linkUrl: `/documents?id=${documentId}`,
          metadata: { documentId, chunkCount },
        });
      }
    });

    return { success: true, documentId };
  }
);

// Export all functions for the serve handler
export const functions = [
  analyzeDocument,
  extractDocumentText,
  embedDocumentChunks,
  handleAnalyzeCompleted,
  handleEmbedCompleted,
  sendTaskReminderEmail,
  sendDealNotification,
  sendWelcomeEmailFn,
  checkTaskReminders,
];
