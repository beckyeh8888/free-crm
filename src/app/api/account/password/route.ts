/**
 * Account Password API
 * POST /api/account/password - Change current user password
 *
 * ISO 27001 A.9.4.3 (Password Management System)
 */

import { z } from 'zod';
import bcrypt from 'bcryptjs';
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '請輸入目前密碼'),
    newPassword: z
      .string()
      .min(8, '密碼至少需要 8 個字元')
      .regex(/[A-Z]/, '密碼需要至少一個大寫字母')
      .regex(/[a-z]/, '密碼需要至少一個小寫字母')
      .regex(/[0-9]/, '密碼需要至少一個數字')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, '密碼需要至少一個特殊字元'),
    confirmPassword: z.string().min(1, '請確認新密碼'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '新密碼與確認密碼不符',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密碼不能與目前密碼相同',
    path: ['newPassword'],
  });

// ============================================
// POST /api/account/password - Change password
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = changePasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { currentPassword, newPassword } = validatedData.data;

    // 3. Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return errorResponse('NOT_FOUND', '用戶不存在');
    }

    // 4. Check if user has a password (OAuth users don't)
    if (!user.password) {
      return errorResponse(
        'FORBIDDEN',
        '您的帳號使用社群登入，無法使用密碼功能。請使用原登入方式。'
      );
    }

    // 5. Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      // Log failed attempt
      await logAudit({
        action: 'password_change',
        entity: 'user_security',
        entityId: userId,
        userId,
        details: {
          success: false,
          reason: 'wrong_current_password',
        },
        request,
      });

      return errorResponse('FORBIDDEN', '目前密碼不正確');
    }

    // 6. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 7. Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 8. Invalidate other sessions (optional security measure)
    // Note: In a production system, you might want to invalidate other sessions
    // and keep only the current session active using:
    // const currentSessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    // For now, we'll just log the password change

    // 9. Log audit
    await logAudit({
      action: 'password_change',
      entity: 'user_security',
      entityId: userId,
      userId,
      details: {
        success: true,
      },
      request,
    });

    return successResponse({
      success: true,
      message: '密碼已成功更新',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('INTERNAL_ERROR', '更新密碼失敗');
  }
}
