import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// API tests run inside the Workers runtime against in-memory D1 and R2 (see worker/test)
export default defineConfig(async () => {
  const migrations = await readD1Migrations('migrations');
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          // Fixed values, so the tests never depend on .dev.vars or reach Google with a real key
          bindings: {
            TEST_MIGRATIONS: migrations,
            APP_URL: 'http://localhost:3000',
            DEV_LOGIN: 'true',
            ADMIN_EMAIL: 'admin@example.test',
            GEMINI_API_KEY: 'test-gemini-key',
            GEMINI_MODEL: '',
            POLLINATIONS_API_KEY: 'test-pollinations-key',
            GOOGLE_CLIENT_ID: '',
            GOOGLE_CLIENT_SECRET: '',
            SENTRY_DSN: '',
            POLAR_SERVER: 'sandbox',
            POLAR_ACCESS_TOKEN: 'test-polar-token',
            POLAR_WEBHOOK_SECRET: 'whsec_dGVzdC13ZWJob29rLXNlY3JldC1rZXktMzJieXRlcyE=',
            POLAR_PRODUCT_BASIC: 'prod-basic',
            POLAR_PRODUCT_PRO: 'prod-pro',
            POLAR_PRODUCT_VIP: 'prod-vip',
          },
        },
      }),
    ],
    test: {
      include: ['worker/test/**/*.test.ts'],
      setupFiles: ['worker/test/setup.ts'],
    },
  };
});
