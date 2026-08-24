'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, updateCartItem, removeCartItem, clearCart, Cart, CartItem } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError('Failed to load cart');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity < 1) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    const result = await updateCartItem(itemId, { quantity: newQuantity });

    if (result.success) {
      await loadCart();
    } else {
      setError(result.message || 'Failed to update quantity');
    }

    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm('Remove this item from cart?')) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    const result = await removeCartItem(itemId);

    if (result.success) {
      await loadCart();
    } else {
      setError(result.message || 'Failed to remove item');
    }

    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleClearCart() {
    if (!confirm('Clear all items from cart?')) return;

    const result = await clearCart();

    if (result.success) {
      await loadCart();
    } else {
      setError(result.message || 'Failed to clear cart');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading cart...</span>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart?.items.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0) || 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">Shopping Cart</h1>
          <p className="text-luxury-brown text-lg">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {error && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-20">
            <div className="mb-8">
              <span className="text-8xl text-luxury-gold/30">🛒</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">Your cart is empty</h2>
            <p className="text-luxury-brown mb-8 text-lg">
              Discover our curated collection of luxury pieces
            </p>
            <Link href="/products" className="btn-luxury px-10 py-4">
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={updatingItems.has(item.id)}
                  />
                ))}
              </div>

              {/* Clear Cart Button */}
              {cart.items.length > 0 && (
                <div className="mt-8 pt-8 border-t border-luxury-sand">
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-luxury-brown hover:text-luxury-terracotta transition-colors underline"
                  >
                    Clear cart
                  </button>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-luxury-sand">
                  <div className="flex justify-between text-luxury-brown">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-luxury-brown text-sm">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-luxury-brown text-sm">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-serif text-luxury-charcoal mb-8">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    // Check if user is authenticated
                    const authenticated = typeof window !== 'undefined' && localStorage.getItem('accessToken');
                    if (authenticated) {
                      router.push('/checkout');
                    } else {
                      router.push('/auth/login?redirect=/checkout');
                    }
                  }}
                  className="btn-luxury w-full px-8 py-4 text-base mb-4"
                >
                  Proceed to Checkout →
                </button>

                <Link
                  href="/products"
                  className="block text-center text-sm text-luxury-brown hover:text-luxury-gold transition-colors underline"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-10 pt-8 border-t border-luxury-sand space-y-4">
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <span className="text-xl text-luxury-gold">✓</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <span className="text-xl text-luxury-gold">✓</span>
                    <span>Free worldwide shipping</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <span className="text-xl text-luxury-gold">✓</span>
                    <span>Easy returns within 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating: boolean;
}) {
  const mainImage = item.product.media?.find((m) => m.isMain) || item.product.media?.[0];
  const itemTotal = item.priceSnapshot * item.quantity;

  return (
    <div className={`border border-luxury-sand bg-luxury-beige p-6 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex gap-6">
        {/* Product Image */}
        <Link href={`/products/${item.product.slug}`} className="shrink-0">
          <div className="w-32 h-32 border border-luxury-sand bg-luxury-cream overflow-hidden">
            {mainImage?.url ? (
              <img
                src={mainImage.url}
                alt={mainImage.altText || item.product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-luxury-beige to-luxury-sand flex items-center justify-center">
                <span className="text-luxury-brown/40 text-xs">No image</span>
              </div>
            )}
          </div>
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-4 mb-3">
            <div className="flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                className="text-lg font-serif text-luxury-charcoal hover:text-luxury-brown transition-colors line-clamp-2"
              >
                {item.product.name}
              </Link>
              {item.variant && (
                <p className="text-sm text-luxury-brown/70 mt-1">
                  Variant: {item.variant.name}
                </p>
              )}
              <p className="text-sm text-luxury-brown/50 mt-1">
                SKU: {item.variant?.sku || item.product.sku}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-serif text-luxury-charcoal">
                ${itemTotal.toFixed(2)}
              </p>
              <p className="text-sm text-luxury-brown/70 mt-1">
                ${item.priceSnapshot.toFixed(2)} each
              </p>
            </div>
          </div>

          {/* Quantity Controls & Remove */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="h-10 w-10 border border-luxury-sand bg-luxury-cream text-luxury-brown transition-colors hover:border-luxury-gold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="text-lg font-serif w-12 text-center text-luxury-charcoal">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating}
                className="h-10 w-10 border border-luxury-sand bg-luxury-cream text-luxury-brown transition-colors hover:border-luxury-gold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              onClick={() => onRemove(item.id)}
              disabled={isUpdating}
              className="text-sm text-luxury-brown hover:text-luxury-terracotta transition-colors underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
