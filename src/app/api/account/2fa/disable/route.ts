/**
 * 2FA Disable API
 * POST /api/account/2fa/disable - Disable 2FA
 *
 * ISO 27001 A.9.4.2 (Secure Log-on Procedures)
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
import { verifyToken, verifyBackupCode, decryptSecret } from '@/lib/2fa';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

// ============================================
// Validation Schema
// ============================================

const disableSchema = z.object({
  // Require either password + 2FA token or backup code
  password: z.string().min(1, '請輸入密碼'),
  token: z
    .string()
    .length(6, '驗證碼必須是 6 位數字')
    .regex(/^\d+$/, '驗證碼必須是數字')
    .optional(),
  backupCode: z.string().optional(),
}).refine(
  (data) => data.token || data.backupCode,
  { message: '請提供 2FA 驗證碼或備用碼', path: ['token'] }
);

// ============================================
// POST /api/account/2fa/disable - Disable 2FA
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session!.user.id;
    const userEmail = session!.user.email;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = disableSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { password, token, backupCode } = validatedData.data;

    // 3. Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      return errorResponse(
        'FORBIDDEN',
        '您的帳號使用社群登入，請使用社群登入管理 2FA'
      );
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logAudit({
        action: '2fa_disable',
        entity: 'user_security',
        entityId: userId,
        userId,
        details: {
          success: false,
          reason: 'wrong_password',
        },
        request,
      });

      return errorResponse('FORBIDDEN', '密碼不正確');
    }

    // 5. Get existing 2FA setup
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      return errorResponse('NOT_FOUND', '2FA 尚未設定');
    }

    if (!twoFactorAuth.enabled) {
      return errorResponse('CONFLICT', '2FA 尚未啟用');
    }

    // 6. Verify 2FA token or backup code
    const secret = decryptSecret(twoFactorAuth.secret, ENCRYPTION_KEY);
    let isValid = false;
    let usedBackupCode = false;

    if (token) {
      isValid = verifyToken(secret, token, userEmail || userId);
    } else if (backupCode) {
      const hashedCodes = JSON.parse(twoFactorAuth.backupCodes || '[]');
      const codeIndex = verifyBackupCode(backupCode, hashedCodes);
      isValid = codeIndex !== -1;
      usedBackupCode = isValid;
    }

    if (!isValid) {
      await logAudit({
        action: '2fa_disable',
        entity: 'user_security',
        entityId: userId,
        userId,
        details: {
          success: false,
          reason: token ? 'invalid_token' : 'invalid_backup_code',
        },
        request,
      });

      return errorResponse('FORBIDDEN', token ? '驗證碼不正確' : '備用碼不正確');
    }

    // 7. Disable 2FA (delete the record)
    await prisma.twoFactorAuth.delete({
      where: { userId },
    });

    // 8. Log successful disable
    await logAudit({
      action: '2fa_disable',
      entity: 'user_security',
      entityId: userId,
      userId,
      details: {
        success: true,
        method: usedBackupCode ? 'backup_code' : 'totp_token',
      },
      request,
    });

    return successResponse({
      success: true,
      message: '2FA 已成功停用',
      disabledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return errorResponse('INTERNAL_ERROR', '停用 2FA 失敗');
  }
}
