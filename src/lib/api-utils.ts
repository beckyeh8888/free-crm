/**
 * API Utilities - ISO 27001 Compliant
 *
 * Standardized API response formats, error handling,
 * and audit logging utilities.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

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
// Audit Log Helpers
// ============================================

export type AuditAction = 'create' | 'read' | 'update' | 'delete';

interface AuditLogOptions {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  request?: Request;
}

export async function logAudit({
  action,
  entity,
  entityId,
  userId,
  details,
  request,
}: AuditLogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown',
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit log error:', error);
  }
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
// Ownership Check
// ============================================

export async function checkCustomerOwnership(
  customerId: string,
  userId: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { userId: true },
  });

  if (!customer) {
    return { exists: false, isOwner: false };
  }

  return { exists: true, isOwner: customer.userId === userId };
}
