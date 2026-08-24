'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWishlist, removeFromWishlist, moveWishlistToCart, clearWishlist, isAuthenticated, Wishlist } from '@/lib/api';

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/wishlist');
      return;
    }

    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      setLoading(true);
      setError(null);
      const data = await getWishlist();
      setWishlist(data);
    } catch (err) {
      setError('Failed to load wishlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm('Remove this item from your wishlist?')) return;

    setProcessingItems(prev => new Set(prev).add(itemId));

    const result = await removeFromWishlist(itemId);

    if (result.success) {
      await loadWishlist();
    } else {
      setError(result.message || 'Failed to remove item');
    }

    setProcessingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleMoveToCart(itemId: string) {
    setProcessingItems(prev => new Set(prev).add(itemId));

    const result = await moveWishlistToCart(itemId, 1);

    if (result.success) {
      await loadWishlist();
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-24 right-4 bg-luxury-gold text-white px-6 py-3 rounded shadow-lg z-50';
      successMsg.textContent = 'Added to cart!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } else {
      setError(result.message || 'Failed to add to cart');
    }

    setProcessingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleClearWishlist() {
    if (!confirm('Clear all items from your wishlist?')) return;

    const result = await clearWishlist();

    if (result.success) {
      await loadWishlist();
    } else {
      setError(result.message || 'Failed to clear wishlist');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading wishlist...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">My Wishlist</h1>
          <p className="text-luxury-brown text-lg">
            {wishlist?.items.length || 0} {wishlist?.items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {error && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
            {error}
          </div>
        )}

        {!wishlist || wishlist.items.length === 0 ? (
          // Empty Wishlist State
          <div className="text-center py-20">
            <div className="mb-8">
              <span className="text-8xl">♡</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">Your wishlist is empty</h2>
            <p className="text-luxury-brown mb-8 text-lg max-w-md mx-auto">
              Save your favorite pieces and come back to them anytime
            </p>
            <Link href="/products" className="btn-luxury px-10 py-4 inline-block">
              Explore Collection →
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Actions */}
            <div className="flex justify-between items-center mb-8">
              <Link href="/account" className="text-luxury-gold hover:text-luxury-darkGold underline">
                ← Back to Account
              </Link>

              {wishlist.items.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  className="text-sm text-luxury-brown hover:text-luxury-terracotta transition-colors underline"
                >
                  Clear Wishlist
                </button>
              )}
            </div>

            {/* Wishlist Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {wishlist.items.map((item) => {
                const mainImage = item.product.media?.find((m) => m.isMain) || item.product.media?.[0];
                const displayPrice = parseFloat(String(item.product.salePrice || item.product.regularPrice));
                const regularPrice = parseFloat(String(item.product.regularPrice));
                const hasDiscount = item.product.salePrice && parseFloat(String(item.product.salePrice)) < regularPrice;
                const isProcessing = processingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`border border-luxury-sand bg-luxury-beige transition-opacity ${
                      isProcessing ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <Link href={`/products/${item.product.slug}`} className="block relative">
                      <div className="aspect-square overflow-hidden bg-luxury-cream">
                        {mainImage?.url ? (
                          <img
                            src={mainImage.url}
                            alt={mainImage.altText || item.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-luxury-beige to-luxury-sand flex items-center justify-center">
                            <span className="text-luxury-brown/40 text-sm">No image</span>
                          </div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-4 right-4 bg-luxury-gold text-white px-3 py-1 text-xs font-serif tracking-wider">
                            SALE
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="block mb-3"
                      >
                        <h3 className="text-lg font-serif text-luxury-charcoal mb-2 line-clamp-2 hover:text-luxury-brown transition-colors">
                          {item.product.name}
                        </h3>

                        {item.variant && (
                          <p className="text-sm text-luxury-brown/70 mb-2">
                            {item.variant.name}
                          </p>
                        )}

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
                      </Link>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleMoveToCart(item.id)}
                          disabled={isProcessing}
                          className="flex-1 btn-luxury px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isProcessing}
                          className="border border-luxury-sand bg-luxury-cream px-3 py-2 hover:border-luxury-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Remove from wishlist"
                        >
                          <span className="text-luxury-terracotta">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Share Wishlist */}
            <div className="mt-16 border border-luxury-sand bg-luxury-beige p-8 text-center">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-4">Share Your Wishlist</h2>
              <p className="text-luxury-brown mb-6 max-w-md mx-auto">
                Share your curated collection with friends and family
              </p>
              <button className="btn-luxury-outline px-8 py-3">
                Get Shareable Link →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
