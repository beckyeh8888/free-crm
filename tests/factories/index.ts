/**
 * Test Data Factories
 * Export all factories for convenient imports
 */

export * from './user.factory';
export * from './customer.factory';
export * from './contact.factory';
export * from './deal.factory';

// Re-export reset functions for easy cleanup
import { resetUserFactory } from './user.factory';
import { resetCustomerFactory } from './customer.factory';
import { resetContactFactory } from './contact.factory';
import { resetDealFactory } from './deal.factory';

/**
 * Reset all factory counters
 * Call this in beforeEach to ensure consistent test data
 */
export function resetAllFactories() {
  resetUserFactory();
  resetCustomerFactory();
  resetContactFactory();
  resetDealFactory();
}
