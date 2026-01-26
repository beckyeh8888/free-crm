/**
 * API Utilities - ISO 27001 Compliant
 *
 * Standardized API response formats, error handling,
 * audit logging, and permission checking utilities.
 *
 * Follows ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isOrganizationMember,
  getUserPermissionContext,
  canAccessCustomer,
  canAccessDeal,
  type UserPermissionContext,
} from './rbac';
import { type PermissionCode, PERMISSIONS } from './permissions';

// ============================================
// Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

// ============================================
// Response Helpers
// ============================================

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } as ApiSuccessResponse<T>, {
    status,
  });
}

export function listResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  } as ApiListResponse<T>);
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status?: number
) {
  const statusMap: Record<ErrorCode, number> = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  };

  return NextResponse.json(
    { success: false, error: { code, message } } as ApiErrorResponse,
    { status: status ?? statusMap[code] }
  );
}

// ============================================
// Auth Helpers
// ============================================

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { session: null, error: errorResponse('UNAUTHORIZED', '請先登入') };
  }
  return { session, error: null };
}

// ============================================
// Organization & Permission Helpers
// ============================================

/**
 * Require user to be a member of an organization
 * Returns the membership context including role information
 */
export async function requireOrgMember(
  session: Session,
  organizationId: string
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  return { context, error: null };
}

/**
 * Require user to have a specific permission
 */
export async function requirePermission(
  session: Session,
  organizationId: string,
  permission: PermissionCode
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  // First check membership
  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  // Check permission
  if (!context.permissions.has(permission)) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', `您沒有執行此操作的權限: ${permission}`),
    };
  }

  return { context, error: null };
}

/**
 * Require user to have any of the specified permissions
 */
export async function requireAnyPermission(
  session: Session,
  organizationId: string,
  permissions: PermissionCode[]
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  const hasAny = permissions.some((p) => context.permissions.has(p));
  if (!hasAny) {
    return {
      context: null,
      error: errorResponse(
        'FORBIDDEN',
        `您沒有執行此操作的權限，需要以下任一權限: ${permissions.join(', ')}`
      ),
    };
  }

  return { context, error: null };
}

/**
 * Require user to have all of the specified permissions
 */
export async function requireAllPermissions(
  session: Session,
  organizationId: string,
  permissions: PermissionCode[]
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  const hasAll = permissions.every((p) => context.permissions.has(p));
  if (!hasAll) {
    const missing = permissions.filter((p) => !context.permissions.has(p));
    return {
      context: null,
      error: errorResponse(
        'FORBIDDEN',
        `您缺少以下權限: ${missing.join(', ')}`
      ),
    };
  }

  return { context, error: null };
}

/**
 * Check if user can access a specific customer (with permission check)
 */
export async function requireCustomerAccess(
  session: Session,
  organizationId: string,
  customerId: string
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  const canAccess = await canAccessCustomer(userId, organizationId, customerId);
  if (!canAccess) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您沒有權限存取此客戶'),
    };
  }

  return { context, error: null };
}

/**
 * Check if user can access a specific deal (with permission check)
 */
export async function requireDealAccess(
  session: Session,
  organizationId: string,
  dealId: string
): Promise<{
  context: UserPermissionContext | null;
  error: NextResponse | null;
}> {
  const userId = session.user?.id;
  if (!userId) {
    return {
      context: null,
      error: errorResponse('UNAUTHORIZED', '請先登入'),
    };
  }

  const context = await getUserPermissionContext(userId, organizationId);

  if (!context) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您不是此組織的成員'),
    };
  }

  if (context.memberStatus !== 'active') {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您的組織成員資格已被停用或尚未啟用'),
    };
  }

  const canAccess = await canAccessDeal(userId, organizationId, dealId);
  if (!canAccess) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', '您沒有權限存取此商機'),
    };
  }

  return { context, error: null };
}

/**
 * Get organization ID from request (header or query param)
 */
export function getOrganizationId(request: Request): string | null {
  const url = new URL(request.url);

  // Check header first
  const headerOrgId = request.headers.get('x-organization-id');
  if (headerOrgId) {
    return headerOrgId;
  }

  // Then check query param
  const queryOrgId = url.searchParams.get('organizationId');
  if (queryOrgId) {
    return queryOrgId;
  }

  return null;
}

// ============================================
// Audit Log Helpers
// ============================================

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'role_change'
  | 'member_invite'
  | 'member_suspend'
  | 'member_remove'
  | '2fa_enable'
  | '2fa_disable'
  | 'password_change'
  | 'password_reset';

interface AuditLogOptions {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/**
 * Create an audit log entry
 * Follows ISO 27001 A.12.4.1 (Event Logging)
 */
export async function logAudit({
  action,
  entity,
  entityId,
  userId,
  organizationId,
  details,
  metadata,
  request,
}: AuditLogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        organizationId,
        details: details ? JSON.stringify(details) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown',
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit log error:', error);
  }
}

/**
 * Log admin action with additional context
 */
export async function logAdminAction({
  action,
  entity,
  entityId,
  userId,
  organizationId,
  targetUserId,
  before,
  after,
  request,
}: {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId: string;
  organizationId: string;
  targetUserId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  request?: Request;
}) {
  return logAudit({
    action,
    entity,
    entityId,
    userId,
    organizationId,
    details: { before, after },
    metadata: { targetUserId, adminAction: true },
    request,
  });
}

// ============================================
// Pagination Helpers
// ============================================

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// ============================================
// Ownership Check (Legacy - for backwards compatibility)
// ============================================

/**
 * Check customer ownership (for multi-tenant)
 * A user "owns" a customer if they created it or are assigned to it
 */
export async function checkCustomerOwnership(
  customerId: string,
  userId: string,
  organizationId?: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      createdById: true,
      assignedToId: true,
      organizationId: true,
    },
  });

  if (!customer) {
    return { exists: false, isOwner: false, isAssigned: false, belongsToOrg: false };
  }

  const isOwner = customer.createdById === userId;
  const isAssigned = customer.assignedToId === userId;
  const belongsToOrg = organizationId ? customer.organizationId === organizationId : true;

  return {
    exists: true,
    isOwner,
    isAssigned,
    belongsToOrg,
    hasAccess: (isOwner || isAssigned) && belongsToOrg,
  };
}

/**
 * Check deal ownership (for multi-tenant)
 */
export async function checkDealOwnership(
  dealId: string,
  userId: string,
  organizationId?: string
) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      createdById: true,
      assignedToId: true,
      customer: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!deal) {
    return { exists: false, isOwner: false, isAssigned: false, belongsToOrg: false };
  }

  const isOwner = deal.createdById === userId;
  const isAssigned = deal.assignedToId === userId;
  const belongsToOrg = organizationId
    ? deal.customer.organizationId === organizationId
    : true;

  return {
    exists: true,
    isOwner,
    isAssigned,
    belongsToOrg,
    hasAccess: (isOwner || isAssigned) && belongsToOrg,
  };
}

// ============================================
// Re-exports for convenience
// ============================================

export { PERMISSIONS } from './permissions';
export type { PermissionCode } from './permissions';
export type { UserPermissionContext } from './rbac';
