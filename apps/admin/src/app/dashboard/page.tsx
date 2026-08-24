'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getDashboardStats, DashboardStats } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--color-border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-border)]" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-primary)]">Dashboard</h1>
          <p className="text-[var(--color-muted)] mt-1">Welcome back! Here's your business overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">💰</div>
              <div className={`text-sm font-medium ${
                (stats?.revenueChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(stats?.revenueChange ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenueChange ?? 0)}%
              </div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-primary)] mb-1">
              ${(stats?.totalRevenue ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-[var(--color-muted)]">Total Revenue</div>
          </div>

          {/* Total Orders */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">🛒</div>
              <div className={`text-sm font-medium ${
                (stats?.ordersChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(stats?.ordersChange ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.ordersChange ?? 0)}%
              </div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-primary)] mb-1">
              {stats?.totalOrders ?? 0}
            </div>
            <div className="text-sm text-[var(--color-muted)]">Total Orders</div>
          </div>

          {/* Total Customers */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">👥</div>
              <div className="text-sm text-[var(--color-muted)]">Active</div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-primary)] mb-1">
              {stats?.totalCustomers ?? 0}
            </div>
            <div className="text-sm text-[var(--color-muted)]">Total Customers</div>
          </div>

          {/* Total Products */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">📦</div>
              <div className="text-sm text-[var(--color-muted)]">In Stock</div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-primary)] mb-1">
              {stats?.totalProducts ?? 0}
            </div>
            <div className="text-sm text-[var(--color-muted)]">Total Products</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Items */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Pending Items
            </h2>
            <div className="space-y-3">
              <Link
                href="/orders?status=pending"
                className="flex items-center justify-between p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">📋</div>
                  <div>
                    <div className="font-medium text-[var(--color-text)]">Pending Orders</div>
                    <div className="text-sm text-[var(--color-muted)]">Require processing</div>
                  </div>
                </div>
                <div className="text-2xl font-serif text-[var(--color-accent)]">
                  {stats?.pendingOrders ?? 0}
                </div>
              </Link>

              <Link
                href="/custom-requests?status=pending"
                className="flex items-center justify-between p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">✨</div>
                  <div>
                    <div className="font-medium text-[var(--color-text)]">Custom Requests</div>
                    <div className="text-sm text-[var(--color-muted)]">Awaiting response</div>
                  </div>
                </div>
                <div className="text-2xl font-serif text-[var(--color-accent)]">
                  {stats?.pendingCustomRequests ?? 0}
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/products/new"
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-center"
              >
                <div className="text-2xl mb-2">➕</div>
                <div className="text-sm font-medium text-[var(--color-text)]">Add Product</div>
              </Link>
              <Link
                href="/categories/new"
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏷️</div>
                <div className="text-sm font-medium text-[var(--color-text)]">Add Category</div>
              </Link>
              <Link
                href="/orders"
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-center"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm font-medium text-[var(--color-text)]">View Orders</div>
              </Link>
              <Link
                href="/customers"
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-center"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium text-[var(--color-text)]">View Customers</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
