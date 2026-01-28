/**
 * Audit Log Integration Tests
 * Tests audit logging functionality for ISO 27001 compliance
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { POST as CREATE_CUSTOMER } from '@/app/api/customers/route';
import { PATCH, DELETE } from '@/app/api/customers/[id]/route';
import { createMockRequest } from '@tests/helpers/request-helpers';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Audit Log', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'audit@example.com' });
  });

  const mockAuth = (ctx: TestContext) => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  describe('Create operations', () => {
    it('should log create action with entity details', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Audit Create Test', email: 'auditcreate@example.com' },
      });
      await CREATE_CUSTOMER(request);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'create', entity: 'customer' },
      });

      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].userId).toBe(testCtx.user.id);
      expect(auditLogs[0].entityId).toBeDefined();

      // Verify details contain entity information
      const details = JSON.parse(auditLogs[0].details || '{}');
      expect(details.name).toBe('Audit Create Test');
      expect(details.email).toBe('auditcreate@example.com');
    });

    it('should log entityId correctly', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Entity ID Test' },
      });
      const response = await CREATE_CUSTOMER(request);
      const data = await response.json();

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'create', entity: 'customer' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog?.entityId).toBe(data.data.id);
    });
  });

  describe('Update operations', () => {
    it('should log update action with before/after state', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Before Update',
        email: 'before@example.com',
      });

      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { name: 'After Update', email: 'after@example.com' },
      });
      await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'update', entity: 'customer', entityId: customer.id },
      });

      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].userId).toBe(testCtx.user.id);

      // Verify details contain before/after state
      const details = JSON.parse(auditLogs[0].details || '{}');
      expect(details.before).toBeDefined();
      expect(details.before.name).toBe('Before Update');
      expect(details.after).toBeDefined();
      expect(details.after.name).toBe('After Update');
    });

    it('should track partial updates', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Original Name',
        status: 'active',
      });

      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { status: 'inactive' }, // Only updating status
      });
      await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'update', entity: 'customer', entityId: customer.id },
      });

      const details = JSON.parse(auditLog?.details || '{}');
      expect(details.after.status).toBe('inactive');
    });
  });

  describe('Delete operations', () => {
    it('should log delete action with entity details', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Delete Test',
        email: 'delete@example.com',
      });
      const customerId = customer.id;

      const request = createMockRequest(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      await DELETE(request, { params: Promise.resolve({ id: customerId }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'delete', entity: 'customer', entityId: customerId },
      });

      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].userId).toBe(testCtx.user.id);

      // Verify details contain deleted entity information
      const details = JSON.parse(auditLogs[0].details || '{}');
      expect(details.name).toBe('Delete Test');
      expect(details.email).toBe('delete@example.com');
    });

    it('should log cascade delete information', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Cascade Test',
      });

      // Create contacts and deals
      await prisma.contact.create({
        data: { name: 'Contact 1', customerId: customer.id },
      });
      await prisma.contact.create({
        data: { name: 'Contact 2', customerId: customer.id },
      });
      await prisma.deal.create({
        data: { title: 'Deal 1', customerId: customer.id },
      });

      const customerId = customer.id;

      const request = createMockRequest(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      await DELETE(request, { params: Promise.resolve({ id: customerId }) });

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'delete', entity: 'customer', entityId: customerId },
      });

      const details = JSON.parse(auditLog?.details || '{}');
      expect(details.deletedRelations).toBeDefined();
      expect(details.deletedRelations.contacts).toBe(2);
      expect(details.deletedRelations.deals).toBe(1);
    });
  });

  describe('Audit log metadata', () => {
    it('should record user ID for all actions', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'User ID Test' },
      });
      await CREATE_CUSTOMER(request);

      const auditLog = await prisma.auditLog.findFirst({
        where: { entity: 'customer' },
      });

      expect(auditLog?.userId).toBe(testCtx.user.id);
    });

    it('should record timestamp for all actions', async () => {
      mockAuth(testCtx);
      const beforeTime = new Date();

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Timestamp Test' },
      });
      await CREATE_CUSTOMER(request);

      const afterTime = new Date();

      const auditLog = await prisma.auditLog.findFirst({
        where: { entity: 'customer' },
      });

      expect(auditLog?.createdAt).toBeDefined();
      expect(auditLog!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
      expect(auditLog!.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    });

    it('should maintain audit history for same entity', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'History Test',
      });

      // Update multiple times
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(`/api/customers/${customer.id}`, {
          method: 'PATCH',
          body: { name: `Update ${i + 1}` },
        });
        await PATCH(request, { params: Promise.resolve({ id: customer.id }) });
      }

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'customer', entityId: customer.id, action: 'update' },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBe(3);

      // Verify chronological order
      for (let i = 1; i < auditLogs.length; i++) {
        expect(auditLogs[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          auditLogs[i - 1].createdAt.getTime()
        );
      }
    });
  });

  describe('Audit log queries', () => {
    it('should be able to query by entity type', async () => {
      mockAuth(testCtx);

      // Create customer via API to generate audit log
      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Query Test Customer' },
      });
      await CREATE_CUSTOMER(request);

      // Create direct audit log for a different entity type
      await prisma.auditLog.create({
        data: {
          action: 'create',
          entity: 'deal',
          userId: testCtx.user.id,
        },
      });

      const customerLogs = await prisma.auditLog.findMany({
        where: { entity: 'customer' },
      });

      const dealLogs = await prisma.auditLog.findMany({
        where: { entity: 'deal' },
      });

      expect(customerLogs.length).toBeGreaterThan(0);
      expect(dealLogs.length).toBe(1);
    });

    it('should be able to query by action type', async () => {
      mockAuth(testCtx);

      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
      });

      // Create an update log
      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { name: 'Updated' },
      });
      await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      const updateLogs = await prisma.auditLog.findMany({
        where: { action: 'update' },
      });

      const readLogs = await prisma.auditLog.findMany({
        where: { action: 'read' },
      });

      expect(updateLogs.length).toBeGreaterThan(0);
      // read logs may or may not exist depending on what operations were performed
    });

    it('should be able to query by date range', async () => {
      mockAuth(testCtx);

      const startTime = new Date();

      // Create customer via API to generate audit log
      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Date Range Test' },
      });
      await CREATE_CUSTOMER(request);

      const endTime = new Date();

      const logsInRange = await prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime,
          },
        },
      });

      expect(logsInRange.length).toBeGreaterThan(0);
    });
  });
});
