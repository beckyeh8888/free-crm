import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Main vitest config for unit, integration, and accessibility tests
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@tests': path.resolve(dirname, 'tests'),
    },
  },
  test: {
    globals: true,
    include: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    // SQLite doesn't support concurrent writes - run tests sequentially
    fileParallelism: false,
    // Increase timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './test-results/coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.{ts,tsx}', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
