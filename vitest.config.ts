import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/*.test.ts'],
    exclude: ['test/worker.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
