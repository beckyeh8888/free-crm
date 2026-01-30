/**
 * React Testing Setup
 * Setup for @testing-library/react tests with jest-dom matchers
 *
 * For Vitest 4 with globals: true, we need to explicitly extend
 * the global expect with jest-dom matchers.
 */

import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
