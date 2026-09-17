import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SITE_PAGE_SLUGS = [
  'privacy',
  'terms',
  'about',
  'returns',
  'contact',
] as const;

export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

export interface SitePageSettings {
  slug: SitePageSlug;
  title: string;
  lastUpdated: string;
  content: string;
}

const DEFAULT_SITE_PAGES: Record<SitePageSlug, SitePageSettings> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'January 1, 2024',
    content: '',
  },
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    lastUpdated: 'January 1, 2024',
    content: '',
  },
  about: {
    slug: 'about',
    title: 'About Wolhomes',
    lastUpdated: '',
    content: '',
  },
  returns: {
    slug: 'returns',
    title: 'Returns & Refunds',
    lastUpdated: '',
    content: '',
  },
  contact: {
    slug: 'contact',
    title: 'Contact Us',
    lastUpdated: '',
    content: '',
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCurrency(): Promise<string> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });

    return setting?.defaultCurrency ?? 'USD';
  }

  async updateDefaultCurrency(currency: string): Promise<string> {
    const normalized = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('Currency must be a valid 3-letter ISO code.');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: { defaultCurrency: normalized },
      create: { id: 'default', defaultCurrency: normalized },
    });

    return setting.defaultCurrency;
  }

  async getSitePages(): Promise<SitePageSettings[]> {
    const stored = await this.readStoredSitePages();

    return SITE_PAGE_SLUGS.map((slug) => this.mergePage(slug, stored[slug]));
  }

  async getSitePage(slug: string): Promise<SitePageSettings> {
    const normalized = this.normalizeSlug(slug);
    const stored = await this.readStoredSitePages();
    return this.mergePage(normalized, stored[normalized]);
  }

  async updateSitePage(
    slug: string,
    data: Partial<Pick<SitePageSettings, 'title' | 'lastUpdated' | 'content'>>,
  ): Promise<SitePageSettings> {
    const normalized = this.normalizeSlug(slug);
    const stored = await this.readStoredSitePages();
    const current = this.mergePage(normalized, stored[normalized]);

    const updated: SitePageSettings = {
      ...current,
      title: data.title !== undefined ? data.title.trim() : current.title,
      lastUpdated:
        data.lastUpdated !== undefined
          ? data.lastUpdated.trim()
          : current.lastUpdated,
      content: data.content !== undefined ? data.content : current.content,
    };

    const nextPages = {
      ...stored,
      [normalized]: updated,
    };

    await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', defaultCurrency: 'USD' },
    });

    const serialized = JSON.stringify(nextPages);
    await this.prisma.$executeRaw`
      UPDATE "app_settings"
      SET "sitePages" = ${serialized}::jsonb,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = 'default'
    `;

    return updated;
  }

  private normalizeSlug(slug: string): SitePageSlug {
    const normalized = slug.trim().toLowerCase();
    if (!SITE_PAGE_SLUGS.includes(normalized as SitePageSlug)) {
      throw new NotFoundException(`Unknown site page: ${slug}`);
    }
    return normalized as SitePageSlug;
  }

  private mergePage(
    slug: SitePageSlug,
    storedPage: Partial<SitePageSettings> | undefined,
  ): SitePageSettings {
    return {
      ...DEFAULT_SITE_PAGES[slug],
      ...(storedPage ?? {}),
      slug,
    };
  }

  private async readStoredSitePages(): Promise<
    Partial<Record<SitePageSlug, Partial<SitePageSettings>>>
  > {
    const rows = await this.prisma.$queryRaw<Array<{ sitePages: unknown }>>`
      SELECT "sitePages"
      FROM "app_settings"
      WHERE "id" = 'default'
      LIMIT 1
    `;

    const value = rows[0]?.sitePages;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Partial<Record<SitePageSlug, Partial<SitePageSettings>>>;
  }
}
