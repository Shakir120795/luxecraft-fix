'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, isAuthenticated, Order, resumePayment, verifyRazorpayPayment, capturePayPalPayment, verifyCryptoPayment, cancelOrder } from '@/lib/api';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingPayment, setResumingPayment] = useState(false);
  const [resumeProviderOrderId, setResumeProviderOrderId] = useState<string | null>(null);
  const [resumePaymentId, setResumePaymentId] = useState<string | null>(null);
  const [resumeCrypto, setResumeCrypto] = useState<{
    network: string;
    asset: string;
    address: string;
    amount: number;
    currency: string;
    instructions: string;
    qrPayload: string;
  } | null>(null);
  const [resumeCryptoTxHash, setResumeCryptoTxHash] = useState('');
  const [resumeCryptoQr, setResumeCryptoQr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account/orders');
      return;
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (!resumeCrypto) {
      setResumeCryptoQr(null);
      return;
    }

    QRCode.toDataURL(resumeCrypto.qrPayload, { margin: 2, width: 220 })
      .then(setResumeCryptoQr)
      .catch(() => setResumeCryptoQr(null));
  }, [resumeCrypto]);

  const normalizedStatus = (order?.orderStatus || order?.status || 'PENDING').toUpperCase();

  const statusLabel = (status: string) => ({
    PENDING: 'Payment Pending',
    PAYMENT_CONFIRMED: 'Payment Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }[status] || status);

  const statusTone = (status: string) => {
    if (status === 'DELIVERED') return 'border-[#2f6b36]/30 bg-[#2f6b36]/10 text-[#2f6b36]';
    if (['PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(status)) return 'border-[#c99545]/30 bg-[#c99545]/10 text-[#7a5a2c]';
    if (status === 'CANCELLED') return 'border-[#b94740]/30 bg-[#b94740]/10 text-[#b94740]';
    return 'border-[#ded8d0] bg-[#faf9f7] text-[#6a636b]';
  };

  async function handleResumePayment() {
    if (!order) return;
    setError(null);
    setResumingPayment(true);

    try {
      const result = await resumePayment(order.id);
      if (!result.success) {
        setError(result.message || 'Unable to resume payment.');
        return;
      }

      setResumeProviderOrderId(result.providerOrderId || null);
      setResumePaymentId(result.payment?.id || null);
      setResumeCrypto(result.crypto || null);

      if (result.provider === 'razorpay') {
        if (!result.providerOrderId || !result.publicKey) {
          setError('Card payment could not be initialized.');
          return;
        }

        const loadRazorpay = () =>
          new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existing) return resolve();

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Unable to load Card Payment.'));
            document.body.appendChild(script);
          });

        await loadRazorpay();
        const RazorpayCtor = (window as Window & {
          Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
        }).Razorpay;

        if (!RazorpayCtor) throw new Error('Card Payment is unavailable.');

        const razorpay = new RazorpayCtor({
          key: result.publicKey,
          order_id: result.providerOrderId,
          amount: Math.round(Number(result.payment?.amount || order.total) * 100),
          currency: result.payment?.currency || order.currency,
          name: 'Wolhomes',
          description: `Order ${order.orderNumber}`,
          prefill: {
            name: `${order.billingAddress?.firstName || ''} ${order.billingAddress?.lastName || ''}`.trim(),
            email: order.guestEmail || '',
            contact: order.billingAddress?.phone || '',
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            setResumingPayment(true);
            const verification = await verifyRazorpayPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (!verification.success) {
              setError(verification.message || 'Payment verification failed.');
              setResumingPayment(false);
              return;
            }

            await loadOrder();
            setResumingPayment(false);
          },
        });

        razorpay.open();
        return;
      }

      if (result.provider === 'paypal') {
        if (!result.approveUrl || !result.providerOrderId) {
          setError('PayPal payment could not be initialized.');
          return;
        }
        window.open(result.approveUrl, '_blank', 'noopener,noreferrer');
        setError('PayPal approval opened in a new tab. Complete it there, then click Capture PayPal Payment.');
        return;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to resume payment.');
    } finally {
      setResumingPayment(false);
    }
  }

  async function handleCaptureResumedPayPal() {
    if (!order || !resumeProviderOrderId) return;
    setResumingPayment(true);
    setError(null);
    try {
      const result = await capturePayPalPayment({
        orderId: order.id,
        paypalOrderId: resumeProviderOrderId,
      });
      if (!result.success) {
        setError(result.message || 'PayPal capture failed.');
        return;
      }
      await loadOrder();
      setResumeProviderOrderId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PayPal capture failed.');
    } finally {
      setResumingPayment(false);
    }
  }

  async function handleVerifyResumedCrypto() {
    if (!order || !resumeCrypto || !resumeCryptoTxHash.trim()) return;
    setResumingPayment(true);
    setError(null);
    try {
      const result = await verifyCryptoPayment({
        orderId: order.id,
        txHash: resumeCryptoTxHash.trim(),
        network: resumeCrypto.network,
        asset: resumeCrypto.asset,
      });
      if (!result.success) {
        setError(result.message || 'Crypto payment verification failed.');
        return;
      }
      await loadOrder();
      setResumeCrypto(null);
      setResumeCryptoTxHash('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crypto payment verification failed.');
    } finally {
      setResumingPayment(false);
    }
  }

  async function handleCancelOrder() {
    if (!order) return;
    if (!window.confirm('Cancel this unpaid order and release its reservation?')) return;

    setError(null);
    setResumingPayment(true);
    try {
      const result = await cancelOrder(order.id);
      if (!result.success) {
        setError(result.message || 'Unable to cancel order.');
        return;
      }
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setResumingPayment(false);
    }
  }

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
      <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-[#67625c]">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading order...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-serif font-light text-[#302b35] mb-4">Order Not Found</h1>
          <p className="text-[#67625c] mb-8">{error || 'The order could not be found'}</p>
          <Link href="/account/orders" className="btn-luxury px-10 py-4 inline-block">
            Back to Orders 
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ef]">
      {/* Header */}
      <div className="border-b border-[#e0dbd6] bg-white px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/account/orders" className="text-luxury-gold hover:text-luxury-darkGold">
               Back
            </Link>
          </div>
          <h1 className="font-serif text-4xl font-medium tracking-[-0.03em] text-[#161616] sm:text-5xl">
            Order #{order.orderNumber}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#67625c]">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status */}
            <div className="border border-[#e0dbd6] bg-white p-6 shadow-[0_8px_30px_rgba(48,43,53,0.04)] sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#2f6b36]">Order Tracking</p><h2 className="mt-1 font-serif text-2xl text-[#161616]">Order Status</h2></div><span className="hidden text-[10px] uppercase tracking-[0.16em] text-[#8a837c] sm:block">#{order.orderNumber}</span></div>
              
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-4 py-2 text-sm ${
                  order.status === 'Delivered' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  order.status === 'Shipped' ? 'bg-luxury-gold/10 text-luxury-gold' :
                  order.status === 'Cancelled' ? 'bg-luxury-terracotta/20 text-luxury-terracotta' :
                  'bg-luxury-sand text-[#67625c]'
                }`}>
                  {order.status}
                </span>
                
                <span className={`px-4 py-2 text-sm ${
                  order.paymentStatus === 'Paid' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  'bg-luxury-sand text-[#67625c]'
                }`}>
                  Payment: {order.paymentStatus}
                </span>
                
                <span className={`px-4 py-2 text-sm ${
                  order.fulfillmentStatus === 'Fulfilled' ? 'bg-luxury-gold/20 text-luxury-gold' :
                  'bg-luxury-sand text-[#67625c]'
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
            <div className="border border-[#e0dbd6] bg-white p-6 shadow-[0_8px_30px_rgba(48,43,53,0.04)] sm:p-8">
              <h2 className="text-2xl font-serif text-[#302b35] mb-6">Order Items</h2>
              
              <div className="space-y-6">
                {order.items.map((item: any, idx: number) => {
                  const product = item.product ?? {};
                  const variant = product.variant ?? item.variantSnapshot ?? null;
                  const customization = item.customization && typeof item.customization === 'object'
                    ? Object.entries(item.customization)
                    : [];
                  const dimensions = product.dimensions ?? {};

                  return (
                    <div key={idx} className="border-b border-[#e0dbd6] pb-6 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="h-28 w-28 shrink-0 overflow-hidden border border-[#e0dbd6] bg-[#f7f3ef]">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#faf9f7] text-[#c99545] font-serif text-xl">
                              W
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-xl text-[#302b35]">{product.name || 'Product'}</h3>

                          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-[#67625c] sm:grid-cols-2">
                            <p><strong className="text-[#302b35]">SKU:</strong> {product.sku || 'N/A'}</p>
                            {variant?.name && <p><strong className="text-[#302b35]">Size / Variant:</strong> {variant.name}</p>}
                            {product.color && <p><strong className="text-[#302b35]">Color:</strong> {product.color}</p>}
                            {product.material && <p><strong className="text-[#302b35]">Material:</strong> {product.material}</p>}
                            {product.style && <p><strong className="text-[#302b35]">Style:</strong> {product.style}</p>}
                            {product.collection && <p><strong className="text-[#302b35]">Collection:</strong> {product.collection}</p>}
                            {product.origin && <p><strong className="text-[#302b35]">Origin:</strong> {product.origin}</p>}
                            <p><strong className="text-[#302b35]">Quantity:</strong> {item.quantity}</p>
                          </div>

                          {(dimensions.lengthCm || dimensions.widthCm || dimensions.heightCm || dimensions.weightKg) && (
                            <div className="mt-4 border-t border-[#eee8e2] pt-3 text-xs text-[#8a837c]">
                              {dimensions.lengthCm && <span className="mr-4">L {dimensions.lengthCm} cm</span>}
                              {dimensions.widthCm && <span className="mr-4">W {dimensions.widthCm} cm</span>}
                              {dimensions.heightCm && <span className="mr-4">H {dimensions.heightCm} cm</span>}
                              {dimensions.weightKg && <span>Weight {dimensions.weightKg} kg</span>}
                            </div>
                          )}

                          {customization.length > 0 && (
                            <div className="mt-4 border-l-2 border-[#c99545] bg-[#faf9f7] px-4 py-3">
                              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8a837c]">Selected Options</p>
                              <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-[#67625c] sm:grid-cols-2">
                                {customization.map(([key, value]) => (
                                  <p key={key}>
                                    <strong className="text-[#302b35]">{String(key)}:</strong>{' '}
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {product.productNote && (
                            <p className="mt-3 text-xs leading-5 text-[#8a837c]">{product.productNote}</p>
                          )}
                        </div>

                        <div className="text-left sm:w-32 sm:text-right">
                          <p className="font-serif text-xl text-[#302b35]">${Number(item.totalPrice).toFixed(2)}</p>
                          <p className="mt-1 text-sm text-[#67625c]">${Number(item.unitPrice).toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="border border-[#e0dbd6] bg-white p-6 shadow-[0_8px_30px_rgba(48,43,53,0.04)] sm:p-8">
                <h2 className="text-2xl font-serif text-[#302b35] mb-6">Shipping Address</h2>
                {order.shippingMethodName && (
                  <p className="mb-3 text-xs uppercase tracking-[0.14em] text-[#8a837c]">
                    Shipping: {order.shippingMethodName}
                  </p>
                )}
                <div className="text-[#67625c] space-y-1">
                  <p className="font-medium text-[#302b35]">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.stateProvince || order.shippingAddress.state || ''} {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="pt-2">{order.shippingAddress.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-[#e0dbd6] bg-luxury-beige p-6">
              <h2 className="text-xl font-serif text-[#302b35] mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-[#e0dbd6] text-sm">
                <div className="flex justify-between text-[#67625c]">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#67625c]">
                  <span>Shipping</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#67625c]">
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

              <div className="flex justify-between text-2xl font-serif text-[#302b35] mb-8">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {order.paymentStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={handleResumePayment}
                      disabled={resumingPayment}
                      className="w-full border border-luxury-gold bg-luxury-gold/10 px-6 py-3 text-sm text-[#302b35] hover:bg-luxury-gold/20 transition-colors disabled:opacity-50"
                    >
                      {resumingPayment ? 'Preparing Payment…' : 'Resume Payment'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={resumingPayment}
                      className="w-full border border-luxury-terracotta bg-luxury-terracotta/10 px-6 py-3 text-sm text-luxury-terracotta hover:bg-luxury-terracotta/20 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {(order.paymentStatus === 'FAILED' || order.status === 'Failed') && (
                  <Link
                    href={`/checkout?retryOrderId=${order.id}`}
                    className="block w-full border border-luxury-gold bg-luxury-gold/10 px-6 py-3 text-center text-sm text-[#302b35] hover:bg-luxury-gold/20 transition-colors"
                  >
                    Retry Payment
                  </Link>
                )}

                {resumeProviderOrderId && order.paymentStatus === 'PENDING' && (
                  <button
                    type="button"
                    onClick={handleCaptureResumedPayPal}
                    disabled={resumingPayment}
                    className="w-full border border-luxury-gold bg-luxury-gold/10 px-6 py-3 text-sm text-[#302b35] hover:bg-luxury-gold/20 transition-colors disabled:opacity-50"
                  >
                    {resumingPayment ? 'Capturing…' : 'Capture PayPal Payment'}
                  </button>
                )}

                {resumeCrypto && order.paymentStatus === 'PENDING' && (
                  <div className="border border-[#e0dbd6] bg-white p-5">
                    <h3 className="font-serif text-lg text-[#302b35]">Complete Crypto Payment</h3>
                    <p className="mt-2 text-sm text-[#67625c]">
                      Send {resumeCrypto.amount.toFixed(2)} {resumeCrypto.asset} on {resumeCrypto.network}.
                    </p>
                    {resumeCryptoQr && (
                      <img src={resumeCryptoQr} alt="Crypto payment QR code" className="mx-auto my-4 h-48 w-48" />
                    )}
                    <p className="break-all text-xs text-[#67625c]">{resumeCrypto.address}</p>
                    <input
                      value={resumeCryptoTxHash}
                      onChange={(e) => setResumeCryptoTxHash(e.target.value)}
                      placeholder="Transaction hash"
                      className="mt-4 w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-[#302b35]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyResumedCrypto}
                      disabled={resumingPayment || !resumeCryptoTxHash.trim()}
                      className="mt-3 w-full btn-luxury px-6 py-3 text-sm disabled:opacity-50"
                    >
                      {resumingPayment ? 'Verifying…' : 'Verify Crypto Payment'}
                    </button>
                  </div>
                )}

                {normalizedStatus === 'DELIVERED' && (
                  <button className="btn-luxury w-full px-6 py-3 text-sm">
                    Reorder
                  </button>
                )}

                <button className="w-full border border-[#e0dbd6] bg-[#f7f3ef] px-6 py-3 text-sm text-[#67625c] hover:border-luxury-gold transition-colors">
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
  const normalized = status.toUpperCase();
  const stages = [
    { label: 'Order Placed', active: true },
    { label: 'Processing', active: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(normalized) },
    { label: 'Shipped', active: ['SHIPPED', 'DELIVERED'].includes(normalized) },
    { label: 'Delivered', active: normalized === 'DELIVERED' },
  ];

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-4 h-[calc(100%-32px)] w-px bg-[#e0dbd6]" />
      <div className="space-y-5">
        {stages.map((item, idx) => (
          <div key={item.label} className="relative flex items-center gap-4">
            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${item.active ? 'border-[#c99545] bg-[#c99545] text-white' : 'border-[#e0dbd6] bg-white text-[#8a837c]'}`}>
              {item.active ? '✓' : idx + 1}
            </div>
            <div>
              <p className={`text-sm ${item.active ? 'font-medium text-[#302b35]' : 'text-[#8a837c]'}`}>{item.label}</p>
              {idx === 0 && <p className="mt-1 text-xs text-[#8a837c]">{new Date(createdAt).toLocaleString()}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
