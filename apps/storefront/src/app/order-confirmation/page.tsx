'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getOrder, Order } from '@/lib/api';

function getImageUrl(value: any): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  for (const key of ['url', 'src', 'imageUrl', 'thumbnail']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

function getOrderItemImage(item: any): string | null {
  const product = item?.product ?? {};
  const snapshot = item?.productSnapshot ?? {};
  const variant = item?.variantSnapshot ?? {};
  const candidates = [
    Array.isArray(product.images) ? product.images[0] : null,
    Array.isArray(product.media) ? product.media[0] : null,
    product.image,
    product.imageUrl,
    Array.isArray(snapshot.images) ? snapshot.images[0] : null,
    Array.isArray(snapshot.media) ? snapshot.media[0] : null,
    snapshot.image,
    snapshot.imageUrl,
    snapshot.thumbnail,
    Array.isArray(variant.images) ? variant.images[0] : null,
    Array.isArray(variant.media) ? variant.media[0] : null,
  ];

  for (const candidate of candidates) {
    const url = getImageUrl(candidate);
    if (url) return url;
  }
  return null;
}

function OrderItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f6efe3] via-[#eee3d0] to-[#e5d2b4] text-[#a87836]">
        <span className="font-serif text-3xl" aria-hidden="true">W</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

function formatMoney(amount: unknown, currency?: string | null): string {
  const numericAmount = Number(amount ?? 0);
  const currencyCode = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
  } catch {
    return (Number.isFinite(numericAmount) ? numericAmount : 0).toFixed(2) + ' ' + currencyCode;
  }
}

function formatOrderDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrder(id: string) {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrder(id);

        if (!active) return;
        if (data) {
          setOrder(data);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        if (!active) return;
        setError('Failed to load order');
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (orderId) {
      void loadOrder(orderId);
    } else {
      setError('Order ID not found');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-luxury-cream px-4">
        <div className="w-full max-w-md border border-luxury-sand bg-white p-10 text-center shadow-[0_18px_60px_rgba(48,43,53,0.06)]">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#e8dece] border-t-[#c99545]" aria-label="Loading" />
          <p className="font-serif text-xl text-luxury-charcoal">Preparing your order details</p>
          <p className="mt-2 text-sm text-luxury-brown">Just a moment while we bring everything together.</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-luxury-cream px-4 py-16">
        <div className="w-full max-w-md border border-luxury-sand bg-white p-8 text-center shadow-[0_18px_60px_rgba(48,43,53,0.06)] sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eee1] text-2xl text-[#a87836]" aria-hidden="true">!</div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a87836]">Wolhomes Orders</p>
          <h1 className="mb-4 font-serif text-3xl font-light text-luxury-charcoal">Order Not Found</h1>
          <p className="mb-8 text-sm leading-6 text-luxury-brown">{error || 'The order could not be found.'}</p>
          <Link href="/" className="btn-luxury inline-flex items-center justify-center px-8 py-3">Back to Home</Link>
        </div>
      </main>
    );
  }

  const currency = order.currency || 'USD';
  const items = Array.isArray(order.items) ? order.items : [];
  const orderDate = formatOrderDate(order.createdAt);
  const paymentStatus = String(order.paymentStatus || 'PENDING').replaceAll('_', ' ');
  const orderStatus = String(order.orderStatus || order.status || 'CONFIRMED').replaceAll('_', ' ');
  const address = order.shippingAddress;
  const addressLines = address
    ? [
        [address.firstName, address.lastName].filter(Boolean).join(' ').trim(),
        address.company,
        address.addressLine1,
        address.addressLine2,
        [address.city, address.stateProvince || address.state, address.postalCode].filter(Boolean).join(', '),
        address.country,
        address.phone,
      ].filter((line) => typeof line === 'string' && line.trim())
    : [];
  const confirmationEmail = order.guestEmail || (order.userId ? 'your registered email address' : 'the email address provided at checkout');

  return (
    <main className="min-h-screen bg-luxury-cream text-luxury-charcoal">
      <div className="relative overflow-hidden border-b border-luxury-sand bg-gradient-to-br from-white via-[#fbf8f3] to-[#f0e5d3]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[#c99545]/20" />
        <div className="pointer-events-none absolute -right-4 -top-8 h-48 w-48 rounded-full border border-[#c99545]/15" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#d5b16f] bg-white shadow-[0_8px_24px_rgba(169,121,52,0.12)]">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#a87836]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m5 12.5 4.2 4.2L19.5 6.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a87836]">Wolhomes · Order Received</p>
            <h1 className="font-serif text-4xl font-light tracking-tight text-luxury-charcoal sm:text-6xl">Order Confirmed</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-luxury-brown sm:text-base">
              Thank you for choosing Wolhomes. Your order details are below, ready whenever you need them.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <span className="border border-[#d8c7a8] bg-white/80 px-4 py-2 text-[#5d4a2b]">
                Order <strong className="ml-1 font-semibold">{order.orderNumber}</strong>
              </span>
              <span className="border border-luxury-sand bg-white/80 px-4 py-2 text-luxury-brown">
                Status <strong className="ml-1 font-semibold text-luxury-charcoal">{orderStatus}</strong>
              </span>
              <span className="border border-luxury-sand bg-white/80 px-4 py-2 text-luxury-brown">
                Payment <strong className="ml-1 font-semibold text-luxury-charcoal">{paymentStatus}</strong>
              </span>
            </div>
            {orderDate && <p className="mt-3 text-xs text-luxury-brown">Placed on {orderDate}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.4fr_0.85fr]">
          <section className="overflow-hidden border border-luxury-sand bg-white shadow-[0_14px_42px_rgba(48,43,53,0.045)]">
            <div className="flex items-end justify-between gap-4 border-b border-luxury-sand px-5 py-5 sm:px-7">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a87836]">Your selection</p>
                <h2 className="font-serif text-2xl text-luxury-charcoal">Order Details</h2>
              </div>
              <span className="whitespace-nowrap text-xs text-luxury-brown">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="divide-y divide-luxury-sand px-5 sm:px-7">
              {items.map((item: any, idx: number) => {
                const product = item?.product ?? {};
                const snapshot = item?.productSnapshot ?? {};
                const name = product.name || snapshot.name || item?.name || 'Product';
                const image = getOrderItemImage(item);
                const variant = item?.variant?.name || item?.variantSnapshot?.name || snapshot.variant?.name;
                const quantity = Number(item?.quantity ?? 0);
                const lineTotal = Number(item?.totalPrice ?? 0);
                const unitPrice = Number(item?.unitPrice ?? 0);

                return (
                  <div key={item?.id || idx} className="group flex gap-4 py-5 sm:gap-5 sm:py-6">
                    <div className="h-24 w-24 shrink-0 overflow-hidden border border-luxury-sand bg-[#f5eee3] sm:h-28 sm:w-28">
                      <OrderItemImage src={image} alt={name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base leading-6 text-luxury-charcoal sm:text-lg">{name}</h3>
                      {variant && <p className="mt-1 text-xs text-luxury-brown">Variant: {variant}</p>}
                      <p className="mt-2 text-xs text-luxury-brown">Quantity: {quantity}</p>
                      <p className="mt-1 text-xs text-luxury-brown">{formatMoney(unitPrice, currency)} each</p>
                    </div>
                    <div className="shrink-0 pt-1 text-right">
                      <p className="text-sm font-semibold text-luxury-charcoal">{formatMoney(lineTotal, currency)}</p>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="py-8 text-sm text-luxury-brown">Item details are not available for this order.</p>
              )}
            </div>

            <div className="border-t border-luxury-sand bg-[#fcfaf7] px-5 py-6 sm:px-7">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-luxury-brown">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between gap-4 text-luxury-brown">
                  <span>Shipping</span>
                  <span>{formatMoney(order.shippingCost, currency)}</span>
                </div>
                <div className="flex justify-between gap-4 text-luxury-brown">
                  <span>Tax</span>
                  <span>{formatMoney(order.taxAmount, currency)}</span>
                </div>
                {Number(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between gap-4 text-[#9c5f34]">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discountAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-luxury-sand pt-4 font-serif text-xl text-luxury-charcoal">
                  <span>Total</span>
                  <span>{formatMoney(order.total, currency)}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            {addressLines.length > 0 ? (
              <section className="border border-luxury-sand bg-white p-5 shadow-[0_14px_42px_rgba(48,43,53,0.035)] sm:p-6">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a87836]">Delivery destination</p>
                <h2 className="mb-4 font-serif text-xl text-luxury-charcoal">Shipping Address</h2>
                <div className="space-y-1 text-sm leading-6 text-luxury-brown">
                  {addressLines.map((line, index) => <p key={index}>{line}</p>)}
                </div>
              </section>
            ) : (
              <section className="border border-luxury-sand bg-white p-5 sm:p-6">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a87836]">Delivery destination</p>
                <h2 className="font-serif text-xl text-luxury-charcoal">Shipping Address</h2>
                <p className="mt-3 text-sm leading-6 text-luxury-brown">Address details will be available in your order record.</p>
              </section>
            )}

            <section className="relative overflow-hidden border border-[#d8c29d] bg-gradient-to-br from-[#f7efdf] to-[#fffdfa] p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#c99545]/20" />
              <p className="relative mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a87836]">A quick note</p>
              <h2 className="relative font-serif text-xl text-luxury-charcoal">What happens next?</h2>
              <p className="relative mt-3 text-sm leading-6 text-luxury-brown">
                We’ll send your order updates to <strong className="break-words text-luxury-charcoal">{confirmationEmail}</strong>. Once your parcel is dispatched, tracking details will be available in your order page.
              </p>
              <p className="relative mt-3 text-xs leading-5 text-luxury-brown">
                Keep your order number handy: <strong className="text-luxury-charcoal">{order.orderNumber}</strong>
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/orders" className="btn-luxury inline-flex items-center justify-center px-8 py-4 text-sm">
            View Order Details
          </Link>
          <Link href="/products" className="btn-luxury-outline inline-flex items-center justify-center px-8 py-4 text-sm">
            Continue Shopping
          </Link>
        </div>
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.18em] text-[#998c7b]">Made for meaningful spaces · Wolhomes</p>
      </div>
    </main>
  );
}
