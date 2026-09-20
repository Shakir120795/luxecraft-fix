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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
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
    ].map(([slug, label], sortOrder) => ({ slug, label, sortOrder, isActive: true })),
  },
];

const DEFAULT_SITE_PAGES: Record<SitePageSlug, SitePageSettings> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'September 19, 2026',
    content: "Privacy Policy\n\nEffective Date: September 19, 2026\n\nAt WOLHOMES, accessible from our online store, protecting the privacy and security of our customers and website visitors is one of our main priorities. This Privacy Policy document outlines the types of information that is collected and recorded by WOLHOMES and how we use it.\n\nIf you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at info@wolhomes.com.\n\n1. Information We Collect\n\nWhen you visit our site or make a purchase, we collect certain personal information to process your order and provide a seamless shopping experience:\n\nPersonal Details: Name, email address, phone number, shipping address, and billing address.\n\nOrder & Customization Details: Specific dimensions, designs, or custom requirements for your handcrafted Hand-Tufted, Hand-Knotted or Flat Weave Rugs.\n\nPayment Information: Payment card details, PayPal information, or other financial details. (Note: All payments are processed securely through third-party encrypted payment gateways. We do not store your full payment card details on our servers.)\n\nTechnical & Usage Data: IP address, browser type, device information, pages viewed, and cookies to improve website functionality.\n\n2. How We Use Your Information\n\nWe use the information we collect for the following purposes:\n\nTo process, manufacture, and ship your orders directly from our factory in Mirzapur, Uttar Pradesh, India to your doorstep.\n\nTo communicate with you regarding order confirmations, tracking details, custom order approvals, or customer service requests.\n\nTo manage your WOLHOMES account.\n\nTo improve our website experience, products, and custom services.\n\nTo send promotional emails and newsletters (only if you have opted in; you can unsubscribe at any time).\n\n3. Sharing Your Information\n\nWe respect your privacy and do not sell, trade, or rent your personal information to third parties. We only share information with trusted third parties to facilitate operations, such as:\n\nShipping & Courier Partners: Global shipping carriers to handle door-to-door delivery from our factory to your destination.\n\nPayment Processors: Secure payment gateways to process transactions.\n\nLegal Requirements: If required by law, regulation, or legal process to protect our rights or comply with judicial proceedings.\n\n4. International Data Transfers\n\nAs our primary manufacturing facility and administrative operations are located at Devpurwa Road, Mirzapur, Uttar Pradesh, India, your data may be transferred and processed in India and other locations where our service providers operate. We ensure that appropriate security measures are taken to protect your personal data globally.\n\n5. Cookies and Tracking Technologies\n\nWOLHOMES uses cookies to remember user preferences, maintain session state, and enhance site navigation. You can choose to disable cookies through your individual browser options, though some site functions may be affected.\n\n6. Data Security\n\nWe implement industry-standard administrative, technical, and physical security measures to safeguard your personal information. While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet or electronic storage is 100% secure.\n\n7. Contact Us Regarding Your Privacy\n\nIf you wish to access, correct, or delete any personal information we have about you, or if you have any questions regarding this policy, please reach out to us:\n\nEmail: info@wolhomes.com\n\nFactory Address: 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh – 231001, India",
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    lastUpdated: 'September 19, 2026',
    content: "Terms of Service\n\nEffective Date: September 19, 2026\n\nWelcome to WOLHOMES. These Terms of Service (\"Terms\") govern your use of our website, services, and the purchase of our products. By accessing or using our website, placing an order, or engaging with our brand, you agree to be bound by these Terms.\n\n1. General Conditions\n\nWOLHOMES operates as a direct manufacturer and global seller of handcrafted rugs and homewares. Our manufacturing and fulfillment operations are based out of our factory located at Devpurwa Road, Mirzapur, Uttar Pradesh, India.\n\nWe reserve the right to refuse service to anyone for any reason at any time.\n\n2. Products & Handcrafted Variations\n\nArtisanal Nature: Our products, particularly our Hand-Tufted and Hand-Knotted rugs, are handcrafted by master artisans. Minor variations in dye color, texture, weaving patterns, and exact sizing (typically within +/- 2-3%) are inherent characteristics of handmade products and are not considered defects.\n\nColor Accuracy: We make every effort to display product colors accurately on our website. However, actual colors may vary slightly depending on display settings and monitor calibrations.\n\n3. Custom & Made-to-Order Products\n\nFinal Sale: Custom and personalized rug orders are specially handcrafted to your individual specifications. As such, custom orders are non-returnable, non-exchangeable, and non-refundable once production has commenced.\n\nDefects or Errors: If a custom item arrives damaged, defective, or incorrectly made due to our manufacturing error, you must notify us within 48 hours of delivery with photographic evidence at info@wolhomes.com for a free replacement or resolution.\n\n4. Pricing, Payments, & Orders\n\nPrices for our products are subject to change without prior notice.\n\nWe accept major credit cards, PayPal, and authorized gift cards.\n\nWe reserve the right to cancel or refuse any order placed with us (e.g., in cases of suspected fraud or pricing errors). If an order is canceled after payment, a full refund will be issued to your original payment method.\n\n5. International Shipping, Duties, & Returns\n\nShipping: We offer global door-to-door shipping straight from our factory in Mirzapur, India.\n\nReturn Shipping & Customs (Buyer’s Responsibility): For eligible standard returns (excluding custom orders), the buyer is solely responsible for paying all return shipping charges, including any applicable customs duties, import taxes, and courier fees needed to deliver the package Delivered Duty Paid (DDP) to our factory in Mirzapur, India. Returns shipped with unpaid duties or postage-due will be rejected.\n\n6. Intellectual Property\n\nAll content on this website, including text, graphics, logos, images, rug designs, and software, is the property of WOLHOMES and is protected by applicable copyright, trademark, and intellectual property laws.\n\n7. Limitation of Liability\n\nWOLHOMES shall not be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of our website or any products purchased through our store, to the maximum extent permitted by law.\n\n8. Governing Law & Jurisdiction\n\nThese Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction residing in the courts of Mirzapur, Uttar Pradesh, India.\n\n9. Contact Information\n\nQuestions about the Terms of Service should be sent to us at:\n\nEmail: info@wolhomes.com\n\nFactory Address: WOLHOMES, 575/2-C, Devpurwa Road, Mirzapur, Uttar Pradesh – 231001, India",
  },

  about: {
    slug: 'about',
    title: 'About Wolhomes',
    lastUpdated: '',
    content: `About Wolhomes

Where timeless craftsmanship meets contemporary elegance

Our Story

Founded in 2020, Wolhomes began with a simple vision: to create furniture that tells a story. Each piece we craft is more than just an objectit's a testament to the enduring beauty of artisanal excellence and thoughtful design.

Our journey started in a small workshop, where our founders combined their passion for traditional woodworking with innovative design principles. Today, we've grown into a trusted name in luxury furniture, but our commitment to quality and craftsmanship remains unchanged.

Every item in our collection is meticulously crafted by skilled artisans who pour their expertise and dedication into each detail. We source the finest materials from sustainable suppliers, ensuring that beauty and responsibility go hand in hand.

Our Values

Craftsmanship

Every piece is handcrafted by master artisans who have honed their skills over decades. We believe in the power of human touch and the beauty of imperfection.

Sustainability

We're committed to environmental responsibility, using sustainably sourced materials and eco-friendly processes that minimize our impact on the planet.

Timelessness

Our designs transcend trends. We create furniture meant to be cherished for generations, becoming more beautiful with age and use.

Our Process

01 Design

Our design team carefully sketches and refines each concept, balancing aesthetic appeal with functional excellence. Every curve, every joint is intentional.

02 Material Selection

We source only the finest hardwoods, metals, and fabrics from trusted suppliers who share our commitment to quality and sustainability.

03 Crafting

Master craftspeople bring the design to life through traditional techniques refined over generations, combined with modern precision tools.

04 Quality Control

Each piece undergoes rigorous inspection to ensure it meets our exacting standards before it's carefully packaged and delivered to your home.

Experience Wolhomes

Discover our curated collection of handcrafted furniture, or let us create something uniquely yours through our custom design service.

Browse Collection
Request Custom Design`,
  },

  returns: {
    slug: 'returns',
    title: 'Returns & Refunds',
    lastUpdated: '',
    content: `Returns & Refunds

Your satisfaction is our priority

We want you to love your Wolhomes furniture. If you're not completely satisfied, we offer a straightforward return policy to ensure your peace of mind.

1. 30-Day Return Policy

Standard Products

You may return any standard (non-custom) product within 30 days of delivery for a full refund, provided the item is:

- In original, unused condition
- In original packaging with all materials
- Free from damage, stains, or alterations
- Accompanied by proof of purchase

Custom & Made-to-Order

Custom-made and made-to-order items are non-refundable except in cases of:

- Manufacturing defects
- Damage during shipping
- Significant deviation from approved specifications

These items are crafted specifically for you and cannot be resold.

2. How to Initiate a Return

1. Contact Us — Email info@wolhomes.com or call +1 (234) 567-890 within 30 days of delivery. Provide your order number and reason for the return.

2. Receive Authorization — We review your request and send a Return Authorization (RA) within 1-2 business days along with instructions.

3. Package & Ship — Repackage the item in its original packaging, place the RA on the outside, and use a tracked shipping service. The customer is responsible for return shipping.

4. Receive Refund — After inspection, your refund will be issued within 7-10 business days to the original payment method.

3. Return Shipping Costs

Customer Responsibility

If you changed your mind, you are responsible for return shipping. We recommend tracked shipping with insurance.

Wolhomes Responsibility

If we sent the wrong item or the item arrived damaged or defective, Wolhomes covers all return shipping costs and provides a prepaid label.

Large Items

For freight furniture, contact us to arrange logistics. Special handling fees may apply.

4. Refund Processing

Once your return is received and inspected:

- Approved Returns: Full refund within 7-10 business days to the original payment method
- Original Shipping Fees: Not refundable unless the return is due to our error
- Partial Refunds: May apply if the item shows signs of use or damage
- Rejected Returns: The item will be sent back at the customer's expense

Your bank may require an additional 2-3 business days to process the refund.

5. Exchanges

We currently do not offer direct exchanges. If you'd like a different item:

1. Return the original item following the return process.
2. Once the refund is processed, place a new order.

For size or color variations within the same product line, contact uswe may be able to arrange a direct exchange.

6. Damaged or Defective Items

If your item arrives damaged or defective:

1. Inspect Upon Delivery — Note any visible damage on the delivery receipt.
2. Contact Us Immediately — Contact us within 48 hours and email photos to info@wolhomes.com.
3. Resolution — We will arrange a replacement or full refund including original shipping costs.
4. No Return Needed — Often, no return is required.

7. Non-Returnable Items

- Custom-made or personalized items
- Final sale or clearance items
- Items damaged through misuse or negligence
- Items without original packaging or a Return Authorization
- Items returned after 30 days

8. Cancellations

Before Production

You may cancel within 24 hours for a full refund. Contact info@wolhomes.com.

After Production Begins

Orders cannot be cancelled once production has begun.

Custom Orders

Custom orders cannot be cancelled once the design has been approved and the deposit has been paid.

9. International Returns

The same return policy applies internationally, with these additional considerations:

- Customer is responsible for return shipping and customs fees
- Returns must clear customs and arrive within 30 days
- Original customs duties and taxes are non-refundable
- Contact us before returning an international order for required documentation

Warranty

All Wolhomes furniture includes a 5-year warranty against manufacturing defects. Custom pieces include a lifetime structural warranty.

Read Full Warranty Terms

Questions About Returns?

Our customer service team is here to make the return process as smooth as possible.

Contact Support
View FAQ`,
  },

  contact: {
    slug: 'contact',
    title: 'Contact Us',
    lastUpdated: '',
    content: `Wolhomes Concierge

Let's create something meaningful.

We'd love to hear from you. Whether you are exploring our collection, planning a bespoke rug, or simply have a question, our team is here to help.

Get In Touch

Contact Information

Address

123 Artisan Boulevard
Design District
New York, NY 10001
United States

Phone

+1 (234) 567-890
Monday - Friday: 9:00 AM - 6:00 PM EST
Saturday: 10:00 AM - 4:00 PM EST

Email

info@wolhomes.com
We respond within 24 hours.

Explore Wolhomes

Helpful Links

Frequently Asked Questions
Returns & Refunds
Custom Design Services

Concierge Support

Send Us a Message

Tell us what you're looking for and our team will get back to you with the right guidance.

Message Sent

Thank you for contacting us. We'll get back to you within 24 hours.

Full Name *
John Doe

Email Address *
john@example.com

Phone Number
+1 (234) 567-890

Subject *

Select a subject
General Inquiry
Order Status
Custom Design
Shipping & Delivery
Returns & Refunds
Product Information
Other

Message *
Tell us how we can help you...

Send Message

By submitting this form, you agree to our Privacy Policy`,
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

  async updateProductFilters(filters: ProductFilterSetting[]): Promise<ProductFilterSetting[]> {
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

  private normalizeProductFilters(filters: ProductFilterSetting[]): ProductFilterSetting[] {
    return filters
      .filter((attribute) => attribute && attribute.slug && attribute.name)
      .map((attribute, attributeIndex) => {
        const values = Array.isArray(attribute.values)
          ? attribute.values
              .filter((value) => value && value.slug && value.label)
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
