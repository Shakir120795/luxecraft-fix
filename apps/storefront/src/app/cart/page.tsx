'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, updateCartItem, removeCartItem, clearCart, getAddresses, getCartTotals, getShippingMethods, isAuthenticated, Cart, CartItem, CartTotals } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState('');
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState<number | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
    loadShippingCountry();
  }, []);

  async function loadShippingCountry() {
    try {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        setCountry('');
        return;
      }

      const addresses = await getAddresses();
      const shippingAddress = addresses.find((address) => address.isDefault) || addresses.find((address) => address.type === 'SHIPPING' || address.type === 'BOTH');
      setCountry(shippingAddress?.country?.toUpperCase() || '');
    } catch (err) {
      console.error('Failed to load shipping country:', err);
      setCountry('');
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadShippingData() {
      if (!cart || cart.items.length === 0 || !country) {
        setTotals(null);
        setEstimatedDelivery(null);
        return;
      }

      const subtotal = cart.items.reduce(
        (sum, item) => sum + (Number(item.priceSnapshot) || 0) * Number(item.quantity),
        0,
      );

      try {
        const [cartTotals, methods] = await Promise.all([
          getCartTotals(country),
          getShippingMethods({ country, orderValue: subtotal }),
        ]);

        if (cancelled) return;

        setTotals(cartTotals);

        const available = methods.filter((method) => method.rate >= 0);
        const cheapest = [...available].sort((a, b) => a.rate - b.rate)[0];
        setEstimatedDelivery(cheapest?.estimatedDays ?? null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load shipping data:', err);
        setTotals(null);
        setEstimatedDelivery(null);
      }
    }

    void loadShippingData();

    return () => {
      cancelled = true;
    };
  }, [cart, country]);

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

  const subtotal = cart?.items.reduce((sum, item) => sum + (Number(item.priceSnapshot) || 0) * Number(item.quantity), 0) || 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
  const shipping = totals?.shipping ?? 0;
  const tax = totals?.tax ?? 0;
  const total = totals?.total ?? subtotal;

  return (
    <main className="min-h-screen bg-[#f8f6f2] font-sans">
      {/* Header */}
      <div className="border-b border-[#ded8d0] bg-[#f8f6f2] px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-1 font-serif text-3xl font-light tracking-tight text-luxury-charcoal sm:text-4xl">Shopping Cart</h1>
          <p className="text-sm text-luxury-brown">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-20">
            <div className="mb-8">
              <span className="text-8xl text-luxury-gold/30">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">Your cart is empty</h2>
            <p className="text-luxury-brown mb-8 text-lg">
              Discover our curated collection of luxury pieces
            </p>
            <Link href="/products" className="btn-luxury px-10 py-4">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            {/* Cart Items */}
            <div className="min-w-0">
              <div className="overflow-hidden rounded-lg border border-[#ded8d0] bg-white">
                <div className="border-b border-[#ded8d0] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#302b35]">LuxeCraft</div>
                    <button type="button" className="text-xs text-[#59535b]">...</button>
                  </div>
                </div>
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
            <div className="min-w-0">
              <div className="sticky top-24 rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-7 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold text-[#2f2933]">Order Summary</h2>

                <div className="mb-6 space-y-4 border-b border-[#ded8d0] pb-6">
                  <div className="flex justify-between text-luxury-brown">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-luxury-brown text-sm">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-luxury-brown text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-5 rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3 text-sm text-[#59535b]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Estimated delivery</span>
                    <span className="font-medium text-[#2f2933]">{estimatedDelivery ? `${estimatedDelivery} business days` : country ? "Shipping unavailable" : "Add a shipping address at checkout"}</span>
                  </div>
                </div>

                <div className="mb-7 flex justify-between text-xl font-semibold text-[#2f2933]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
                  className="mb-4 w-full rounded-md bg-[#302b35] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#211e24]"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/products"
                  className="block text-center text-sm font-medium text-[#302b35] underline underline-offset-4 transition hover:text-black"
                >
                  Continue Shopping
                </Link>


                <div className="mt-6 border-t border-[#ded8d0] pt-5">
                  <div className="text-sm font-semibold text-[#302b35]">Secure options in checkout</div>
                  <div className="mt-3 flex w-full items-center justify-between gap-2">
                    <span className="flex h-8 w-12 items-center justify-center rounded border border-[#ddd7cf] bg-white p-1"><img src="https://cdn.simpleicons.org/visa" alt="Visa" className="h-6 w-11 object-contain" /></span>
                    <span className="flex h-8 w-12 items-center justify-center rounded border border-[#ddd7cf] bg-white p-1"><img src="https://cdn.simpleicons.org/mastercard" alt="Mastercard" className="h-6 w-11 object-contain" /></span>
                    <span className="flex h-8 w-12 items-center justify-center rounded border border-[#ddd7cf] bg-white p-1"><img src="https://cdn.simpleicons.org/americanexpress" alt="American Express" className="h-6 w-11 object-contain" /></span>
                    <span className="flex h-8 w-12 items-center justify-center rounded border border-[#ddd7cf] bg-white p-1"><svg viewBox="0 0 48 24" className="h-6 w-11" aria-label="UPI"><path d="M4 15 9 5h5l-5 10H4Z" fill="#5b8db8"/><path d="m13 15 5-10h5l-5 10h-5Z" fill="#39a94a"/><path d="m22 15 5-10h5l-5 10h-5Z" fill="#f4a21e"/><text x="31" y="15" font-size="8" font-family="Arial" font-weight="700" fill="#2b4e8a">UPI</text></svg></span>
                  </div>
                  
                  <div className="mt-5 rounded-md border border-[#ded8d0] bg-[#faf9f7] p-4"><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#59535b]">Coupon code</label><div className="flex gap-2"><input type="text" placeholder="Enter coupon code" className="min-w-0 flex-1 rounded-md border border-[#ded8d0] bg-white px-3 py-2.5 text-sm text-[#302b35] outline-none transition focus:border-[#302b35]" /><button type="button" className="rounded-md bg-[#302b35] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#211e24]">Apply</button></div><p className="mt-2 text-xs text-[#6a636b]">Coupon discounts are applied at checkout.</p></div>                    <p className="mt-2 text-xs text-[#6a636b]">Local taxes included (where applicable)</p>
                </div>
                {/* Trust Badges */}
                <div className="mt-7 border-t border-black/10 pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Free worldwide shipping</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-luxury-brown">
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
  const price = Number(item.priceSnapshot) || 0;
  const itemTotal = price * Number(item.quantity);

  return (
    <div className={`border-b border-[#ded8d0] p-4 transition-opacity sm:p-5 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex gap-4 sm:gap-5">
        {/* Product Image */}
        <Link href={`/products/${item.product.slug}`} className="shrink-0">
          <div className="h-28 w-28 overflow-hidden rounded-md border border-[#ded8d0] bg-[#f6f2ec] sm:h-32 sm:w-32">
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
            </div>

            <div className="text-right">
              <p className="text-xl font-serif text-luxury-charcoal">
                ${itemTotal.toFixed(2)}
              </p>
              <p className="text-sm text-luxury-brown/70 mt-1">
                ${price.toFixed(2)} each
              </p>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={isUpdating || item.quantity <= 1} className="h-8 w-8 border border-[#cfc8c0] bg-white text-base font-light text-[#302b35] transition hover:bg-[#302b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">-</button>
              <span className="w-8 text-center text-sm text-[#302b35]">{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} disabled={isUpdating} className="h-8 w-8 border border-[#cfc8c0] bg-white text-base font-light text-[#302b35] transition hover:bg-[#302b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">+</button>
            </div>
            <div className="mt-3 flex w-full items-center justify-between text-xs font-medium text-[#59535b]">
              <Link href={`/products/${item.product.slug}`} className="border border-[#b94b43] bg-[#b94b43] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#a83f38] hover:border-[#a83f38]">Edit</Link>
              <button type="button" className="border border-[#b94b43] bg-[#b94b43] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#a83f38] hover:border-[#a83f38]">Save for later</button>
              <button type="button" onClick={() => onRemove(item.id)} disabled={isUpdating} className="border border-[#b94b43] bg-[#b94b43] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#a83f38] hover:border-[#a83f38] disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









