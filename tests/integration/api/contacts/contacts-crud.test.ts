/**
 * Contact CRUD API Integration Tests
 * GET/POST /api/customers/[id]/contacts
 * PATCH/DELETE /api/customers/[id]/contacts/[contactId]
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/customers/[id]/contacts/route';
import { PATCH, DELETE } from '@/app/api/customers/[id]/contacts/[contactId]/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createContact, createPrimaryContact } from '@tests/factories/contact.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Contact API', () => {
  let testCtx: TestContext;
  let testCustomer: Awaited<ReturnType<typeof createCustomer>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'test@example.com' });
    testCustomer = await createCustomer({
      organizationId: testCtx.organization.id,
      createdById: testCtx.user.id,
      name: 'Test Customer',
    });
  });

  const mockAuth = (ctx: TestContext | null) => {
    vi.mocked(getServerSession).mockResolvedValue(
      ctx
        ? {
            user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : null
    );
  };

  describe('GET /api/customers/[id]/contacts', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: testCustomer.id }) });

      expect(response.status).toBe(401);
    });

    it('should return contacts for the customer', async () => {
      mockAuth(testCtx);

      await createContact({ customerId: testCustomer.id, name: 'Contact 1' });
      await createContact({ customerId: testCustomer.id, name: 'Contact 2' });

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: testCustomer.id }) });
      const data = await parseResponse<{ data: { name: string }[]; pagination: { total: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other@example.com' });
      const otherCustomer = await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
      });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: otherCustomer.id }) });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent customer', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/customers/non-existent/contacts');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
    });

    it('should order by isPrimary first', async () => {
      mockAuth(testCtx);

      await createContact({ customerId: testCustomer.id, name: 'Regular Contact', isPrimary: false });
      await createContact({ customerId: testCustomer.id, name: 'Primary Contact', isPrimary: true });

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`);
      const response = await GET(request, { params: Promise.resolve({ id: testCustomer.id }) });
      const data = await parseResponse<{ data: { name: string; isPrimary: boolean }[] }>(response);

      expect(data.data[0].name).toBe('Primary Contact');
      expect(data.data[0].isPrimary).toBe(true);
    });
  });

  describe('POST /api/customers/[id]/contacts', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`, {
        method: 'POST',
        body: { name: 'New Contact' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: testCustomer.id }) });

      expect(response.status).toBe(401);
    });

    it('should create contact successfully', async () => {
      mockAuth(testCtx);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`, {
        method: 'POST',
        body: {
          name: 'New Contact',
          email: 'newcontact@example.com',
          phone: '0912-345-678',
          title: 'CEO',
        },
      });
      const response = await POST(request, { params: Promise.resolve({ id: testCustomer.id }) });
      const data = await parseResponse<{ success: boolean; data: { id: string; name: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Contact');
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other2@example.com' });
      const otherCustomer = await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
      });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}/contacts`, {
        method: 'POST',
        body: { name: 'Hacked Contact' },
      });
      const response = await POST(request, { params: Promise.resolve({ id: otherCustomer.id }) });

      expect(response.status).toBe(403);
    });

    it('should reject invalid data', async () => {
      mockAuth(testCtx);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`, {
        method: 'POST',
        body: { name: '' }, // Empty name
      });
      const response = await POST(request, { params: Promise.resolve({ id: testCustomer.id }) });

      expect(response.status).toBe(400);
    });

    it('should set as primary and unset other primaries', async () => {
      mockAuth(testCtx);

      // Create existing primary contact
      const existingPrimary = await createPrimaryContact(testCustomer.id, { name: 'Old Primary' });

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts`, {
        method: 'POST',
        body: { name: 'New Primary', isPrimary: true },
      });
      await POST(request, { params: Promise.resolve({ id: testCustomer.id }) });

      // Verify old primary is no longer primary
      const updatedOld = await prisma.contact.findUnique({ where: { id: existingPrimary.id } });
      expect(updatedOld?.isPrimary).toBe(false);

      // Verify new primary count
      const primaryCount = await prisma.contact.count({
        where: { customerId: testCustomer.id, isPrimary: true },
      });
      expect(primaryCount).toBe(1);
    });
  });

  describe('PATCH /api/customers/[id]/contacts/[contactId]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const contact = await createContact({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${contact.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: contact.id }),
      });

      expect(response.status).toBe(401);
    });

    it('should update contact successfully', async () => {
      mockAuth(testCtx);

      const contact = await createContact({ customerId: testCustomer.id, name: 'Original' });
      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${contact.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name', title: 'CTO' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: contact.id }),
      });
      const data = await parseResponse<{ success: boolean; data: { name: string; title: string } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Name');
      expect(data.data.title).toBe('CTO');
    });

    it('should return 404 for non-existent contact', async () => {
      mockAuth(testCtx);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/non-existent`, {
        method: 'PATCH',
        body: { name: 'Updated' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 404 for contact belonging to different customer', async () => {
      mockAuth(testCtx);

      const otherCustomer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Other Customer',
      });
      const otherContact = await createContact({ customerId: otherCustomer.id });

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${otherContact.id}`, {
        method: 'PATCH',
        body: { name: 'Hacked' },
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: otherContact.id }),
      });

      expect(response.status).toBe(404);
    });

    it('should update isPrimary and unset other primaries', async () => {
      mockAuth(testCtx);

      const primary = await createPrimaryContact(testCustomer.id, { name: 'Current Primary' });
      const regular = await createContact({ customerId: testCustomer.id, name: 'Regular', isPrimary: false });

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${regular.id}`, {
        method: 'PATCH',
        body: { isPrimary: true },
      });
      await PATCH(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: regular.id }),
      });

      // Verify old primary is no longer primary
      const updatedPrimary = await prisma.contact.findUnique({ where: { id: primary.id } });
      expect(updatedPrimary?.isPrimary).toBe(false);

      // Verify new primary
      const updatedRegular = await prisma.contact.findUnique({ where: { id: regular.id } });
      expect(updatedRegular?.isPrimary).toBe(true);
    });
  });

  describe('DELETE /api/customers/[id]/contacts/[contactId]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const contact = await createContact({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: contact.id }),
      });

      expect(response.status).toBe(401);
    });

    it('should delete contact successfully', async () => {
      mockAuth(testCtx);

      const contact = await createContact({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: contact.id }),
      });
      const data = await parseResponse<{ success: boolean; data: { deleted: boolean } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.deleted).toBe(true);

      // Verify contact is deleted
      const deletedContact = await prisma.contact.findUnique({ where: { id: contact.id } });
      expect(deletedContact).toBeNull();
    });

    it('should return 404 for non-existent contact', async () => {
      mockAuth(testCtx);

      const request = createMockRequest(`/api/customers/${testCustomer.id}/contacts/non-existent`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testCustomer.id, contactId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other3@example.com' });
      const otherCustomer = await createCustomer({
        organizationId: otherCtx.organization.id,
        createdById: otherCtx.user.id,
      });
      const otherContact = await createContact({ customerId: otherCustomer.id });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}/contacts/${otherContact.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: otherCustomer.id, contactId: otherContact.id }),
      });

      expect(response.status).toBe(403);
    });
  });
});
