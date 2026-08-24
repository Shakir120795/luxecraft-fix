'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrders, isAuthenticated, Order } from '@/lib/api';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account/orders');
      return;
    }

    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">My Orders</h1>
          <p className="text-luxury-brown text-lg">View and track your orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-luxury-sand bg-luxury-beige p-6 sticky top-24">
              <h2 className="font-serif text-lg text-luxury-charcoal mb-4">Filter Orders</h2>
              <div className="space-y-2">
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`block w-full text-left px-4 py-2 transition-colors ${
                      filter === status
                        ? 'bg-luxury-gold text-white'
                        : 'text-luxury-brown hover:bg-luxury-sand'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-luxury-sand">
                <Link href="/account" className="text-sm text-luxury-gold hover:text-luxury-darkGold underline">
                  ← Back to Account
                </Link>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-3">
            {filteredOrders.length > 0 ? (
              <div className="space-y-6">
                {filteredOrders.map(order => (
                  <div key={order.id} className="border border-luxury-sand bg-luxury-beige p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-luxury-sand">
                      <div>
                        <h3 className="font-serif text-xl text-luxury-charcoal mb-1">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-luxury-brown">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end gap-2">
                        <span className={`text-xs px-3 py-1 ${
                          order.status === 'Delivered' ? 'bg-luxury-gold/20 text-luxury-gold' :
                          order.status === 'Shipped' ? 'bg-luxury-gold/10 text-luxury-gold' :
                          order.status === 'Cancelled' ? 'bg-luxury-terracotta/20 text-luxury-terracotta' :
                          'bg-luxury-sand text-luxury-brown'
                        }`}>
                          {order.status}
                        </span>
                        <p className="font-serif text-2xl text-luxury-charcoal">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="mb-6">
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="shrink-0 w-20 h-20 border border-luxury-sand bg-luxury-cream">
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
                        ))}
                        {order.items.length > 3 && (
                          <div className="shrink-0 w-20 h-20 border border-luxury-sand bg-luxury-sand flex items-center justify-center">
                            <span className="text-xs text-luxury-brown">+{order.items.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="btn-luxury px-6 py-2 text-sm"
                      >
                        View Details →
                      </Link>
                      
                      {order.status === 'Delivered' && (
                        <button className="border border-luxury-sand bg-luxury-cream px-6 py-2 text-sm text-luxury-brown hover:border-luxury-gold transition-colors">
                          Reorder
                        </button>
                      )}
                      
                      {['Pending', 'Processing'].includes(order.status) && (
                        <button className="border border-luxury-terracotta bg-luxury-terracotta/10 px-6 py-2 text-sm text-luxury-terracotta hover:bg-luxury-terracotta/20 transition-colors">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-luxury-sand bg-luxury-beige p-12 text-center">
                <div className="mb-6">
                  <span className="text-7xl">📦</span>
                </div>
                <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
                  No {filter !== 'all' && filter} Orders Found
                </h2>
                <p className="text-luxury-brown mb-8">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet"
                    : `You don't have any ${filter} orders`
                  }
                </p>
                {filter !== 'all' ? (
                  <button
                    onClick={() => setFilter('all')}
                    className="btn-luxury-outline px-8 py-3"
                  >
                    View All Orders
                  </button>
                ) : (
                  <Link href="/products" className="btn-luxury px-8 py-3 inline-block">
                    Start Shopping →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
