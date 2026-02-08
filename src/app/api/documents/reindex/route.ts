/**
 * Document Re-Index API
 *
 * POST /api/documents/reindex - Re-embed all document chunks
 *
 * Used when switching embedding providers/models.
 * Sends document/embed.requested events for all documents with chunks.
 *
 * ISO 42001 AI Management System
 */

import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { isEmbeddingConfigured } from '@/lib/ai/embedding';
import { invalidateEmbeddingCache } from '@/lib/rag/vector-search';
import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit: 2 requests per 5 minutes per org (heavy operation)
  const rlKey = getRateLimitKey('doc-reindex', organizationId);
  const rlResult = checkRateLimit(rlKey, { limit: 2, windowSeconds: 300 });
  if (!rlResult.success) {
    return errorResponse('VALIDATION_ERROR', '重新索引操作過於頻繁，請稍後再試。');
  }

  // Check embedding is configured
  const embeddingReady = await isEmbeddingConfigured(organizationId);
  if (!embeddingReady) {
    return errorResponse('VALIDATION_ERROR', 'Embedding 尚未設定。請至「設定 → AI 功能」設定 Embedding 供應商。');
  }

  // Find all documents that have chunks (meaning they've been extracted)
  const documents = await prisma.document.findMany({
    where: {
      organizationId,
      extractionStatus: 'completed',
    },
    select: { id: true },
  });

  if (documents.length === 0) {
    return successResponse({ reindexed: 0, message: '沒有需要重新索引的文件' });
  }

  // Invalidate existing cache
  invalidateEmbeddingCache(organizationId);

  // Clear existing embeddings on all chunks for this org
  await prisma.documentChunk.updateMany({
    where: { organizationId },
    data: {
      embedding: null,
      embeddingModel: null,
      embeddingDims: null,
      embeddedAt: null,
    },
  });

  // Send embed events for all documents
  const events = documents.map((doc) => ({
    name: 'document/embed.requested' as const,
    data: {
      documentId: doc.id,
      organizationId,
    },
  }));

  await inngest.send(events);

  await logAudit({
    action: 'update',
    entity: 'document',
    userId: session.user.id,
    details: {
      action: 'reindex_all',
      documentCount: documents.length,
    },
    request,
  });

  return successResponse({
    reindexed: documents.length,
    message: `已排隊重新索引 ${documents.length} 份文件`,
  });
}
