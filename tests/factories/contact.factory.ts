/**
 * Contact Test Data Factory
 */

import { prisma } from '@/lib/prisma';

export interface ContactFactoryData {
  customerId: string;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
}

let contactCounter = 0;

/**
 * Build contact data without creating in database
 */
export function buildContact(overrides: ContactFactoryData) {
  contactCounter++;
  return {
    customerId: overrides.customerId,
    name: overrides.name ?? `Test Contact ${contactCounter}`,
    email: overrides.email ?? `contact-${contactCounter}-${Date.now()}@example.com`,
    phone: overrides.phone ?? '0922-333-444',
    title: overrides.title ?? 'Manager',
    isPrimary: overrides.isPrimary ?? false,
  };
}

/**
 * Create contact in database
 */
export async function createContact(overrides: ContactFactoryData) {
  const data = buildContact(overrides);

  return prisma.contact.create({
    data,
  });
}

/**
 * Create primary contact for a customer
 */
export async function createPrimaryContact(customerId: string, overrides: Partial<ContactFactoryData> = {}) {
  return createContact({
    customerId,
    isPrimary: true,
    ...overrides,
  });
}

/**
 * Reset factory counter
 */
export function resetContactFactory() {
  contactCounter = 0;
}
