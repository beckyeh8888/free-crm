/**
 * Login API Integration Tests
 * Tests NextAuth CredentialsProvider authorize function
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import bcrypt from 'bcryptjs';

// Import the authorize function by accessing the credentials provider
import { authOptions } from '@/lib/auth';

// Get the authorize function from credentials provider
const credentialsProvider = authOptions.providers.find(
  (p) => p.id === 'credentials'
);

// Type for the authorize function
type AuthorizeFunction = (
  credentials: Record<'email' | 'password', string> | undefined
) => Promise<{ id: string; email: string; name: string | null; role: string } | null>;

describe('NextAuth Credentials Login', () => {
  const testPassword = 'TestPass123!';
  let hashedPassword: string;

  beforeEach(async () => {
    await clearDatabase();
    hashedPassword = await bcrypt.hash(testPassword, 10);
  });

  describe('Successful Login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'login@example.com',
          password: hashedPassword,
          role: 'user',
        },
      });

      // Get authorize function
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'login@example.com',
        password: testPassword,
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe('login@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.role).toBe('user');
    });

    it('should return user with admin role', async () => {
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
        },
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'admin@example.com',
        password: testPassword,
      });

      expect(result?.role).toBe('admin');
    });

    it('should not return password in user object', async () => {
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'nopass@example.com',
          password: hashedPassword,
          role: 'user',
        },
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'nopass@example.com',
        password: testPassword,
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('Invalid Credentials', () => {
    it('should reject wrong password', async () => {
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'wrongpass@example.com',
          password: hashedPassword,
          role: 'user',
        },
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: 'wrongpass@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('電子郵件或密碼錯誤');
    });

    it('should reject non-existent user', async () => {
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
      ).rejects.toThrow('電子郵件或密碼錯誤');
    });

    it('should reject missing email', async () => {
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: '',
          password: testPassword,
        })
      ).rejects.toThrow('請輸入電子郵件和密碼');
    });

    it('should reject missing password', async () => {
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: 'test@example.com',
          password: '',
        })
      ).rejects.toThrow('請輸入電子郵件和密碼');
    });

    it('should reject undefined credentials', async () => {
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(authorize(undefined)).rejects.toThrow('請輸入電子郵件和密碼');
    });
  });

  describe('User without password (OAuth user)', () => {
    it('should reject OAuth user trying to login with credentials', async () => {
      // Create OAuth user without password
      await prisma.user.create({
        data: {
          name: 'OAuth User',
          email: 'oauth@example.com',
          password: null, // OAuth users don't have password
          role: 'user',
        },
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: 'oauth@example.com',
          password: testPassword,
        })
      ).rejects.toThrow('電子郵件或密碼錯誤');
    });
  });
});
