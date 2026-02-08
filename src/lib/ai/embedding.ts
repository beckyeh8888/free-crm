/**
 * Embedding Provider Abstraction Layer
 *
 * Generates embeddings for document chunks using the organization's
 * configured embedding provider. Falls back to the main AI provider
 * if a separate embedding provider is not configured.
 *
 * Supported providers:
 * - OpenAI: text-embedding-3-small (1536 dims)
 * - Google: text-embedding-004 (768 dims)
 * - Ollama: nomic-embed-text (768 dims)
 * - Anthropic: NOT supported (no embedding API)
 *
 * ISO 42001 AI Management System
 */

import { embed, embedMany, type EmbeddingModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import { prisma } from '@/lib/prisma';
import { decrypt } from './encryption';
import { AI_SETTING_KEYS, type AIProvider } from './types';

// ============================================
// Default Embedding Models per Provider
// ============================================

const DEFAULT_EMBEDDING_MODELS: Partial<Record<AIProvider, string>> = {
  openai: 'text-embedding-3-small',
  google: 'text-embedding-004',
  ollama: 'nomic-embed-text',
};

const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-004': 768,
  'nomic-embed-text': 768,
  'mxbai-embed-large': 1024,
};

// Providers that support embedding
const EMBEDDING_CAPABLE_PROVIDERS = new Set<AIProvider>(['openai', 'google', 'ollama']);

// ============================================
// Configuration Reading
// ============================================

interface EmbeddingConfig {
  readonly provider: AIProvider;
  readonly model: string;
  readonly apiKey: string | null;
  readonly dimensions: number;
}

async function getEmbeddingConfig(organizationId: string): Promise<EmbeddingConfig | null> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      organizationId,
      key: {
        in: [
          AI_SETTING_KEYS.EMBEDDING_PROVIDER,
          AI_SETTING_KEYS.EMBEDDING_MODEL,
          AI_SETTING_KEYS.PROVIDER,
          AI_SETTING_KEYS.API_KEY,
          AI_SETTING_KEYS.OLLAMA_ENDPOINT,
        ],
      },
    },
  });

  const map: Record<string, string | null> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  // Use dedicated embedding provider if configured, otherwise fall back to main provider
  const embeddingProvider = (map[AI_SETTING_KEYS.EMBEDDING_PROVIDER] || map[AI_SETTING_KEYS.PROVIDER]) as AIProvider | undefined;
  if (!embeddingProvider) return null;

  // Check if provider supports embeddings
  if (!EMBEDDING_CAPABLE_PROVIDERS.has(embeddingProvider)) return null;

  const embeddingModel = map[AI_SETTING_KEYS.EMBEDDING_MODEL] || DEFAULT_EMBEDDING_MODELS[embeddingProvider];
  if (!embeddingModel) return null;

  // Ollama doesn't need an API key
  let apiKey: string | null = null;
  if (embeddingProvider !== 'ollama') {
    const encryptedKey = map[AI_SETTING_KEYS.API_KEY];
    if (!encryptedKey) return null;
    try {
      apiKey = decrypt(encryptedKey);
    } catch {
      return null;
    }
  }

  const dimensions = EMBEDDING_DIMENSIONS[embeddingModel] || 768;

  return { provider: embeddingProvider, model: embeddingModel, apiKey, dimensions };
}

// ============================================
// Model Factory
// ============================================

function createEmbeddingModel(config: EmbeddingConfig): EmbeddingModel {
  switch (config.provider) {
    case 'openai': {
      const openai = createOpenAI({ apiKey: config.apiKey! });
      return openai.textEmbeddingModel(config.model);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey! });
      return google.textEmbeddingModel(config.model);
    }
    case 'ollama': {
      return ollama.textEmbeddingModel(config.model) as unknown as EmbeddingModel;
    }
    default:
      throw new Error(`Embedding 不支援此供應商: ${config.provider}`);
  }
}

// ============================================
// Public API
// ============================================

/**
 * Check if a provider supports embedding generation.
 */
export function isEmbeddingCapable(provider: AIProvider): boolean {
  return EMBEDDING_CAPABLE_PROVIDERS.has(provider);
}

/**
 * Check if embedding is configured for an organization.
 */
export async function isEmbeddingConfigured(organizationId: string): Promise<boolean> {
  const config = await getEmbeddingConfig(organizationId);
  return config !== null;
}

/**
 * Generate a single embedding vector for a text string.
 * Returns null if embedding is not configured.
 */
export async function generateEmbedding(
  organizationId: string,
  text: string,
): Promise<{ embedding: number[]; model: string; dimensions: number } | null> {
  const config = await getEmbeddingConfig(organizationId);
  if (!config) return null;

  const model = createEmbeddingModel(config);
  const result = await embed({ model, value: text });

  return {
    embedding: Array.from(result.embedding),
    model: config.model,
    dimensions: config.dimensions,
  };
}

/**
 * Generate embeddings for multiple text strings in batch.
 * Returns null if embedding is not configured.
 */
export async function generateEmbeddings(
  organizationId: string,
  texts: readonly string[],
): Promise<{ embeddings: number[][]; model: string; dimensions: number } | null> {
  const config = await getEmbeddingConfig(organizationId);
  if (!config) return null;

  const model = createEmbeddingModel(config);
  const result = await embedMany({ model, values: [...texts] });

  return {
    embeddings: result.embeddings.map((e) => Array.from(e)),
    model: config.model,
    dimensions: config.dimensions,
  };
}

/**
 * Get the embedding dimensions for the current configuration.
 */
export async function getEmbeddingDimensions(organizationId: string): Promise<number | null> {
  const config = await getEmbeddingConfig(organizationId);
  return config?.dimensions ?? null;
}
