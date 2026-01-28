/**
 * Admin User Detail API
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Remove user from organization
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
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
// Validation Schemas
// ============================================

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  roleId: z.string().optional(),
  status: z.enum(['active', 'invited', 'suspended']).optional(),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate self-modification restrictions
 * Prevents users from suspending themselves or demoting their own role
 */
async function validateSelfModification(
  currentMember: Awaited<ReturnType<typeof getMemberWithDetails>>,
  sessionUserId: string,
  roleId?: string,
  status?: string
): Promise<{ error: Response | null }> {
  if (!currentMember || currentMember.userId !== sessionUserId) {
    return { error: null };
  }

  // Cannot suspend self
  if (status === 'suspended') {
    return { error: errorResponse('FORBIDDEN', '無法停用自己的帳號') };
  }

  // Check if demoting own role
  if (!roleId || roleId === currentMember.roleId) {
    return { error: null };
  }

  const [newRole, currentRole] = await Promise.all([
    prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    }),
    prisma.role.findUnique({
      where: { id: currentMember.roleId },
      include: { permissions: true },
    }),
  ]);

  if (
    newRole &&
    currentRole &&
    newRole.permissions.length < currentRole.permissions.length
  ) {
    return { error: errorResponse('FORBIDDEN', '無法降低自己的權限等級') };
  }

  return { error: null };
}

/**
 * Verify that a role exists and is accessible
 */
async function verifyRoleAccess(
  roleId: string,
  organizationId: string
): Promise<{ exists: boolean }> {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      OR: [{ organizationId }, { organizationId: null, isSystem: true }],
    },
  });
  return { exists: !!role };
}

/**
 * Build update data objects for user and member
 */
function buildUserUpdateData(
  name?: string,
  roleId?: string,
  status?: string
): {
  memberUpdate: Record<string, unknown>;
  userUpdate: Record<string, unknown>;
} {
  const memberUpdate: Record<string, unknown> = {};
  const userUpdate: Record<string, unknown> = {};

  if (roleId) memberUpdate.roleId = roleId;
  if (status) memberUpdate.status = status;
  if (name) userUpdate.name = name;

  return { memberUpdate, userUpdate };
}

/**
 * Execute user and member updates in a transaction
 */
async function executeUserMemberUpdate(
  currentMember: NonNullable<Awaited<ReturnType<typeof getMemberWithDetails>>>,
  memberUpdate: Record<string, unknown>,
  userUpdate: Record<string, unknown>,
  organizationId: string
) {
  return prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: { id: currentMember.userId },
        data: userUpdate,
      });
    }

    if (Object.keys(memberUpdate).length > 0) {
      await tx.organizationMember.update({
        where: { id: currentMember.id },
        data: memberUpdate,
      });
    }

    return getMemberWithDetails(currentMember.id, organizationId);
  });
}

/**
 * Determine the audit action type based on changes
 */
function determineUserAuditAction(
  roleId: string | undefined,
  currentRoleId: string,
  status: string | undefined,
  currentStatus: string
): 'update' | 'role_change' | 'member_suspend' {
  if (roleId && roleId !== currentRoleId) {
    return 'role_change';
  }
  if (status === 'suspended' && currentStatus !== 'suspended') {
    return 'member_suspend';
  }
  return 'update';
}

