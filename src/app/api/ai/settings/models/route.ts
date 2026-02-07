/**
 * AI Models List API
 *
 * POST /api/ai/settings/models - Fetch available models from provider API
 *
 * Supports:
 * - OpenAI: GET /v1/models
 * - Anthropic: Curated list (no public models endpoint)
 * - Google Gemini: GET /v1beta/models
 * - Ollama: GET /api/tags
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import {
  requireAuth,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { checkAISettingsTestRateLimit } from '@/lib/ai/rate-limit';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/ai/encryption';
import { AI_SETTING_KEYS } from '@/lib/ai/types';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const modelsRequestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  apiKey: z.string().min(1),
  ollamaEndpoint: z.string().optional(),
});

interface ModelInfo {
  readonly id: string;
  readonly name: string;
}

// ============================================
// Provider-specific model fetchers
// ============================================

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI API 錯誤 (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const models: ModelInfo[] = (data.data || [])
    .filter((m: { id: string; owned_by?: string }) => {
      const id = m.id;
      // Filter to chat-capable models only
      return (
        id.startsWith('gpt-') ||
        id.startsWith('o1') ||
        id.startsWith('o3') ||
        id.startsWith('o4') ||
        id.startsWith('chatgpt-')
      );
    })
    .map((m: { id: string }) => ({
      id: m.id,
      name: m.id,
    }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));

  return models;
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  // Anthropic has a models API
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Anthropic API 錯誤 (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const models: ModelInfo[] = (data.data || [])
    .map((m: { id: string; display_name?: string }) => ({
      id: m.id,
      name: m.display_name || m.id,
    }))
    .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name));

  return models;
}

async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { signal: AbortSignal.timeout(10000) }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google API 錯誤 (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const models: ModelInfo[] = (data.models || [])
    .filter((m: { name: string; supportedGenerationMethods?: string[] }) => {
      // Filter to models that support generateContent
      return m.supportedGenerationMethods?.includes('generateContent');
    })
    .map((m: { name: string; displayName?: string }) => ({
      // Google returns "models/gemini-1.5-pro" format, strip the prefix
      id: m.name.replace('models/', ''),
      name: m.displayName || m.name.replace('models/', ''),
    }))
    .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name));

  return models;
}

async function fetchOllamaModels(endpoint: string): Promise<ModelInfo[]> {
  const baseUrl = endpoint || 'http://localhost:11434';
  const response = await fetch(`${baseUrl}/api/tags`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Ollama API 錯誤 (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  const models: ModelInfo[] = (data.models || [])
    .map((m: { name: string; model?: string }) => ({
      id: m.name,
      name: m.name,
    }))
    .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name));

  return models;
}

// ============================================
// Main handler
// ============================================

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  // Share rate limit with test connection
  try {
    await checkAISettingsTestRateLimit(organizationId);
  } catch {
    return errorResponse('VALIDATION_ERROR', '請求過於頻繁，請稍後再試。');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const parseResult = modelsRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('VALIDATION_ERROR', '請提供有效的供應商和 API 金鑰');
  }

  const { provider, apiKey: rawApiKey, ollamaEndpoint } = parseResult.data;

  // Resolve stored API key if needed
  let resolvedApiKey = rawApiKey;
  if (rawApiKey === '__USE_STORED__') {
    const stored = await prisma.systemSetting.findUnique({
      where: { organizationId_key: { organizationId, key: AI_SETTING_KEYS.API_KEY } },
    });
    if (!stored?.value) {
      return errorResponse('VALIDATION_ERROR', '尚未儲存 API 金鑰，請先輸入金鑰');
    }
    try {
      resolvedApiKey = decrypt(stored.value);
    } catch {
      return errorResponse('VALIDATION_ERROR', 'API 金鑰解密失敗，請重新輸入');
    }
  }

  try {
    let models: ModelInfo[];

    switch (provider) {
      case 'openai':
        models = await fetchOpenAIModels(resolvedApiKey);
        break;
      case 'anthropic':
        models = await fetchAnthropicModels(resolvedApiKey);
        break;
      case 'google':
        models = await fetchGoogleModels(resolvedApiKey);
        break;
      case 'ollama':
        models = await fetchOllamaModels(ollamaEndpoint || 'http://localhost:11434');
        break;
    }

    return successResponse({ models });
  } catch (err) {
    const message = err instanceof Error ? err.message : '取得模型列表失敗';
    console.error('[AI Models Fetch Error]', message);
    return errorResponse('VALIDATION_ERROR', message);
  }
}
