/**
 * Account Profile API
 * GET /api/account/profile - Get current user profile
 * PATCH /api/account/profile - Update current user profile
 *
 * ISO 27001 A.9.4.3 (Password Management System)
 */

import { z } from 'zod';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// ============================================
// Validation Schema
// ============================================

const updateProfileSchema = z.object({
  name: z.string().min(1, '請輸入姓名').max(100, '姓名不能超過 100 字').optional(),
  image: z.string().url('請輸入有效的圖片網址').optional().nullable(),
});

// ============================================
// GET /api/account/profile - Get user profile
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session!.user.id;

    // 2. Get user with organization memberships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        twoFactorAuth: {
          select: {
            enabled: true,
            verifiedAt: true,
          },
        },
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                logo: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 3. Transform response
    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      security: {
        has2FA: user.twoFactorAuth?.enabled ?? false,
        twoFactorVerifiedAt: user.twoFactorAuth?.verifiedAt,
      },
      organizations: user.organizations.map((om) => ({
        id: om.organization.id,
        name: om.organization.name,
        slug: om.organization.slug,
        plan: om.organization.plan,
        logo: om.organization.logo,
        role: {
          id: om.role.id,
          name: om.role.name,
          description: om.role.description,
        },
        joinedAt: om.joinedAt,
      })),
    };

    return successResponse(response);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('INTERNAL_ERROR', '取得個人資料失敗');
  }
}

// ============================================
// PATCH /api/account/profile - Update user profile
// ============================================

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session!.user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { name, image } = validatedData.data;

    // 3. Get current user for audit
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true },
    });

    if (!currentUser) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 4. Update user
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        updatedAt: true,
      },
    });

    // 5. Log audit
    await logAudit({
      action: 'update',
      entity: 'user_profile',
      entityId: userId,
      userId,
      details: {
        before: {
          name: currentUser.name,
          image: currentUser.image,
        },
        after: {
          name: updatedUser.name,
          image: updatedUser.image,
        },
      },
      request,
    });

    return successResponse({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('INTERNAL_ERROR', '更新個人資料失敗');
  }
}
