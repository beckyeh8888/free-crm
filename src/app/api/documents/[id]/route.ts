/**
 * Document API - Single CRUD
 *
 * GET    /api/documents/[id] - Get document details with analyses
 * PATCH  /api/documents/[id] - Update document metadata
 * DELETE /api/documents/[id] - Delete document and related data
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
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import { updateDocumentSchema } from '@/lib/validation';
import { deleteFile } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Check if user can access a document via organization membership
 */
async function checkDocumentAccess(
  documentId: string,
  userId: string
): Promise<{
  canAccess: boolean;
  organizationId?: string;
  document?: { id: string; filePath: string | null };
}> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      organizationId: true,
      filePath: true,
      customer: {
        select: {
          createdById: true,
          assignedToId: true,
        },
      },
    },
  });

  if (!document) {
    return { canAccess: false };
  }

  // Check via customer relationship
  if (document.customer) {
    const hasAccess =
      document.customer.createdById === userId ||
      document.customer.assignedToId === userId;
    if (hasAccess) {
      return {
        canAccess: true,
        organizationId: document.organizationId,
        document: { id: document.id, filePath: document.filePath },
      };
    }
  }

  // Check via organization membership
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: document.organizationId,
      },
    },
  });

  return {
    canAccess: membership?.status === 'active',
    organizationId: document.organizationId,
    document: { id: document.id, filePath: document.filePath },
  };
}

/**
 * Safely parse a JSON string, returning null on failure
 */
function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * GET /api/documents/[id]
 * Get document details including analyses
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  // Check access
  const access = await checkDocumentAccess(documentId, session.user.id);
  if (!access.canAccess) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Fetch full document with analyses
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      filePath: true,
      fileSize: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
      organizationId: true,
      customerId: true,
      customer: {
        select: { id: true, name: true },
      },
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!document) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Parse JSON fields in analyses
  const parsedAnalyses = document.analyses.map((a) => ({
    ...a,
    entities: safeJsonParse(a.entities),
    keyPoints: safeJsonParse(a.keyPoints),
    actionItems: safeJsonParse(a.actionItems),
  }));

  // Log audit
  await logAudit({
    action: 'read',
    entity: 'document',
    entityId: document.id,
    userId: session.user.id,
    organizationId: access.organizationId,
    request,
  });

  return successResponse({
    ...document,
    analyses: parsedAnalyses,
  });
}

/**
 * PATCH /api/documents/[id]
 * Update document metadata
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  try {
    const body = await request.json();

    // Validate input
    const result = updateDocumentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

    // Check access
    const access = await checkDocumentAccess(documentId, session.user.id);
    if (!access.canAccess || !access.organizationId) {
      return errorResponse('NOT_FOUND', '找不到此文件');
    }

    // Check permission
    const { error: permError } = await requirePermission(
      session,
      access.organizationId,
      PERMISSIONS.DOCUMENTS_UPDATE
    );
    if (permError) return permError;

    const data = result.data;

    // Verify customer belongs to org if customerId is being changed
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, organizationId: access.organizationId },
      });
      if (!customer) {
        return errorResponse('NOT_FOUND', '找不到此客戶或客戶不屬於此組織');
      }
    }

    // Get before state for audit
    const before = await prisma.document.findUnique({
      where: { id: documentId },
      select: { name: true, type: true, customerId: true },
    });

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.customerId !== undefined && { customerId: data.customerId }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        content: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        customerId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit
    await logAudit({
      action: 'update',
      entity: 'document',
      entityId: document.id,
      userId: session.user.id,
      organizationId: access.organizationId,
      details: {
        before,
        after: { name: document.name, type: document.type, customerId: document.customerId },
      },
      request,
    });

    return successResponse(document);
  } catch (err) {
    console.error('Update document error:', err);
    return errorResponse('INTERNAL_ERROR', '更新文件失敗');
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete document and cascaded analyses
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: documentId } = await context.params;

  // Check access
  const access = await checkDocumentAccess(documentId, session.user.id);
  if (!access.canAccess || !access.organizationId) {
    return errorResponse('NOT_FOUND', '找不到此文件');
  }

  // Check permission
  const { error: permError } = await requirePermission(
    session,
    access.organizationId,
    PERMISSIONS.DOCUMENTS_DELETE
  );
  if (permError) return permError;

  try {
    // Get document info for audit before deletion
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        name: true,
        type: true,
        filePath: true,
        _count: { select: { analyses: true } },
      },
    });

    if (!document) {
      return errorResponse('NOT_FOUND', '找不到此文件');
    }

    // Delete file from MinIO if exists
    if (document.filePath) {
      try {
        await deleteFile(document.filePath);
      } catch (error_) {
        console.error('Failed to delete file from storage:', error_);
        // Continue with DB deletion even if file deletion fails
      }
    }

    // Delete document (cascade deletes analyses per schema)
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Log audit
    await logAudit({
      action: 'delete',
      entity: 'document',
      entityId: documentId,
      userId: session.user.id,
      organizationId: access.organizationId,
      details: {
        name: document.name,
        type: document.type,
        analysesDeleted: document._count.analyses,
        hadFile: !!document.filePath,
      },
      request,
    });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('Delete document error:', err);
    return errorResponse('INTERNAL_ERROR', '刪除文件失敗');
  }
}
