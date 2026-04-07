import type { MetadataRoute } from 'next';
import { getPublishedTours, cities } from '@/data/mock-tours';
import { SITE } from '@/lib/config';
import { SEO_LANDING_SLUGS } from '@/lib/seo-landings';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/tours`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const seoLandings: MetadataRoute.Sitemap = SEO_LANDING_SLUGS.map((slug) => ({
    url: `${base}/tours/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const tourPages: MetadataRoute.Sitemap = getPublishedTours().map((tour) => ({
    url: `${base}/tours/${tour.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${base}/from/${city.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...seoLandings, ...tourPages, ...cityPages];
}
