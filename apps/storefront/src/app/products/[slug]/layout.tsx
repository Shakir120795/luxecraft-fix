import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://wolhomes.com';
const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001/api/v1';

type ProductSeo = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  regularPrice: string | number;
  salePrice?: string | number | null;
  currency?: string | null;
  status?: string;
  media?: Array<{
    url: string;
    altText?: string | null;
    isMain?: boolean;
  }>;
  reviews?: Array<{
    rating: number;
    status?: string;
  }>;
  variants?: Array<{
    stockQty?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
    isAvailable?: boolean;
  }>;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
};

async function getProduct(slug: string): Promise<ProductSeo | null> {
  try {
    const res = await fetch(
      `${API_URL}/storefront/products/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.success ? data.data : data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

function absoluteUrl(value: string): string {
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return value;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.shortDescription?.trim() ||
    product.description?.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim() ||
    `Discover ${product.name} from Wolhomes.`;

  const image = product.media?.find((item) => item.isMain)?.url || product.media?.[0]?.url;
  const canonical = `/products/${encodeURIComponent(product.slug)}`;

  return {
    title: product.name,
    description: description.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title: product.name,
      description: description.slice(0, 200),
      siteName: 'Wolhomes',
      images: image
        ? [
            {
              url: absoluteUrl(image),
              alt: product.media?.find((item) => item.isMain)?.altText || product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description.slice(0, 200),
      images: image ? [absoluteUrl(image)] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function ProductJsonLd({ product }: { product: ProductSeo }) {
  const activeReviews = (product.reviews ?? []).filter(
    (review) => !review.status || review.status === 'APPROVED',
  );
  const reviewCount = activeReviews.length;
  const averageRating =
    reviewCount > 0
      ? activeReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
      : 0;

  const regularPrice = Number(product.regularPrice);
  const salePrice =
    product.salePrice !== null && product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;
  const price =
    salePrice !== null && Number.isFinite(salePrice) && salePrice < regularPrice
      ? salePrice
      : regularPrice;

  const currency = (product.currency || 'USD').toUpperCase();
  const imageUrls = (product.media ?? [])
    .map((item) => item.url)
    .filter(Boolean)
    .map(absoluteUrl);

  const variants = product.variants ?? [];
  const hasInventoryData = variants.some((variant) => variant.trackInventory === true);
  const isAvailable = variants.some(
    (variant) =>
      variant.isAvailable !== false &&
      (variant.trackInventory !== true ||
        (Number(variant.stockQty ?? 0) > 0 || variant.allowBackorder === true)),
  );

  const productUrl = absoluteUrl(`/products/${encodeURIComponent(product.slug)}`);

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.shortDescription ||
      product.description?.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim() ||
      undefined,
    url: productUrl,
    image: imageUrls,
    category: product.category?.name || undefined,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: currency,
      price: Number.isFinite(price) ? price.toFixed(2) : undefined,
      availability:
        hasInventoryData && !isAvailable
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: absoluteUrl('/products'),
      },
      ...(product.category?.name
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category.name,
              item: product.category.slug
                ? absoluteUrl(`/categories/${encodeURIComponent(product.category.slug)}`)
                : absoluteUrl('/products'),
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: product.category?.name ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd product={product} />
      {children}
    </>
  );
}
