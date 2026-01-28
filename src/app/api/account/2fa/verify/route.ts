/**
 * 2FA Verify API
 * POST /api/account/2fa/verify - Verify 2FA token and enable 2FA
 *
 * ISO 27001 A.9.4.2 (Secure Log-on Procedures)
 */

import { z } from 'zod';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { verifyToken, decryptSecret } from '@/lib/2fa';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

// ============================================
// Validation Schema
// ============================================

const verifySchema = z.object({
  token: z
    .string()
    .length(6, '驗證碼必須是 6 位數字')
    .regex(/^\d+$/, '驗證碼必須是數字'),
});

// ============================================
// POST /api/account/2fa/verify - Verify and enable 2FA
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = verifySchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { token } = validatedData.data;

    // 3. Get existing 2FA setup
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      return errorResponse('NOT_FOUND', '請先開始 2FA 設定流程');
    }

    if (twoFactorAuth.enabled) {
      return errorResponse('CONFLICT', '2FA 已啟用');
    }

    // 4. Decrypt secret
    const secret = decryptSecret(twoFactorAuth.secret, ENCRYPTION_KEY);

    // 5. Verify token
    const isValid = verifyToken(secret, token, userEmail || userId);

    if (!isValid) {
      // Log failed verification
      await logAudit({
        action: '2fa_enable',
        entity: 'user_security',
        entityId: userId,
        userId,
        details: {
          stage: 'verification_failed',
          reason: 'invalid_token',
        },
        request,
      });

      return errorResponse('FORBIDDEN', '驗證碼不正確，請確認時間同步並重試');
    }

    // 6. Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: true,
        verifiedAt: new Date(),
      },
    });

    // 7. Log successful activation
    await logAudit({
      action: '2fa_enable',
      entity: 'user_security',
      entityId: userId,
      userId,
      details: {
        stage: 'enabled',
        success: true,
      },
      request,
    });

    return successResponse({
      success: true,
      message: '2FA 已成功啟用',
      enabledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return errorResponse('INTERNAL_ERROR', '驗證 2FA 失敗');
  }
}
