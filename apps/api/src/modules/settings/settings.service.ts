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

export interface ProductFilterValueSetting {
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductFilterSetting {
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  values: ProductFilterValueSetting[];
}

export type HomepageVideoPlatform = 'youtube' | 'instagram';

export interface HomepageVideoSetting {
  id: string;
  title: string;
  url: string;
  platform: HomepageVideoPlatform;
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_PRODUCT_FILTERS: ProductFilterSetting[] = [
  {
    slug: 'style',
    name: 'Style',
    sortOrder: 0,
    isActive: true,
    values: [
      ['floral-rugs', 'Floral Rugs'],
      ['chinese-rugs', 'Chinese Rugs'],
      ['vintage-rugs', 'Vintage Rugs'],
      ['persian-rugs', 'Persian Rugs'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
  {
    slug: 'size',
    name: 'Size',
    sortOrder: 1,
    isActive: true,
    values: [
      ['3x6', '3x6'],
      ['4x6', '4x6'],
      ['5x8', '5x8'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
  {
    slug: 'shape',
    name: 'Shape',
    sortOrder: 2,
    isActive: true,
    values: [
      ['irregular-rugs', 'Irregular Rugs'],
      ['area-rugs', 'Area Rugs'],
      ['round-rugs', 'Round Rugs'],
      ['runner-rugs', 'Runner Rugs'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
  {
    slug: 'color',
    name: 'Colour',
    sortOrder: 3,
    isActive: true,
    values: [
      ['red', 'Red'],
      ['black', 'Black'],
      ['white', 'White'],
      ['blue', 'Blue'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
  {
    slug: 'material',
    name: 'Material',
    sortOrder: 4,
    isActive: true,
    values: [
      ['wool', 'Wool'],
      ['silk', 'Silk'],
      ['viscose', 'Viscose'],
      ['jute', 'Jute'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
  {
    slug: 'weave-type',
    name: 'Weave Type',
    sortOrder: 5,
    isActive: true,
    values: [
      ['hand-tufted', 'Hand Tufted'],
      ['hand-knotted', 'Hand Knotted'],
      ['flat-weave-rugs', 'Flat Weave Rugs'],
    ].map(([slug, label], sortOrder) => ({
      slug,
      label,
      sortOrder,
      isActive: true,
    })),
  },
];

const DEFAULT_SITE_PAGES: Record<SitePageSlug, SitePageSettings> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'September 19, 2026',
    content:
      "Privacy Policy\n\nEffective Date: September 19, 2026\n\nAt WOLHOMES, accessible from our online store, protecting the privacy and security of our customers and website visitors is one of our main priorities. This Privacy Policy document outlines the types of information that is collected and recorded by WOLHOMES and how we use it.\n\nIf you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at info@wolhomes.com.\n\n1. Information We Collect\n\nWhen you visit our site or make a purchase, we collect certain personal information to process your order and provide a seamless shopping experience:\n\nPersonal Details: Name, email address, phone number, shipping address, and billing address.\n\nOrder & Customization Details: Specific dimensions, designs, or custom requirements for your handcrafted Hand-Tufted, Hand-Knotted or Flat Weave Rugs.\n\nPayment Information: Payment card details, PayPal information, or other financial details. (Note: All payments are processed securely through third-party encrypted payment gateways. We do not store your full payment card details on our servers.)\n\nTechnical & Usage Data: IP address, browser type, device information, pages viewed, and cookies to improve website functionality.\n\n2. How We Use Your Information\n\nWe use the information we collect for the following purposes:\n\nTo process, manufacture, and ship your orders directly from our factory in Mirzapur, Uttar Pradesh, India to your doorstep.\n\nTo communicate with you regarding order confirmations, tracking details, custom order approvals, or customer service requests.\n\nTo manage your WOLHOMES account.\n\nTo improve our website experience, products, and custom services.\n\nTo send promotional emails and newsletters (only if you have opted in; you can unsubscribe at any time).\n\n3. Sharing Your Information\n\nWe respect your privacy and do not sell, trade, or rent your personal information to third parties. We only share information with trusted third parties to facilitate operations, such as:\n\nShipping & Courier Partners: Global shipping carriers to handle door-to-door delivery from our factory to your destination.\n\nPayment Processors: Secure payment gateways to process transactions.\n\nLegal Requirements: If required by law, regulation, or legal process to protect our rights or comply with judicial proceedings.\n\n4. International Data Transfers\n\nAs our primary manufacturing facility and administrative operations are located at Devpurwa Road, Mirzapur, Uttar Pradesh, India, your data may be transferred and processed in India and other locations where our service providers operate. We ensure that appropriate security measures are taken to protect your personal data globally.\n\n5. Cookies and Tracking Technologies\n\nWOLHOMES uses cookies to remember user preferences, maintain session state, and enhance site navigation. You can choose to disable cookies through your individual browser options, though some site functions may be affected.\n\n6. Data Security\n\nWe implement industry-standard administrative, technical, and physical security measures to safeguard your personal information. While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet or electronic storage is 100% secure.\n\n7. Contact Us Regarding Your Privacy\n\nIf you wish to access, correct, or delete any personal information we have about you, or if you have any questions about this policy, please reach out to us:\n\nEmail: info@wolhomes.com\n\nFactory Address: 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh â€“ 231001, India",
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    lastUpdated: 'September 19, 2026',
    content:
      "Terms of Service\n\nEffective Date: September 19, 2026\n\nWelcome to WOLHOMES. These Terms of Service (\"Terms\") govern your use of our website, services, and the purchase of our products. By accessing or using our website, placing an order, or engaging with our brand, you agree to be bound by these Terms.\n\n1. General Conditions\n\nWOLHOMES operates as a direct manufacturer and global seller of handcrafted rugs and homewares. Our manufacturing and fulfillment operations are based out of our factory located at Devpurwa Road, Mirzapur, Uttar Pradesh, India.\n\nWe reserve the right to refuse service to anyone for any reason at any time.\n\n2. Products & Handcrafted Variations\n\nArtisanal Nature: Our products, particularly our Hand-Tufted and Hand-Knotted rugs, are handcrafted by master artisans. Minor variations in dye color, texture, weaving patterns, and exact sizing (typically within +/- 2-3%) are inherent characteristics of handmade products and are not considered defects.\n\nColor Accuracy: We make every effort to display product colors accurately on our website. However, actual colors may vary slightly depending on display settings and monitor calibrations.\n\n3. Custom & Made-to-Order Products\n\nFinal Sale: Custom and personalized rug orders are specially handcrafted to your individual specifications. As such, custom orders are non-returnable, non-exchangeable, and non-refundable once production has commenced.\n\nDefects or Errors: If a custom item arrives damaged, defective, or incorrectly made due to our manufacturing error, you must notify us within 48 hours of delivery with photographic evidence at info@wolhomes.com for a free replacement or resolution.\n\n4. Pricing, Payments, & Orders\n\nPrices for our products are subject to change without prior notice.\n\nWe accept major credit cards, PayPal, and authorized gift cards.\n\nWe reserve the right to cancel or refuse any order placed with us (e.g., in cases of suspected fraud or pricing errors). If an order is canceled after payment, a full refund will be issued to your original payment method.\n\n5. International Shipping, Duties, & Returns\n\nShipping: We offer global door-to-door shipping straight from our factory in Mirzapur, India.\n\nReturn Shipping & Customs (Buyerâ€™s Responsibility): For eligible standard returns (excluding custom orders), the buyer is solely responsible for paying all return shipping charges, including any applicable customs duties, import taxes, and courier fees needed to deliver the package Delivered Duty Paid (DDP) to our factory in Mirzapur, India. Returns shipped with unpaid duties or postage-due will be rejected.\n\n6. Intellectual Property\n\nAll content on this website, including text, graphics, logos, images, rug designs, and software, is the property of WOLHOMES and is protected by applicable copyright, trademark, and intellectual property laws.\n\n7. Limitation of Liability\n\nWOLHOMES shall not be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of our website or any products purchased through our store, to the maximum extent permitted by law.\n\n8. Governing Law & Jurisdiction\n\nThese Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction residing in the courts of Mirzapur, Uttar Pradesh, India.\n\n9. Contact Information\n\nQuestions about the Terms of Service should be sent to us at:\n\nEmail: info@wolhomes.com\n\nFactory Address: WOLHOMES, 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh â€“ 231001, India",
  },

  about: {
    slug: 'about',
    title: 'About Us',
    lastUpdated: 'September 19, 2026',
    content:
      "About Us\n\nCrafting Timeless Heritage, Delivered Straight from Our Loom to Your Home.\n\nWelcome to WOLHOMES. We are master rug makers and artisans dedicated to the timeless art of handcrafted floor coverings.\n\nOur journey began in 1990 as a family tradition deeply rooted in perfecting ancient weaving techniquesâ€”specifically Tibetan Hand-Knotted and premium Hand-Tufted rug-making. Over the decades, our skilled artisans passed down these traditional skills from generation to generation. Building upon this 35+ years of heritage, our firm was formally registered in 2017 as a modern manufacturing unit, allowing us to serve global clients with structured quality standards.\n\nWhy Buyers & Interior Designers Worldwide Choose Us\n\nMaster Craftsmanship: Every rug we produce is a work of art. From intricate Tibetan hand-knotted patterns to luxurious hand-tufted textures, our master weavers pour exceptional skill, precision, and dedication into every piece.\n\nDirect Factory-to-Doorstep Model: Based in our manufacturing facility at Devpurwa Road, Mirzapur, Uttar Pradesh (India), we manage the entire production process in-houseâ€”from raw material selection to weaving, washing, and final quality inspection. Delivering directly from our factory to your door eliminates unnecessary middlemen and guarantees true factory-direct pricing.\n\nCustom & Bespoke Rugs: Because we own and operate our manufacturing factory, we offer full customization for trade professionals, architects, interior designers, and individual buyers worldwide. Whether you require a unique size, specific color palette, or custom design, we build your rug exactly to your specifications.\n\nGlobal Door-to-Door Delivery: We cater to rug lovers across the globe, providing reliable, fully tracked door-to-door shipping straight from our looms in India to your address, anywhere in the world.\n\nOur Promise\n\nWhether you are seeking a statement Tibetan hand-knotted heirloom or a bespoke hand-tufted rug crafted for your space, WOLHOMES promises uncompromised quality, authentic craftsmanship, and a seamless shopping experience from our factory to your home.\n\nFactory Address: Devpurwa Road, Mirzapur, Uttar Pradesh, India\n\nCustomer Care: info@wolhomes.com",
  },

  returns: {
    slug: 'returns',
    title: 'Return & Refund Policy',
    lastUpdated: 'September 19, 2026',
    content:
      "Return & Refund Policy\n\nThank you for shopping with us! We want you to love your purchase. If you are not completely satisfied, we are here to help.\n\n14-Day Return Window\n\nWe offer a 14-day return policy. You have 14 days from the date you receive your item to request a return.\n\nTo be eligible for a return:\n\nYour item must be unused, unworn, and in the same condition that you received it.\n\nIt must be in the original packaging with all tags attached.\n\nProof of purchase (order number or receipt) is required.\n\nNon-Returnable Items (Custom & Personalized Orders)\n\nPlease note that Custom and Personalized Orders CANNOT be returned or exchanged.\n\nWhy? Custom items are specially made-to-order according to your unique specifications, measurements, or designs, making them non-resalable.\n\nDefective or Damaged Custom Orders: If your custom item arrives damaged, defective, or incorrect due to our error, please contact us within 48 hours of delivery with photos, and we will immediately send a free replacement or issue a full refund.\n\nHow to Initiate a Return\n\nContact Us: Send an email to info@wolhomes.com with your Order ID and the reason for the return.\n\nGet Approval: Our team will review your request and send you the return shipping instructions and factory return address.\n\nShip the Item: Package the item securely and send it back to our factory using a trackable shipping method.\n\nImportant Return Shipping & Duty Notice:\n\nThe buyer is solely responsible for paying all return shipping charges, including any applicable customs duties, taxes, and import fees required to deliver the package directly to our Factory (Delivered Duty Paid / DDP). Returns shipped with unpaid duties or postage-due will not be accepted at our factory. (Note: Return shipping fees will only be covered by us if the item arrived damaged, defective, or incorrect).\n\nRefunds\n\nOnce we receive and inspect your returned item at our factory, we will notify you via email regarding the approval or rejection of your refund.\n\nIf approved, your refund will be processed immediately to your original method of payment (Credit Card, PayPal, etc.).\n\nPlease allow 3 to 7 business days for the refund to reflect in your bank account, depending on your card issuer.\n\nDamaged, Defective, or Incorrect Items\n\nPlease inspect your order upon arrival. If the item is defective, damaged, or if you received the wrong item, contact us immediately at info@wolhomes.com so we can evaluate the issue and make it right for you.\n\nContact Us\n\nIf you have any questions about our Return Policy, please reach out to us:\n\nEmail: info@wolhomes.com\n\nCustomer Support Hours: Monday - Friday (9 AM - 5 PM EST)\n\nFactory Address: 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh, India",
  },

  contact: {
    slug: 'contact',
    title: 'Contact Us',
    lastUpdated: 'September 19, 2026',
    content:
      "Contact Us\n\nWe would love to hear from you! Whether you have questions about our handcrafted rugs, need help placing a Custom & Made-to-Order request, or want to track your shipment, our team is here to assist you.\n\nGet in Touch\n\nEmail Customer Care: info@wolhomes.com\n\nCustomer Support Hours: Monday â€“ Friday (9:00 AM â€“ 5:00 PM EST)\n\nResponse Time: We strive to respond to all inquiries within 24 to 48 hours.\n\nFactory & Manufacturing Facility Address\n\nAll our Hand-Tufted and Hand-Knotted rugs are manufactured, quality-checked, and shipped directly from our main factory unit:\n\nWOLHOMES\n\n575/2-C, Devpurwa Road, Mirzapur,\n\nUttar Pradesh, India â€“ 231001\n\nCustom & Trade Inquiries\n\nCustom Rug Orders: Have a specific size, color palette, or design in mind? Send us an email with your specifications or sketches, and our master artisans will bring it to life.\n\nTrade & Wholesale Program: Are you an interior designer, architect, or business owner looking for bulk or trade pricing? Contact us with your business details and resale certificate to join our trade program.\n\nSend Us a Message\n\n(If you are filling out our online contact form, please provide the following details so we can assist you faster)\n\nFull Name:\n\nEmail Address:\n\nOrder ID (if applicable):\n\nSubject: (General Inquiry / Custom Order / Shipping Status / Trade Request)\n\nMessage:",
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductFilters(): Promise<ProductFilterSetting[]> {
    const rows = await this.prisma.$queryRaw<Array<{ productFilters: unknown }>>`
      SELECT "productFilters"
      FROM "app_settings"
      WHERE "id" = 'default'
      LIMIT 1
    `;

    const value = rows[0]?.productFilters;

    if (!Array.isArray(value) || value.length === 0) {
      return DEFAULT_PRODUCT_FILTERS;
    }

    return this.normalizeProductFilters(value as ProductFilterSetting[]);
  }

  async updateProductFilters(
    filters: ProductFilterSetting[],
  ): Promise<ProductFilterSetting[]> {
    const normalized = this.normalizeProductFilters(filters);

    await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', defaultCurrency: 'USD' },
    });

    await this.prisma.$executeRaw`
      UPDATE "app_settings"
      SET "productFilters" = ${JSON.stringify(normalized)}::jsonb,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = 'default'
    `;

    return normalized;
  }

  async getHomepageVideos(): Promise<HomepageVideoSetting[]> {
    const rows = await this.prisma.$queryRaw<Array<{ homepageVideos: unknown }>>`
      SELECT "homepageVideos"
      FROM "app_settings"
      WHERE "id" = 'default'
      LIMIT 1
    `;

    const value = rows[0]?.homepageVideos;

    if (!Array.isArray(value)) {
      return [];
    }

    return this.normalizeHomepageVideos(value as HomepageVideoSetting[]);
  }

  async updateHomepageVideos(
    videos: HomepageVideoSetting[],
  ): Promise<HomepageVideoSetting[]> {
    const normalized = this.normalizeHomepageVideos(videos);

    if (!Array.isArray(videos) || videos.length < 1 || videos.length > 3 || normalized.length < 1 || normalized.length > 3) {
      throw new BadRequestException('Homepage videos must contain between 1 and 3 valid videos.');
    }

    await this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', defaultCurrency: 'USD' },
    });

    await this.prisma.$executeRaw`
      UPDATE "app_settings"
      SET "homepageVideos" = ${JSON.stringify(normalized)}::jsonb,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = 'default'
    `;

    return normalized;
  }

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

    return SITE_PAGE_SLUGS.map((slug) =>
      this.mergePage(slug, stored[slug]),
    );
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
      title:
        data.title !== undefined ? data.title.trim() : current.title,
      lastUpdated:
        data.lastUpdated !== undefined
          ? data.lastUpdated.trim()
          : current.lastUpdated,
      content:
        data.content !== undefined ? data.content : current.content,
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

  private normalizeProductFilters(
    filters: ProductFilterSetting[],
  ): ProductFilterSetting[] {
    return filters
      .filter(
        (attribute) =>
          attribute && attribute.slug && attribute.name,
      )
      .map((attribute, attributeIndex) => {
        const values = Array.isArray(attribute.values)
          ? attribute.values
              .filter(
                (value) =>
                  value && value.slug && value.label,
              )
              .map((value, valueIndex) => ({
                slug: String(value.slug).trim().toLowerCase(),
                label: String(value.label).trim(),
                sortOrder: Number.isFinite(Number(value.sortOrder))
                  ? Number(value.sortOrder)
                  : valueIndex,
                isActive: value.isActive !== false,
              }))
          : [];

        return {
          slug: String(attribute.slug).trim().toLowerCase(),
          name: String(attribute.name).trim(),
          sortOrder: Number.isFinite(Number(attribute.sortOrder))
            ? Number(attribute.sortOrder)
            : attributeIndex,
          isActive: attribute.isActive !== false,
          values,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((attribute, index) => ({
        ...attribute,
        sortOrder: index,
        values: attribute.values
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((value, valueIndex) => ({
            ...value,
            sortOrder: valueIndex,
          })),
      }));
  }

  private normalizeHomepageVideos(
    videos: HomepageVideoSetting[],
  ): HomepageVideoSetting[] {
    return videos
      .filter(
        (video) =>
          video &&
          video.id &&
          video.url,
      )
      .map((video, index) => ({
        id: String(video.id).trim(),
        title: String(video.title ?? '').trim(),
        url: String(video.url).trim(),
        platform:
          (video.platform === 'instagram' ? 'instagram' : 'youtube') as HomepageVideoPlatform,
        sortOrder: Number.isFinite(Number(video.sortOrder))
          ? Number(video.sortOrder)
          : index,
        isActive: video.isActive !== false,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((video, index) => ({
        ...video,
        sortOrder: index,
      }));
  }

  private normalizeSlug(slug: string): SitePageSlug {
    const normalized = slug.trim().toLowerCase();

    if (
      !SITE_PAGE_SLUGS.includes(
        normalized as SitePageSlug,
      )
    ) {
      throw new NotFoundException(
        `Unknown site page: ${slug}`,
      );
    }

    return normalized as SitePageSlug;
  }

  private mergePage(
    slug: SitePageSlug,
    storedPage:
      | Partial<SitePageSettings>
      | undefined,
  ): SitePageSettings {
    return {
      ...DEFAULT_SITE_PAGES[slug],
      ...(storedPage ?? {}),
      slug,
    };
  }

  private async readStoredSitePages(): Promise<
    Partial<
      Record<
        SitePageSlug,
        Partial<SitePageSettings>
      >
    >
  > {
    const rows =
      await this.prisma.$queryRaw<
        Array<{ sitePages: unknown }>
      >`
        SELECT "sitePages"
        FROM "app_settings"
        WHERE "id" = 'default'
        LIMIT 1
      `;

    const value = rows[0]?.sitePages;

    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return {};
    }

    return value as Partial<
      Record<
        SitePageSlug,
        Partial<SitePageSettings>
      >
    >;
  }
}
