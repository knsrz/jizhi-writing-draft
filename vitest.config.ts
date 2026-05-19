import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'apps/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx,js,mjs}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      'Reference_Project/**',
      'craft-agents-oss-main/**',
      'claw-code-main/**',
    ],
  },
});
