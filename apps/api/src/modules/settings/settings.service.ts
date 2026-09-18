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
    content: `Privacy Policy

Last updated: January 1, 2024

Introduction

At Wolhomes, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.

1. Information We Collect

1.1 Personal Information

When you make a purchase or create an account, we collect personal information including:

- Name and contact information (email, phone, address)
- Billing and shipping addresses
- Payment information (processed securely through our payment providers)
- Order history and preferences
- Communication preferences

1.2 Automatically Collected Information

When you visit our website, we automatically collect certain information:

- IP address and browser type
- Device information and operating system
- Pages visited and time spent on our site
- Referring website and search terms
- Cookies and similar tracking technologies

1.3 Custom Design Information

For custom design requests, we collect additional information including design preferences, measurements, material choices, and photos or sketches you provide.

2. How We Use Your Information

We use the information we collect to:

- Process and fulfill your orders
- Communicate with you about your orders and account
- Provide customer support and respond to inquiries
- Send marketing communications (with your consent)
- Improve your website, products, and services
- Prevent fraud and enhance security
- Comply with legal obligations
- Analyze website usage and optimize user experience

3. Information Sharing

We do not sell your personal information. We may share your information with:

- Service Providers: Payment processors, shipping companies, and email service providers who assist in operating our business
- Legal Requirements: When required by law, court order, or government regulation
- Business Transfers: In connection with a merger, acquisition, or sale of assets
- Protection: To protect our rights, property, or safety, and that of our customers

All third-party service providers are contractually obligated to protect your information and use it only for the purposes we specify.

4. Cookies & Tracking Technologies

We use cookies and similar technologies to enhance your browsing experience. Cookies are small data files stored on your device that help us:

- Remember your preferences and settings
- Keep you logged into your account
- Maintain items in your shopping cart
- Analyze website traffic and usage patterns
- Deliver personalized content and advertisements

You can control cookie settings through your browser preferences. However, disabling cookies may limit your ability to use certain features of our website.

5. Data Security

We implement appropriate technical and organizational measures to protect your personal information:

- SSL encryption for data transmission
- Secure servers and databases
- Regular security audits and updates
- Access controls and authentication
- Employee training on data protection

While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.

6. Your Rights & Choices

You have the right to:

- Access: Request a copy of the personal information we hold about you
- Correction: Update or correct inaccurate information
- Deletion: Request deletion of your personal information (subject to legal requirements)
- Opt-Out: Unsubscribe from marketing communications at any time
- Data Portability: Request your data in a portable format
- Object: Object to certain processing of your personal information

To exercise these rights, please contact us at privacy@wolhomes.com

7. Data Retention

We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.

- Account information: Retained while your account is active
- Order history: Retained for 7 years for tax and legal purposes
- Marketing data: Retained until you opt-out
- Website analytics: Anonymized after 26 months

8. Children’s Privacy

Our website is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will promptly delete it.

9. International Transfers

Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information.

10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last Updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.

11. Contact Us

If you have questions or concerns about this Privacy Policy or our data practices:

Wolhomes
123 Artisan Boulevard
New York, NY 10001
United States

Email: privacy@wolhomes.com
Phone: +1 (234) 567-890`,
  },

  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    lastUpdated: 'January 1, 2024',
    content: `Terms & Conditions

Last updated: January 1, 2024

Welcome to Wolhomes. These Terms and Conditions ("Terms") govern your use of our website and the purchase of our products. By accessing our website or making a purchase, you agree to be bound by these Terms.

1. General Terms

1.1 By placing an order with Wolhomes, you warrant that you are legally capable of entering into binding contracts and are at least 18 years of age.

1.2 We reserve the right to refuse service to anyone for any reason at any time.

1.3 These Terms may be updated from time to time. Continued use of our services after changes constitutes acceptance of the new Terms.

2. Products & Pricing

2.1 All products are subject to availability; we reserve the right to discontinue any product.

2.2 Prices are in USD and subject to change without notice; the charged price is the price displayed at the time of order placement.

2.3 We strive to display colors and details as accurately as possible, but cannot guarantee that your device display reflects the actual product.

2.4 Custom products are made to order according to specifications agreed during the design consultation.

3. Orders & Payment

3.1 All orders are subject to acceptance and availability; we may decline orders at our discretion.

3.2 Payment in full is required before processing. We accept major credit cards, PayPal, and bank transfers.

3.3 Custom orders require a 50% deposit to commence; the remaining balance is due before delivery.

3.4 Customers are responsible for providing accurate billing and shipping information. We are not liable for delays or non-delivery caused by incorrect information.

4. Shipping & Delivery

4.1 Shipping times are estimates and are not guaranteed.

4.2 Risk of loss and title pass upon delivery to the carrier.

4.3 We are not responsible for customs, weather, or carrier delays.

4.4 International customers are responsible for customs duties, taxes, and import fees.

5. Returns & Refunds

5.1 Standard products may be returned within 30 days of delivery in original condition. See Returns Policy for complete details.

5.2 Custom-made products are non-refundable except for manufacturing defects or damage during shipping.

5.3 Refunds are issued to the original payment method within 7-10 business days after receiving the returned item.

6. Warranty

6.1 All products carry a 5-year warranty against manufacturing defects under normal use.

6.2 Custom pieces include a lifetime structural warranty.

6.3 Warranties do not cover normal wear and tear, misuse, unauthorized modifications, or failure to follow care instructions.

7. Intellectual Property

7.1 All website content including images, text, logos, and designs is the property of Wolhomes and is protected by copyright and trademark laws.

7.2 You may not reproduce, distribute, or create derivative works without express written permission.

7.3 Custom designs remain the intellectual property of Wolhomes unless otherwise agreed in writing.

8. Limitation of Liability

8.1 We are not liable for indirect, incidental, special, consequential, or punitive damages arising from the use of our products or services.

8.2 Total liability will not exceed the amount paid for the product in question.

8.3 We are not liable for delays or failures caused by circumstances beyond our reasonable control.

9. Privacy

Your use of this website is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

10. Governing Law

10.1 These Terms are governed by the laws of the State of New York, United States, without regard to conflict-of-law provisions.

10.2 Disputes will be resolved in the courts of New York, NY.

11. Contact

Wolhomes
123 Artisan Boulevard
New York, NY 10001
United States

Email: legal@wolhomes.com
Phone: +1 (234) 567-890`,
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

1. Contact Us — Email returns@wolhomes.com or call +1 (234) 567-890 within 30 days of delivery. Provide your order number and reason for the return.

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
2. Contact Us Immediately — Contact us within 48 hours and email photos to support@wolhomes.com.
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

You may cancel within 24 hours for a full refund. Contact support@wolhomes.com.

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

hello@wolhomes.com
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
