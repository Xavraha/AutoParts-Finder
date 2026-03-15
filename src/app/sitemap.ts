import type { MetadataRoute } from 'next';
import { POPULAR_SEARCHES } from '@/lib/utils/popular-searches';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autopartsfinder.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
  ];

  const popularRoutes: MetadataRoute.Sitemap = POPULAR_SEARCHES.map((s) => ({
    url: `${BASE_URL}/parts/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...popularRoutes];
}
