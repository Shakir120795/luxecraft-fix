'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { getOrder, updateOrderStatus, Order } from '@/lib/api';

const statusOptions = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;

    setUpdating(true);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrder(updated);
      alert('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
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

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif text-[var(--color-primary)] mb-4">Order Not Found</h2>
          <button
            onClick={() => router.push('/orders')}
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
          >
             Back to Orders
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push('/orders')}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] mb-2 text-sm"
            >
               Back to Orders
            </button>
            <h1 className="text-3xl font-serif text-[var(--color-primary)]">
              Order #{order.orderNumber}
            </h1>
            <p className="text-[var(--color-muted)] mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`px-4 py-2 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
                Order Items
              </h2>
              
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="border-b border-[var(--color-border)] pb-5 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-24 w-24 shrink-0 object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="h-24 w-24 shrink-0 bg-[var(--color-border)] flex items-center justify-center">
                            W
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="font-medium text-[var(--color-text)]">
                            {item.product?.name || 'Product'}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                            <div><strong className="text-[var(--color-text)]">SKU:</strong> {item.product?.sku || 'N/A'}</div>
                            {item.product?.variant?.name && <div><strong className="text-[var(--color-text)]">Size / Variant:</strong> {item.product.variant.name}</div>}
                            {item.product?.color && <div><strong className="text-[var(--color-text)]">Color:</strong> {item.product.color}</div>}
                            {item.product?.material && <div><strong className="text-[var(--color-text)]">Material:</strong> {item.product.material}</div>}
                            {item.product?.style && <div><strong className="text-[var(--color-text)]">Style:</strong> {item.product.style}</div>}
                            {item.product?.collection && <div><strong className="text-[var(--color-text)]">Collection:</strong> {item.product.collection}</div>}
                            {item.product?.origin && <div><strong className="text-[var(--color-text)]">Origin:</strong> {item.product.origin}</div>}
                            <div><strong className="text-[var(--color-text)]">Quantity:</strong> {item.quantity}</div>
                          </div>

                          {item.product?.dimensions && (
                            <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
                              {item.product.dimensions.lengthCm && <span className="mr-4">L {item.product.dimensions.lengthCm} cm</span>}
                              {item.product.dimensions.widthCm && <span className="mr-4">W {item.product.dimensions.widthCm} cm</span>}
                              {item.product.dimensions.heightCm && <span className="mr-4">H {item.product.dimensions.heightCm} cm</span>}
                              {item.product.dimensions.weightKg && <span>Weight {item.product.dimensions.weightKg} kg</span>}
                            </div>
                          )}

                          {item.customization && typeof item.customization === 'object' && (
                            <div className="mt-3 border-l-2 border-[var(--color-accent)] bg-[var(--color-bg)] px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Selected Options</div>
                              <div className="mt-1 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                                {Object.entries(item.customization).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="font-medium text-[var(--color-text)]">
                            ${Number(item.total).toFixed(2)}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-muted)]">
                            ${Number(item.price).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              ) : (
                        <div className="w-20 h-20 bg-[var(--color-border)] flex items-center justify-center">
                          
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-[var(--color-text)]">
                          {item.product?.name || 'Product'}
                        </div>
                        <div className="text-sm text-[var(--color-muted)]">
                          SKU: {item.product?.sku || 'N/A'}
                        </div>
                        <div className="text-sm text-[var(--color-muted)] mt-1">
                          Quantity: {item.quantity}  ${Number(item.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[var(--color-text)]">
                          ${Number(item.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-muted)]">No items in this order</p>
              )}

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-2">
                <div className="flex justify-between text-[var(--color-text)]">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text)]">
                  <span>Shipping</span>
                  <span>${Number(order.shippingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text)]">
                  <span>Tax</span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-serif text-[var(--color-primary)] pt-2 border-t border-[var(--color-border)]">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-xl font-serif text-[var(--color-primary)] mb-4">
                Update Order Status
              </h2>

              <div className="flex gap-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>

              <div className="mt-4 text-sm text-[var(--color-muted)]">
                <p><strong>Status Guide:</strong></p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li> <strong>PENDING</strong> - Order received, awaiting processing</li>
                  <li> <strong>PROCESSING</strong> - Order is being prepared</li>
                  <li> <strong>SHIPPED</strong> - Order has been shipped to customer</li>
                  <li> <strong>DELIVERED</strong> - Order received by customer</li>
                  <li> <strong>CANCELLED</strong> - Order cancelled</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Customer
              </h3>
              {order.user ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-[var(--color-text)]">
                      {order.user.firstName} {order.user.lastName}
                    </div>
                    <div className="text-[var(--color-muted)]">
                      {order.user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/customers/${order.userId}`)}
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
                  >
                    View Customer Profile 
                  </button>
                </div>
              ) : (
                <p className="text-[var(--color-muted)] text-sm">No customer info</p>
              )}
            </div>

            {/* Order Info */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">
                Order Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[var(--color-muted)]">Order ID</div>
                  <div className="font-mono text-xs text-[var(--color-text)]">{order.id}</div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Order Number</div>
                  <div className="font-medium text-[var(--color-text)]">#{order.orderNumber}</div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Created</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--color-muted)]">Last Updated</div>
                  <div className="text-[var(--color-text)]">
                    {new Date(order.updatedAt).toLocaleString()}
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
