/**
 * Vector Search Module
 *
 * Performs cosine similarity search over document chunk embeddings.
 * Operates entirely in application memory — suitable for CRM-scale
 * datasets (up to ~50K chunks per organization).
 *
 * For larger datasets, consider migrating to PostgreSQL + pgvector.
 *
 * ISO 42001 AI Management System
 */

import { prisma } from '@/lib/prisma';

// ============================================
// Types
// ============================================

export interface SimilarChunk {
  readonly chunkId: string;
  readonly documentId: string;
  readonly content: string;
  readonly chunkIndex: number;
  readonly score: number;
}

export interface VectorSearchOptions {
  readonly topK?: number;
  readonly minScore?: number;
  readonly documentIds?: readonly string[];
}

// ============================================
// LRU Cache for Organization Embeddings
// ============================================

interface CachedEmbeddings {
  readonly chunks: readonly CachedChunk[];
  readonly loadedAt: number;
}

interface CachedChunk {
  readonly id: string;
  readonly documentId: string;
  readonly content: string;
  readonly chunkIndex: number;
  readonly embedding: Float32Array;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_ORGS = 3;
const embeddingCache = new Map<string, CachedEmbeddings>();

function evictOldestCache(): void {
  if (embeddingCache.size < MAX_CACHED_ORGS) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, value] of embeddingCache) {
    if (value.loadedAt < oldestTime) {
      oldestTime = value.loadedAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    embeddingCache.delete(oldestKey);
  }
}

/**
 * Invalidate cache for an organization (call after embedding updates).
 */
export function invalidateEmbeddingCache(organizationId: string): void {
  embeddingCache.delete(organizationId);
}

// ============================================
// Embedding Loading
// ============================================

async function loadOrganizationEmbeddings(
  organizationId: string,
  documentIds?: readonly string[],
): Promise<readonly CachedChunk[]> {
  // Check cache first (only for full-org loads, not filtered)
  if (!documentIds) {
    const cached = embeddingCache.get(organizationId);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return cached.chunks;
    }
  }

  // Load from database
  const where: Record<string, unknown> = {
    organizationId,
    embedding: { not: null },
  };

  if (documentIds && documentIds.length > 0) {
    where.documentId = { in: [...documentIds] };
  }

  const chunks = await prisma.documentChunk.findMany({
    where,
    select: {
      id: true,
      documentId: true,
      content: true,
      chunkIndex: true,
      embedding: true,
    },
  });

  const parsed: CachedChunk[] = [];
  for (const chunk of chunks) {
    if (!chunk.embedding) continue;

    try {
      const arr = JSON.parse(chunk.embedding) as number[];
      parsed.push({
        id: chunk.id,
        documentId: chunk.documentId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: new Float32Array(arr),
      });
    } catch {
      // Skip chunks with invalid embedding data
    }
  }

  // Cache full-org loads only
  if (!documentIds) {
    evictOldestCache();
    embeddingCache.set(organizationId, {
      chunks: parsed,
      loadedAt: Date.now(),
    });
  }

  return parsed;
}

// ============================================
// Cosine Similarity
// ============================================

function cosineSimilarity(a: Float32Array, b: Float32Array | number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = typeof b[i] === 'number' ? b[i] : 0;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ============================================
// Public API
// ============================================

/**
 * Find document chunks most similar to a query embedding.
 *
 * @param organizationId - Scope search to this organization
 * @param queryEmbedding - The embedding vector of the search query
 * @param options - Search configuration (topK, minScore, documentIds filter)
 * @returns Sorted array of similar chunks with scores
 */
export async function findSimilarChunks(
  organizationId: string,
  queryEmbedding: number[],
  options?: VectorSearchOptions,
): Promise<SimilarChunk[]> {
  const topK = options?.topK ?? 5;
  const minScore = options?.minScore ?? 0.7;

  const chunks = await loadOrganizationEmbeddings(
    organizationId,
    options?.documentIds,
  );

  if (chunks.length === 0) return [];

  // Compute similarity for all chunks
  const scored: SimilarChunk[] = [];

  for (const chunk of chunks) {
    const score = cosineSimilarity(chunk.embedding, queryEmbedding);
    if (score >= minScore) {
      scored.push({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        score,
      });
    }
  }

  // Sort by score descending, take top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
