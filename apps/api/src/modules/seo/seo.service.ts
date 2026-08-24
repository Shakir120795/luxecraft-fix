import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateSitemap(): Promise<string> {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } }),
      this.prisma.category.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } }),
    ]);

    const baseUrl = process.env.APP_URL || 'https://luxecraft.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home
    xml += `  <url><loc>${baseUrl}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;

    // Categories
    categories.forEach((cat) => {
      xml += `  <url><loc>${baseUrl}/category/${cat.slug}</loc><lastmod>${cat.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });

    // Products
    products.forEach((prod) => {
      xml += `  <url><loc>${baseUrl}/product/${prod.slug}</loc><lastmod>${prod.updatedAt.toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>\n`;
    });

    xml += '</urlset>';

    return xml;
  }

  getRobotsText(): string {
    return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Crawl-delay: 1

Sitemap: ${process.env.APP_URL || 'https://luxecraft.com'}/sitemap.xml
`;
  }

  getStructuredData(type: 'product' | 'category' | 'organization', data: any): Record<string, unknown> {
    if (type === 'product') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.imageUrl,
        sku: data.sku,
        price: data.price,
        priceCurrency: data.currency || 'USD',
        url: `${process.env.APP_URL}/product/${data.slug}`,
      };
    }

    if (type === 'category') {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: data.name,
        description: data.description,
        url: `${process.env.APP_URL}/category/${data.slug}`,
      };
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LuxeCraft',
      url: process.env.APP_URL || 'https://luxecraft.com',
      logo: `${process.env.APP_URL}/logo.png`,
    };
  }

  getCanonicalUrl(path: string): string {
    const base = process.env.APP_URL || 'https://luxecraft.com';
    return `${base}${path}`;
  }
}
