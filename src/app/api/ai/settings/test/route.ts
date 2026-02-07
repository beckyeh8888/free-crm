/**
 * AI Settings Test Connection API
 *
 * POST /api/ai/settings/test - Verify API key by making a minimal AI call
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import {
  requireAuth,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { checkAISettingsTestRateLimit } from '@/lib/ai/rate-limit';
import { handleAIError } from '@/lib/ai/errors';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';

const testConnectionSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  apiKey: z.string().min(1),
  model: z.string().optional(),
  ollamaEndpoint: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Rate limit
  try {
    await checkAISettingsTestRateLimit(organizationId);
  } catch {
    return errorResponse('VALIDATION_ERROR', 'AI 測試連線請求過於頻繁，請稍後再試。');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const parseResult = testConnectionSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('VALIDATION_ERROR', '請提供有效的供應商和 API 金鑰');
  }

  const { provider, apiKey, model } = parseResult.data;

  try {
    const startTime = Date.now();

    // Create model instance based on provider
    let aiModel: LanguageModel;
    const modelName = model || getDefaultTestModel(provider);

    switch (provider) {
      case 'openai': {
        const openai = createOpenAI({ apiKey });
        aiModel = openai(modelName);
        break;
      }
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey });
        aiModel = anthropic(modelName);
        break;
      }
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey });
        aiModel = google(modelName);
        break;
      }
      case 'ollama': {
        aiModel = ollama(modelName, { simulateStreaming: true }) as unknown as LanguageModel;
        break;
      }
    }

    // Make a minimal test call
    const result = await generateText({
      model: aiModel,
      prompt: 'Say "OK" in one word.',
      maxOutputTokens: 5,
      abortSignal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    return successResponse({
      success: true,
      model: modelName,
      provider,
      latency,
      response: result.text.substring(0, 50),
    });
  } catch (err) {
    const aiError = handleAIError(err);
    return errorResponse('VALIDATION_ERROR', aiError.message);
  }
}

function getDefaultTestModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5-20251001',
    google: 'gemini-2.0-flash',
    ollama: 'llama3.2',
  };
  return defaults[provider] || 'gpt-4o-mini';
}
