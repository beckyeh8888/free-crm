/**
 * Deal CRUD API Integration Tests
 * GET/POST /api/deals
 * GET/PATCH/DELETE /api/deals/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/deals/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/deals/[id]/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createUser } from '@tests/factories/user.factory';
import { createCustomer } from '@tests/factories/customer.factory';
import { createDeal, createDealsAtAllStages } from '@tests/factories/deal.factory';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Deal API', () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testCustomer: Awaited<ReturnType<typeof createCustomer>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testUser = await createUser({ email: 'test@example.com' });
    testCustomer = await createCustomer({ userId: testUser.id, name: 'Test Customer' });
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

  describe('GET /api/deals', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/deals');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return only deals from users customers', async () => {
      mockAuth(testUser);

      await createDeal({ customerId: testCustomer.id, title: 'My Deal 1' });
      await createDeal({ customerId: testCustomer.id, title: 'My Deal 2' });

      // Create deal for another user's customer
      const otherUser = await createUser({ email: 'other@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });
      await createDeal({ customerId: otherCustomer.id, title: 'Other Deal' });

      const request = createMockRequest('/api/deals');
      const response = await GET(request);
      const data = await parseResponse<{ data: { title: string }[]; pagination: { total: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
      expect(data.data.map(d => d.title)).not.toContain('Other Deal');
    });

    it('should include customer information', async () => {
      mockAuth(testUser);

      await createDeal({ customerId: testCustomer.id, title: 'Deal with Customer' });

      const request = createMockRequest('/api/deals');
      const response = await GET(request);
      const data = await parseResponse<{ data: { customer: { id: string; name: string } }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data[0].customer).toBeDefined();
      expect(data.data[0].customer.id).toBe(testCustomer.id);
      expect(data.data[0].customer.name).toBe('Test Customer');
    });

    it('should filter by stage', async () => {
      mockAuth(testUser);

      await createDealsAtAllStages(testCustomer.id);

      const request = createMockRequest('/api/deals', {
        searchParams: { stage: 'proposal' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { stage: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].stage).toBe('proposal');
    });

    it('should filter by customerId', async () => {
      mockAuth(testUser);

      const secondCustomer = await createCustomer({ userId: testUser.id, name: 'Second Customer' });
      await createDeal({ customerId: testCustomer.id, title: 'First Customer Deal' });
      await createDeal({ customerId: secondCustomer.id, title: 'Second Customer Deal' });

      const request = createMockRequest('/api/deals', {
        searchParams: { customerId: secondCustomer.id },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { title: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Second Customer Deal');
    });

    it('should filter by value range', async () => {
      mockAuth(testUser);

      await createDeal({ customerId: testCustomer.id, title: 'Small Deal', value: 10000 });
      await createDeal({ customerId: testCustomer.id, title: 'Medium Deal', value: 50000 });
      await createDeal({ customerId: testCustomer.id, title: 'Large Deal', value: 100000 });

      const request = createMockRequest('/api/deals', {
        searchParams: { minValue: '20000', maxValue: '60000' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { title: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Medium Deal');
    });

    it('should search by title', async () => {
      mockAuth(testUser);

      await createDeal({ customerId: testCustomer.id, title: 'Enterprise Software License' });
      await createDeal({ customerId: testCustomer.id, title: 'Consulting Services' });

      const request = createMockRequest('/api/deals', {
        searchParams: { search: 'Software' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { title: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toContain('Software');
    });
  });

  describe('POST /api/deals', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: { title: 'New Deal', customerId: testCustomer.id },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create deal successfully', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          title: 'New Deal',
          customerId: testCustomer.id,
          value: 50000,
          stage: 'proposal',
          probability: 50,
        },
      });
      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; data: { id: string; title: string; value: number } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('New Deal');
      expect(data.data.value).toBe(50000);
    });

    it('should reject deal for non-existent customer', async () => {
      mockAuth(testUser);

      // Use a valid-looking CUID format that doesn't exist
      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          title: 'New Deal',
          customerId: 'clz00000000000000000000000', // Valid format but doesn't exist
        },
      });
      const response = await POST(request);

      // API validates customerId belongs to user's customers, returns 404 if not found
      expect(response.status).toBe(404);
    });

    it('should reject deal for other users customer', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other2@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: {
          title: 'Hacked Deal',
          customerId: otherCustomer.id,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should reject invalid data', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/deals', {
        method: 'POST',
        body: { title: '' }, // Empty title
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/deals/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const deal = await createDeal({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/deals/${deal.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: deal.id }) });

      expect(response.status).toBe(401);
    });

    it('should return deal with customer details', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id, title: 'Detail Deal' });
      const request = createMockRequest(`/api/deals/${deal.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: deal.id }) });
      const data = await parseResponse<{ success: boolean; data: { id: string; title: string; customer: { id: string } } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(deal.id);
      expect(data.data.title).toBe('Detail Deal');
      expect(data.data.customer.id).toBe(testCustomer.id);
    });

    it('should return 404 for non-existent deal', async () => {
      mockAuth(testUser);

      const request = createMockRequest('/api/deals/non-existent');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
    });

    it('should return 404 for other users deal', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other3@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });
      const otherDeal = await createDeal({ customerId: otherCustomer.id });

      const request = createMockRequest(`/api/deals/${otherDeal.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: otherDeal.id }) });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/deals/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const deal = await createDeal({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        body: { stage: 'qualified' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: deal.id }) });

      expect(response.status).toBe(401);
    });

    it('should update deal stage successfully', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id, stage: 'lead' });
      const request = createMockRequest(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        body: { stage: 'qualified', probability: 30 },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: deal.id }) });
      const data = await parseResponse<{ success: boolean; data: { stage: string; probability: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.stage).toBe('qualified');
      expect(data.data.probability).toBe(30);
    });

    it('should update deal value', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id, value: 10000 });
      const request = createMockRequest(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        body: { value: 25000 },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: deal.id }) });
      const data = await parseResponse<{ data: { value: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.value).toBe(25000);
    });

    it('should return 404 for other users deal', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other4@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });
      const otherDeal = await createDeal({ customerId: otherCustomer.id });

      const request = createMockRequest(`/api/deals/${otherDeal.id}`, {
        method: 'PATCH',
        body: { stage: 'closed_won' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: otherDeal.id }) });

      expect(response.status).toBe(404);
    });

    it('should create audit log on update', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id, stage: 'lead' });
      const request = createMockRequest(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        body: { stage: 'closed_won' },
      });
      await PATCH(request, { params: Promise.resolve({ id: deal.id }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'deal', action: 'update', entityId: deal.id },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/deals/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const deal = await createDeal({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/deals/${deal.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: deal.id }) });

      expect(response.status).toBe(401);
    });

    it('should delete deal successfully', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id });
      const request = createMockRequest(`/api/deals/${deal.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: deal.id }) });
      const data = await parseResponse<{ success: boolean; data: { deleted: boolean } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.deleted).toBe(true);

      // Verify deal is deleted
      const deletedDeal = await prisma.deal.findUnique({ where: { id: deal.id } });
      expect(deletedDeal).toBeNull();
    });

    it('should return 404 for other users deal', async () => {
      mockAuth(testUser);

      const otherUser = await createUser({ email: 'other5@example.com' });
      const otherCustomer = await createCustomer({ userId: otherUser.id });
      const otherDeal = await createDeal({ customerId: otherCustomer.id });

      const request = createMockRequest(`/api/deals/${otherDeal.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: otherDeal.id }) });

      expect(response.status).toBe(404);
    });

    it('should create audit log on delete', async () => {
      mockAuth(testUser);

      const deal = await createDeal({ customerId: testCustomer.id, title: 'Delete Audit Test' });
      const dealId = deal.id;

      const request = createMockRequest(`/api/deals/${dealId}`, { method: 'DELETE' });
      await DELETE(request, { params: Promise.resolve({ id: dealId }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'deal', action: 'delete', entityId: dealId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});
