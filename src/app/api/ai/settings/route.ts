/**
 * AI Settings API
 *
 * GET  /api/ai/settings - Read AI configuration (masked key)
 * PUT  /api/ai/settings - Save AI configuration
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 * ISO 42001 AI Management System
 */

import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { aiConfigSchema } from '@/lib/validation';
import { encrypt } from '@/lib/ai/encryption';
import { getAIConfig, getMaskedApiKey } from '@/lib/ai/provider';
import { AI_SETTING_KEYS } from '@/lib/ai/types';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  const config = await getAIConfig(organizationId);
  const maskedKey = await getMaskedApiKey(organizationId);

  return successResponse({
    config,
    maskedApiKey: maskedKey,
  });
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const organizationId = session.user.defaultOrganizationId;
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '請先加入組織');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求資料');
  }

  const parseResult = aiConfigSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('VALIDATION_ERROR', '無效的 AI 設定資料');
  }

  const { provider, apiKey, model, ollamaEndpoint, features } = parseResult.data;

  // Encrypt the API key before storing
  const encryptedKey = encrypt(apiKey);

  // Upsert all settings
  const upserts = [
    { key: AI_SETTING_KEYS.PROVIDER, value: provider },
    { key: AI_SETTING_KEYS.API_KEY, value: encryptedKey },
    { key: AI_SETTING_KEYS.MODEL, value: model || null },
    { key: AI_SETTING_KEYS.OLLAMA_ENDPOINT, value: ollamaEndpoint || null },
    { key: AI_SETTING_KEYS.FEATURES, value: features ? JSON.stringify(features) : null },
  ];

  for (const { key, value } of upserts) {
    await prisma.systemSetting.upsert({
      where: {
        organizationId_key: { organizationId, key },
      },
      create: {
        organizationId,
        key,
        value,
        description: `AI configuration: ${key}`,
      },
      update: {
        value,
      },
    });
  }

  await logAudit({
    action: 'update',
    entity: 'system_setting',
    userId: session.user.id,
    details: {
      action: 'ai_configure',
      provider,
      model: model || 'default',
      // Never log the actual API key
    },
    request,
  });

  const updatedConfig = await getAIConfig(organizationId);
  const maskedKey = await getMaskedApiKey(organizationId);

  return successResponse({
    config: updatedConfig,
    maskedApiKey: maskedKey,
  });
}
