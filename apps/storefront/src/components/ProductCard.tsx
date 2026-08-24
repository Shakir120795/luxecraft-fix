import Link from 'next/link';
import { Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const mainImage = product.media?.find((m) => m.isMain) || product.media?.[0];
  const displayPrice = parseFloat(String(product.salePrice || product.regularPrice));
  const regularPrice = parseFloat(String(product.regularPrice));
  const hasDiscount = product.salePrice && parseFloat(String(product.salePrice)) < regularPrice;

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group cursor-pointer">
        <div className="relative mb-4 aspect-square overflow-hidden border border-luxury-sand bg-luxury-beige">
          {mainImage?.url ? (
            <img
              src={mainImage.url}
              alt={mainImage.altText || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-luxury-beige to-luxury-sand flex items-center justify-center">
              <span className="text-luxury-brown/60 text-sm font-serif">No image</span>
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-4 right-4 bg-luxury-gold text-white px-3 py-1 text-xs font-serif tracking-wider">
              SALE
            </div>
          )}
        </div>

        <h3 className="text-lg font-serif text-luxury-charcoal mb-2 line-clamp-2 group-hover:text-luxury-brown transition-colors">
          {product.name}
        </h3>

        <p className="text-sm text-luxury-brown/70 mb-3 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-serif text-luxury-charcoal">
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-luxury-brown/50 line-through">
              ${regularPrice.toFixed(2)}
            </span>
          )}
        </div>

        {product.variants && product.variants.length > 0 && (
          <p className="text-xs text-luxury-brown/60 mt-2 uppercase tracking-wider">
            {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </Link>
  );
}
