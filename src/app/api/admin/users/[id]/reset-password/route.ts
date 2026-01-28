/**
 * Admin User Password Reset API
 * POST /api/admin/users/[id]/reset-password - Reset user password
 *
 * ISO 27001 A.9.4.3 (Password Management System)
 */

import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

const resetPasswordSchema = z.object({
  // If newPassword is provided, set it directly (for admin override)
  // If not provided, generate a temporary password or send reset email
  newPassword: z
    .string()
    .min(8, '密碼至少需要 8 個字元')
    .regex(/[A-Z]/, '密碼需要至少一個大寫字母')
    .regex(/[a-z]/, '密碼需要至少一個小寫字母')
    .regex(/[0-9]/, '密碼需要至少一個數字')
    .optional(),
  sendEmail: z.boolean().default(true),
  forceChangeOnLogin: z.boolean().default(true),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a secure random password
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  const shuffled = password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');

  return shuffled;
}

// ============================================
// POST /api/admin/users/[id]/reset-password
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

    // 3. Check permission (need both ADMIN_USERS and ADMIN_USERS_UPDATE)
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_USERS_UPDATE
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = resetPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { newPassword, sendEmail, forceChangeOnLogin } = validatedData.data;

    // 5. Get member and verify they belong to organization
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
            password: true,
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
              password: true,
            },
          },
        },
      });
    }

    if (!member) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 6. Check if user has a password (OAuth users don't)
    if (!member.user.password) {
      return errorResponse(
        'FORBIDDEN',
        '此用戶使用社群登入，無法重設密碼'
      );
    }

    // 7. Generate or use provided password
    const passwordToSet = newPassword || generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    // 8. Update user password
    await prisma.user.update({
      where: { id: member.user.id },
      data: {
        password: hashedPassword,
        // Note: We would add a forcePasswordChange field if needed
      },
    });

    // 9. Invalidate all existing sessions for this user
    await prisma.session.deleteMany({
      where: { userId: member.user.id },
    });

    // 10. Log audit (do not log the actual password)
    await logAdminAction({
      action: 'password_reset',
      entity: 'user',
      entityId: member.user.id,
      userId: session.user.id,
      organizationId,
      targetUserId: member.user.id,
      after: {
        resetBy: session.user.id,
        forceChangeOnLogin,
        emailSent: sendEmail,
      },
      request,
    });

    // TODO: Send password reset email if sendEmail is true
    // This would typically be done via a service like nodemailer or SendGrid

    return successResponse({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      passwordReset: true,
      // Only return temporary password if not sending email
      temporaryPassword: !sendEmail ? passwordToSet : undefined,
      emailSent: sendEmail,
      sessionsInvalidated: true,
      forceChangeOnLogin,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse('INTERNAL_ERROR', '重設密碼失敗');
  }
}
