'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, ProductMedia, addToCart } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/storefront/products/${slug}`, { cache: 'no-store' });
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Product not found');
          } else {
            setError('Failed to load product');
          }
          return;
        }

        const data = await res.json();
        
        setProduct(data.data);

        if (data.data.variants && data.data.variants.length > 0) {
          setSelectedVariant(data.data.variants[0].id);
        }

        const initialImage =
          data.data.media?.find((item: ProductMedia) => item.isMain) ||
          data.data.media?.[0];

        setSelectedImageId(initialImage?.id ?? null);
      } catch (err) {
        setError('Failed to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-luxury-brown">
            <div className="h-3 w-3 bg-luxury-gold animate-pulse" />
            <span className="font-serif">Loading product...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-4 text-5xl font-serif font-light text-luxury-charcoal">404</h1>
          <p className="mb-8 text-luxury-brown">{error || 'Product not found'}</p>
          <Link
            href="/products"
            className="btn-luxury"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const selectedSizeVariant =
    product.variants?.find((variant) => variant.id === selectedVariant) ?? null;

  const effectiveRegularPrice =
    selectedSizeVariant?.regularPrice != null
      ? selectedSizeVariant.regularPrice
      : product.regularPrice;

  const effectiveSalePrice =
    selectedSizeVariant?.salePrice != null
      ? selectedSizeVariant.salePrice
      : product.salePrice;

  const displayPrice = parseFloat(
    String(effectiveSalePrice ?? effectiveRegularPrice),
  );

  const regularPrice = parseFloat(String(effectiveRegularPrice));

  const hasDiscount =
    effectiveSalePrice != null &&
    parseFloat(String(effectiveSalePrice)) < regularPrice;

  const activeMedia = product.media ?? [];

  const fallbackImage =
    activeMedia.find((item) => item.isMain) || activeMedia[0];

  const selectedImage =
    activeMedia.find((item) => item.id === selectedImageId) ||
    fallbackImage;

  const selectedImageIndex = Math.max(
    0,
    activeMedia.findIndex((item) => item.id === selectedImage?.id),
  );

  const handleVariantSelect = (variantId: string) => {
    const variant = product?.variants?.find((item) => item.id === variantId);

    if (!variant) return;

    const unavailable =
      variant.trackInventory === true &&
      variant.stockQty <= 0 &&
      variant.allowBackorder !== true;

    if (unavailable) return;

    setSelectedVariant(variantId);
    setQuantity(1);
  };

  const goToPreviousImage = () => {
    if (activeMedia.length === 0) return;

    const previousIndex =
      (selectedImageIndex - 1 + activeMedia.length) %
      activeMedia.length;

    setSelectedImageId(activeMedia[previousIndex].id);
  };

  const goToNextImage = () => {
    if (activeMedia.length === 0) return;

    const nextIndex = (selectedImageIndex + 1) % activeMedia.length;

    setSelectedImageId(activeMedia[nextIndex].id);
  };

  const selectedVariantUnavailable =
    !!selectedSizeVariant &&
    selectedSizeVariant.trackInventory === true &&
    selectedSizeVariant.stockQty <= 0 &&
    selectedSizeVariant.allowBackorder !== true;

  const validateSelectedQuantity = () => {
    if (
      selectedSizeVariant &&
      selectedSizeVariant.trackInventory === true &&
      selectedSizeVariant.allowBackorder !== true &&
      quantity > Math.max(0, selectedSizeVariant.stockQty)
    ) {
      alert(
        `Only ${Math.max(0, selectedSizeVariant.stockQty)} item(s) are available for this size.`,
      );
      return false;
    }

    return true;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (selectedVariantUnavailable) {
      return;
    }

    if (!validateSelectedQuantity()) return;

    const result = await addToCart({
      productId: product.id,
      variantId: selectedVariant,
      quantity,
    });

    if (result.success) {
    } else {
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (selectedVariantUnavailable) {
      return;
    }

    if (!validateSelectedQuantity()) return;

    const result = await addToCart({
      productId: product.id,
      variantId: selectedVariant,
      quantity,
    });

    if (result.success) {
      router.push('/checkout');
    } else {
    }
  };

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-luxury-brown">
            <Link href="/" className="hover:text-luxury-gold transition-colors">
              Home
            </Link>
            <span className="text-luxury-sand">/</span>
            <Link href="/products" className="hover:text-luxury-gold transition-colors">
              Products
            </Link>
            <span className="text-luxury-sand">/</span>
            <span className="text-luxury-charcoal font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div>
            <div className="relative mb-4 aspect-square overflow-hidden border border-luxury-sand bg-luxury-beige">
              {selectedImage?.url ? (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="group relative block h-full w-full cursor-zoom-in"
                  aria-label="Open product image fullscreen"
                >
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.altText || product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="pointer-events-none absolute bottom-4 right-4 bg-black/55 px-3 py-2 text-xs uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                    View fullscreen
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-luxury-beige to-luxury-sand">
                  <div className="text-center">
                    <div className="mb-4 text-6xl text-luxury-gold">🖼️</div>
                    <span className="font-serif text-lg text-luxury-brown">
                      No image available
                    </span>
                  </div>
                </div>
              )}

              {activeMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 border border-white/60 bg-black/40 px-3 py-3 text-xl text-white backdrop-blur-sm transition hover:bg-black/60"
                    aria-label="Previous product image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/60 bg-black/40 px-3 py-3 text-xl text-white backdrop-blur-sm transition hover:bg-black/60"
                    aria-label="Next product image"
                  >
                    ›
                  </button>
                </>
              )}

              {hasDiscount && (
                <div className="absolute top-6 right-6 bg-luxury-gold px-4 py-2 font-serif text-sm tracking-wider text-white">
                  SALE
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {activeMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {activeMedia.map((image, index) => {
                  const isSelected = image.id === selectedImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageId(image.id)}
                      className={`aspect-square overflow-hidden bg-luxury-beige transition-all ${
                        isSelected
                          ? 'border-2 border-luxury-gold'
                          : 'border border-luxury-sand hover:border-luxury-gold'
                      }`}
                      aria-label={`View size image ${index + 1}`}
                      aria-current={isSelected ? 'true' : undefined}
                    >
                      <img
                        src={image.url}
                        alt={
                          image.altText ||
                          `${product.name} image ${index + 1}`
                        }
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fullscreen viewer */}
            {isFullscreen && selectedImage?.url && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Fullscreen product image viewer"
                onClick={() => setIsFullscreen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="absolute right-5 top-5 z-10 border border-white/40 bg-black/50 px-4 py-2 text-2xl text-white hover:bg-black/70"
                  aria-label="Close fullscreen viewer"
                >
                  ×
                </button>

                {activeMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToPreviousImage();
                      }}
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-white/40 bg-black/50 px-4 py-3 text-3xl text-white hover:bg-black/70 sm:left-8"
                      aria-label="Previous product image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToNextImage();
                      }}
                      className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-white/40 bg-black/50 px-4 py-3 text-3xl text-white hover:bg-black/70 sm:right-8"
                      aria-label="Next product image"
                    >
                      ›
                    </button>
                  </>
                )}

                <img
                  src={selectedImage.url}
                  alt={selectedImage.altText || product.name}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  onClick={(event) => event.stopPropagation()}
                />

                {activeMedia.length > 1 && (
                  <div className="absolute bottom-5 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded border border-white/20 bg-black/50 p-2">
                    {activeMedia.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedImageId(image.id);
                        }}
                        className={`h-14 w-14 shrink-0 overflow-hidden border ${
                          image.id === selectedImage?.id
                            ? 'border-2 border-luxury-gold'
                            : 'border-white/30'
                        }`}
                        aria-label="Select product image"
                      >
                        <img
                          src={image.url}
                          alt={image.altText || product.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-6 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-luxury-sand">
              <span className="text-4xl font-serif text-luxury-charcoal">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-luxury-brown/50 line-through font-light">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mb-8">
              <p className="text-luxury-brown leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Dimensions */}
            {(selectedSizeVariant?.lengthCm ||
              selectedSizeVariant?.widthCm ||
              selectedSizeVariant?.heightCm ||
              product.lengthCm ||
              product.widthCm ||
              product.heightCm) && (
              <div className="mb-8 border border-luxury-sand bg-luxury-beige p-6">
                <h3 className="font-serif text-lg text-luxury-charcoal mb-4">
                  Dimensions
                  {selectedSizeVariant?.name && (
                    <span className="ml-2 text-sm font-normal text-luxury-brown/70">
                      ({selectedSizeVariant.name})
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-3 gap-6 text-sm">
                  {(selectedSizeVariant?.lengthCm ?? product.lengthCm) && (
                    <div>
                      <p className="text-luxury-brown/60 mb-1 uppercase text-xs tracking-wider">
                        Length
                      </p>
                      <p className="font-medium text-luxury-charcoal">
                        {selectedSizeVariant?.lengthCm ?? product.lengthCm} cm
                      </p>
                    </div>
                  )}

                  {(selectedSizeVariant?.widthCm ?? product.widthCm) && (
                    <div>
                      <p className="text-luxury-brown/60 mb-1 uppercase text-xs tracking-wider">
                        Width
                      </p>
                      <p className="font-medium text-luxury-charcoal">
                        {selectedSizeVariant?.widthCm ?? product.widthCm} cm
                      </p>
                    </div>
                  )}

                  {(selectedSizeVariant?.heightCm ?? product.heightCm) && (
                    <div>
                      <p className="text-luxury-brown/60 mb-1 uppercase text-xs tracking-wider">
                        Height
                      </p>
                      <p className="font-medium text-luxury-charcoal">
                        {selectedSizeVariant?.heightCm ?? product.heightCm} cm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <h3 className="font-serif text-lg text-luxury-charcoal mb-4">Select Size</h3>
                <p className="mb-4 text-sm text-luxury-brown/70">
                  Select a size to see its dimensions.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((variant) => {
                    const isUnavailable =
                      variant.trackInventory === true &&
                      variant.stockQty <= 0 &&
                      variant.allowBackorder !== true;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => handleVariantSelect(variant.id)}
                        className={`px-5 py-3 border transition-all text-sm tracking-wide ${
                          selectedVariant === variant.id
                            ? 'border-luxury-gold bg-luxury-gold text-white'
                            : isUnavailable
                              ? 'border-luxury-sand bg-luxury-beige text-luxury-brown/40 cursor-not-allowed line-through'
                              : 'border-luxury-sand bg-luxury-beige hover:border-luxury-gold text-luxury-brown'
                        }`}
                     >
                        {variant.name}
                        {isUnavailable && (
                          <span className="block text-[10px] mt-1 tracking-wider uppercase">
                            Out of stock
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-10">
              <h3 className="font-serif text-lg text-luxury-charcoal mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                  className="h-12 w-12 border border-luxury-sand bg-luxury-beige text-luxury-brown transition-colors hover:border-luxury-gold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  −
                </button>

                <span className="text-xl font-serif w-16 text-center text-luxury-charcoal">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      selectedSizeVariant &&
                      selectedSizeVariant.trackInventory === true &&
                      selectedSizeVariant.allowBackorder !== true
                    ) {
                      setQuantity((current) =>
                        Math.min(
                          current + 1,
                          Math.max(0, selectedSizeVariant.stockQty),
                        ),
                      );
                      return;
                    }

                    setQuantity((current) => current + 1);
                  }}
                  disabled={
                    !!selectedSizeVariant &&
                    selectedSizeVariant.trackInventory === true &&
                    selectedSizeVariant.allowBackorder !== true &&
                    quantity >= Math.max(0, selectedSizeVariant.stockQty)
                  }
                  className="h-12 w-12 border border-luxury-sand bg-luxury-beige text-luxury-brown transition-colors hover:border-luxury-gold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {selectedSizeVariant &&
                selectedSizeVariant.trackInventory === true &&
                selectedSizeVariant.allowBackorder !== true && (
                  <p className="mt-3 text-xs text-luxury-brown/60">
                    {Math.max(0, selectedSizeVariant.stockQty)} available
                  </p>
                )}
            </div>

            {/* Add to Cart / Buy Now */}
            <div className="flex flex-col gap-4 mb-10 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={selectedVariantUnavailable}
                className="btn-luxury flex-1 px-8 py-5 text-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={selectedVariantUnavailable}
                className="flex-1 border border-luxury-gold bg-luxury-gold px-8 py-5 text-lg font-medium text-white transition-colors hover:bg-luxury-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>

              <button
                type="button"
                className="border border-luxury-sand bg-luxury-beige px-6 py-5 transition-colors hover:border-luxury-gold sm:flex-none"
                aria-label="Save to wishlist"
              >
                <span className="text-2xl text-luxury-gold">♡</span>
              </button>
            </div>

            {/* Features */}
            <div className="border-t border-luxury-sand pt-8">
              <div className="grid grid-cols-1 gap-5 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-luxury-gold">✓</span>
                  <span className="text-luxury-brown">Authentic craftsmanship</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-luxury-gold">✓</span>
                  <span className="text-luxury-brown">Worldwide shipping available</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-luxury-gold">✓</span>
                  <span className="text-luxury-brown">Premium quality guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
