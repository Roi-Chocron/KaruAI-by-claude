import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

// The public pages only; everything behind sign-in is left out
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/login', '/terms', '/privacy', '/refund', '/cookies'].map(path => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'yearly',
    priority: path === '' ? 1 : 0.3,
  }));
}
