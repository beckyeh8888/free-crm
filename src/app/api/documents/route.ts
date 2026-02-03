/**
 * Document API - List & Create
 *
 * GET  /api/documents - List documents (paginated, filterable)
 * POST /api/documents - Create a new document (JSON text or FormData file upload)
 *
 * Multi-tenant: Requires organizationId in header or query param
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  listResponse,
  errorResponse,
  logAudit,
  getPaginationParams,
  getOrganizationId,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import {
  createDocumentSchema,
  documentFilterSchema,
} from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';
import { uploadFile, generateFileKey } from '@/lib/storage';

/**
 * GET /api/documents
 * List all documents for the authenticated user within an organization
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search by name)
 * - type: 'contract' | 'email' | 'meeting_notes' | 'quotation'
 * - customerId: string (filter by customer)
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Get organization ID
  let organizationId = getOrganizationId(request);

  if (!organizationId) {
    const defaultOrg = await getUserDefaultOrganization(session.user.id);
    if (defaultOrg) {
      organizationId = defaultOrg.organization.id;
    }
  }

  // Parse filters
  const filterResult = documentFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    type: searchParams.get('type') || undefined,
    customerId: searchParams.get('customerId') || undefined,
  });

  const filters = filterResult.success ? filterResult.data : {};

  // Build where clause for multi-tenant
  const where = {
    ...(organizationId && { organizationId }),
    ...(filters.type && { type: filters.type }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.search && {
      name: { contains: filters.search },
    }),
  };

  // Execute queries in parallel
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
        customerId: true,
        customer: {
          select: { id: true, name: true },
        },
        _count: {
          select: { analyses: true },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  // Log audit event (bulk read)
  await logAudit({
    action: 'read',
    entity: 'document',
    userId: session.user.id,
    organizationId: organizationId || undefined,
    details: { count: documents.length, filters },
    request,
  });

  return listResponse(documents, { page, limit, total });
}

// ============================================
// Helper Types for Document Creation
// ============================================

interface DocumentInput {
  name: string;
  type: string;
  content?: string;
  customerId?: string | null;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  bodyOrgId?: string;
}

// ============================================
// Helper Functions for Document Creation
// ============================================

/**
 * Resolve organization ID from request or user's default
 */
async function resolveOrganizationId(
  request: NextRequest,
  userId: string,
  bodyOrgId?: string
): Promise<string | null> {
  let orgId = bodyOrgId || getOrganizationId(request);
  if (orgId) return orgId;

  const defaultOrg = await getUserDefaultOrganization(userId);
  return defaultOrg?.organization.id ?? null;
}

/**
 * Parse form data input and upload file
 */
async function parseFormDataInput(
  request: NextRequest,
  userId: string
): Promise<{ data: DocumentInput; error?: Response }> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string) || file?.name || '';
  const type = (formData.get('type') as string) || 'contract';
  const customerId = (formData.get('customerId') as string) ?? null;
  const bodyOrgId = (formData.get('organizationId') as string) || undefined;

  if (!file) {
    return { data: { name, type }, error: errorResponse('VALIDATION_ERROR', '請選擇要上傳的檔案') };
  }

  const orgId = await resolveOrganizationId(request, userId, bodyOrgId);
  if (!orgId) {
    return { data: { name, type }, error: errorResponse('VALIDATION_ERROR', '請指定組織或先加入一個組織') };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = generateFileKey(orgId, file.name);
  await uploadFile(fileKey, buffer, file.type);

  return {
    data: {
      name,
      type,
      customerId,
      filePath: fileKey,
      fileSize: buffer.length,
      mimeType: file.type,
      bodyOrgId,
    },
  };
}

/**
 * Parse JSON input for document creation
 */
async function parseJsonInput(
  request: NextRequest
): Promise<{ data: DocumentInput; error?: Response }> {
  const body = await request.json();
  const result = createDocumentSchema.safeParse(body);

  if (!result.success) {
    return {
      data: { name: '', type: '' },
      error: errorResponse('VALIDATION_ERROR', result.error.issues[0].message),
    };
  }

  const parsed = result.data;
  return {
    data: {
      name: parsed.name,
      type: parsed.type,
      content: parsed.content,
      customerId: parsed.customerId,
      bodyOrgId: body.organizationId,
    },
  };
}

/**
 * POST /api/documents
 * Create a new document within an organization
 *
 * Supports two modes:
 * 1. JSON body: { name, type, content, customerId }
 * 2. FormData: file + name + type + customerId (file upload to MinIO)
 *
 * Requires: documents:create permission
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    // Parse input based on content type
    const parseResult = isFormData
      ? await parseFormDataInput(request, session.user.id)
      : await parseJsonInput(request);

    if (parseResult.error) return parseResult.error;

    const { name, type, content, customerId, filePath, fileSize, mimeType, bodyOrgId } = parseResult.data;

    // Get organization ID
    const organizationId = await resolveOrganizationId(request, session.user.id, bodyOrgId);
    if (!organizationId) {
      return errorResponse('VALIDATION_ERROR', '請指定組織或先加入一個組織');
    }

    // Check permission for creating documents
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.DOCUMENTS_CREATE
    );
    if (permError) return permError;

    // Verify customer belongs to org if customerId provided
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organizationId },
      });
      if (!customer) {
        return errorResponse('NOT_FOUND', '找不到此客戶或客戶不屬於此組織');
      }
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        name,
        type,
        content,
        filePath,
        fileSize,
        mimeType,
        customerId: customerId ?? null,
        organizationId,
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

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'document',
      entityId: document.id,
      userId: session.user.id,
      organizationId,
      details: {
        name: document.name,
        type: document.type,
        hasFile: !!filePath,
        fileSize,
      },
      request,
    });

    return successResponse(document, 201);
  } catch (err) {
    console.error('Create document error:', err);
    return errorResponse('INTERNAL_ERROR', '建立文件失敗');
  }
}
