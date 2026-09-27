import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://wolhomes.com';
const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001/api/v1';

type SitemapData = {
  products?: Array<{
    slug: string;
    updatedAt: string;
    publishedAt?: string | null;
  }>;
  categories?: Array<{
    slug: string;
    updatedAt: string;
  }>;
};

async function getSitemapData(): Promise<SitemapData> {
  try {
    const res = await fetch(`${API_URL}/storefront/sitemap`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return {};
    const data = await res.json();
    return data?.success ? data.data ?? {} : data ?? {};
  } catch {
    return {};
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/custom-design`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (data.categories ?? []).map((category) => ({
    url: `${SITE_URL}/categories/${encodeURIComponent(category.slug)}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (data.products ?? []).map((product) => ({
    url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
    lastModified: new Date(product.updatedAt || product.publishedAt || now),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
