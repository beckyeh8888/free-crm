/**
 * AI Chat Streaming API
 *
 * POST /api/ai/chat - Streaming chat with CRM context
 *
 * Uses Vercel AI SDK streamText for real-time responses.
 *
 * ISO 42001 AI Management System
 */

import { streamText } from 'ai';
import {
  requireAuth,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { getAIModel, requireAIFeature } from '@/lib/ai/provider';
import { buildChatSystemPrompt } from '@/lib/ai/prompts/chat';
import { getCRMContext } from '@/lib/ai/crm-context';
import { checkAIChatRateLimit } from '@/lib/ai/rate-limit';
import { handleAIError } from '@/lib/ai/errors';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit
  try {
    await checkAIChatRateLimit(session.user.id);
  } catch {
    return errorResponse('VALIDATION_ERROR', 'AI 請求過於頻繁，請稍後再試。');
  }

  // Check AI feature enabled
  try {
    await requireAIFeature(organizationId, 'chat');
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('VALIDATION_ERROR', aiError.message);
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return errorResponse('VALIDATION_ERROR', '至少需要一則訊息');
  }

  try {
    // Get AI model
    const model = await getAIModel(organizationId);

    // Get user's latest message for context building
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUserMessage?.content || '';

    // Fetch CRM context based on the query
    const crmContext = await getCRMContext(organizationId, session.user.id, query);

    // Get organization info for system prompt
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Build system prompt
    const systemPrompt = buildChatSystemPrompt({
      userName: session.user.name || '使用者',
      organizationName: org?.name || '組織',
    });

    // Stream the response
    const result = streamText({
      model,
      system: `${systemPrompt}\n\n---\n\n以下是與查詢相關的 CRM 資料：\n\n${crmContext}`,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      maxOutputTokens: 2000,
    });

    // Audit log (async, don't block the stream)
    logAudit({
      action: 'create',
      entity: 'system_setting',
      userId: session.user.id,
      details: {
        action: 'ai_chat',
        messageCount: messages.length,
      },
      request,
    }).catch(() => {
      // Don't fail the stream if audit logging fails
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('INTERNAL_ERROR', aiError.message);
  }
}
