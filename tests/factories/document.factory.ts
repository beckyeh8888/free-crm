/**
 * Document Test Data Factory
 * For creating test documents in multi-tenant context
 */

import { prisma } from '@/lib/prisma';

export interface DocumentFactoryData {
  organizationId: string;
  name?: string;
  type?: string;
  content?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  customerId?: string | null;
}

let documentCounter = 0;

/**
 * Build document data without creating in database
 */
export function buildDocument(overrides: DocumentFactoryData) {
  documentCounter++;
  return {
    organizationId: overrides.organizationId,
    name: overrides.name ?? `Test Document ${documentCounter}`,
    type: overrides.type ?? 'contract',
    content: overrides.content ?? `Test content for document ${documentCounter}`,
    filePath: overrides.filePath ?? null,
    fileSize: overrides.fileSize ?? null,
    mimeType: overrides.mimeType ?? null,
    customerId: overrides.customerId ?? null,
  };
}

/**
 * Create document in database
 */
export async function createDocument(overrides: DocumentFactoryData) {
  const data = buildDocument(overrides);

  return prisma.document.create({
    data,
  });
}

/**
 * Create document with file metadata (simulating uploaded file)
 */
export async function createDocumentWithFile(overrides: DocumentFactoryData) {
  documentCounter++;
  return prisma.document.create({
    data: {
      organizationId: overrides.organizationId,
      name: overrides.name ?? `Uploaded File ${documentCounter}.pdf`,
      type: overrides.type ?? 'contract',
      content: null,
      filePath: overrides.filePath ?? `documents/${overrides.organizationId}/test-uuid/file-${documentCounter}.pdf`,
      fileSize: overrides.fileSize ?? 1024 * 50,
      mimeType: overrides.mimeType ?? 'application/pdf',
      customerId: overrides.customerId ?? null,
    },
  });
}

/**
 * Create document with analysis
 */
export async function createDocumentWithAnalysis(overrides: DocumentFactoryData) {
  const doc = await createDocument(overrides);

  const analysis = await prisma.documentAnalysis.create({
    data: {
      documentId: doc.id,
      summary: 'Test summary of the document',
      sentiment: 'positive',
      keyPoints: JSON.stringify(['Point 1', 'Point 2']),
      actionItems: JSON.stringify(['Action 1', 'Action 2']),
      entities: JSON.stringify({ people: ['Alice'], companies: ['Acme'] }),
      confidence: 0.95,
      model: 'gpt-4',
    },
  });

  return { ...doc, analyses: [analysis] };
}

/**
 * Reset factory counter
 */
export function resetDocumentFactory() {
  documentCounter = 0;
}
