import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

// ESM-compatible way to get project root (replaces __dirname)
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// Resolve an absolute path to the mock file
const mockEnvPath = path.resolve(projectRoot, './test/mocks/app-environment.js');

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
    // Automatically load shared test setup (mocks, globals)
    setupFiles: ['./test/mocks/zxing-mock.ts']
  },
  // Use an alias so imports of `$app/environment` resolve to our test mock
  resolve: {
    alias: {
      '$app/environment': mockEnvPath,
      '$lib': path.resolve(projectRoot, './src/lib'),
      '$utils': path.resolve(projectRoot, './src/lib/utils'),
      '$components': path.resolve(projectRoot, './src/lib/components')
    }
  },
  // Prevent loading Vite plugins (not needed for these unit tests)
  plugins: []
});
