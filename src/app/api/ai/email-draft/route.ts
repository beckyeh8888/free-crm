/**
 * Email Draft Generation API
 *
 * POST /api/ai/email-draft - Generate an AI-powered email draft
 *
 * Uses generateText (non-streaming) for complete draft generation.
 *
 * ISO 42001 AI Management System
 */

import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { getAIModel, requireAIFeature } from '@/lib/ai/provider';
import { getEmailDraftPrompt } from '@/lib/ai/prompts/email';
import { checkAIEmailDraftRateLimit } from '@/lib/ai/rate-limit';
import { handleAIError } from '@/lib/ai/errors';
import { emailDraftSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit
  try {
    await checkAIEmailDraftRateLimit(session.user.id);
  } catch {
    return errorResponse('VALIDATION_ERROR', 'AI 請求過於頻繁，請稍後再試。');
  }

  // Check AI feature enabled
  try {
    await requireAIFeature(organizationId, 'email_draft');
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('VALIDATION_ERROR', aiError.message);
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const parsed = emailDraftSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', '請求參數不正確');
  }

  const { customerId, dealId, tone, purpose, context } = parsed.data;

  try {
    // Fetch customer info if provided
    let customerName = '';
    let companyName: string | undefined;
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, organizationId },
        select: { name: true, company: true },
      });
      if (customer) {
        customerName = customer.name;
        companyName = customer.company ?? undefined;
      }
    }

    // Fetch deal info if provided
    let dealInfo: { title: string; stage: string; value?: number; currency?: string } | undefined;
    if (dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: {
          title: true, stage: true, value: true, currency: true,
          customer: { select: { name: true, company: true, organizationId: true } },
        },
      });
      // Verify deal belongs to user's organization via customer
      if (deal && deal.customer?.organizationId === organizationId) {
        dealInfo = {
          title: deal.title,
          stage: deal.stage,
          value: deal.value ? Number(deal.value) : undefined,
          currency: deal.currency ?? undefined,
        };
        // Use deal's customer info if no customer was explicitly provided
        if (!customerName) {
          customerName = deal.customer.name;
          companyName = deal.customer.company ?? undefined;
        }
      }
    }

    if (!customerName) {
      customerName = '客戶';
    }

    // Get AI model and generate
    const model = await getAIModel(organizationId);
    const prompt = getEmailDraftPrompt({
      purpose,
      tone,
      customerName,
      companyName,
      dealInfo,
      additionalContext: context,
    });

    const result = await generateText({
      model,
      prompt,
      maxOutputTokens: 1500,
    });

    // Parse the JSON response
    let emailData: { subject: string; body: string };
    try {
      emailData = JSON.parse(result.text);
    } catch {
      // If AI didn't return valid JSON, use the raw text
      emailData = {
        subject: '（AI 未回傳標準格式）',
        body: result.text,
      };
    }

    // Audit log
    await logAudit({
      action: 'create',
      entity: 'system_setting',
      userId: session.user.id,
      organizationId,
      details: {
        action: 'ai_email_draft',
        purpose,
        tone,
        customerId,
        dealId,
      },
      request,
    }).catch(() => {
      // Don't fail the response if audit logging fails
    });

    return successResponse({
      subject: emailData.subject || '',
      body: emailData.body || '',
      tone,
    });
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('INTERNAL_ERROR', aiError.message);
  }
}
