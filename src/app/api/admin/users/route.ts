/**
 * Admin User Management API
 * GET /api/admin/users - List organization users
 * POST /api/admin/users - Create/invite user
 *
 * ISO 27001 A.9.2.1 (User Registration)
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  successResponse,
  listResponse,
  errorResponse,
  getPaginationParams,
  logAdminAction,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// Helper Functions
// ============================================

/**
 * Build orderBy clause for user list query
 * Extracts nested ternary to improve readability (S3358)
 */
function buildUserOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  if (sortBy === 'name') {
    return { user: { name: sortOrder } };
  }
  if (sortBy === 'email') {
    return { user: { email: sortOrder } };
  }
  return { [sortBy]: sortOrder };
}

// ============================================
// Validation Schemas
// ============================================

const inviteUserSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  name: z.string().min(1, '請輸入姓名').max(100, '姓名不能超過 100 字'),
  roleId: z.string().min(1, '請選擇角色'),
  sendInviteEmail: z.boolean().default(true),
});

const createUserSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  name: z.string().min(1, '請輸入姓名').max(100, '姓名不能超過 100 字'),
  password: z
    .string()
    .min(8, '密碼至少需要 8 個字元')
    .regex(/[A-Z]/, '密碼需要至少一個大寫字母')
    .regex(/[a-z]/, '密碼需要至少一個小寫字母')
    .regex(/[0-9]/, '密碼需要至少一個數字')
    .optional(),
  roleId: z.string().min(1, '請選擇角色'),
  status: z.enum(['active', 'pending']).default('active'),
});

// ============================================
// GET /api/admin/users - List organization users
// ============================================

export async function GET(request: Request) {
  try {
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

    // 4. Parse query parameters
    const url = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(url.searchParams);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const roleId = url.searchParams.get('roleId') || '';
    const sortBy = url.searchParams.get('sortBy') || 'joinedAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as
      | 'asc'
      | 'desc';

    // 5. Build filter conditions
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    // 6. Query users (organization members)
    const [members, total] = await Promise.all([
      prisma.organizationMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildUserOrderBy(sortBy, sortOrder),
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
              twoFactorAuth: {
                select: {
                  enabled: true,
                },
              },
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              isSystem: true,
            },
          },
        },
      }),
      prisma.organizationMember.count({ where }),
    ]);

    // 7. Transform response
    const users = members.map((member) => ({
      memberId: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      userStatus: member.user.status,
      memberStatus: member.status,
      role: member.role,
      joinedAt: member.joinedAt,
      invitedAt: member.invitedAt,
      invitedBy: member.invitedBy,
      lastLoginAt: member.user.lastLoginAt,
      createdAt: member.user.createdAt,
      has2FA: member.user.twoFactorAuth?.enabled ?? false,
    }));

    return listResponse(users, { page, limit, total });
  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('INTERNAL_ERROR', '取得用戶列表失敗');
  }
}

// ============================================
// POST /api/admin/users - Create/invite user
// ============================================

export async function POST(request: Request) {
  try {
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
      PERMISSIONS.ADMIN_USERS_CREATE
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();

    // Determine if this is a create (with password) or invite (without password)
    const isInvite = !body.password;
    const schema = isInvite ? inviteUserSchema : createUserSchema;
    const validatedData = schema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { email, name, roleId } = validatedData.data;

    // 5. Verify role exists and belongs to organization (or is system role)
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [{ organizationId }, { organizationId: null, isSystem: true }],
      },
    });

    if (!role) {
      return errorResponse('NOT_FOUND', '角色不存在');
    }

    // 6. Check if user already exists in the system
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 7. Check if user is already a member of this organization
    if (user) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        return errorResponse('CONFLICT', '此用戶已是組織成員');
      }
    }

    // 8. Create user or organization member
    const result = await prisma.$transaction(async (tx) => {
      // If user doesn't exist, create them
      const currentUser = user ?? await (async () => {
        const password =
          !isInvite && 'password' in validatedData.data
            ? await bcrypt.hash(validatedData.data.password as string, 10)
            : null;

        return tx.user.create({
          data: {
            email,
            name,
            password,
            status: isInvite ? 'pending' : 'active',
          },
        });
      })();

      // Create organization membership
      const member = await tx.organizationMember.create({
        data: {
          userId: currentUser.id,
          organizationId,
          roleId,
          status: isInvite ? 'invited' : 'active',
          invitedAt: isInvite ? new Date() : null,
          invitedBy: isInvite ? session.user.id : null,
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
              id: true,
              name: true,
            },
          },
        },
      });

      return member;
    });

    // 9. Log audit
    await logAdminAction({
      action: 'member_invite',
      entity: 'organization_member',
      entityId: result.id,
      userId: session.user.id,
      organizationId,
      targetUserId: result.userId,
      after: {
        email: result.user.email,
        name: result.user.name,
        role: result.role.name,
        status: result.status,
      },
      request,
    });

    // TODO: Send invite email if sendInviteEmail is true and this is an invite

    return successResponse(
      {
        memberId: result.id,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.role,
        status: result.status,
        isInvite,
      },
      201
    );
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('INTERNAL_ERROR', '建立用戶失敗');
  }
}
