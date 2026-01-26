/**
 * Customer CRUD API Integration Tests
 * GET/POST /api/customers
 * GET/PATCH/DELETE /api/customers/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/customers/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/customers/[id]/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createUser } from '@tests/factories/user.factory';
import { createCustomer } from '@tests/factories/customer.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Customer API', () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testUser = await createUser({ email: 'test@example.com' });
  });

  const mockAuth = (user: typeof testUser | null) => {
    vi.mocked(getServerSession).mockResolvedValue(
      user
        ? {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : null
    );
  };

  describe('GET /api/customers', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/customers');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return only user own customers', async () => {
      mockAuth(testUser);

      // Create customers for test user
      await createCustomer({ userId: testUser.id, name: 'Customer 1' });
      await createCustomer({ userId: testUser.id, name: 'Customer 2' });

      // Create customer for another user
      const otherUser = await createUser({ email: 'other@example.com' });
      await createCustomer({ userId: otherUser.id, name: 'Other Customer' });

      const request = createMockRequest('/api/customers');
      const response = await GET(request);
      const data = await parseResponse<{ data: { name: string }[]; pagination: { total: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
      expect(data.data.map(c => c.name)).not.toContain('Other Customer');
    });

    it('should paginate results', async () => {
      mockAuth(testUser);

      // Create 25 customers
      for (let i = 0; i < 25; i++) {
        await createCustomer({ userId: testUser.id, name: `Customer ${i}` });
      }

      const request = createMockRequest('/api/customers', {
        searchParams: { page: '1', limit: '10' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(10);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should filter by type', async () => {
      mockAuth(testUser);

      await createCustomer({ userId: testUser.id, type: 'B2B', name: 'B2B Customer' });
      await createCustomer({ userId: testUser.id, type: 'B2C', name: 'B2C Customer' });

      const request = createMockRequest('/api/customers', {
        searchParams: { type: 'B2B' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { type: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].type).toBe('B2B');
    });

    it('should filter by status', async () => {
      mockAuth(testUser);

      await createCustomer({ userId: testUser.id, status: 'active', name: 'Active' });
      await createCustomer({ userId: testUser.id, status: 'inactive', name: 'Inactive' });
      await createCustomer({ userId: testUser.id, status: 'lead', name: 'Lead' });

      const request = createMockRequest('/api/customers', {
        searchParams: { status: 'active' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { status: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].status).toBe('active');
    });

    it('should search by name', async () => {
      mockAuth(testUser);

      await createCustomer({ userId: testUser.id, name: 'Acme Corp' });
      await createCustomer({ userId: testUser.id, name: 'Beta Inc' });

      const request = createMockRequest('/api/customers', {
        searchParams: { search: 'Acme' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { name: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Acme Corp');
    });
  });

  describe('POST /api/customers', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Test Customer' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create customer with valid data', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: {
          name: 'New Customer',
          email: 'customer@example.com',
          type: 'B2B',
          status: 'active',
        },
      });
      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; data: { id: string; name: string; email: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Customer');
      expect(data.data.email).toBe('customer@example.com');
    });

    it('should reject invalid data', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: '' }, // Empty name
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email for same user', async () => {
      mockAuth(testUser);

      await createCustomer({ userId: testUser.id, email: 'duplicate@example.com' });

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: {
          name: 'New Customer',
          email: 'duplicate@example.com',
        },
      });
      const response = await POST(request);
      const data = await parseResponse<{ error: { code: string } }>(response);

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should create audit log on create', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/customers', {
        method: 'POST',
        body: { name: 'Audit Test Customer' },
      });
      await POST(request);

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'customer', action: 'create' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/customers/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const customer = await createCustomer({ userId: testUser.id });
      const request = createMockRequest(`/api/customers/${customer.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: customer.id }) });

      expect(response.status).toBe(401);
    });

    it('should return customer details with contacts and deals', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id, name: 'Detail Customer' });
      const request = createMockRequest(`/api/customers/${customer.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: customer.id }) });
      const data = await parseResponse<{ success: boolean; data: { id: string; name: string; contacts: unknown[]; deals: unknown[] } }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(customer.id);
      expect(data.data.name).toBe('Detail Customer');
      expect(data.data.contacts).toBeDefined();
      expect(data.data.deals).toBeDefined();
    });

    it('should return 404 for non-existent customer', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/customers/non-existent-id');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

      expect(response.status).toBe(404);
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other2@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: otherCustomer.id }) });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/customers/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const customer = await createCustomer({ userId: testUser.id });
      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      expect(response.status).toBe(401);
    });

    it('should update customer successfully', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id, name: 'Original Name' });
      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name', status: 'inactive' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: customer.id }) });
      const data = await parseResponse<{ success: boolean; data: { name: string; status: string } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Name');
      expect(data.data.status).toBe('inactive');
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other3@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}`, {
        method: 'PATCH',
        body: { name: 'Hacked Name' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: otherCustomer.id }) });

      expect(response.status).toBe(403);
    });

    it('should reject duplicate email on update', async () => {
      mockAuth(testUser);

      await createCustomer({ userId: testUser.id, email: 'existing@example.com' });
      const customer = await createCustomer({ userId: testUser.id, email: 'original@example.com' });

      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { email: 'existing@example.com' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      expect(response.status).toBe(409);
    });

    it('should create audit log on update', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id, name: 'Audit Update Test' });
      const request = createMockRequest(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Audit Test' },
      });
      await PATCH(request, { params: Promise.resolve({ id: customer.id }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'customer', action: 'update', entityId: customer.id },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/customers/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const customer = await createCustomer({ userId: testUser.id });
      const request = createMockRequest(`/api/customers/${customer.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: customer.id }) });

      expect(response.status).toBe(401);
    });

    it('should delete customer successfully', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id });
      const request = createMockRequest(`/api/customers/${customer.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: customer.id }) });
      const data = await parseResponse<{ success: boolean; data: { deleted: boolean } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.deleted).toBe(true);

      // Verify customer is deleted
      const deletedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
      expect(deletedCustomer).toBeNull();
    });

    it('should return 403 for other users customer', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other4@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });

      const request = createMockRequest(`/api/customers/${otherCustomer.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: otherCustomer.id }) });

      expect(response.status).toBe(403);
    });

    it('should cascade delete contacts and deals', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id });

      // Create contacts and deals for the customer
      await prisma.contact.create({
        data: { name: 'Test Contact', customerId: customer.id },
      });
      await prisma.deal.create({
        data: { title: 'Test Deal', customerId: customer.id },
      });

      const request = createMockRequest(`/api/customers/${customer.id}`, { method: 'DELETE' });
      await DELETE(request, { params: Promise.resolve({ id: customer.id }) });

      // Verify cascade delete
      const contacts = await prisma.contact.findMany({ where: { customerId: customer.id } });
      const deals = await prisma.deal.findMany({ where: { customerId: customer.id } });

      expect(contacts.length).toBe(0);
      expect(deals.length).toBe(0);
    });

    it('should create audit log on delete', async () => {
      mockAuth(testUser);

      const customer = await createCustomer({ userId: testUser.id, name: 'Audit Delete Test' });
      const customerId = customer.id;

      const request = createMockRequest(`/api/customers/${customerId}`, { method: 'DELETE' });
      await DELETE(request, { params: Promise.resolve({ id: customerId }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'customer', action: 'delete', entityId: customerId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});
