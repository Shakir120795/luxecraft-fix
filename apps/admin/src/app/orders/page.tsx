'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { getOrders, Order } from '@/lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.user?.firstName} ${order.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">Orders</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Manage and track customer orders
            </p>
          </div>
          <div className="text-2xl font-serif text-[var(--color-accent)]">
            {orders.length} Total
          </div>
        </div>

        {/* Filters */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search by order number, customer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="animate-pulse text-[var(--color-muted)]">Loading orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-serif text-[var(--color-primary)] mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Orders Found' : 'No Orders Yet'}
            </h3>
            <p className="text-[var(--color-muted)]">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here once customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Order
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--color-text)]">
                          #{order.orderNumber}
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          ID: {order.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.user ? (
                          <>
                            <div className="font-medium text-[var(--color-text)]">
                              {order.user.firstName} {order.user.lastName}
                            </div>
                            <div className="text-sm text-[var(--color-muted)]">
                              {order.user.email}
                            </div>
                          </>
                        ) : (
                          <div className="text-[var(--color-muted)]">N/A</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--color-text)]">
                          ${Number(order.total).toFixed(2)}
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          Subtotal: ${Number(order.subtotal).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
            <div>Showing {filteredOrders.length} of {orders.length} orders</div>
            <div className="font-medium">
              Total Revenue: ${orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
