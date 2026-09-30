'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, ProductMedia, addToCart, getProducts } from '@/lib/api';
import { ProductRecommendations } from '@/components/ProductRecommendations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1';

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

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
  useEffect(() => {
    if (!product) return;

    async function loadRecommendations() {
      try {
        const items = await getProducts(12);
        setRecommendations(items.filter((item) => item.id !== product?.id));
      } catch {
        setRecommendations([]);
      }
    }

    loadRecommendations();
  }, [product]);


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

  const reviews = product.reviews ?? [];
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  const topReviews = [...reviews]
    .sort(
      (a, b) =>
        Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter(
      (review) => Number(review.rating || 0) === rating,
    ).length;

    return {
      rating,
      count,
      percentage: reviewCount > 0 ? (count / reviewCount) * 100 : 0,
    };
  });

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

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Wolhomes Product',
      text: 'Discover this piece from Wolhomes.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Product link copied to clipboard.');
      }
    } catch {
      // User cancelled the native share dialog.
    }
  };

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

    setCartMessage(null);
    setCartError(null);

    if (selectedVariantUnavailable) {
      setCartError('This selection is currently out of stock.');
      return;
    }

    if (!validateSelectedQuantity()) return;

    const result = await addToCart({
      productId: product.id,
      variantId: selectedVariant,
      quantity,
    });

    if (result.success) {
      setCartMessage('Added to cart successfully.');
      window.dispatchEvent(new CustomEvent('wolhomes:cart-updated'));
    } else {
      setCartError(result.message || 'Unable to add this product to your cart.');
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
      window.dispatchEvent(new CustomEvent('wolhomes:cart-updated'));
      router.push('/checkout');
    } else {
      setCartError(result.message || 'Unable to add this product to your cart.');
    }
  };

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-black/10 bg-white px-4 py-3 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-luxury-brown">
            <Link href="/" className="hover:text-luxury-gold transition-colors">
              Home
            </Link>
            <span className="text-black/20">/</span>
            <Link href="/products" className="hover:text-luxury-gold transition-colors">
              Products
            </Link>
            <span className="text-black/20">/</span>
            <span className="text-luxury-charcoal font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 sm:gap-10 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="relative mb-4 aspect-[4/5] overflow-hidden border border-luxury-sand bg-luxury-beige sm:aspect-[3/4]">
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
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="pointer-events-none absolute bottom-4 right-4 bg-black/55 px-3 py-2 text-xs uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                    View fullscreen
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-luxury-beige to-luxury-sand">
                  <div className="text-center">
                    <div className="mb-4 text-6xl text-luxury-gold"></div>
                    <span className="font-serif text-lg text-luxury-brown">
                      No image available
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-luxury-brown/70">
                    Need a different size? <Link href="/custom-design" className="font-medium underline underline-offset-2 transition-colors hover:text-luxury-gold">Request a custom quote ?</Link>
                  </p>
                </div>
              )}

              {activeMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-white/60 bg-black/40 px-3 py-3 text-xl text-white backdrop-blur-sm transition hover:bg-black/60"
                    aria-label="Previous product image"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-white/60 bg-black/40 px-3 py-3 text-xl text-white backdrop-blur-sm transition hover:bg-black/60"
                    aria-label="Next product image"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}

              {hasDiscount && (
                <div className="absolute right-6 top-6 z-10 bg-luxury-gold px-4 py-2 font-serif text-sm tracking-wider text-white">
                  SALE
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsWishlisted((current) => !current)}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm backdrop-blur-sm transition hover:scale-105"
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isWishlisted}
              >
                {isWishlisted ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
                  </svg>
                )}
              </button>
             </div>
             {activeMedia.length > 1 && (
               <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {activeMedia.map((image, index) => {
                  const isSelected = image.id === selectedImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageId(image.id)}
                       className={`h-20 w-20 shrink-0 overflow-hidden bg-luxury-beige transition-all ${
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
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                   <img
                     src={selectedImage.url}
                     alt={selectedImage.altText || product.name}
                     onClick={(event) => event.stopPropagation()}
                     className="max-h-[85vh] max-w-[90vw] object-contain"
                    />

                {activeMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70"
                    aria-label="Previous product image"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70"
                    aria-label="Next product image"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}

               </div>
             )}
          {/* Details */}
          <div className="lg:max-w-[560px]">
            <div className="mb-3">
              <h1 className="font-serif text-[30px] font-normal leading-[1.15] text-luxury-charcoal sm:text-[32px]">
                {product.name}
              </h1>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4 py-2">
              <div
                className="flex items-center gap-1"
                aria-label={reviewCount > 0 ? 'Rated ' + averageRating.toFixed(1) + ' out of 5' : 'No reviews yet'}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.round(averageRating) ? 'text-luxury-gold text-lg' : 'text-black/15 text-lg'}
                  >
                    &#9733;
                  </span>
                ))}
              </div>
              <span className="rounded-full border border-[#c99545]/40 bg-[#c99545]/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[#7a5a2c] shadow-sm">
                {reviewCount > 0
                  ? averageRating.toFixed(1) + ' · ' + reviewCount + ' ' + (reviewCount === 1 ? 'Review' : 'Reviews')
                  : 'No Reviews Yet'}
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="shrink-0 border border-luxury-charcoal px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-charcoal transition hover:bg-luxury-charcoal hover:text-white"
                aria-label="Share this product"
              >
                Share
              </button>
            </div>


            <div className="mb-3 flex items-baseline gap-3 pb-2">
              <span className="font-serif text-3xl font-bold text-luxury-gold">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-light text-luxury-brown/45 line-through">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>

            {product.deliveryInfo && (
              <div className="mb-4 py-2">
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-luxury-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
                  </svg>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-luxury-charcoal">
                      Estimated Delivery
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-luxury-charcoal">
                      {product.deliveryInfo}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(product.material || product.style || product.color || product.productNote) && (
              <div className="mb-4 py-2">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-luxury-charcoal">Product Note</p>
                <div className="space-y-1 text-sm leading-6 text-luxury-brown">
                  {product.material && <p><strong>Material:</strong> {product.material}</p>}
                  {product.style && <p><strong>Style:</strong> {product.style}</p>}
                  {product.color && <p><strong>Color:</strong> {product.color}</p>}
                  {product.productNote && <p className="pt-2">{product.productNote}</p>}
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-start gap-6">
              {product.variants && product.variants.length > 0 && (
                <div className="w-[260px] max-w-full">
                  <label htmlFor="product-size" className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-luxury-charcoal">
                    Size
                  </label>

                  <div className="relative">
                    <select
                      id="product-size"
                      value={selectedVariant ?? ''}
                      onChange={(event) => handleVariantSelect(event.target.value)}
                      className="w-full appearance-none rounded-md border-4 border-[#c6534c] bg-white px-4 py-3.5 pr-10 text-base font-bold text-luxury-charcoal outline-none focus:border-[#b94740]"
                    >
                      {product.variants.map((variant) => {
                        const isUnavailable =
                          variant.trackInventory === true &&
                          variant.stockQty <= 0 &&
                          variant.allowBackorder !== true;

                        return (
                          <option key={variant.id} value={variant.id} disabled={isUnavailable}>
                            {variant.name}{isUnavailable ? ' - Out of stock' : ''}
                          </option>
                        );
                      })}
                    </select>

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-[#c6534c]">
                      &#8964;
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-luxury-brown/70">
                    Need a different size? <Link href="/custom-design" className="font-medium underline underline-offset-2 hover:text-luxury-gold">Request a custom quote ?</Link>
                  </p>
                </div>
              )}

              <div className="shrink-0">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-luxury-charcoal">
                  Quantity
                </h3>

                <div className="flex h-[52px] items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-l-md border-2 border-[#c6534c] bg-[#c6534c] text-2xl font-bold text-white hover:bg-[#b94740] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    -
                  </button>

                  <span className="flex h-[52px] w-[64px] shrink-0 items-center justify-center border-y-2 border-[#c6534c] bg-white text-2xl font-serif font-bold text-luxury-charcoal">
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
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-r-md border-2 border-[#c6534c] bg-[#c6534c] text-2xl font-bold text-white hover:bg-[#b94740] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    +
                  </button>
                </div>

                {selectedSizeVariant &&
                  selectedSizeVariant.trackInventory === true &&
                  selectedSizeVariant.allowBackorder !== true && (
                    <p className="mt-1 text-[10px] text-luxury-brown/60">
                      {Math.max(0, selectedSizeVariant.stockQty)} available
                    </p>
                  )}
              </div>
            </div>
            {cartMessage && (
              <div className="mb-4 border border-green-700/20 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
                {cartMessage}
              </div>
            )}
            {cartError && (
              <div className="mb-4 border border-[#bf4e48]/30 bg-[#bf4e48]/5 px-4 py-3 text-sm text-[#8f322d]" role="alert">
                {cartError}
              </div>
            )}

            <div className="mb-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedVariantUnavailable}
                  className="border-2 border-black bg-black px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-luxury-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to Cart
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={selectedVariantUnavailable}
                  className="border-2 border-[#c6534c] bg-[#c6534c] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#b94740] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

            </div>
            {(product.deliveryInfo || product.shippingInfo || product.returnsInfo || product.careInstructions || product.origin) && (
              <div className="mb-3">
                {[
                  ['Shipping', product.shippingInfo],
                  ['Returns', product.returnsInfo],
                  ['Care', product.careInstructions],
                  ['Origin', product.origin],
                ].filter(([, value]) => value).map(([title, value]) => (
                  <details key={title} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium uppercase tracking-[0.14em] text-luxury-charcoal">
                      <span>{title}</span>
                      <span className="text-xl font-light text-luxury-gold transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="pb-5 pr-8 text-sm leading-7 text-luxury-brown/80">
                      {title === "Product Note" && (
                        <div className="mb-4 space-y-1">
                          {product.material && <p><strong>Material:</strong> {product.material}</p>}
                          {product.style && <p><strong>Style:</strong> {product.style}</p>}
                          {product.color && <p><strong>Color:</strong> {product.color}</p>}
                        </div>
                      )}
                      {value}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Customer Reviews — positioned in the details column */}
            {reviewCount > 0 && (
              <details className="group mb-5 border-y border-black/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-charcoal">
                        Customer Reviews
                      </h2>
                      <span className="text-[10px] text-luxury-brown">
                        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm tracking-[0.08em] text-luxury-gold">
                        {'★'.repeat(Math.max(0, Math.min(5, Math.round(averageRating))))}
                      </span>
                      <span className="text-[11px] font-semibold text-luxury-charcoal">
                        {averageRating.toFixed(1)} / 5
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-luxury-brown/60">
                        Verified customer feedback
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xl font-light text-luxury-gold transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>

                <div className="border-t border-black/5 pb-5 pt-5">
                  <div className="grid gap-5 rounded-sm bg-luxury-cream/60 p-4 sm:grid-cols-[150px_1fr] sm:p-5">
                    <div className="text-center sm:border-r sm:border-black/10 sm:pr-5">
                      <div className="font-serif text-4xl text-luxury-charcoal">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="mt-1 text-sm tracking-[0.08em] text-luxury-gold">
                        {'★'.repeat(Math.max(0, Math.min(5, Math.round(averageRating))))}
                      </div>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-luxury-brown/65">
                        Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-3">
                          <span className="w-7 text-[10px] font-semibold text-luxury-brown">
                            {item.rating}★
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/8">
                            <div
                              className="h-full rounded-full bg-luxury-gold transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="w-5 text-right text-[10px] text-luxury-brown/70">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-0">
                    {topReviews.map((review) => (
                      <article
                        key={review.id}
                        className="border-b border-black/7 py-4 first:pt-1 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] tracking-[0.06em] text-luxury-gold">
                                {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}
                              </span>
                              <span className="text-[10px] text-luxury-brown">
                                {Number(review.rating || 0).toFixed(0)}/5
                              </span>
                              {review.isFeatured && (
                                <span className="rounded-full border border-luxury-gold/30 bg-luxury-gold/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-luxury-brown">
                                  Featured
                                </span>
                              )}
                            </div>
                            {review.title && (
                              <h3 className="mt-1.5 text-sm font-semibold text-luxury-charcoal">
                                {review.title}
                              </h3>
                            )}
                            {review.content && (
                              <p className="mt-1 text-sm leading-6 text-luxury-brown">
                                {review.content}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-luxury-charcoal">
                              {review.customerName || 'Customer'}
                            </p>
                            <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-luxury-brown/50">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {reviewCount > 5 && (
                    <p className="mt-4 border-t border-black/5 pt-4 text-center text-[10px] uppercase tracking-[0.12em] text-luxury-brown/55">
                      Showing 5 featured/latest reviews
                    </p>
                  )}
                </div>
              </details>
            )}
           </div>

          </div>
        </div>

        <div className="mt-6">
          <ProductRecommendations title="Recommended Products" products={recommendations.slice(0, 8)} />
          <ProductRecommendations title="Top Products" products={recommendations.slice(0, 8).reverse()} />
          <ProductRecommendations title="Recently Viewed" products={recommendations.slice(0, 8)} />
        </div>

      </div>
    </main>
  );
}







































