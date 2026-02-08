/**
 * Document Semantic Search API
 *
 * POST /api/documents/search - Search documents using vector similarity
 *
 * Returns matched document chunks with relevance scores.
 * Requires embedding to be configured for the organization.
 *
 * ISO 42001 AI Management System
 */

import {
  requireAuth,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { documentSearchSchema } from '@/lib/validation';
import { ragQuery } from '@/lib/rag/pipeline';
import { requireAIFeature } from '@/lib/ai/provider';
import { handleAIError } from '@/lib/ai/errors';
import { checkRateLimit, getRateLimitKey, AI_RATE_LIMIT } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit: 20 req/min per user
  const rlKey = getRateLimitKey('doc-search', session.user.id);
  const rlResult = checkRateLimit(rlKey, AI_RATE_LIMIT);
  if (!rlResult.success) {
    return errorResponse('VALIDATION_ERROR', '搜尋請求過於頻繁，請稍後再試。');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const parseResult = documentSearchSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('VALIDATION_ERROR', '搜尋參數無效');
  }

  const { query, customerId, topK } = parseResult.data;

  // Check RAG feature enabled
  try {
    await requireAIFeature(organizationId, 'rag');
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('VALIDATION_ERROR', aiError.message);
  }

  try {
    const result = await ragQuery(organizationId, query, {
      customerId,
      topK,
    });

    if (!result) {
      return errorResponse('VALIDATION_ERROR', 'Embedding 尚未設定。請至「設定 → AI 功能」設定 Embedding 供應商。');
    }

    return successResponse({
      query,
      results: result.sources.map((s) => ({
        documentId: s.documentId,
        documentName: s.documentName,
        content: s.chunkContent,
        score: Math.round(s.score * 100) / 100,
      })),
      totalResults: result.sources.length,
    });
  } catch (err) {
    console.error('Semantic search error:', err);
    return errorResponse('INTERNAL_ERROR', '語意搜尋發生錯誤');
  }
}