async function getMemberWithDetails(
  memberId: string,
  organizationId: string
) {
  // Try to find by member ID first
  let member = await prisma.organizationMember.findFirst({
    where: {
      id: memberId,
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          emailVerified: true,
          twoFactorAuth: {
            select: {
              enabled: true,
              verifiedAt: true,
            },
          },
          loginHistory: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              ip: true,
              device: true,
              browser: true,
              location: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          permissions: {
            include: {
              permission: {
                select: {
                  code: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // If not found by member ID, try user ID
  if (!member) {
    member = await prisma.organizationMember.findFirst({
      where: {
        userId: memberId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            emailVerified: true,
            twoFactorAuth: {
              select: {
                enabled: true,
                verifiedAt: true,
              },
            },
            loginHistory: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                ip: true,
                device: true,
                browser: true,
                location: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isSystem: true,
            permissions: {
              include: {
                permission: {
                  select: {
                    code: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return member;
}

// ============================================
// GET /api/admin/users/[id] - Get user details
// ============================================

export async function GET(
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
      PERMISSIONS.ADMIN_USERS
    );
    if (permError) return permError;

    // 4. Get member with details
    const member = await getMemberWithDetails(id, organizationId);

    if (!member) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 5. Transform response
    const response = {
      memberId: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      userStatus: member.user.status,
      memberStatus: member.status,
      emailVerified: member.user.emailVerified,
      lastLoginAt: member.user.lastLoginAt,
      createdAt: member.user.createdAt,
      joinedAt: member.joinedAt,
      invitedAt: member.invitedAt,
      invitedBy: member.invitedBy,
      role: {
        id: member.role.id,
        name: member.role.name,
        description: member.role.description,
        isSystem: member.role.isSystem,
        permissions: member.role.permissions.map((rp) => ({
          code: rp.permission.code,
          name: rp.permission.name,
          category: rp.permission.category,
        })),
      },
      security: {
        has2FA: member.user.twoFactorAuth?.enabled ?? false,
        twoFactorVerifiedAt: member.user.twoFactorAuth?.verifiedAt,
        recentLogins: member.user.loginHistory,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('INTERNAL_ERROR', '取得用戶詳情失敗');
  }
}

// ============================================
// PATCH /api/admin/users/[id] - Update user
// ============================================

export async function PATCH(
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
      PERMISSIONS.ADMIN_USERS_UPDATE
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { name, roleId, status } = validatedData.data;

    // 5. Get current member
    const currentMember = await getMemberWithDetails(id, organizationId);

    if (!currentMember) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 6. Validate self-modification restrictions
    const { error: selfModError } = await validateSelfModification(
      currentMember,
      session.user.id,
      roleId,
      status
    );
    if (selfModError) return selfModError;

    // 7. Verify new role if changing
    if (roleId) {
      const { exists } = await verifyRoleAccess(roleId, organizationId);
      if (!exists) {
        return errorResponse('NOT_FOUND', '角色不存在');
      }
    }

    // 8. Prepare update data
    const { memberUpdate, userUpdate } = buildUserUpdateData(name, roleId, status);
    const beforeState: Record<string, unknown> = {
      name: currentMember.user.name,
      role: currentMember.role.name,
      memberStatus: currentMember.status,
    };

    // 9. Update in transaction
    const result = await executeUserMemberUpdate(
      currentMember,
      memberUpdate,
      userUpdate,
      organizationId
    );

    // 10. Determine audit action
    const auditAction = determineUserAuditAction(
      roleId,
      currentMember.roleId,
      status,
      currentMember.status
    );

    // 11. Log audit
    await logAdminAction({
      action: auditAction,
      entity: 'organization_member',
      entityId: currentMember.id,
      userId: session.user.id,
      organizationId,
      targetUserId: currentMember.userId,
      before: beforeState,
      after: {
        name: result?.user.name,
        role: result?.role.name,
        memberStatus: result?.status,
      },
      request,
    });

    // 12. Transform response
    const response = {
      memberId: result?.id,
      userId: result?.user.id,
      name: result?.user.name,
      email: result?.user.email,
      memberStatus: result?.status,
      role: {
        id: result?.role.id,
        name: result?.role.name,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('INTERNAL_ERROR', '更新用戶失敗');
  }
}

// ============================================
// DELETE /api/admin/users/[id] - Remove user from organization
// ============================================

export async function DELETE(
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
      PERMISSIONS.ADMIN_USERS_DELETE
    );
    if (permError) return permError;

    // 4. Get current member
    const currentMember = await getMemberWithDetails(id, organizationId);

    if (!currentMember) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 5. Prevent self-removal
    if (currentMember.userId === session.user.id) {
      return errorResponse('FORBIDDEN', '無法從組織中移除自己');
    }

    // 6. Delete organization membership
    await prisma.organizationMember.delete({
      where: { id: currentMember.id },
    });

    // 7. Log audit
    await logAdminAction({
      action: 'member_remove',
      entity: 'organization_member',
      entityId: currentMember.id,
      userId: session.user.id,
      organizationId,
      targetUserId: currentMember.userId,
      before: {
        email: currentMember.user.email,
        name: currentMember.user.name,
        role: currentMember.role.name,
      },
      request,
    });

    return successResponse({
      deleted: true,
      memberId: currentMember.id,
      userId: currentMember.userId,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('INTERNAL_ERROR', '移除用戶失敗');
  }
}
