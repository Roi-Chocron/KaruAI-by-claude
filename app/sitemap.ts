import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

// The public pages only; everything behind sign-in is left out
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/he', '/login', '/terms', '/privacy', '/refund', '/cookies'].map(path => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' || path === '/he' ? 'weekly' : 'yearly',
    priority: path === '' || path === '/he' ? 1 : 0.3,
  }));
}
