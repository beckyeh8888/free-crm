/**
 * AI Provider Abstraction Layer
 *
 * BYOK model: reads per-organization AI configuration from SystemSetting,
 * decrypts the API key, and returns a configured Vercel AI SDK model instance.
 *
 * ISO 42001 AI Management System
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import type { LanguageModel } from 'ai';
import { prisma } from '@/lib/prisma';
import { decrypt, maskApiKey } from './encryption';
import { AINotConfiguredError, AIFeatureDisabledError } from './errors';
import type { AIConfig, AIProvider, AIFeature } from './types';
import { AI_SETTING_KEYS } from './types';

// ============================================
// Read Configuration from Database
// ============================================

interface RawAISettings {
  provider?: string;
  apiKey?: string;
  model?: string;
  ollamaEndpoint?: string;
  features?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
}

async function getRawSettings(organizationId: string): Promise<RawAISettings> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      organizationId,
      key: { in: Object.values(AI_SETTING_KEYS) },
    },
  });

  const map: Record<string, string | null> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return {
    provider: map[AI_SETTING_KEYS.PROVIDER] ?? undefined,
    apiKey: map[AI_SETTING_KEYS.API_KEY] ?? undefined,
    model: map[AI_SETTING_KEYS.MODEL] ?? undefined,
    ollamaEndpoint: map[AI_SETTING_KEYS.OLLAMA_ENDPOINT] ?? undefined,
    features: map[AI_SETTING_KEYS.FEATURES] ?? undefined,
    embeddingProvider: map[AI_SETTING_KEYS.EMBEDDING_PROVIDER] ?? undefined,
    embeddingModel: map[AI_SETTING_KEYS.EMBEDDING_MODEL] ?? undefined,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Get the configured AI model for an organization.
 * Throws AINotConfiguredError if not set up.
 */
export async function getAIModel(organizationId: string): Promise<LanguageModel> {
  const raw = await getRawSettings(organizationId);

  if (!raw.provider || !raw.apiKey) {
    throw new AINotConfiguredError();
  }

  // Ollama doesn't need an API key
  const provider = raw.provider as AIProvider;
  const modelName = raw.model || getDefaultModel(provider);

  if (provider === 'ollama') {
    // ollama-ai-provider returns LanguageModelV1; cast for AI SDK v6 compat
    return ollama(modelName, { simulateStreaming: true }) as unknown as LanguageModel;
  }

  const apiKey = decrypt(raw.apiKey);

  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(modelName);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelName);
    }
    default:
      throw new Error(`不支援的 AI 供應商: ${provider}`);
  }
}

/**
 * Get the AI configuration for display (API key masked).
 */
export async function getAIConfig(organizationId: string): Promise<AIConfig | null> {
  const raw = await getRawSettings(organizationId);

  if (!raw.provider) return null;

  const defaultFeatures: Record<AIFeature, boolean> = { chat: true, document_analysis: true, email_draft: true, insights: true, rag: false };
  let features = defaultFeatures;
  if (raw.features) {
    try {
      features = { ...defaultFeatures, ...JSON.parse(raw.features) };
    } catch {
      // Use defaults if JSON is invalid
    }
  }

  return {
    provider: raw.provider as AIProvider,
    model: raw.model || getDefaultModel(raw.provider as AIProvider),
    features,
    ollamaEndpoint: raw.ollamaEndpoint,
    hasApiKey: !!raw.apiKey,
    embeddingProvider: raw.embeddingProvider as AIProvider | undefined,
    embeddingModel: raw.embeddingModel,
  };
}

/**
 * Check if AI is configured for an organization.
 */
export async function isAIConfigured(organizationId: string): Promise<boolean> {
  const raw = await getRawSettings(organizationId);
  return !!(raw.provider && raw.apiKey);
}

/**
 * Check if a specific AI feature is enabled for an organization.
 * Throws AINotConfiguredError if AI is not set up.
 * Throws AIFeatureDisabledError if the feature is disabled.
 */
export async function requireAIFeature(organizationId: string, feature: AIFeature): Promise<void> {
  const config = await getAIConfig(organizationId);

  if (!config || !config.hasApiKey) {
    throw new AINotConfiguredError();
  }

  if (!config.features[feature]) {
    const featureLabels: Record<AIFeature, string> = {
      chat: 'AI 對話助手',
      document_analysis: '文件智能分析',
      email_draft: 'Email 草稿生成',
      insights: '銷售洞察',
      rag: 'RAG 文件檢索',
    };
    throw new AIFeatureDisabledError(featureLabels[feature]);
  }
}

/**
 * Check if a specific AI feature is enabled (non-throwing).
 * Returns false if AI is not configured or feature is disabled.
 */
export async function isFeatureEnabled(organizationId: string, feature: AIFeature): Promise<boolean> {
  const config = await getAIConfig(organizationId);
  if (!config || !config.hasApiKey) return false;
  return !!config.features[feature];
}

/**
 * Get masked API key for display purposes.
 */
export async function getMaskedApiKey(organizationId: string): Promise<string | null> {
  const raw = await getRawSettings(organizationId);
  if (!raw.apiKey) return null;

  try {
    const decrypted = decrypt(raw.apiKey);
    return maskApiKey(decrypted);
  } catch {
    return '****（解密失敗）';
  }
}

// ============================================
// Helpers
// ============================================

function getDefaultModel(provider: AIProvider): string {
  const defaults: Record<AIProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-5-20250929',
    google: 'gemini-2.0-flash',
    ollama: 'llama3.2',
  };
  return defaults[provider];
}
