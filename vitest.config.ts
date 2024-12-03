import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.ts'],
    environment: 'happy-dom',
    coverage: {
      all: false,
      reporter: ['text', 'json-summary', 'json'],
      provider: 'istanbul',
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: [
      { find: '@app', replacement: resolve(__dirname, './src') },
      { find: '@lib', replacement: resolve(__dirname, './src/lib') },
    ],
  },
});
