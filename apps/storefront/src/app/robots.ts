import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://wolhomes.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account/',
        '/auth/',
        '/cart/',
        '/checkout/',
        '/order-confirmation/',
        '/wishlist/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
