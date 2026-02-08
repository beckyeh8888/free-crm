/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Orchestrates the query flow:
 * 1. Generate embedding for query
 * 2. Find similar document chunks via vector search
 * 3. Format context for LLM consumption
 *
 * ISO 42001 AI Management System
 */

import { generateEmbedding, isEmbeddingConfigured } from '@/lib/ai/embedding';
import { findSimilarChunks, type SimilarChunk } from './vector-search';
import { prisma } from '@/lib/prisma';

// ============================================
// Types
// ============================================

export interface RAGSource {
  readonly documentId: string;
  readonly documentName: string;
  readonly chunkContent: string;
  readonly chunkIndex: number;
  readonly score: number;
}

export interface RAGResult {
  readonly context: string;
  readonly sources: readonly RAGSource[];
}

export interface RAGQueryOptions {
  readonly documentIds?: readonly string[];
  readonly customerId?: string;
  readonly topK?: number;
  readonly minScore?: number;
}

// ============================================
// Public API
// ============================================

/**
 * Execute a RAG query — embed query, find similar chunks, format context.
 *
 * @returns RAG context and sources, or null if embedding is not configured
 */
export async function ragQuery(
  organizationId: string,
  query: string,
  options?: RAGQueryOptions,
): Promise<RAGResult | null> {
  // Check if embedding is configured
  const configured = await isEmbeddingConfigured(organizationId);
  if (!configured) return null;

  // Generate embedding for the query
  const embeddingResult = await generateEmbedding(organizationId, query);
  if (!embeddingResult) return null;

  // Resolve documentIds filter from customerId if provided
  let documentIds = options?.documentIds ? [...options.documentIds] : undefined;

  if (options?.customerId && !documentIds) {
    const customerDocs = await prisma.document.findMany({
      where: {
        customerId: options.customerId,
        organizationId,
      },
      select: { id: true },
    });
    if (customerDocs.length > 0) {
      documentIds = customerDocs.map((d) => d.id);
    }
  }

  // Find similar chunks
  const chunks = await findSimilarChunks(
    organizationId,
    embeddingResult.embedding,
    {
      topK: options?.topK ?? 5,
      minScore: options?.minScore ?? 0.7,
      documentIds,
    },
  );

  if (chunks.length === 0) {
    return { context: '', sources: [] };
  }

  // Enrich with document names
  const sources = await enrichChunksWithDocumentNames(chunks);

  // Format context for LLM
  const context = formatRAGContext(sources);

  return { context, sources };
}

// ============================================
// Helpers
// ============================================

async function enrichChunksWithDocumentNames(
  chunks: readonly SimilarChunk[],
): Promise<RAGSource[]> {
  const documentIds = [...new Set(chunks.map((c) => c.documentId))];

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: { id: true, name: true },
  });

  const nameMap = new Map(documents.map((d) => [d.id, d.name]));

  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    documentName: nameMap.get(chunk.documentId) ?? '未知文件',
    chunkContent: chunk.content,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
  }));
}

function formatRAGContext(sources: readonly RAGSource[]): string {
  if (sources.length === 0) return '';

  const lines = sources.map((s, i) =>
    `[文件 ${i + 1}: ${s.documentName} (相關度: ${Math.round(s.score * 100)}%)]\n${s.chunkContent}`
  );

  return `以下是與查詢相關的文件內容：\n\n${lines.join('\n\n---\n\n')}`;
}
