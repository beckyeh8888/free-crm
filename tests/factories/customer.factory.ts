/**
 * Customer Test Data Factory
 */

import { prisma } from '@/lib/prisma';

export interface CustomerFactoryData {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  type?: 'B2B' | 'B2C';
  status?: 'active' | 'inactive' | 'lead';
  notes?: string;
}

let customerCounter = 0;

/**
 * Build customer data without creating in database
 */
export function buildCustomer(overrides: CustomerFactoryData) {
  customerCounter++;
  return {
    userId: overrides.userId,
    name: overrides.name ?? `Test Customer ${customerCounter}`,
    email: overrides.email ?? `customer-${customerCounter}-${Date.now()}@example.com`,
    phone: overrides.phone ?? '0912-345-678',
    company: overrides.company ?? `Test Company ${customerCounter}`,
    type: overrides.type ?? 'B2B',
    status: overrides.status ?? 'active',
    notes: overrides.notes,
  };
}

/**
 * Create customer in database
 */
export async function createCustomer(overrides: CustomerFactoryData) {
  const data = buildCustomer(overrides);

  return prisma.customer.create({
    data,
  });
}

/**
 * Create customer with contacts
 */
export async function createCustomerWithContacts(
  overrides: CustomerFactoryData,
  contactCount = 2
) {
  const customer = await createCustomer(overrides);

  const contacts = await Promise.all(
    Array.from({ length: contactCount }, (_, i) =>
      prisma.contact.create({
        data: {
          customerId: customer.id,
          name: `Contact ${i + 1}`,
          email: `contact-${i + 1}-${Date.now()}@example.com`,
          isPrimary: i === 0,
        },
      })
    )
  );

  return { ...customer, contacts };
}

/**
 * Create customer with deals
 */
export async function createCustomerWithDeals(
  overrides: CustomerFactoryData,
  dealCount = 2
) {
  const customer = await createCustomer(overrides);

  const deals = await Promise.all(
    Array.from({ length: dealCount }, (_, i) =>
      prisma.deal.create({
        data: {
          customerId: customer.id,
          title: `Deal ${i + 1}`,
          value: (i + 1) * 10000,
          stage: 'lead',
        },
      })
    )
  );

  return { ...customer, deals };
}

/**
 * Reset factory counter
 */
export function resetCustomerFactory() {
  customerCounter = 0;
}
