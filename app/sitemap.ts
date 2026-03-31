import { getAllDates } from '@/lib/data';
import type { MetadataRoute } from 'next';

const siteUrl = 'https://investing.lz5z.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getAllDates();

  const barometerPages = dates.map((date) => ({
    url: `${siteUrl}/barometer/${date}/`,
    lastModified: new Date(date + 'T00:00:00'),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...barometerPages,
  ];
}
