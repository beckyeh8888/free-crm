/**
 * Test Data Factories
 * Export all factories for convenient imports
 * Updated for multi-tenant schema (Sprint 2)
 */

export * from './user.factory';
export * from './organization.factory';
export * from './customer.factory';
export * from './contact.factory';
export * from './deal.factory';

// Re-export reset functions for easy cleanup
import { resetUserFactory } from './user.factory';
import { resetOrganizationFactory } from './organization.factory';
import { resetCustomerFactory } from './customer.factory';
import { resetContactFactory } from './contact.factory';
import { resetDealFactory } from './deal.factory';

/**
 * Reset all factory counters
 * Call this in beforeEach to ensure consistent test data
 */
export function resetAllFactories() {
  resetUserFactory();
  resetOrganizationFactory();
  resetCustomerFactory();
  resetContactFactory();
  resetDealFactory();
}
