/**
 * Document Text Chunking Module
 *
 * Splits document text into meaningful chunks for embedding and retrieval.
 * Uses a recursive splitting strategy: paragraphs → lines → sentences → fixed-size.
 *
 * ISO 42001 AI Management System — data preprocessing
 */

// ============================================
// Types
// ============================================

export interface ChunkConfig {
  readonly maxChunkSize: number;
  readonly chunkOverlap: number;
  readonly minChunkSize: number;
}

export interface Chunk {
  readonly content: string;
  readonly chunkIndex: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: ChunkConfig = {
  maxChunkSize: 512,
  chunkOverlap: 64,
  minChunkSize: 50,
};

// Separators in order of preference (most meaningful → least)
const SEPARATORS = [
  '\n\n',       // Paragraph boundary
  '\n',         // Line boundary
  '。',         // Chinese period
  '！',         // Chinese exclamation
  '？',         // Chinese question
  '. ',         // English sentence
  '! ',         // English exclamation
  '? ',         // English question
  '；',         // Chinese semicolon
  '; ',         // English semicolon
  '，',         // Chinese comma
  ', ',         // English comma
  ' ',          // Word boundary
];

// ============================================
// Chunking Logic
// ============================================

/**
 * Split text by a separator, keeping the separator attached to the preceding segment.
 */
function splitBySeparator(text: string, separator: string): string[] {
  const parts = text.split(separator);
  if (parts.length <= 1) return [text];

  // Re-attach separators (except for the last part)
  return parts.map((part, i) => {
    if (i < parts.length - 1) return part + separator;
    return part;
  }).filter(Boolean);
}

/**
 * Recursively split text into chunks that fit within maxChunkSize.
 */
function recursiveSplit(
  text: string,
  separators: readonly string[],
  maxSize: number,
): string[] {
  // Base case: text fits within max size
  if (text.length <= maxSize) {
    return [text];
  }

  // Try each separator in order of preference
  for (let i = 0; i < separators.length; i++) {
    const separator = separators[i];
    const parts = splitBySeparator(text, separator);

    if (parts.length <= 1) continue;

    // Merge small parts together, split large parts further
    const result: string[] = [];
    let current = '';

    for (const part of parts) {
      if (current.length + part.length <= maxSize) {
        current += part;
      } else {
        if (current) result.push(current);

        if (part.length <= maxSize) {
          current = part;
        } else {
          // Recursively split with remaining separators
          const subChunks = recursiveSplit(part, separators.slice(i + 1), maxSize);
          result.push(...subChunks.slice(0, -1));
          current = subChunks[subChunks.length - 1] || '';
        }
      }
    }

    if (current) result.push(current);
    return result;
  }

  // Fallback: hard split at maxSize
  const result: string[] = [];
  for (let i = 0; i < text.length; i += maxSize) {
    result.push(text.slice(i, i + maxSize));
  }
  return result;
}

/**
 * Add overlap between chunks for better context continuity.
 */
function addOverlap(chunks: string[], overlap: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;

  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;

    // Prepend overlap from the end of the previous chunk
    const prevChunk = chunks[i - 1];
    const overlapText = prevChunk.slice(-overlap);
    return overlapText + chunk;
  });
}

// ============================================
// Public API
// ============================================

/**
 * Split document text into chunks suitable for embedding.
 *
 * @param text - The full document text
 * @param config - Optional chunking configuration
 * @returns Array of Chunk objects with content, index, and character offsets
 */
export function chunkText(
  text: string,
  config?: Partial<ChunkConfig>,
): Chunk[] {
  const { maxChunkSize, chunkOverlap, minChunkSize } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  if (!text || text.trim().length < minChunkSize) {
    return [];
  }

  // Step 1: Recursively split into raw chunks
  const rawChunks = recursiveSplit(text, SEPARATORS, maxChunkSize);

  // Step 2: Filter out tiny chunks (merge with neighbors where possible)
  const filteredChunks: string[] = [];
  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (trimmed.length < minChunkSize && filteredChunks.length > 0) {
      // Merge with previous chunk if it won't exceed max size
      const prev = filteredChunks[filteredChunks.length - 1];
      if (prev.length + chunk.length <= maxChunkSize) {
        filteredChunks[filteredChunks.length - 1] = prev + chunk;
        continue;
      }
    }
    if (trimmed.length > 0) {
      filteredChunks.push(chunk);
    }
  }

  // Step 3: Add overlap for context continuity
  const overlappedChunks = addOverlap(filteredChunks, chunkOverlap);

  // Step 4: Calculate offsets and build Chunk objects
  let currentOffset = 0;
  const chunks: Chunk[] = [];

  for (let i = 0; i < overlappedChunks.length; i++) {
    const content = overlappedChunks[i];
    const originalContent = filteredChunks[i];

    // Find the start offset of the original (non-overlapped) content in the source text
    const startInSource = text.indexOf(originalContent, currentOffset);
    const startOffset = startInSource >= 0 ? startInSource : currentOffset;
    const endOffset = startOffset + originalContent.length;

    chunks.push({
      content,
      chunkIndex: i,
      startOffset,
      endOffset,
    });

    currentOffset = endOffset;
  }

  return chunks;
}
