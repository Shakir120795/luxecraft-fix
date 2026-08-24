'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getOrders, isAuthenticated, logout, User, Order } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account');
      return;
    }

    loadAccountData();
  }, []);

  async function loadAccountData() {
    try {
      setLoading(true);
      const userData = getCurrentUser();
      setUser(userData);

      const orders = await getOrders();
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading account...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">
            Welcome, {user.firstName || user.email}
          </h1>
          <p className="text-luxury-brown text-lg">Manage your account and orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AccountNav />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Verification Alert */}
            {!user.isVerified && (
              <div className="border border-luxury-gold/50 bg-luxury-gold/10 p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Email Not Verified</h3>
                    <p className="text-luxury-brown mb-4">
                      Please verify your email address to access all features.
                    </p>
                    <Link href="/auth/verify-email" className="text-luxury-gold hover:text-luxury-darkGold underline">
                      Verify Email →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Account Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/account/orders" className="border border-luxury-sand bg-luxury-beige p-6 hover:border-luxury-gold transition-colors">
                <div className="text-4xl font-serif text-luxury-gold mb-3">{recentOrders.length}</div>
                <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Orders</h3>
                <p className="text-sm text-luxury-brown">View order history</p>
              </Link>

              <Link href="/account/addresses" className="border border-luxury-sand bg-luxury-beige p-6 hover:border-luxury-gold transition-colors">
                <div className="text-4xl font-serif text-luxury-gold mb-3">📍</div>
                <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Addresses</h3>
                <p className="text-sm text-luxury-brown">Manage shipping addresses</p>
              </Link>

              <Link href="/account/settings" className="border border-luxury-sand bg-luxury-beige p-6 hover:border-luxury-gold transition-colors">
                <div className="text-4xl font-serif text-luxury-gold mb-3">⚙️</div>
                <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Settings</h3>
                <p className="text-sm text-luxury-brown">Update your profile</p>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-luxury-charcoal">Recent Orders</h2>
                <Link href="/account/orders" className="text-sm text-luxury-gold hover:text-luxury-darkGold underline">
                  View All →
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block border border-luxury-sand bg-luxury-cream p-4 hover:border-luxury-gold transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-serif text-luxury-charcoal">Order #{order.orderNumber}</p>
                        <span className={`text-xs px-3 py-1 ${
                          order.status === 'Delivered' ? 'bg-luxury-gold/20 text-luxury-gold' :
                          order.status === 'Shipped' ? 'bg-luxury-gold/10 text-luxury-gold' :
                          'bg-luxury-sand text-luxury-brown'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-luxury-brown">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="font-serif text-luxury-charcoal">${order.total.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-luxury-brown mb-6">You haven't placed any orders yet</p>
                  <Link href="/products" className="btn-luxury px-8 py-3 inline-block">
                    Start Shopping →
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/wishlist" className="border border-luxury-sand bg-luxury-cream p-4 hover:border-luxury-gold transition-colors text-center">
                  <span className="text-2xl block mb-2">♡</span>
                  <span className="text-sm text-luxury-brown">View Wishlist</span>
                </Link>
                
                <Link href="/custom-design" className="border border-luxury-sand bg-luxury-cream p-4 hover:border-luxury-gold transition-colors text-center">
                  <span className="text-2xl block mb-2">✏️</span>
                  <span className="text-sm text-luxury-brown">Custom Design</span>
                </Link>
                
                <Link href="/account/addresses" className="border border-luxury-sand bg-luxury-cream p-4 hover:border-luxury-gold transition-colors text-center">
                  <span className="text-2xl block mb-2">📍</span>
                  <span className="text-sm text-luxury-brown">Add Address</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="border border-luxury-sand bg-luxury-cream p-4 hover:border-luxury-terracotta transition-colors text-center"
                >
                  <span className="text-2xl block mb-2">🚪</span>
                  <span className="text-sm text-luxury-brown">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountNav() {
  return (
    <nav className="border border-luxury-sand bg-luxury-beige p-6 sticky top-24">
      <h2 className="font-serif text-lg text-luxury-charcoal mb-6">My Account</h2>
      <ul className="space-y-3">
        <li>
          <Link
            href="/account"
            className="block text-luxury-brown hover:text-luxury-gold transition-colors py-2 border-l-2 border-luxury-gold pl-4 font-medium"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/account/orders"
            className="block text-luxury-brown hover:text-luxury-gold transition-colors py-2 border-l-2 border-transparent hover:border-luxury-sand pl-4"
          >
            Orders
          </Link>
        </li>
        <li>
          <Link
            href="/account/addresses"
            className="block text-luxury-brown hover:text-luxury-gold transition-colors py-2 border-l-2 border-transparent hover:border-luxury-sand pl-4"
          >
            Addresses
          </Link>
        </li>
        <li>
          <Link
            href="/account/settings"
            className="block text-luxury-brown hover:text-luxury-gold transition-colors py-2 border-l-2 border-transparent hover:border-luxury-sand pl-4"
          >
            Settings
          </Link>
        </li>
        <li>
          <Link
            href="/wishlist"
            className="block text-luxury-brown hover:text-luxury-gold transition-colors py-2 border-l-2 border-transparent hover:border-luxury-sand pl-4"
          >
            Wishlist
          </Link>
        </li>
      </ul>
    </nav>
  );
}
