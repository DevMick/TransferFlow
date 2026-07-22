import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://transferflow:transferflow@localhost:5432/transferflow_test',
      BETTER_AUTH_SECRET: 'test-secret-key-that-is-long-enough',
      BETTER_AUTH_URL: 'http://localhost:3000',
    },
  },
});
