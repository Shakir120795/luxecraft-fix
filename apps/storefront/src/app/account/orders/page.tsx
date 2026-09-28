'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrders, isAuthenticated, Order, cancelOrder } from '@/lib/api';

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

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Payment Pending',
      PAYMENT_CONFIRMED: 'Payment Confirmed',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      FAILED: 'Payment Failed',
    };
    return labels[status?.toUpperCase()] || status || 'Pending';
  };

  const statusTone = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'border-[#2f6b36]/30 bg-[#2f6b36]/10 text-[#2f6b36]';
      case 'SHIPPED':
      case 'PROCESSING':
      case 'PAYMENT_CONFIRMED':
        return 'border-[#c99545]/30 bg-[#c99545]/10 text-[#7a5a2c]';
      case 'CANCELLED':
      case 'FAILED':
        return 'border-[#b94740]/30 bg-[#b94740]/10 text-[#b94740]';
      default:
        return 'border-[#ded8d0] bg-[#faf9f7] text-[#6a636b]';
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => {
        const orderStatus = (o.orderStatus || o.status || '').toLowerCase();
        return filter === 'failed'
          ? o.paymentStatus.toUpperCase() === 'FAILED' || orderStatus === 'failed'
          : orderStatus === filter.toLowerCase();
      });

  const counts = {
    all: orders.length,
    pending: orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === 'PENDING').length,
    processing: orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === 'PROCESSING').length,
    shipped: orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === 'SHIPPED').length,
    delivered: orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === 'DELIVERED').length,
    cancelled: orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === 'CANCELLED').length,
    failed: orders.filter(o => o.paymentStatus.toUpperCase() === 'FAILED' || (o.orderStatus || o.status || '').toUpperCase() === 'FAILED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-3 w-3 animate-pulse rounded-full bg-[#c99545]" />
          <p className="font-serif text-lg text-[#302b35]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ef] text-[#161616]">
      <section className="border-b border-[#e0dbd6] bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[#2f6b36]">Wolhomes / Account</p>
              <h1 className="font-serif text-4xl font-medium tracking-[-0.03em] text-[#161616] sm:text-5xl">My Orders</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#67625c]">A clear view of every purchase, payment status, and delivery stage.</p>
            </div>
            <Link href="/products" className="btn-luxury w-fit px-6">
              Continue Shopping
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ['all', 'All', counts.all],
              ['pending', 'Pending', counts.pending],
              ['failed', 'Failed', counts.failed],
              ['processing', 'Processing', counts.processing],
              ['shipped', 'Shipped', counts.shipped],
              ['delivered', 'Delivered', counts.delivered],
              ['cancelled', 'Cancelled', counts.cancelled],
            ].map(([value, label, count]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setFilter(String(value))}
                className={`group flex items-center justify-between border px-4 py-3 text-left transition-all ${filter === value
                  ? 'border-[#2f6b36] bg-[#2f6b36] text-white shadow-sm'
                  : 'border-[#e0dbd6] bg-[#faf9f7] text-[#5f5a55] hover:border-[#c99545] hover:bg-white'}`}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.13em]">{label}</span>
                <span className={`font-serif text-lg ${filter === value ? 'text-white' : 'text-[#161616]'}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {filteredOrders.length > 0 ? (
          <div className="space-y-5">
            {filteredOrders.map(order => {
              const currentStatus = (order.orderStatus || order.status || 'PENDING').toUpperCase();
              const items = order.items || [];
              return (
                <article key={order.id} className="group overflow-hidden border border-[#e0dbd6] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c99545] hover:shadow-[0_14px_40px_rgba(48,43,53,0.07)]">
                  <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-serif text-2xl text-[#161616]">Order #{order.orderNumber}</h2>
                        <span className={`border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${statusTone(currentStatus)}`}>
                          {statusLabel(currentStatus)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#8a837c]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-[#67625c]">
                        <span><strong className="font-medium text-[#302b35]">{items.length}</strong> {items.length === 1 ? 'item' : 'items'}</span>
                        <span>Payment: <strong className="font-medium text-[#302b35]">{order.paymentStatus}</strong></span>
                        <span>Fulfillment: <strong className="font-medium text-[#302b35]">{order.fulfillmentStatus || 'UNFULFILLED'}</strong></span>
                      </div>

                      {items.length > 0 && (
                        <div className="mt-5 border-l-2 border-[#c99545] bg-[#faf9f7] px-4 py-3">
                          <p className="truncate font-serif text-base text-[#302b35]">
                            {items[0]?.productSnapshot?.name || 'Product'}
                            {items.length > 1 ? ` + ${items.length - 1} more` : ''}
                          </p>
                          <p className="mt-1 text-xs text-[#8a837c]">
                            Qty {items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-[#e8e2dc] pt-5 lg:w-56 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#8a837c]">Order Total</p>
                        <p className="mt-1 font-serif text-3xl text-[#161616]">${Number(order.total).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/account/orders/${order.id}`} className="btn-luxury flex-1 px-4 text-[10px]">
                          View Details
                        </Link>
                        {order.paymentStatus === 'PENDING' && (
                          <Link href={`/account/orders/${order.id}`} className="border border-[#c99545] bg-[#c99545]/10 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#7a5a2c] hover:bg-[#c99545]/20">
                            Pay
                          </Link>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.paymentStatus === 'FAILED' && (
                          <Link href={`/checkout?retryOrderId=${order.id}`} className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7a5a2c] underline underline-offset-4">
                            Retry payment
                          </Link>
                        )}
                        {order.paymentStatus === 'PENDING' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Cancel this unpaid order and release its reservation?')) return;
                              const result = await cancelOrder(order.id);
                              if (!result.success) window.alert(result.message || 'Unable to cancel order.');
                              await loadOrders();
                            }}
                            className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#b94740] underline underline-offset-4"
                          >
                            Cancel order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-[#e0dbd6] bg-white px-6 py-16 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#c99545] bg-[#faf9f7] text-[#c99545]">
              <span className="font-serif text-2xl">W</span>
            </div>
            <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.22em] text-[#2f6b36]">Orders</p>
            <h2 className="mt-2 font-serif text-3xl text-[#161616]">
              No {filter !== 'all' ? filter : ''} Orders Found
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#67625c]">
              {filter === 'all' ? "You haven't placed any orders yet." : `You don't have any ${filter} orders.`}
            </p>
            <button onClick={() => setFilter('all')} className="btn-luxury mt-7 px-8">
              {filter === 'all' ? 'Start Shopping' : 'View All Orders'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}