'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getCustomer, getOrders, updateCustomerStatus, Customer, Order } from '@/lib/api';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  async function loadCustomerData() {
    try {
      const [customerData, ordersData] = await Promise.all([
        getCustomer(customerId),
        getOrders(),
      ]);
      setCustomer(customerData);
      setOrders(ordersData.filter(o => o.userId === customerId));
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;

    setUpdating(true);
    try {
      const updated = await updateCustomerStatus(customerId, !customer.isActive);
      setCustomer(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update customer status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--color-border)]" />
          <div className="h-96 bg-[var(--color-border)]" />
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif text-[var(--color-primary)] mb-4">Customer Not Found</h2>
          <button
            onClick={() => router.push('/customers')}
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
          >
            ← Back to Customers
          </button>
        </div>
      </AdminLayout>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push('/customers')}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] mb-2 text-sm"
            >
              ← Back to Customers
            </button>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-[var(--color-muted)] mt-1">
              Customer since {new Date(customer.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`px-6 py-2 text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              customer.isActive
                ? 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                : 'border border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
            }`}
          >
            {updating ? 'Updating...' : customer.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="text-[var(--color-muted)] text-sm mb-2">Total Orders</div>
              <div className="text-3xl font-serif text-[var(--color-primary)]">
                {orders.length}
              </div>
            </div>

            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="text-[var(--color-muted)] text-sm mb-2">Total Spent</div>
              <div className="text-3xl font-serif text-[var(--color-primary)]">
                ${totalSpent.toFixed(2)}
              </div>
            </div>

            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="text-[var(--color-muted)] text-sm mb-2">Status</div>
              <div className="text-3xl font-serif text-[var(--color-primary)]">
                {customer.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-[var(--color-primary)]">
                  Order History
                </h2>
                {orders.length > 0 && (
                  <Link
                    href="/orders"
                    className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                  >
                    View All Orders →
                  </Link>
                )}
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
                    >
                      <div>
                        <div className="font-medium text-[var(--color-text)]">
                          Order #{order.orderNumber}
                        </div>
                        <div className="text-sm text-[var(--color-muted)]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[var(--color-text)]">
                          ${Number(order.total).toFixed(2)}
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {order.status}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 5 && (
                    <div className="text-center text-sm text-[var(--color-muted)] pt-2">
                      + {orders.length - 5} more orders
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-muted)]">
                  No orders yet
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[var(--color-muted)] mb-1">Email</div>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                  >
                    {customer.email}
                  </a>
                </div>
                {customer.phoneNumber && (
                  <div>
                    <div className="text-[var(--color-muted)] mb-1">Phone</div>
                    <a
                      href={`tel:${customer.phoneNumber}`}
                      className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                    >
                      {customer.phoneNumber}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Account Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[var(--color-muted)]">Customer ID</div>
                  <div className="font-mono text-xs text-[var(--color-text)]">{customer.id}</div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Joined</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(customer.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Last Updated</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(customer.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Status</div>
                  <div className="font-medium text-[var(--color-text)]">
                    {customer.isActive ? '✓ Active' : '✗ Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
