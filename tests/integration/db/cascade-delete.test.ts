/**
 * Cascade Delete Integration Tests
 * Tests database cascade delete behavior per Prisma schema
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase, prisma } from '@tests/helpers/test-db';
import { createUser } from '@tests/factories/user.factory';
import { createCustomer } from '@tests/factories/customer.factory';
import { createContact } from '@tests/factories/contact.factory';
import { createDeal } from '@tests/factories/deal.factory';

describe('Cascade Delete', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Customer cascade', () => {
    it('should cascade delete contacts when customer is deleted', async () => {
      const user = await createUser({ email: 'cascade@example.com' });
      const customer = await createCustomer({ userId: user.id });

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
      const user = await createUser({ email: 'cascade2@example.com' });
      const customer = await createCustomer({ userId: user.id });

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
      const user = await createUser({ email: 'cascade3@example.com' });
      const customer = await createCustomer({ userId: user.id });

      // Create document for the customer
      await prisma.document.create({
        data: {
          name: 'Test Document',
          type: 'contract',
          userId: user.id,
          customerId: customer.id,
        },
      });

      // Verify document exists
      const docsBefore = await prisma.document.count({ where: { customerId: customer.id } });
      expect(docsBefore).toBe(1);

      // Delete customer - documents should be set to null per schema (onDelete: SetNull)
      await prisma.customer.delete({ where: { id: customer.id } });

      // Verify document still exists but customerId is null
      const docsAfter = await prisma.document.findMany({
        where: { userId: user.id },
      });
      expect(docsAfter.length).toBe(1);
      expect(docsAfter[0].customerId).toBeNull();
    });
  });

  describe('User cascade', () => {
    it('should cascade delete customers when user is deleted', async () => {
      const user = await createUser({ email: 'usercascade@example.com' });

      // Create multiple customers for the user
      await createCustomer({ userId: user.id, name: 'Customer 1' });
      await createCustomer({ userId: user.id, name: 'Customer 2' });

      // Verify customers exist
      const customersBefore = await prisma.customer.count({ where: { userId: user.id } });
      expect(customersBefore).toBe(2);

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify customers are deleted
      const customersAfter = await prisma.customer.count({ where: { userId: user.id } });
      expect(customersAfter).toBe(0);
    });

    it('should cascade delete sessions and accounts when user is deleted', async () => {
      const user = await createUser({ email: 'sessioncascade@example.com' });

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: 'test-token-123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Create account
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
        },
      });

      // Verify session and account exist
      const sessionsBefore = await prisma.session.count({ where: { userId: user.id } });
      const accountsBefore = await prisma.account.count({ where: { userId: user.id } });
      expect(sessionsBefore).toBe(1);
      expect(accountsBefore).toBe(1);

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify sessions and accounts are deleted
      const sessionsAfter = await prisma.session.count({ where: { userId: user.id } });
      const accountsAfter = await prisma.account.count({ where: { userId: user.id } });
      expect(sessionsAfter).toBe(0);
      expect(accountsAfter).toBe(0);
    });

    it('should cascade delete entire hierarchy: user -> customers -> contacts/deals', async () => {
      const user = await createUser({ email: 'hierarchy@example.com' });
      const customer = await createCustomer({ userId: user.id });

      // Create contacts and deals
      await createContact({ customerId: customer.id });
      await createContact({ customerId: customer.id });
      await createDeal({ customerId: customer.id });
      await createDeal({ customerId: customer.id });

      // Verify hierarchy exists
      const usersBefore = await prisma.user.count({ where: { id: user.id } });
      const customersBefore = await prisma.customer.count({ where: { userId: user.id } });
      const contactsBefore = await prisma.contact.count({ where: { customerId: customer.id } });
      const dealsBefore = await prisma.deal.count({ where: { customerId: customer.id } });

      expect(usersBefore).toBe(1);
      expect(customersBefore).toBe(1);
      expect(contactsBefore).toBe(2);
      expect(dealsBefore).toBe(2);

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify entire hierarchy is deleted
      const usersAfter = await prisma.user.count({ where: { id: user.id } });
      const customersAfter = await prisma.customer.count({ where: { userId: user.id } });
      const contactsAfter = await prisma.contact.count({ where: { customerId: customer.id } });
      const dealsAfter = await prisma.deal.count({ where: { customerId: customer.id } });

      expect(usersAfter).toBe(0);
      expect(customersAfter).toBe(0);
      expect(contactsAfter).toBe(0);
      expect(dealsAfter).toBe(0);
    });
  });

  describe('Document cascade', () => {
    it('should cascade delete document analyses when document is deleted', async () => {
      const user = await createUser({ email: 'doccascade@example.com' });

      // Create document
      const document = await prisma.document.create({
        data: {
          name: 'Analysis Test Doc',
          type: 'contract',
          userId: user.id,
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
