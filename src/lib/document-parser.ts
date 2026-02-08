/**
 * Document Text Extraction Module
 *
 * Extracts plain text from uploaded files (PDF, DOCX, TXT, CSV, MD).
 * Used by the Inngest extraction pipeline to populate Document.content.
 *
 * ISO 42001 AI Management System — data preprocessing
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

// ============================================
// Supported MIME Types
// ============================================

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/html',
  'text/xml',
  'application/json',
]);

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...TEXT_MIME_TYPES,
]);

// ============================================
// Type Definitions
// ============================================

export interface ExtractionResult {
  readonly text: string;
  readonly pageCount?: number;
  readonly wordCount: number;
}

// ============================================
// Extraction Functions
// ============================================

/**
 * Extract text from a PDF buffer.
 * Returns null if the PDF is scanned (image-only) with no extractable text.
 */
async function extractPdfText(buffer: Buffer): Promise<ExtractionResult | null> {
  const result = await pdfParse(buffer);
  const text = result.text?.trim();

  // Scanned PDFs yield empty or near-empty text
  if (!text || text.length < 10) {
    return null;
  }

  return {
    text,
    pageCount: result.numpages,
    wordCount: text.split(/\s+/).length,
  };
}

/**
 * Extract text from a DOCX buffer using mammoth.
 */
async function extractDocxText(buffer: Buffer): Promise<ExtractionResult | null> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim();

  if (!text || text.length < 1) {
    return null;
  }

  return {
    text,
    wordCount: text.split(/\s+/).length,
  };
}

/**
 * Extract text from plain-text-based formats (TXT, CSV, MD, HTML, etc.).
 */
function extractPlainText(buffer: Buffer): ExtractionResult | null {
  const text = buffer.toString('utf-8').trim();

  if (!text || text.length < 1) {
    return null;
  }

  return {
    text,
    wordCount: text.split(/\s+/).length,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Check if a MIME type is supported for text extraction.
 */
export function isSupportedMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

/**
 * Extract text content from a file buffer based on its MIME type.
 *
 * @returns ExtractionResult with the extracted text, or null if:
 *   - MIME type is unsupported
 *   - File is a scanned PDF (image-only)
 *   - File content is empty
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult | null> {
  if (!isSupportedMimeType(mimeType)) {
    return null;
  }

  switch (mimeType) {
    case 'application/pdf':
      return extractPdfText(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);

    default:
      // All text-based MIME types
      if (TEXT_MIME_TYPES.has(mimeType)) {
        return extractPlainText(buffer);
      }
      return null;
  }
}

/**
 * Get a human-readable description of supported file types.
 */
export function getSupportedFormats(): string {
  return 'PDF, DOCX, TXT, CSV, Markdown';
}
