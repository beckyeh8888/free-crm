/**
 * Document Auto-Classification
 *
 * Uses LLM to classify document type based on text content sample.
 * Falls back gracefully when AI is not configured.
 *
 * ISO 42001 AI Management System
 */

import { generateText } from 'ai';
import { getAIModel, isAIConfigured } from '@/lib/ai/provider';
import { handleAIError } from '@/lib/ai/errors';

// ============================================
// Types
// ============================================

export type DocumentType = 'contract' | 'email' | 'meeting_notes' | 'quotation';

const VALID_TYPES = new Set<DocumentType>(['contract', 'email', 'meeting_notes', 'quotation']);

// ============================================
// Classification Prompt
// ============================================

const CLASSIFICATION_PROMPT = `你是一個文件分類專家。根據以下文件內容，判斷文件類型。

只回覆以下其中一個分類代碼（不要有其他文字）：
- contract — 合約、協議、契約書、條款
- email — 電子郵件、郵件往來
- meeting_notes — 會議紀錄、討論摘要、議程
- quotation — 報價單、估價單、發票、訂單

如果無法確定，回覆 contract。`;

// ============================================
// Public API
// ============================================

/**
 * Classify a document based on a text sample.
 *
 * @param organizationId - Organization context for AI model
 * @param textSample - First portion of document text (will be truncated to 1000 chars)
 * @returns Classified document type, or null if AI is not configured
 */
export async function classifyDocument(
  organizationId: string,
  textSample: string,
): Promise<DocumentType | null> {
  const configured = await isAIConfigured(organizationId);
  if (!configured) return null;

  try {
    const model = await getAIModel(organizationId);

    // Use first 1000 characters as sample to save tokens
    const sample = textSample.slice(0, 1000);

    const result = await generateText({
      model,
      system: CLASSIFICATION_PROMPT,
      prompt: sample,
      maxOutputTokens: 20,
    });

    const response = result.text.trim().toLowerCase();

    // Validate the response is a valid document type
    if (VALID_TYPES.has(response as DocumentType)) {
      return response as DocumentType;
    }

    // Try to extract a valid type from the response
    for (const type of VALID_TYPES) {
      if (response.includes(type)) return type;
    }

    return null;
  } catch (err) {
    console.error('Document classification failed:', handleAIError(err));
    return null;
  }
}
