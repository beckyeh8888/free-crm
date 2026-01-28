/**
 * Admin User Suspend API
 * POST /api/admin/users/[id]/suspend - Suspend or reactivate user
 *
 * ISO 27001 A.9.2.5 (Review of User Access Rights)
 * ISO 27001 A.9.2.6 (Removal of Access Rights)
 */

import { z } from 'zod';
import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  successResponse,
  errorResponse,
  logAdminAction,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// Validation Schema
// ============================================

const suspendUserSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  reason: z.string().max(500).optional(),
});

// ============================================
// POST /api/admin/users/[id]/suspend
// ============================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Get organization ID
    const organizationId =
      getOrganizationId(request) || session.user.defaultOrganizationId;
    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    // 3. Check permission
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_USERS_SUSPEND
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = suspendUserSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { action, reason } = validatedData.data;

    // 5. Get current member (by member ID or user ID)
    let member = await prisma.organizationMember.findFirst({
      where: {
        id: id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // Try user ID if member ID not found
    if (!member) {
      member = await prisma.organizationMember.findFirst({
        where: {
          userId: id,
          organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
          role: {
            select: {
              name: true,
            },
          },
        },
      });
    }

    if (!member) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 6. Prevent self-suspension
    if (member.userId === session.user.id) {
      return errorResponse('FORBIDDEN', '無法停用自己的帳號');
    }

    // 7. Check current status
    if (action === 'suspend' && member.status === 'suspended') {
      return errorResponse('CONFLICT', '用戶已被停用');
    }

    if (action === 'reactivate' && member.status === 'active') {
      return errorResponse('CONFLICT', '用戶已是啟用狀態');
    }

    // 8. Update member status
    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    const beforeStatus = member.status;

    await prisma.organizationMember.update({
      where: { id: member.id },
      data: { status: newStatus },
    });

    // 9. Also update user status if suspending all memberships
    // (For now, we only update the organization member status)

    // 10. Log audit
    await logAdminAction({
      action: action === 'suspend' ? 'member_suspend' : 'update',
      entity: 'organization_member',
      entityId: member.id,
      userId: session.user.id,
      organizationId,
      targetUserId: member.userId,
      before: {
        status: beforeStatus,
      },
      after: {
        status: newStatus,
        reason: reason || null,
      },
      request,
    });

    return successResponse({
      memberId: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      previousStatus: beforeStatus,
      newStatus,
      action,
      reason: reason || null,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return errorResponse('INTERNAL_ERROR', '操作失敗');
  }
}
