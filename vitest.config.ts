import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname === 'undefined' ? path.dirname(fileURLToPath(import.meta.url)) : __dirname;

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
    setupFiles: ['tests/setup.ts', 'tests/setup-react.ts'],
    // SQLite doesn't support concurrent writes - run tests sequentially
    fileParallelism: false,
    // Increase timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Coverage settings
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      allowExternal: true,
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/app/**',
        'src/middleware.ts',
        'src/lib/auth.ts',
        'src/lib/db.ts',
        'src/lib/prisma.ts',
        'src/lib/inngest/**',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 85,
        statements: 95,
      },
    },
  },
});
