'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, isAuthenticated, Order } from '@/lib/api';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account/orders');
      return;
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await getOrder(orderId);
      
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
          <Link href="/account/orders" className="btn-luxury px-10 py-4 inline-block">
            Back to Orders →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/account/orders" className="text-luxury-gold hover:text-luxury-darkGold">
              ← Back
            </Link>
          </div>
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">
            Order #{order.orderNumber}
          </h1>
          <p className="text-luxury-brown text-lg">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Order Status</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-4 py-2 text-sm ${
                  order.status === 'Delivered' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  order.status === 'Shipped' ? 'bg-luxury-gold/10 text-luxury-gold' :
                  order.status === 'Cancelled' ? 'bg-luxury-terracotta/20 text-luxury-terracotta' :
                  'bg-luxury-sand text-luxury-brown'
                }`}>
                  {order.status}
                </span>
                
                <span className={`px-4 py-2 text-sm ${
                  order.paymentStatus === 'Paid' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  'bg-luxury-sand text-luxury-brown'
                }`}>
                  Payment: {order.paymentStatus}
                </span>
                
                <span className={`px-4 py-2 text-sm ${
                  order.fulfillmentStatus === 'Fulfilled' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  'bg-luxury-sand text-luxury-brown'
                }`}>
                  {order.fulfillmentStatus}
                </span>
              </div>

              {/* Order Timeline */}
              <div className="space-y-4">
                <OrderTimeline status={order.status} createdAt={order.createdAt} />
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Order Items</h2>
              
              <div className="space-y-6">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 pb-6 border-b border-luxury-sand last:border-0 last:pb-0">
                    <div className="w-24 h-24 border border-luxury-sand bg-luxury-cream shrink-0">
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
                      <h3 className="font-serif text-lg text-luxury-charcoal mb-1">
                        {item.productSnapshot?.name || 'Product'}
                      </h3>
                      {item.variantSnapshot && (
                        <p className="text-sm text-luxury-brown mb-2">
                          Variant: {item.variantSnapshot.name}
                        </p>
                      )}
                      <p className="text-sm text-luxury-brown">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl text-luxury-charcoal">${item.totalPrice.toFixed(2)}</p>
                      <p className="text-sm text-luxury-brown mt-1">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Shipping Address</h2>
                <div className="text-luxury-brown space-y-1">
                  <p className="font-medium text-luxury-charcoal">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="pt-2">{order.shippingAddress.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-luxury-sand bg-luxury-beige p-6">
              <h2 className="text-xl font-serif text-luxury-charcoal mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-luxury-sand text-sm">
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
              </div>

              <div className="flex justify-between text-2xl font-serif text-luxury-charcoal mb-8">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {order.status === 'Delivered' && (
                  <button className="btn-luxury w-full px-6 py-3 text-sm">
                    Reorder
                  </button>
                )}
                
                {['Pending', 'Processing'].includes(order.status) && (
                  <button className="w-full border border-luxury-terracotta bg-luxury-terracotta/10 px-6 py-3 text-sm text-luxury-terracotta hover:bg-luxury-terracotta/20 transition-colors">
                    Cancel Order
                  </button>
                )}

                <button className="w-full border border-luxury-sand bg-luxury-cream px-6 py-3 text-sm text-luxury-brown hover:border-luxury-gold transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function OrderTimeline({ status, createdAt }: { status: string; createdAt: string }) {
  const statuses = [
    { label: 'Order Placed', completed: true },
    { label: 'Processing', completed: ['Processing', 'Shipped', 'Delivered'].includes(status) },
    { label: 'Shipped', completed: ['Shipped', 'Delivered'].includes(status) },
    { label: 'Delivered', completed: status === 'Delivered' },
  ];

  return (
    <div className="relative">
      {statuses.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4 mb-4 last:mb-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            item.completed ? 'bg-luxury-gold text-white' : 'bg-luxury-sand text-luxury-brown'
          }`}>
            {item.completed ? '✓' : idx + 1}
          </div>
          <div className="flex-1">
            <p className={`text-sm ${item.completed ? 'text-luxury-charcoal font-medium' : 'text-luxury-brown'}`}>
              {item.label}
            </p>
            {idx === 0 && (
              <p className="text-xs text-luxury-brown/70">
                {new Date(createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
