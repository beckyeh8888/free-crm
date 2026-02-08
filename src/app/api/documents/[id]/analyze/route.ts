/**
 * Document Analysis API
 *
 * POST /api/documents/[id]/analyze - Trigger AI analysis for a document
 *
 * This endpoint queues a document for AI analysis using Inngest.
 * The actual analysis runs asynchronously in the background.
 *
 * Multi-tenant: Documents are accessed via organization membership
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { inngest } from '@/lib/inngest/client';
import { isAIConfigured } from '@/lib/ai/provider';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const analyzeOptionsSchema = z.object({
  analysisType: z
    .enum(['contract', 'email', 'meeting_notes', 'quotation'])
    .default('contract'),
  options: z
    .object({
      extractEntities: z.boolean().default(true),
      summarize: z.boolean().default(true),
      extractDates: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Check if user can access a document
 * User can access if they are in the same organization
 */
async function canAccessDocument(
  documentId: string,
  userId: string
): Promise<{ canAccess: boolean; organizationId?: string }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      organizationId: true,
      customer: {
        select: {
          createdById: true,
          assignedToId: true,
        },
      },
    },
  });

  if (!document) {
    return { canAccess: false };
  }

  // Check if user has access via customer
  if (document.customer) {
    const hasAccess =
      document.customer.createdById === userId ||
      document.customer.assignedToId === userId;
    return { canAccess: hasAccess, organizationId: document.organizationId };
  }

  // For org-level documents (no customer), check org membership
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: document.organizationId,
      },
    },
  });

  return {
    canAccess: membership?.status === 'active',
    organizationId: document.organizationId,
  };
}

/**
 * POST /api/documents/[id]/analyze
 * Queue a document for AI analysis
 *
 * Request body (optional):
 * {
 *   "analysisType": "contract" | "email" | "meeting_notes" | "quotation",
 *   "options": {
 *     "extractEntities": boolean,
 *     "summarize": boolean,
 *     "extractDates": boolean
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "eventId": "...",
 *     "documentId": "...",
 *     "status": "queued"
 *   }
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  // Check document exists and user can access
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      organizationId: true,
    },
  });

  if (!document) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Check access
  const { canAccess, organizationId } = await canAccessDocument(
    documentId,
    session.user.id
  );

  if (!canAccess) {
    return errorResponse('FORBIDDEN', '無權分析此文件');
  }

  // Check if document has content to analyze
  if (!document.content || document.content.trim().length === 0) {
    // If the document has a file but text hasn't been extracted yet, provide a helpful message
    const fullDoc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { filePath: true, extractionStatus: true },
    });

    if (fullDoc?.filePath) {
      if (fullDoc.extractionStatus === 'pending' || fullDoc.extractionStatus === 'processing') {
        return errorResponse('VALIDATION_ERROR', '文件文字萃取中，請稍候再進行分析。');
      }
      if (fullDoc.extractionStatus === 'unsupported') {
        return errorResponse('VALIDATION_ERROR', '此檔案格式不支援文字萃取（可能為掃描 PDF）。請嘗試手動輸入文字內容。');
      }
      if (fullDoc.extractionStatus === 'failed') {
        return errorResponse('VALIDATION_ERROR', '文字萃取失敗。請重新上傳檔案或手動輸入文字內容。');
      }
    }

    return errorResponse('VALIDATION_ERROR', '文件內容為空，無法分析。請輸入文字內容或上傳包含文字的檔案。');
  }

  // Check if AI is configured for this organization
  if (organizationId) {
    const aiReady = await isAIConfigured(organizationId);
    if (!aiReady) {
      return errorResponse(
        'VALIDATION_ERROR',
        'AI 功能尚未設定。請至「設定 → AI 功能」配置 API Key 後再試。'
      );
    }
  }

  try {
    // Parse options from request body (optional)
    let analysisType: 'contract' | 'email' | 'meeting_notes' | 'quotation' = 'contract';
    let analysisOptions: { extractEntities?: boolean; summarize?: boolean; extractDates?: boolean } | undefined;

    try {
      const body = await request.json();
      const parsed = analyzeOptionsSchema.safeParse(body);
      if (parsed.success) {
        analysisType = parsed.data.analysisType;
        analysisOptions = parsed.data.options;
      }
    } catch {
      // Body is optional, use defaults
    }

    // Check if analysis is already in progress
    const existingAnalysis = await prisma.documentAnalysis.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    // Send event to Inngest queue
    const eventResult = await inngest.send({
      name: 'document/analyze.requested',
      data: {
        documentId,
        userId: session.user.id,
        organizationId,
        analysisType,
        options: analysisOptions,
      },
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'document_analysis_request',
      entityId: documentId,
      userId: session.user.id,
      organizationId,
      details: {
        documentName: document.name,
        analysisType,
        hasExistingAnalysis: !!existingAnalysis,
      },
      request,
    });

    return successResponse({
      eventId: eventResult.ids[0],
      documentId,
      status: 'queued',
      message: '文件分析已加入佇列，將在背景執行',
    });
  } catch (err) {
    console.error('Queue document analysis error:', err);
    return errorResponse('INTERNAL_ERROR', '無法排程文件分析');
  }
}

/**
 * GET /api/documents/[id]/analyze
 * Get the latest analysis result for a document
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  // Check document exists and user can access
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!document) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Check access
  const { canAccess, organizationId } = await canAccessDocument(
    documentId,
    session.user.id
  );

  if (!canAccess) {
    return errorResponse('FORBIDDEN', '無權存取此文件');
  }

  // Get latest analysis
  const analysis = await prisma.documentAnalysis.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });

  if (!analysis) {
    return errorResponse('NOT_FOUND', '此文件尚未進行分析');
  }

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'document_analysis',
    entityId: analysis.id,
    userId: session.user.id,
    organizationId,
    request,
  });

  return successResponse({
    ...analysis,
    // Parse JSON fields
    entities: analysis.entities ? JSON.parse(analysis.entities) : null,
    keyPoints: analysis.keyPoints ? JSON.parse(analysis.keyPoints) : null,
    actionItems: analysis.actionItems ? JSON.parse(analysis.actionItems) : null,
  });
}
