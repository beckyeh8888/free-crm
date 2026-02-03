/**
 * Organization API - GET/PATCH current organization
 * Follows ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  successResponse,
  errorResponse,
  logAudit,
  PERMISSIONS,
} from '@/lib/api-utils';

// ============================================
// Validation Schema
// ============================================

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo: z.string().url().nullable().optional(),
});

// ============================================
// GET /api/organization
// ============================================

export async function GET(request: NextRequest) {
  // Auth check
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Get organization ID from session
  const organizationId =
    getOrganizationId(request) ?? session.user.defaultOrganizationId;

  if (!organizationId) {
    return errorResponse('NOT_FOUND', '找不到組織');
  }

  // Permission check - any org member can view
  const { error: permError } = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.ADMIN_ORG
  );

  // If no admin permission, check if user is org member at all
  if (permError) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        status: 'active',
      },
    });

    if (!member) {
      return errorResponse('FORBIDDEN', '您不是此組織的成員');
    }
  }

  // Get organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      logo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          members: true,
          customers: true,
          documents: true,
        },
      },
    },
  });

  if (!organization) {
    return errorResponse('NOT_FOUND', '找不到組織');
  }

  return successResponse({
    ...organization,
    memberCount: organization._count.members,
    customerCount: organization._count.customers,
    documentCount: organization._count.documents,
    _count: undefined,
  });
}

// ============================================
// PATCH /api/organization
// ============================================

export async function PATCH(request: NextRequest) {
  // Auth check
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Get organization ID
  const organizationId =
    getOrganizationId(request) ?? session.user.defaultOrganizationId;

  if (!organizationId) {
    return errorResponse('NOT_FOUND', '找不到組織');
  }

  // Permission check - need admin:organization permission
  const { error: permError } = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.ADMIN_ORG
  );
  if (permError) return permError;

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', '無效的請求內容');
  }

  const result = updateOrgSchema.safeParse(body);
  if (!result.success) {
    return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message || '驗證失敗');
  }

  const { name, logo } = result.data;

  // Get current organization for audit
  const currentOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, logo: true },
  });

  if (!currentOrg) {
    return errorResponse('NOT_FOUND', '找不到組織');
  }

  // Update organization
  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(name !== undefined && { name }),
      ...(logo !== undefined && { logo }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      logo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Audit log
  await logAudit({
    action: 'update',
    entity: 'organization',
    entityId: organizationId,
    userId: session.user.id,
    organizationId,
    details: {
      before: { name: currentOrg.name, logo: currentOrg.logo },
      after: { name: updatedOrg.name, logo: updatedOrg.logo },
    },
    request,
  });

  return successResponse(updatedOrg);
}
