/**
 * 2FA Backup Codes API
 * GET /api/account/2fa/backup-codes - Get remaining backup code count
 * POST /api/account/2fa/backup-codes - Regenerate backup codes
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
import { generateBackupCodes, verifyToken, decryptSecret } from '@/lib/2fa';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

// ============================================
// Validation Schema
// ============================================

const regenerateSchema = z.object({
  password: z.string().min(1, '請輸入密碼'),
  token: z
    .string()
    .length(6, '驗證碼必須是 6 位數字')
    .regex(/^\d+$/, '驗證碼必須是數字'),
});

// ============================================
// GET /api/account/2fa/backup-codes - Get backup code info
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session!.user.id;

    // 2. Get 2FA setup
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
      select: {
        enabled: true,
        backupCodes: true,
        verifiedAt: true,
      },
    });

    if (!twoFactorAuth) {
      return errorResponse('NOT_FOUND', '2FA 尚未設定');
    }

    if (!twoFactorAuth.enabled) {
      return errorResponse('CONFLICT', '2FA 尚未啟用');
    }

    // 3. Count remaining backup codes
    const hashedCodes = JSON.parse(twoFactorAuth.backupCodes || '[]');
    const remainingCount = hashedCodes.length;

    return successResponse({
      twoFactorEnabled: twoFactorAuth.enabled,
      verifiedAt: twoFactorAuth.verifiedAt,
      backupCodes: {
        remaining: remainingCount,
        total: 10, // Original count
        warningThreshold: 3,
        needsRegeneration: remainingCount <= 3,
      },
    });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return errorResponse('INTERNAL_ERROR', '取得備用碼資訊失敗');
  }
}

// ============================================
// POST /api/account/2fa/backup-codes - Regenerate backup codes
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
    const validatedData = regenerateSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { password, token } = validatedData.data;

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
      return errorResponse('FORBIDDEN', '密碼不正確');
    }

    // 5. Get 2FA setup
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      return errorResponse('NOT_FOUND', '2FA 尚未設定');
    }

    if (!twoFactorAuth.enabled) {
      return errorResponse('CONFLICT', '2FA 尚未啟用');
    }

    // 6. Verify 2FA token
    const secret = decryptSecret(twoFactorAuth.secret, ENCRYPTION_KEY);
    const isValid = verifyToken(secret, token, userEmail || userId);

    if (!isValid) {
      await logAudit({
        action: 'update',
        entity: 'user_security',
        entityId: userId,
        userId,
        details: {
          action: 'backup_codes_regeneration_failed',
          reason: 'invalid_token',
        },
        request,
      });

      return errorResponse('FORBIDDEN', '驗證碼不正確');
    }

    // 7. Generate new backup codes
    const newBackupCodes = generateBackupCodes();

    // 8. Update backup codes
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        backupCodes: JSON.stringify(newBackupCodes.hashedCodes),
      },
    });

    // 9. Log regeneration
    await logAudit({
      action: 'update',
      entity: 'user_security',
      entityId: userId,
      userId,
      details: {
        action: 'backup_codes_regenerated',
        success: true,
      },
      request,
    });

    // 10. Return new backup codes (only shown once!)
    return successResponse({
      success: true,
      message: '備用碼已重新產生，請妥善保存',
      backupCodes: newBackupCodes.codes, // Only shown once!
      warning: '這些備用碼只會顯示一次，請立即保存到安全的地方',
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return errorResponse('INTERNAL_ERROR', '重新產生備用碼失敗');
  }
}
