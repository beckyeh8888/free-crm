/**
 * Two-Factor Authentication Utilities
 *
 * Uses TOTP (Time-based One-Time Password) algorithm
 * RFC 6238 compliant
 *
 * ISO 27001 A.9.4.2 (Secure Log-on Procedures)
 */

import * as OTPAuth from 'otpauth';
import crypto from 'node:crypto';

// ============================================
// Configuration
// ============================================

const ISSUER = 'Free CRM';
const ALGORITHM = 'SHA1';
const DIGITS = 6;
const PERIOD = 30; // seconds
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// ============================================
// Types
// ============================================

export interface TwoFactorSetupResult {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

export interface BackupCodes {
  codes: string[];
  hashedCodes: string[];
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  // Generate a new random secret using OTPAuth
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Create a TOTP instance
 */
function createTOTP(secret: string, accountName: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret,
  });
}

/**
 * Generate a provisioning URI for QR code
 */
export function generateTOTPUri(secret: string, accountName: string): string {
  const totp = createTOTP(secret, accountName);
  return totp.toString();
}

/**
 * Generate QR code as data URL (base64)
 */
export async function generateQRCodeDataUrl(uri: string): Promise<string> {
  // Use a simple SVG-based QR code for now
  // In production, you might want to use a proper QR code library
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  });
}

/**
 * Verify a TOTP token
 */
export function verifyToken(secret: string, token: string, accountName: string): boolean {
  const totp = createTOTP(secret, accountName);

  // Allow for time drift (1 period before and after)
  const delta = totp.validate({ token, window: 1 });

  return delta !== null;
}

/**
 * Generate a current TOTP token (for testing)
 */
export function generateCurrentToken(secret: string, accountName: string): string {
  const totp = createTOTP(secret, accountName);
  return totp.generate();
}

// ============================================
// Backup Codes Functions
// ============================================

/**
 * Generate backup codes
 */
export function generateBackupCodes(): BackupCodes {
  const codes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate a random code like "XXXX-XXXX"
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${part1}-${part2}`;

    codes.push(code);
    hashedCodes.push(hashBackupCode(code));
  }

  return { codes, hashedCodes };
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  // Normalize the code (remove dashes, uppercase)
  const normalized = code.replaceAll('-', '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify a backup code against stored hashes
 * Returns the index of the matched code or -1 if not found
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): number {
  const inputHash = hashBackupCode(code);

  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedCodes[i] === inputHash) {
      return i;
    }
  }

  return -1;
}

/**
 * Remove a used backup code from the list
 */
export function removeUsedBackupCode(
  hashedCodes: string[],
  usedIndex: number
): string[] {
  return hashedCodes.filter((_, index) => index !== usedIndex);
}

// ============================================
// Setup Flow Functions
// ============================================

/**
 * Complete 2FA setup flow
 */
export async function setupTwoFactor(
  accountName: string
): Promise<TwoFactorSetupResult> {
  // 1. Generate secret
  const secret = generateSecret();

  // 2. Generate URI
  const uri = generateTOTPUri(secret, accountName);

  // 3. Generate QR code
  const qrCodeDataUrl = await generateQRCodeDataUrl(uri);

  return {
    secret,
    uri,
    qrCodeDataUrl,
  };
}

/**
 * Encrypt secret for database storage
 * Uses AES-256-GCM for authenticated encryption (ISO 27001 A.10.1.1)
 */
export function encryptSecret(secret: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(12); // GCM recommends 12 bytes IV
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get the authentication tag (16 bytes)
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt secret from database storage
 * Uses AES-256-GCM for authenticated encryption (ISO 27001 A.10.1.1)
 */
export function decryptSecret(encryptedData: string, encryptionKey: string): string {
  const parts = encryptedData.split(':');

  // Support both old (CBC) and new (GCM) formats for migration
  if (parts.length === 2) {
    // Legacy CBC format: iv:encrypted (will be deprecated)
    const [ivHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // New GCM format: iv:authTag:encrypted
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

  // Set the authentication tag for verification
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
