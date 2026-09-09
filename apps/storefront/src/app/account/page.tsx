'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFreshCurrentUser, getOrders, isAuthenticated, logout, User, Order } from '@/lib/api';

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
      const userData = await getFreshCurrentUser();
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
    <main className="min-h-screen bg-[#f8f6f2]">
      {/* Header */}
      <div className="border-b border-[#ded8d0] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-light text-[#302b35] sm:text-5xl mb-3">
            Welcome, {user.firstName || user.email}
          </h1>
          <p className="text-[#6a636b] text-base sm:text-lg">Manage your account and orders</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AccountNav />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Verification Alert */}
            {!user.emailVerified && (
              <div className="rounded-lg border border-luxury-gold/40 bg-luxury-gold/10 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-2xl"></span>
                  <div className="flex-1">
                    <h3 className="mb-2 font-serif text-lg text-[#302b35]">Email Not Verified</h3>
                    <p className="text-luxury-brown mb-4">
                      Please verify your email address to access all features.
                    </p>
                    <Link href="/auth/verify-email" className="text-luxury-gold hover:text-luxury-darkGold underline">
                      Verify Email 
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Account Overview Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Link href="/account/orders" className="rounded-lg border border-[#bf4e48] bg-[#bf4e48] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#a9443e] hover:bg-[#a9443e]">
                <div className="mb-4 text-4xl font-serif text-white">{recentOrders.length}</div>
                <h3 className="mb-2 font-serif text-lg text-white">Orders</h3>
                <p className="text-sm text-white/80">View order history</p>
              </Link>

              <Link href="/account/addresses" className="rounded-lg border border-[#bf4e48] bg-[#bf4e48] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#a9443e] hover:bg-[#a9443e]">
                <div className="mb-4 h-10 w-10 rounded-full border border-white/30 bg-white/10"></div>
                <h3 className="mb-2 font-serif text-lg text-white">Addresses</h3>
                <p className="text-sm text-white/80">Manage shipping addresses</p>
              </Link>

              <Link href="/account/settings" className="rounded-lg border border-[#bf4e48] bg-[#bf4e48] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#a9443e] hover:bg-[#a9443e]">
                <div className="mb-4 h-10 w-10 rounded-full border border-white/30 bg-white/10"></div>
                <h3 className="mb-2 font-serif text-lg text-white">Settings</h3>
                <p className="text-sm text-white/80">Update your profile</p>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-luxury-charcoal">Recent Orders</h2>
                <Link href="/account/orders" className="text-sm text-luxury-gold hover:text-luxury-darkGold underline">
                  View All 
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block rounded-md border border-[#ded8d0] bg-[#faf9f7] p-4 transition-all hover:border-luxury-gold hover:bg-white hover:shadow-sm"
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
                  <Link href="/products" className="inline-block rounded-md bg-[#302b35] px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24]">
                    Start Shopping 
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/wishlist" className="rounded-md border border-[#bf4e48] bg-[#bf4e48] p-5 text-center shadow-sm transition-all hover:border-[#a9443e] hover:bg-[#a9443e]">
                  <span className="text-2xl block mb-2"></span>
                  <span className="text-sm text-white/80">View Wishlist</span>
                </Link>
                
                <Link href="/custom-design" className="rounded-md border border-[#bf4e48] bg-[#bf4e48] p-5 text-center shadow-sm transition-all hover:border-[#a9443e] hover:bg-[#a9443e]">
                  <span className="text-2xl block mb-2"></span>
                  <span className="text-sm text-white/80">Custom Design</span>
                </Link>
                
                <Link href="/account/addresses" className="rounded-md border border-[#bf4e48] bg-[#bf4e48] p-5 text-center shadow-sm transition-all hover:border-[#a9443e] hover:bg-[#a9443e]">
                  <span className="text-2xl block mb-2"></span>
                  <span className="text-sm text-white/80">Add Address</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-[#bf4e48] bg-[#bf4e48] p-5 text-center shadow-sm transition-all hover:border-[#a9443e] hover:bg-[#a9443e]"
                >
                  <span className="text-2xl block mb-2"></span>
                  <span className="text-sm text-white/80">Logout</span>
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
    <nav className="sticky top-24 rounded-lg border border-[#ded8d0] bg-white p-5 shadow-sm">
      <h2 className="mb-5 font-serif text-lg text-[#302b35]">My Account</h2>
      <ul className="space-y-3">
        <li>
          <Link
            href="/account"
            className="block rounded-md border border-white/20 bg-white px-4 py-3 font-medium text-[#302b35] shadow-sm transition-all hover:border-white hover:bg-white"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/account/orders"
            className="block rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3 text-[#6a636b] transition-all hover:border-[#bf4e48] hover:bg-[#bf4e48] hover:text-white"
          >
            Orders
          </Link>
        </li>
        <li>
          <Link
            href="/account/addresses"
            className="block rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3 text-[#6a636b] transition-all hover:border-[#bf4e48] hover:bg-[#bf4e48] hover:text-white"
          >
            Addresses
          </Link>
        </li>
        <li>
          <Link
            href="/account/settings"
            className="block rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3 text-[#6a636b] transition-all hover:border-[#bf4e48] hover:bg-[#bf4e48] hover:text-white"
          >
            Settings
          </Link>
        </li>
        <li>
          <Link
            href="/wishlist"
            className="block rounded-md border border-[#ded8d0] bg-[#faf9f7] px-4 py-3 text-[#6a636b] transition-all hover:border-[#bf4e48] hover:bg-[#bf4e48] hover:text-white"
          >
            Wishlist
          </Link>
        </li>
      </ul>
    </nav>
  );
}

