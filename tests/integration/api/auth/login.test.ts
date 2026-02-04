/**
 * Login API Integration Tests
 * Tests NextAuth CredentialsProvider authorize function
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext } from '@tests/helpers/auth-helpers';
import bcrypt from 'bcryptjs';

// Import the authorize function by accessing the credentials provider
import { authOptions } from '@/lib/auth';

// Get the authorize function from credentials provider
const credentialsProvider = authOptions.providers.find(
  (p) => p.id === 'credentials'
);

// Type for the authorize function return value (updated for multi-tenant)
type AuthorizeReturn = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  status: string;
  defaultOrganizationId?: string;
  defaultOrganizationName?: string;
  defaultRole?: string;
} | null;

type AuthorizeFunction = (
  credentials: Record<'email' | 'password', string> | undefined
) => Promise<AuthorizeReturn>;

describe('NextAuth Credentials Login', () => {
  const testPassword = 'TestPass123!';

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Successful Login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Create test context with user, org, and role
      const ctx = await createTestContext({
        userEmail: 'login@example.com',
        userName: 'Test User',
        userPassword: testPassword,
      });

      // Get authorize function
      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'login@example.com',
        password: testPassword,
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(ctx.user.id);
      expect(result?.email).toBe('login@example.com');
      expect(result?.name).toBe('Test User');
    });

    it('should return user with default organization context', async () => {
      const ctx = await createTestContext({
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userPassword: testPassword,
        roleName: 'Admin',
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'admin@example.com',
        password: testPassword,
      });

      expect(result?.defaultOrganizationId).toBe(ctx.organization.id);
      expect(result?.defaultRole).toBe('Admin');
    });

    it('should not return password in user object', async () => {
      await createTestContext({
        userEmail: 'nopass@example.com',
        userPassword: testPassword,
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      const result = await authorize({
        email: 'nopass@example.com',
        password: testPassword,
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should update lastLoginAt on successful login', async () => {
      const ctx = await createTestContext({
        userEmail: 'lastlogin@example.com',
        userPassword: testPassword,
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      // Get user before login
      const userBefore = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { lastLoginAt: true },
      });

      await authorize({
        email: 'lastlogin@example.com',
        password: testPassword,
      });

      // Get user after login
      const userAfter = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { lastLoginAt: true },
      });

      expect(userAfter?.lastLoginAt).toBeDefined();
      expect(userAfter?.lastLoginAt).not.toBe(userBefore?.lastLoginAt);
    });
  });

  describe('Invalid Credentials', () => {
    it('should reject wrong password', async () => {
      await createTestContext({
        userEmail: 'wrongpass@example.com',
        userPassword: testPassword,
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

  describe('User status checks', () => {
    it('should reject suspended user', async () => {
      // Create user directly with suspended status
      const hashedPwd = await bcrypt.hash(testPassword, 10);
      await prisma.user.create({
        data: {
          name: 'Suspended User',
          email: 'suspended@example.com',
          password: hashedPwd,
          status: 'suspended',
        },
      });

      const authorize = (credentialsProvider as { options: { authorize: AuthorizeFunction } }).options.authorize;

      await expect(
        authorize({
          email: 'suspended@example.com',
          password: testPassword,
        })
      ).rejects.toThrow('帳號已被停用');
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
          status: 'active',
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
