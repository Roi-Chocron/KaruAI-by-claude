// The public address of the site, for links in metadata, the sitemap and robots.txt. Set NEXT_PUBLIC_SITE_URL
// when building for production; it must match APP_URL in wrangler.jsonc.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://karuai.example.workers.dev').replace(/\/$/, '');
