/**
 * Document CRUD API Integration Tests
 * GET/POST /api/documents
 * GET/PATCH/DELETE /api/documents/[id]
 *
 * Multi-tenant document management with MinIO storage
 */

import { vi } from 'vitest';
import { GET, POST } from '@/app/api/documents/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/documents/[id]/route';
import { createMockRequest, parseResponse } from '@tests/helpers/request-helpers';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createDocument, createDocumentWithAnalysis } from '@tests/factories/document.factory';
import { PERMISSIONS } from '@/lib/permissions';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock storage module (MinIO) - not available in test environment
vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getFileUrl: vi.fn().mockResolvedValue('https://minio.local/test-presigned-url'),
  generateFileKey: vi.fn().mockReturnValue('documents/org-1/uuid/test-file.pdf'),
}));

import { getServerSession } from 'next-auth';

describe('Document API', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
    testCtx = await createTestContext({
      userEmail: 'doc-test@example.com',
      permissions: [
        PERMISSIONS.DOCUMENTS_READ,
        PERMISSIONS.DOCUMENTS_CREATE,
        PERMISSIONS.DOCUMENTS_UPDATE,
        PERMISSIONS.DOCUMENTS_DELETE,
        PERMISSIONS.DOCUMENTS_ANALYZE,
        PERMISSIONS.CUSTOMERS_READ,
        PERMISSIONS.CUSTOMERS_CREATE,
      ],
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

  describe('GET /api/documents', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/documents');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return documents for authenticated user', async () => {
      mockAuth(testCtx);

      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Contract A',
        type: 'contract',
      });
      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Email B',
        type: 'email',
      });

      const request = createMockRequest('/api/documents');
      const response = await GET(request);
      const data = await parseResponse<{ data: { name: string }[]; pagination: { total: number } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should only return documents from own organization', async () => {
      mockAuth(testCtx);

      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'My Document',
      });

      // Create document in another organization
      const otherCtx = await createTestContext({ userEmail: 'other-doc@example.com' });
      await createDocument({
        organizationId: otherCtx.organization.id,
        name: 'Other Document',
      });

      const request = createMockRequest('/api/documents');
      const response = await GET(request);
      const data = await parseResponse<{ data: { name: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('My Document');
    });

    it('should filter by type', async () => {
      mockAuth(testCtx);

      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Contract',
        type: 'contract',
      });
      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Email',
        type: 'email',
      });

      const request = createMockRequest('/api/documents', {
        searchParams: { type: 'contract' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { type: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].type).toBe('contract');
    });

    it('should search by name', async () => {
      mockAuth(testCtx);

      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Important Contract',
      });
      await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Meeting Notes Jan',
      });

      const request = createMockRequest('/api/documents', {
        searchParams: { search: 'Important' },
      });
      const response = await GET(request);
      const data = await parseResponse<{ data: { name: string }[] }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Important Contract');
    });

    it('should paginate results', async () => {
      mockAuth(testCtx);

      for (let i = 0; i < 25; i++) {
        await createDocument({
          organizationId: testCtx.organization.id,
          name: `Document ${i}`,
        });
      }

      const request = createMockRequest('/api/documents', {
        searchParams: { page: '1', limit: '10' },
      });
      const response = await GET(request);
      const data = await parseResponse<{
        data: unknown[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.length).toBe(10);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
    });
  });

  describe('POST /api/documents', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const request = createMockRequest('/api/documents', {
        method: 'POST',
        body: { name: 'Test Document' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create document with valid JSON data', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/documents', {
        method: 'POST',
        body: {
          name: 'New Contract',
          type: 'contract',
          content: 'Contract terms and conditions...',
        },
      });
      const response = await POST(request);
      const data = await parseResponse<{
        success: boolean;
        data: { id: string; name: string; type: string; content: string };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Contract');
      expect(data.data.type).toBe('contract');
      expect(data.data.content).toBe('Contract terms and conditions...');
    });

    it('should reject empty name', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/documents', {
        method: 'POST',
        body: { name: '', type: 'contract' },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should create audit log on create', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/documents', {
        method: 'POST',
        body: { name: 'Audit Test Document', type: 'email' },
      });
      await POST(request);

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'document', action: 'create' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/documents/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
      });
      const request = createMockRequest(`/api/documents/${doc.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: doc.id }) });

      expect(response.status).toBe(401);
    });

    it('should return document details with analyses', async () => {
      mockAuth(testCtx);

      const docWithAnalysis = await createDocumentWithAnalysis({
        organizationId: testCtx.organization.id,
        name: 'Analyzed Document',
        content: 'Content for analysis',
      });

      const request = createMockRequest(`/api/documents/${docWithAnalysis.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: docWithAnalysis.id }) });
      const data = await parseResponse<{
        success: boolean;
        data: {
          id: string;
          name: string;
          analyses: Array<{ summary: string }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Analyzed Document');
      expect(data.data.analyses.length).toBe(1);
      expect(data.data.analyses[0].summary).toBe('Test summary of the document');
    });

    it('should return 404 for non-existent document', async () => {
      mockAuth(testCtx);

      const request = createMockRequest('/api/documents/non-existent-id');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'non-existent-id' }) });

      // Returns 404 or similar error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 403/404 for document from another organization', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-doc2@example.com' });
      const otherDoc = await createDocument({
        organizationId: otherCtx.organization.id,
        name: 'Secret Document',
      });

      const request = createMockRequest(`/api/documents/${otherDoc.id}`);
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: otherDoc.id }) });

      // Should be denied access (404 to not leak existence)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/documents/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
      });
      const request = createMockRequest(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: doc.id }) });

      expect(response.status).toBe(401);
    });

    it('should update document successfully', async () => {
      mockAuth(testCtx);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Original Name',
        type: 'contract',
      });
      const request = createMockRequest(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Name', type: 'email' },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: doc.id }) });
      const data = await parseResponse<{ success: boolean; data: { name: string; type: string } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Name');
      expect(data.data.type).toBe('email');
    });

    it('should create audit log on update', async () => {
      mockAuth(testCtx);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Audit Update Test',
      });
      const request = createMockRequest(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        body: { name: 'Updated Audit Test' },
      });
      await PATCH(request, { params: Promise.resolve({ id: doc.id }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'document', action: 'update', entityId: doc.id },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockAuth(null);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
      });
      const request = createMockRequest(`/api/documents/${doc.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: doc.id }) });

      expect(response.status).toBe(401);
    });

    it('should delete document successfully', async () => {
      mockAuth(testCtx);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
      });
      const request = createMockRequest(`/api/documents/${doc.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: doc.id }) });
      const data = await parseResponse<{ success: boolean; data: { deleted: boolean } }>(response);

      expect(response.status).toBe(200);
      expect(data.data.deleted).toBe(true);

      // Verify document is deleted
      const deletedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
      expect(deletedDoc).toBeNull();
    });

    it('should cascade delete analyses', async () => {
      mockAuth(testCtx);

      const docWithAnalysis = await createDocumentWithAnalysis({
        organizationId: testCtx.organization.id,
      });

      const request = createMockRequest(`/api/documents/${docWithAnalysis.id}`, { method: 'DELETE' });
      await DELETE(request, { params: Promise.resolve({ id: docWithAnalysis.id }) });

      // Verify analyses are also deleted
      const analyses = await prisma.documentAnalysis.findMany({
        where: { documentId: docWithAnalysis.id },
      });
      expect(analyses.length).toBe(0);
    });

    it('should create audit log on delete', async () => {
      mockAuth(testCtx);

      const doc = await createDocument({
        organizationId: testCtx.organization.id,
        name: 'Audit Delete Test',
      });
      const docId = doc.id;

      const request = createMockRequest(`/api/documents/${docId}`, { method: 'DELETE' });
      await DELETE(request, { params: Promise.resolve({ id: docId }) });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'document', action: 'delete', entityId: docId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should return 403/404 for document from another organization', async () => {
      mockAuth(testCtx);

      const otherCtx = await createTestContext({ userEmail: 'other-doc3@example.com' });
      const otherDoc = await createDocument({
        organizationId: otherCtx.organization.id,
      });

      const request = createMockRequest(`/api/documents/${otherDoc.id}`, { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: otherDoc.id }) });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
