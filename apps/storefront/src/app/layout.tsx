import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SupportChat } from '@/components/SupportChat';
import { HomeCouponLabel } from '@/components/HomeCouponLabel';
const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://wolhomes.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Wolhomes | Worldwide Luxury Handcrafted Rugs & Crafts',
    template: '%s | Wolhomes',
  },
  description:
    'Discover handcrafted luxury rugs, crafts and bespoke custom designs from Wolhomes, with worldwide ordering and delivery.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Wolhomes',
    title: 'Wolhomes | Worldwide Luxury Handcrafted Rugs & Crafts',
    description:
      'Discover handcrafted luxury rugs, crafts and bespoke custom designs from Wolhomes.',
    images: [
      {
        url: '/wolhomes-header-logo.png',
        width: 1200,
        height: 630,
        alt: 'Wolhomes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wolhomes | Worldwide Luxury Handcrafted Rugs & Crafts',
    description:
      'Discover handcrafted luxury rugs, crafts and bespoke custom designs from Wolhomes.',
    images: ['/wolhomes-header-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wolhomes',
    url: SITE_URL,
    logo: `${SITE_URL}/wolhomes-logo.svg`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <OrganizationJsonLd />
        <SiteHeader />
        {children}
        <SiteFooter />
        <HomeCouponLabel />
        <SupportChat />
      </body>
    </html>
  );
}
