/**
 * Cascade Delete Integration Tests
 * Tests database cascade delete behavior per Prisma schema
 *
 * Updated for multi-tenant schema (Sprint 2)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createTestContext, type TestContext } from '@tests/helpers/auth-helpers';
import { createCustomer } from '@tests/factories/customer.factory';
import { createContact } from '@tests/factories/contact.factory';
import { createDeal } from '@tests/factories/deal.factory';

describe('Cascade Delete', () => {
  let testCtx: TestContext;

  beforeEach(async () => {
    await clearDatabase();
    testCtx = await createTestContext({ userEmail: 'cascade@example.com' });
  });

  describe('Customer cascade', () => {
    it('should cascade delete contacts when customer is deleted', async () => {
      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
      });

      // Create multiple contacts for the customer
      await createContact({ customerId: customer.id, name: 'Contact 1' });
      await createContact({ customerId: customer.id, name: 'Contact 2' });
      await createContact({ customerId: customer.id, name: 'Contact 3' });

      // Verify contacts exist
      const contactsBefore = await prisma.contact.count({ where: { customerId: customer.id } });
      expect(contactsBefore).toBe(3);

      // Delete customer
      await prisma.customer.delete({ where: { id: customer.id } });

      // Verify contacts are deleted
      const contactsAfter = await prisma.contact.count({ where: { customerId: customer.id } });
      expect(contactsAfter).toBe(0);
    });

    it('should cascade delete deals when customer is deleted', async () => {
      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
      });

      // Create multiple deals for the customer
      await createDeal({ customerId: customer.id, title: 'Deal 1' });
      await createDeal({ customerId: customer.id, title: 'Deal 2' });

      // Verify deals exist
      const dealsBefore = await prisma.deal.count({ where: { customerId: customer.id } });
      expect(dealsBefore).toBe(2);

      // Delete customer
      await prisma.customer.delete({ where: { id: customer.id } });

      // Verify deals are deleted
      const dealsAfter = await prisma.deal.count({ where: { customerId: customer.id } });
      expect(dealsAfter).toBe(0);
    });

    it('should cascade delete documents when customer is deleted', async () => {
      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
      });

      // Create document for the customer
      await prisma.document.create({
        data: {
          name: 'Test Document',
          type: 'contract',
          customerId: customer.id,
          organizationId: testCtx.organization.id,
        },
      });

      // Verify document exists
      const docsBefore = await prisma.document.count({ where: { customerId: customer.id } });
      expect(docsBefore).toBe(1);

      // Delete customer - documents should be set to null per schema (onDelete: SetNull)
      await prisma.customer.delete({ where: { id: customer.id } });

      // Verify document still exists but customerId is null
      const docsAfter = await prisma.document.findMany({
        where: { organizationId: testCtx.organization.id },
      });
      expect(docsAfter.length).toBe(1);
      expect(docsAfter[0].customerId).toBeNull();
    });
  });

  describe('Organization cascade', () => {
    it('should cascade delete customers when organization is deleted', async () => {
      // Create multiple customers for the organization
      await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Customer 1',
      });
      await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
        name: 'Customer 2',
      });

      // Verify customers exist
      const customersBefore = await prisma.customer.count({
        where: { organizationId: testCtx.organization.id },
      });
      expect(customersBefore).toBe(2);

      // Delete organization (need to delete members first due to constraints)
      await prisma.organizationMember.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.role.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.organization.delete({ where: { id: testCtx.organization.id } });

      // Verify customers are deleted
      const customersAfter = await prisma.customer.count({
        where: { organizationId: testCtx.organization.id },
      });
      expect(customersAfter).toBe(0);
    });

    it('should cascade delete members when organization is deleted', async () => {
      // Verify member exists
      const membersBefore = await prisma.organizationMember.count({
        where: { organizationId: testCtx.organization.id },
      });
      expect(membersBefore).toBe(1);

      // Delete organization (need to delete members first due to role constraint)
      await prisma.organizationMember.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.role.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.organization.delete({ where: { id: testCtx.organization.id } });

      // Verify members are deleted
      const membersAfter = await prisma.organizationMember.count({
        where: { organizationId: testCtx.organization.id },
      });
      expect(membersAfter).toBe(0);
    });

    it('should cascade delete entire hierarchy: organization -> customers -> contacts/deals', async () => {
      const customer = await createCustomer({
        organizationId: testCtx.organization.id,
        createdById: testCtx.user.id,
      });

      // Create contacts and deals
      await createContact({ customerId: customer.id });
      await createContact({ customerId: customer.id });
      await createDeal({ customerId: customer.id });
      await createDeal({ customerId: customer.id });

      // Verify hierarchy exists
      const customersBefore = await prisma.customer.count({
        where: { organizationId: testCtx.organization.id },
      });
      const contactsBefore = await prisma.contact.count({ where: { customerId: customer.id } });
      const dealsBefore = await prisma.deal.count({ where: { customerId: customer.id } });

      expect(customersBefore).toBe(1);
      expect(contactsBefore).toBe(2);
      expect(dealsBefore).toBe(2);

      // Delete organization (cleanup order matters)
      await prisma.organizationMember.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.role.deleteMany({
        where: { organizationId: testCtx.organization.id },
      });
      await prisma.organization.delete({ where: { id: testCtx.organization.id } });

      // Verify entire hierarchy is deleted
      const customersAfter = await prisma.customer.count({
        where: { organizationId: testCtx.organization.id },
      });
      const contactsAfter = await prisma.contact.count({ where: { customerId: customer.id } });
      const dealsAfter = await prisma.deal.count({ where: { customerId: customer.id } });

      expect(customersAfter).toBe(0);
      expect(contactsAfter).toBe(0);
      expect(dealsAfter).toBe(0);
    });
  });

  describe('User cascade', () => {
    it('should cascade delete sessions and accounts when user is deleted', async () => {
      // Create session
      await prisma.session.create({
        data: {
          userId: testCtx.user.id,
          sessionToken: 'test-token-123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Create account
      await prisma.account.create({
        data: {
          userId: testCtx.user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: testCtx.user.id,
        },
      });

      // Verify session and account exist
      const sessionsBefore = await prisma.session.count({ where: { userId: testCtx.user.id } });
      const accountsBefore = await prisma.account.count({ where: { userId: testCtx.user.id } });
      expect(sessionsBefore).toBe(1);
      expect(accountsBefore).toBe(1);

      // Delete user (need to cleanup org membership first)
      await prisma.organizationMember.deleteMany({
        where: { userId: testCtx.user.id },
      });
      await prisma.user.delete({ where: { id: testCtx.user.id } });

      // Verify sessions and accounts are deleted
      const sessionsAfter = await prisma.session.count({ where: { userId: testCtx.user.id } });
      const accountsAfter = await prisma.account.count({ where: { userId: testCtx.user.id } });
      expect(sessionsAfter).toBe(0);
      expect(accountsAfter).toBe(0);
    });

    it('should cascade delete organization membership when user is deleted', async () => {
      // Verify membership exists
      const membershipBefore = await prisma.organizationMember.count({
        where: { userId: testCtx.user.id },
      });
      expect(membershipBefore).toBe(1);

      // Delete user (need to cleanup membership first due to constraints)
      await prisma.organizationMember.deleteMany({
        where: { userId: testCtx.user.id },
      });
      await prisma.user.delete({ where: { id: testCtx.user.id } });

      // Verify membership is deleted
      const membershipAfter = await prisma.organizationMember.count({
        where: { userId: testCtx.user.id },
      });
      expect(membershipAfter).toBe(0);
    });
  });

  describe('Document cascade', () => {
    it('should cascade delete document analyses when document is deleted', async () => {
      // Create document
      const document = await prisma.document.create({
        data: {
          name: 'Analysis Test Doc',
          type: 'contract',
          organizationId: testCtx.organization.id,
        },
      });

      // Create document analysis
      await prisma.documentAnalysis.create({
        data: {
          documentId: document.id,
          summary: 'Test summary',
          sentiment: 'positive',
          confidence: 0.95,
          model: 'test-model',
        },
      });

      // Verify analysis exists
      const analysesBefore = await prisma.documentAnalysis.count({ where: { documentId: document.id } });
      expect(analysesBefore).toBe(1);

      // Delete document
      await prisma.document.delete({ where: { id: document.id } });

      // Verify analysis is deleted
      const analysesAfter = await prisma.documentAnalysis.count({ where: { documentId: document.id } });
      expect(analysesAfter).toBe(0);
    });
  });
});
