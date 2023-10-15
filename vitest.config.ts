import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.ts'],
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      provider: 'istanbul',
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
  resolve: {
    alias: [{ find: '@app', replacement: resolve(__dirname, './src') }],
  },
});
