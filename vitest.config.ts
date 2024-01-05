import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.ts'],
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      provider: 'istanbul',
      thresholds: {
        lines: 60,
        branches: 60,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: [{ find: '@app', replacement: resolve(__dirname, './src') }],
  },
});
