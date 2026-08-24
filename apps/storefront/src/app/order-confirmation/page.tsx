'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getOrder, Order } from '@/lib/api';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    } else {
      setError('Order ID not found');
      setLoading(false);
    }
  }, [orderId]);

  async function loadOrder(id: string) {
    try {
      setLoading(true);
      const data = await getOrder(id);
      
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading order...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-4">Order Not Found</h1>
          <p className="text-luxury-brown mb-8">{error || 'The order could not be found'}</p>
          <Link href="/" className="btn-luxury px-10 py-4 inline-block">
            Back to Home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-7xl">✓</span>
          </div>
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-4">Order Confirmed</h1>
          <p className="text-luxury-brown text-lg mb-2">
            Thank you for your order!
          </p>
          <p className="text-luxury-brown">
            Order number: <strong>{order.orderNumber}</strong>
          </p>
        </div>

        {/* Order Details */}
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10 mb-8">
          <h2 className="text-2xl font-serif text-luxury-charcoal mb-6 pb-6 border-b border-luxury-sand">
            Order Details
          </h2>

          {/* Order Items */}
          <div className="space-y-6 mb-8">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4">
                <div className="w-20 h-20 border border-luxury-sand bg-luxury-cream shrink-0">
                  {item.productSnapshot?.media?.[0]?.url ? (
                    <img 
                      src={item.productSnapshot.media[0].url} 
                      alt={item.productSnapshot.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-luxury-sand" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-luxury-charcoal">{item.productSnapshot?.name || 'Product'}</h3>
                  <p className="text-sm text-luxury-brown">Quantity: {item.quantity}</p>
                  {item.variantSnapshot && (
                    <p className="text-sm text-luxury-brown">Variant: {item.variantSnapshot.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-serif text-luxury-charcoal">${item.totalPrice.toFixed(2)}</p>
                  <p className="text-sm text-luxury-brown">${item.unitPrice.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-luxury-sand pt-6 space-y-3">
            <div className="flex justify-between text-luxury-brown">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-luxury-brown">
              <span>Shipping</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-luxury-brown">
              <span>Tax</span>
              <span>${order.taxAmount.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-luxury-terracotta">
                <span>Discount</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-serif text-luxury-charcoal pt-3 border-t border-luxury-sand">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="border border-luxury-sand bg-luxury-beige p-8 mb-8">
            <h2 className="text-xl font-serif text-luxury-charcoal mb-4">Shipping Address</h2>
            <div className="text-luxury-brown">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="border border-luxury-gold/30 bg-luxury-gold/5 p-8 mb-8">
          <h2 className="text-xl font-serif text-luxury-charcoal mb-4">What's Next?</h2>
          <ul className="space-y-3 text-luxury-brown">
            <li className="flex items-start gap-3">
              <span className="text-luxury-gold mt-1">1.</span>
              <span>You will receive an order confirmation email at <strong>{order.userId ? 'your registered email' : order.guestEmail}</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-luxury-gold mt-1">2.</span>
              <span>We'll send you a shipping confirmation with tracking information once your order ships</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-luxury-gold mt-1">3.</span>
              <span>Track your order status anytime from your account dashboard</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account/orders" className="btn-luxury px-10 py-4 text-center">
            View Order Details →
          </Link>
          <Link href="/products" className="btn-luxury-outline px-10 py-4 text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
