import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const isDev = process.env.NODE_ENV === 'development';

// The site is exported as static files (out/) that Cloudflare serves; the API is the Worker in worker/.
// In development `next dev` forwards /api/* to the Worker that `wrangler dev` runs on port 8787 (or API_DEV_PORT).
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  ...(isDev && {
    rewrites: async () => [{ source: '/api/:path*', destination: `http://127.0.0.1:${process.env.API_DEV_PORT || 8787}/api/:path*` }],
  }),
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/uploading/bundler-plugin-options/
  org: 'roi-vq',
  project: 'karuai',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  webpack: {
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
