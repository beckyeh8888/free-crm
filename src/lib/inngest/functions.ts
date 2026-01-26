/**
 * Inngest Functions
 *
 * Background job handlers for async processing
 *
 * Multi-tenant: Functions operate within organization context
 */

import { inngest } from './client';
import { prisma } from '../prisma';

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
    const { documentId, userId, organizationId, analysisType, options } = event.data;

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
    // TODO: Replace with actual AI service integration (e.g., OpenAI, Anthropic)
    const analysisResult = await step.run('ai-analysis', async () => {
      // Placeholder for AI analysis
      // In production, this would call an LLM API
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

// Export all functions for the serve handler
export const functions = [analyzeDocument];
