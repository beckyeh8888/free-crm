/**
 * Two-Factor Authentication Unit Tests
 * Tests for 2FA utilities (TOTP, backup codes, encryption)
 */


import crypto from 'node:crypto';
import {
  generateSecret,
  generateTOTPUri,
  verifyToken,
  generateCurrentToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  removeUsedBackupCode,
  encryptSecret,
  decryptSecret,
  setupTwoFactor,
} from '@/lib/2fa';

describe('2FA Module', () => {
  describe('generateSecret', () => {
    it('generates a base32 encoded secret', () => {
      const secret = generateSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      // Base32 characters: A-Z and 2-7
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('generates unique secrets each time', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();

      expect(secret1).not.toBe(secret2);
    });

    it('generates secrets of appropriate length', () => {
      const secret = generateSecret();

      // 20 bytes = 160 bits, base32 encodes 5 bits per char = 32 chars
      expect(secret.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('generateTOTPUri', () => {
    it('generates a valid otpauth URI', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const uri = generateTOTPUri(secret, accountName);

      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain('issuer=Free%20CRM');
      expect(uri).toContain(encodeURIComponent(accountName));
      expect(uri).toContain('secret=');
    });

    it('includes correct parameters', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const accountName = 'user@test.com';

      const uri = generateTOTPUri(secret, accountName);

      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });
  });

  describe('setupTwoFactor', () => {
    it('returns an object with secret, uri, and qrCodeDataUrl', async () => {
      const result = await setupTwoFactor('test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('qrCodeDataUrl');
    });

    it('qrCodeDataUrl starts with data:image/png;base64,', async () => {
      const result = await setupTwoFactor('test@example.com');

      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('uri contains otpauth://totp/', async () => {
      const result = await setupTwoFactor('test@example.com');

      expect(result.uri).toContain('otpauth://totp/');
    });

    it('secret is valid base32', async () => {
      const result = await setupTwoFactor('test@example.com');

      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    });
  });

  describe('verifyToken', () => {
    it('verifies a valid token', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      // Generate a current valid token
      const token = generateCurrentToken(secret, accountName);

      // Verify it
      const isValid = verifyToken(secret, token, accountName);

      expect(isValid).toBe(true);
    });

    it('rejects an invalid token', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const isValid = verifyToken(secret, '000000', accountName);

      expect(isValid).toBe(false);
    });

    it('rejects wrong length token', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const isValid = verifyToken(secret, '12345', accountName);

      expect(isValid).toBe(false);
    });

    it('rejects non-numeric token', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const isValid = verifyToken(secret, 'abcdef', accountName);

      expect(isValid).toBe(false);
    });
  });

  describe('generateCurrentToken', () => {
    it('generates a 6-digit token', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const token = generateCurrentToken(secret, accountName);

      expect(token).toMatch(/^\d{6}$/);
    });

    it('generates consistent tokens for same secret at same time', () => {
      const secret = generateSecret();
      const accountName = 'test@example.com';

      const token1 = generateCurrentToken(secret, accountName);
      const token2 = generateCurrentToken(secret, accountName);

      expect(token1).toBe(token2);
    });
  });

  describe('Backup Codes', () => {
    describe('generateBackupCodes', () => {
      it('generates 10 backup codes', () => {
        const { codes, hashedCodes } = generateBackupCodes();

        expect(codes.length).toBe(10);
        expect(hashedCodes.length).toBe(10);
      });

      it('generates codes in XXXX-XXXX format', () => {
        const { codes } = generateBackupCodes();

        codes.forEach((code) => {
          expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
        });
      });

      it('generates unique codes', () => {
        const { codes } = generateBackupCodes();
        const uniqueCodes = new Set(codes);

        expect(uniqueCodes.size).toBe(codes.length);
      });

      it('hashes do not reveal original codes', () => {
        const { codes, hashedCodes } = generateBackupCodes();

        hashedCodes.forEach((hash, index) => {
          expect(hash).not.toContain(codes[index]);
          expect(hash.length).toBe(64); // SHA256 hex = 64 chars
        });
      });
    });

    describe('hashBackupCode', () => {
      it('produces consistent hash for same code', () => {
        const code = 'ABCD-1234';

        const hash1 = hashBackupCode(code);
        const hash2 = hashBackupCode(code);

        expect(hash1).toBe(hash2);
      });

      it('normalizes code format (ignores dashes)', () => {
        const hash1 = hashBackupCode('ABCD-1234');
        const hash2 = hashBackupCode('ABCD1234');

        expect(hash1).toBe(hash2);
      });

      it('normalizes case (uppercase)', () => {
        const hash1 = hashBackupCode('abcd-1234');
        const hash2 = hashBackupCode('ABCD-1234');

        expect(hash1).toBe(hash2);
      });

      it('produces different hashes for different codes', () => {
        const hash1 = hashBackupCode('ABCD-1234');
        const hash2 = hashBackupCode('EFGH-5678');

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('verifyBackupCode', () => {
      it('returns index when code matches', () => {
        const { codes, hashedCodes } = generateBackupCodes();

        const index = verifyBackupCode(codes[3], hashedCodes);

        expect(index).toBe(3);
      });

      it('returns -1 for non-matching code', () => {
        const { hashedCodes } = generateBackupCodes();

        const index = verifyBackupCode('XXXX-XXXX', hashedCodes);

        expect(index).toBe(-1);
      });

      it('matches case-insensitively', () => {
        const { codes, hashedCodes } = generateBackupCodes();
        const lowerCode = codes[0].toLowerCase();

        const index = verifyBackupCode(lowerCode, hashedCodes);

        expect(index).toBe(0);
      });

      it('matches without dashes', () => {
        const { codes, hashedCodes } = generateBackupCodes();
        const noDashCode = codes[2].replace('-', '');

        const index = verifyBackupCode(noDashCode, hashedCodes);

        expect(index).toBe(2);
      });
    });

    describe('removeUsedBackupCode', () => {
      it('removes the code at specified index', () => {
        const hashedCodes = ['hash0', 'hash1', 'hash2', 'hash3', 'hash4'];

        const result = removeUsedBackupCode(hashedCodes, 2);

        expect(result).toEqual(['hash0', 'hash1', 'hash3', 'hash4']);
        expect(result.length).toBe(4);
      });

      it('does not modify original array', () => {
        const hashedCodes = ['hash0', 'hash1', 'hash2'];

        removeUsedBackupCode(hashedCodes, 1);

        expect(hashedCodes.length).toBe(3);
      });

      it('handles removing first element', () => {
        const hashedCodes = ['hash0', 'hash1', 'hash2'];

        const result = removeUsedBackupCode(hashedCodes, 0);

        expect(result).toEqual(['hash1', 'hash2']);
      });

      it('handles removing last element', () => {
        const hashedCodes = ['hash0', 'hash1', 'hash2'];

        const result = removeUsedBackupCode(hashedCodes, 2);

        expect(result).toEqual(['hash0', 'hash1']);
      });
    });
  });

  describe('Secret Encryption', () => {
    const encryptionKey = 'test-encryption-key-for-2fa';

    describe('encryptSecret', () => {
      it('encrypts a secret', () => {
        const secret = 'JBSWY3DPEHPK3PXP';

        const encrypted = encryptSecret(secret, encryptionKey);

        expect(encrypted).toBeDefined();
        expect(encrypted).not.toBe(secret);
        expect(encrypted).not.toContain(secret);
      });

      it('produces format with iv:authTag:encrypted', () => {
        const secret = 'TESTSECRET123';

        const encrypted = encryptSecret(secret, encryptionKey);
        const parts = encrypted.split(':');

        expect(parts.length).toBe(3);
        expect(parts[0].length).toBe(24); // 12 bytes IV = 24 hex chars
        expect(parts[1].length).toBe(32); // 16 bytes authTag = 32 hex chars
      });

      it('produces different ciphertext each time (random IV)', () => {
        const secret = 'SAMEINPUT';

        const encrypted1 = encryptSecret(secret, encryptionKey);
        const encrypted2 = encryptSecret(secret, encryptionKey);

        expect(encrypted1).not.toBe(encrypted2);
      });
    });

    describe('decryptSecret', () => {
      it('decrypts an encrypted secret', () => {
        const originalSecret = 'JBSWY3DPEHPK3PXP';

        const encrypted = encryptSecret(originalSecret, encryptionKey);
        const decrypted = decryptSecret(encrypted, encryptionKey);

        expect(decrypted).toBe(originalSecret);
      });

      it('handles various secret values', () => {
        const secrets = [
          'ABCDEFGHIJKLMNOP',
          '12345678',
          'MixedCase123ABC',
          'special!@#$%',
        ];

        secrets.forEach((secret) => {
          const encrypted = encryptSecret(secret, encryptionKey);
          const decrypted = decryptSecret(encrypted, encryptionKey);
          expect(decrypted).toBe(secret);
        });
      });

      it('fails with wrong encryption key', () => {
        const secret = 'TESTSECRET';
        const encrypted = encryptSecret(secret, encryptionKey);

        expect(() => {
          decryptSecret(encrypted, 'wrong-key');
        }).toThrow();
      });

      it('fails with tampered ciphertext', () => {
        const secret = 'TESTSECRET';
        const encrypted = encryptSecret(secret, encryptionKey);
        const tampered = encrypted.slice(0, -2) + 'XX'; // Modify last bytes

        expect(() => {
          decryptSecret(tampered, encryptionKey);
        }).toThrow();
      });

      it('decrypts legacy CBC format (iv:encrypted)', () => {
        const plaintext = 'JBSWY3DPEHPK3PXP';

        // Manually create a CBC-encrypted string
        const key = crypto.scryptSync(encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const cbcData = iv.toString('hex') + ':' + encrypted;

        const decrypted = decryptSecret(cbcData, encryptionKey);

        expect(decrypted).toBe(plaintext);
      });
    });

    describe('Encryption roundtrip', () => {
      it('encrypts and decrypts correctly for various inputs', () => {
        const testCases = [
          generateSecret(),
          'ShortKey',
          'A'.repeat(100),
          '日本語テスト',
          '🔐🔑',
        ];

        testCases.forEach((original) => {
          const encrypted = encryptSecret(original, encryptionKey);
          const decrypted = decryptSecret(encrypted, encryptionKey);
          expect(decrypted).toBe(original);
        });
      });
    });
  });
});
