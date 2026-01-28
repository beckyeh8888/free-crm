/**
 * 2FA Setup API
 * POST /api/account/2fa/setup - Start 2FA setup, returns QR code
 *
 * ISO 27001 A.9.4.2 (Secure Log-on Procedures)
 */

import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import {
  setupTwoFactor,
  generateBackupCodes,
  encryptSecret,
} from '@/lib/2fa';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

// ============================================
// POST /api/account/2fa/setup - Start 2FA setup
// ============================================

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Check if 2FA is already enabled
    const existing2FA = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (existing2FA?.enabled) {
      return errorResponse('CONFLICT', '2FA 已啟用。如需重新設定，請先停用現有的 2FA。');
    }

    // 3. Generate 2FA setup data
    const setupResult = await setupTwoFactor(userEmail || userId);

    // 4. Generate backup codes
    const backupCodes = generateBackupCodes();

    // 5. Encrypt secret for storage
    const encryptedSecret = encryptSecret(setupResult.secret, ENCRYPTION_KEY);

    // 6. Store setup data (not enabled yet)
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: encryptedSecret,
        enabled: false,
        backupCodes: JSON.stringify(backupCodes.hashedCodes),
        verifiedAt: null,
      },
      create: {
        userId,
        secret: encryptedSecret,
        enabled: false,
        backupCodes: JSON.stringify(backupCodes.hashedCodes),
      },
    });

    // 7. Log audit (don't log the actual secret)
    await logAudit({
      action: '2fa_enable',
      entity: 'user_security',
      entityId: userId,
      userId,
      details: {
        stage: 'setup_started',
      },
      request,
    });

    // 8. Return QR code and backup codes
    // IMPORTANT: Backup codes are only shown once during setup
    return successResponse({
      qrCode: setupResult.qrCodeDataUrl,
      secret: setupResult.secret, // For manual entry if QR scan fails
      backupCodes: backupCodes.codes, // Only shown once!
      instructions: {
        step1: '使用 Google Authenticator 或其他驗證器 App 掃描 QR Code',
        step2: '安全保存備用碼（只會顯示一次）',
        step3: '輸入 App 顯示的 6 位數驗證碼以完成設定',
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return errorResponse('INTERNAL_ERROR', '設定 2FA 失敗');
  }
}
