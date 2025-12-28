import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve an absolute path to the mock file
const mockEnvPath = fileURLToPath(new URL('./test/mocks/app-environment.js', import.meta.url));

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
      '$lib': path.resolve(__dirname, './src/lib')
    }
  },
  // Prevent loading Vite plugins (not needed for these unit tests)
  plugins: []
});
