import Link from 'next/link';
import { Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const mainImage = product.media?.find((m) => m.isMain) || product.media?.[0];
  const displayPrice = parseFloat(String(product.salePrice ?? product.regularPrice));
  const regularPrice = parseFloat(String(product.regularPrice));
  const hasDiscount =
    product.salePrice != null &&
    parseFloat(String(product.salePrice)) < regularPrice;
  const variantSizes = Array.from(
    new Set(
      (product.variants ?? [])
        .filter((variant) => variant.isAvailable !== false && variant.name?.trim() && variant.name.trim().toLowerCase() !== 'default')
        .map((variant) => variant.name.trim()),
    ),
  );
  const configuredSizes = (product.filterData?.size ?? [])
    .map((size) => size.replace(/-/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const displaySizes = product.selectedVariantName
    ? [product.selectedVariantName]
    : variantSizes.length > 0
      ? variantSizes
      : configuredSizes;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <article className="min-w-0">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-[#f1ede8]">
          {mainImage?.url ? (
            <img
              src={mainImage.url}
              alt={mainImage.altText || product.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f1ede8]">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[rgb(var(--luxecraft-muted))]">
                No image
              </span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute left-3 top-3 rounded-sm bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9a6030] shadow-sm">
              Sale
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        <div className="px-0.5">
          <h3 className="mb-1.5 line-clamp-2 font-serif text-[19px] font-semibold leading-[1.12] text-black transition-colors duration-300 group-hover:text-[#2f6b36]">
            {product.name}
          </h3>

          {(product.shortDescription || product.description) && (
            <p className="mb-2 line-clamp-1 text-[12px] leading-5 text-[#5c5752]">
              {product.shortDescription || product.description}
            </p>
          )}

          {(product.reviews?.length ?? 0) > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] tracking-[0.06em] text-[#c99545]">★★★★★</span>
              <span className="text-[10px] text-[#6d665f]">
                {(
                  product.reviews!.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
                  product.reviews!.length
                ).toFixed(1)}
                {' '}({product.reviews!.length})
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[19px] font-semibold text-black">
              ${displayPrice.toFixed(2)}
            </span>

            {hasDiscount && (
              <span className="text-[12px] text-[#6d665f] line-through">
                ${regularPrice.toFixed(2)}
              </span>
            )}
          </div>

          {displaySizes.length > 0 && (
            <p className="mt-2 line-clamp-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[rgb(var(--luxecraft-muted))]">
              {product.selectedVariantName
                ? `Size: ${displaySizes[0]}`
                : `Sizes: ${displaySizes.slice(0, 3).join(', ')}${displaySizes.length > 3 ? ' +' + (displaySizes.length - 3) + ' more' : ''}`}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

