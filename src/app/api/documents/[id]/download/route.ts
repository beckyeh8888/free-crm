/**
 * Document Download API
 *
 * GET /api/documents/[id]/download - Get presigned download URL
 *
 * Multi-tenant: Access via organization membership
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { getFileUrl } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]/download
 * Get a presigned URL for downloading a document file
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  // Fetch document with access check
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      name: true,
      filePath: true,
      mimeType: true,
      organizationId: true,
      customer: {
        select: {
          createdById: true,
          assignedToId: true,
        },
      },
    },
  });

  if (!document) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Check access via customer or organization
  let hasAccess = false;

  if (document.customer) {
    hasAccess =
      document.customer.createdById === session.user.id ||
      document.customer.assignedToId === session.user.id;
  }

  if (!hasAccess) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: document.organizationId,
        },
      },
    });
    hasAccess = membership?.status === 'active';
  }

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權下載此文件');
  }

  // Check if document has a file
  if (!document.filePath) {
    return errorResponse('NOT_FOUND', '此文件沒有附加檔案');
  }

  try {
    // Generate presigned URL (valid for 1 hour)
    const url = await getFileUrl(document.filePath);

    // Log audit
    await logAudit({
      action: 'read',
      entity: 'document_download',
      entityId: documentId,
      userId: session.user.id,
      organizationId: document.organizationId,
      details: { fileName: document.name },
      request,
    });

    return successResponse({
      url,
      fileName: document.name,
      mimeType: document.mimeType,
    });
  } catch (err) {
    console.error('Download URL generation error:', err);
    return errorResponse('INTERNAL_ERROR', '無法產生下載連結');
  }
}
