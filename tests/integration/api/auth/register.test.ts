/**
 * Registration API Integration Tests
 * POST /api/auth/register
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Successful Registration', () => {
    it('should register new user with valid data', async () => {
      const uniqueEmail = `register-valid-${Date.now()}@example.com`;
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: uniqueEmail,
          password: 'TestPass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ message: string; user: { id: string; name: string; email: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.message).toBe('註冊成功');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(uniqueEmail);
      expect(data.user.name).toBe('Test User');
    });

    it('should hash password with bcrypt', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'hash-test@example.com',
          password: 'TestPass123!',
        },
      });

      await POST(request);

      const user = await prisma.user.findUnique({
        where: { email: 'hash-test@example.com' },
      });

      expect(user).toBeDefined();
      expect(user!.password).not.toBe('TestPass123!');
      expect(await bcrypt.compare('TestPass123!', user!.password!)).toBe(true);
    });

    it('should not return password in response', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'no-password@example.com',
          password: 'TestPass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ user: Record<string, unknown> }>(response);

      expect(data.user).toBeDefined();
      expect(data.user).not.toHaveProperty('password');
    });

    it('should create audit log entry', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'audit@example.com',
          password: 'TestPass123!',
        },
      });

      await POST(request);

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'user', action: 'create' },
      });

      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].action).toBe('create');
      expect(auditLogs[0].entity).toBe('user');
    });

    it('should create user with active status by default', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'status-test@example.com',
          password: 'TestPass123!',
        },
      });

      await POST(request);

      const user = await prisma.user.findUnique({
        where: { email: 'status-test@example.com' },
      });

      expect(user?.status).toBe('active');
    });
  });

  describe('Duplicate Email', () => {
    it('should reject duplicate email', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          name: 'Existing User',
          email: 'existing@example.com',
          password: await bcrypt.hash('TestPass123!', 10),
          status: 'active',
        },
      });

      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'New User',
          email: 'existing@example.com',
          password: 'TestPass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe('此電子郵件已被註冊');
    });
  });

  describe('Password Validation', () => {
    it('should reject password without uppercase', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('大寫');
    });

    it('should reject password without lowercase', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'TESTPASS123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('小寫');
    });

    it('should reject password without number', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass!!!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('數字');
    });

    it('should reject password without special character', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('特殊字元');
    });

    it('should reject password shorter than 8 characters', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Te1!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('8');
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'TestPass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('電子郵件');
    });
  });

  describe('Name Validation', () => {
    it('should reject empty name', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: '',
          email: 'test@example.com',
          password: 'TestPass123!',
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('姓名');
    });
  });
});
