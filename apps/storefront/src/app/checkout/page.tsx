'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { 
  getCart, 
  isAuthenticated, 
  getCurrentUser,
  getAddresses, 
  createAddress,
  getShippingMethods,
  getPaymentConfiguration,
  createOrder,
  verifyRazorpayPayment,
  capturePayPalPayment,
  verifyCryptoPayment,
  Cart,
  Address,
  ShippingMethod,
} from '@/lib/api';

type CheckoutStep = 'customer' | 'address' | 'payment';

const CURRENCY_SYMBOLS: Record<string,string> = { USD:'$', INR:'₹', CAD:'C$', GBP:'£', AUD:'A$', AED:'د.إ', EUR:'€', JPY:'¥', SGD:'S$', NZD:'NZ$', CHF:'CHF ', CNY:'¥' };
function money(amount:number,currency:string){return (CURRENCY_SYMBOLS[currency] ?? (currency + ' ')) + amount.toFixed(2);}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer info
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [guestShippingAddress, setGuestShippingAddress] = useState<Omit<Address, 'id' | 'userId' | 'createdAt'>>();
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>('');
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Shipping
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);

  // Payment provider state
  const [paymentProvider, setPaymentProvider] = useState<'razorpay' | 'paypal' | 'crypto' | 'none'>('none');
  const [availablePaymentProviders, setAvailablePaymentProviders] = useState<string[]>([]);
  const [cryptoNetworks, setCryptoNetworks] = useState<string[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<string[]>([]);
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState('ethereum');
  const [selectedCryptoAsset, setSelectedCryptoAsset] = useState('USDT');
  const [cryptoPayment, setCryptoPayment] = useState<{ network: string; asset: string; address: string; amount: number; currency: string; instructions: string } | null>(null);
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [cryptoQrCode, setCryptoQrCode] = useState<string | null>(null);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [paymentPublicKey, setPaymentPublicKey] = useState<string | undefined>();
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentProviderOrderId, setPaymentProviderOrderId] = useState<string | null>(null);
  const [paymentGuestAccessToken, setPaymentGuestAccessToken] = useState<string | null>(null);

  useEffect(() => {
    loadCheckoutData();
  }, []);
  useEffect(() => {
    if (!cryptoPayment) {
      setCryptoQrCode(null);
      return;
    }

    const qrPayload = `WOLHOMES|${cryptoPayment.network}|${cryptoPayment.asset}|${cryptoPayment.address}|${cryptoPayment.amount}`;
    QRCode.toDataURL(qrPayload, { margin: 2, width: 240 })
      .then(setCryptoQrCode)
      .catch(() => setCryptoQrCode(null));
  }, [cryptoPayment]);



  async function loadCheckoutData() {
    try {
      setLoading(true);
      const cartData = await getCart();
      
      if (!cartData || cartData.items.length === 0) {
        router.push('/cart');
        return;
      }

      setCart(cartData);

      // Load payment provider configuration for the cart currency
      const paymentConfig = await getPaymentConfiguration(cartData.currency);
      setPaymentProvider(paymentConfig.provider as 'razorpay' | 'paypal' | 'crypto' | 'none');
      setAvailablePaymentProviders(paymentConfig.providers || []);
      setCryptoNetworks(paymentConfig.cryptoNetworks || []);
      setCryptoAssets(paymentConfig.cryptoSupportedAssets || []);
      setPaymentConfigured(paymentConfig.currencySupported && (paymentConfig.configured || (paymentConfig.providers || []).length > 0));
      setPaymentPublicKey(paymentConfig.publicKey);

      // Check authentication
      const authenticated = isAuthenticated();
      
      if (authenticated) {
        const user = getCurrentUser();
        if (user) {
          setGuestEmail(user.email);
          setGuestFirstName(user.firstName || '');
          setGuestLastName(user.lastName || '');
        }

        // Load addresses
        const addressData = await getAddresses();
        setAddresses(addressData);
        
        const defaultAddr = addressData.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedShippingAddressId(defaultAddr.id);
          setSelectedBillingAddressId(defaultAddr.id);
        }

        setCurrentStep('address');
      } else if (!isGuest) {
        // Redirect to login
        router.push(`/auth/login?redirect=/checkout`);
        return;
      } else {
        setCurrentStep('customer');
      }
    } catch (err) {
      setError('Failed to load checkout data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomerInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!guestEmail || !guestFirstName || !guestLastName) {
      setError('Please fill in all required fields');
      return;
    }

    setCurrentStep('address');
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const authenticated = isAuthenticated();
    
    if (authenticated && !selectedShippingAddressId) {
      setError('Please select a shipping address');
      return;
    }

    if (authenticated && !sameAsShipping && !selectedBillingAddressId) {
      setError('Please select a billing address');
      return;
    }

    if (!authenticated && !guestShippingAddress) {
      setError('Please enter and use a shipping address.');
      return;
    }

    // Keep the backend shipping method attached to the order while presenting
    // shipping and payment together in one checkout step.
    const shippingAddr = authenticated
      ? addresses.find(a => a.id === selectedShippingAddressId)
      : guestShippingAddress;

    if (!shippingAddr || !cart) {
      setError('Shipping is unavailable for this address.');
      return;
    }

    const methods = await getShippingMethods({
      country: shippingAddr.country,
      weight: cart.items.reduce((sum, item) => sum + (item.product.weightKg || 0) * item.quantity, 0),
      orderValue: cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
    });

    if (methods.length === 0) {
      setError('Worldwide shipping is currently unavailable for this address.');
      return;
    }

    setShippingMethods(methods);
    setShippingMethod(methods[0]);
    setCurrentStep('payment');
  }

  async function handlePlaceOrder() {
    if (!cart || !shippingMethod) {
      setError('Shipping is unavailable for this address.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const accessToken = paymentGuestAccessToken || undefined;

      if (paymentProvider === 'crypto' && cryptoPayment && paymentOrderId) {
        if (!cryptoTxHash.trim()) {
          setError('Please enter the transaction hash after sending the payment.');
          setSubmitting(false);
          return;
        }

        const verification = await verifyCryptoPayment({
          orderId: paymentOrderId,
          txHash: cryptoTxHash.trim(),
          network: cryptoPayment.network,
          asset: cryptoPayment.asset,
          accessToken,
        });

        if (!verification.success) {
          setError(verification.message || 'Crypto payment verification failed.');
          setSubmitting(false);
          return;
        }

        const confirmationQuery = new URLSearchParams({ orderId: paymentOrderId });
        if (accessToken) confirmationQuery.set('access', accessToken);
        router.push(`/order-confirmation?${confirmationQuery.toString()}`);
        return;
      }

      if (paymentProvider === 'paypal' && paymentProviderOrderId && paymentOrderId) {
        const capture = await capturePayPalPayment({
          orderId: paymentOrderId,
          paypalOrderId: paymentProviderOrderId,
          accessToken,
        });

        if (!capture.success) {
          setError(capture.message || 'PayPal payment capture failed.');
          setSubmitting(false);
          return;
        }

        const confirmationQuery = new URLSearchParams({ orderId: paymentOrderId });
        if (accessToken) confirmationQuery.set('access', accessToken);
        router.push(`/order-confirmation?${confirmationQuery.toString()}`);
        return;
      }

      const selectedCryptoMethod =
        paymentProvider === 'crypto'
          ? `crypto:${selectedCryptoAsset}:${selectedCryptoNetwork}`
          : paymentProvider;

      const result = await createOrder({
        shippingAddressId: selectedShippingAddressId || undefined,
        shippingMethodId: shippingMethod.id,
        paymentProvider: paymentProvider as 'razorpay' | 'paypal' | 'crypto',
        paymentMethod: selectedCryptoMethod,
        guestEmail: isGuest ? guestEmail : undefined,
        guestShippingAddress: isGuest
          ? {
              firstName: guestShippingAddress?.firstName ?? guestFirstName,
              lastName: guestShippingAddress?.lastName ?? guestLastName,
              addressLine1: guestShippingAddress?.addressLine1 ?? '',
              addressLine2: guestShippingAddress?.addressLine2 ?? undefined,
              city: guestShippingAddress?.city ?? '',
              stateProvince: guestShippingAddress?.stateProvince ?? undefined,
              postalCode: guestShippingAddress?.postalCode ?? '',
              country: guestShippingAddress?.country ?? '',
              phone: guestShippingAddress?.phone ?? undefined,
            }
          : undefined,
      });

      if (!result.success || !result.data) {
        setError(result.message || 'Failed to place order');
        setSubmitting(false);
        return;
      }

      setPaymentOrderId(result.data.order.id);
      setPaymentProviderOrderId(result.data.providerOrderId || null);
      setPaymentGuestAccessToken(result.data.guestAccessToken || null);
      setPaymentClientSecret(result.data.clientSecret || null);

      if (paymentProvider === 'crypto' && result.data.crypto) {
        setCryptoPayment(result.data.crypto);
        setSubmitting(false);
        return;
      }

      if (paymentProvider === 'razorpay') {
        if (!result.data.providerOrderId || !result.data.publicKey) {
          setError('Razorpay payment could not be initialized.');
          setSubmitting(false);
          return;
        }

        const loadRazorpay = () =>
          new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existing) {
              resolve();
              return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
            document.body.appendChild(script);
          });

        await loadRazorpay();

        const RazorpayCtor = (window as Window & {
          Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
        }).Razorpay;

        if (!RazorpayCtor) {
          throw new Error('Razorpay Checkout is unavailable.');
        }

        const razorpay = new RazorpayCtor({
          key: result.data.publicKey,
          order_id: result.data.providerOrderId,
          amount: Math.round(Number(result.data.payment?.amount || 0) * 100),
          currency: result.data.payment?.currency || cart.currency,
          name: 'Wolhomes',
          description: `Order ${result.data.order.orderNumber}`,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            setSubmitting(true);

            const verification = await verifyRazorpayPayment({
              orderId: result.data!.order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              accessToken: result.data!.guestAccessToken || undefined,
            });

            if (!verification.success) {
              setError(verification.message || 'Razorpay payment verification failed.');
              setSubmitting(false);
              return;
            }

            const confirmationQuery = new URLSearchParams({ orderId: result.data!.order.id });
            if (result.data!.guestAccessToken) {
              confirmationQuery.set('access', result.data!.guestAccessToken);
            }
            router.push(`/order-confirmation?${confirmationQuery.toString()}`);
          },
        });

        razorpay.open();
        setSubmitting(false);
        return;
      }

      if (paymentProvider === 'paypal') {
        if (!result.data.approveUrl || !result.data.providerOrderId) {
          setError('PayPal payment could not be initialized.');
          setSubmitting(false);
          return;
        }

        window.open(result.data.approveUrl, '_blank', 'noopener,noreferrer');
        setError('PayPal approval page opened in a new tab. Complete the payment there, then return here and click Capture PayPal Payment.');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setSubmitting(false);
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading checkout...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  const originalTotal = cart.items.reduce((sum, item) => sum + (Number(item.product.regularPrice) || Number(item.priceSnapshot) || 0) * item.quantity, 0);
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.priceSnapshot) * item.quantity, 0);
  const shopDiscount = Math.max(0, originalTotal - subtotal);
  const selectedShippingMethod = shippingMethod;
  const shippingCost = selectedShippingMethod?.rate ?? 0;
  const total = subtotal + shippingCost;

  return (
    <main className="min-h-screen bg-[#f8f6f2] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-5 font-serif text-4xl font-light text-luxury-charcoal sm:text-5xl">Checkout</h1>
          <div className="flex items-center justify-center gap-3 text-sm">
            <StepIndicator step={1} label="Customer" current={currentStep === 'customer'} completed={['address', 'payment'].includes(currentStep)} />
            <div className="w-12 h-px bg-luxury-sand" />
            <StepIndicator step={2} label="Address" current={currentStep === 'address'} completed={currentStep === 'payment'} />
            <div className="w-12 h-px bg-luxury-sand" />
            <StepIndicator step={3} label="Shipping & Payment" current={currentStep === 'payment'} completed={false} />
          </div>
        </div>

        {error && (
          <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Customer Info Step */}
            {currentStep === 'customer' && (
              <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-7 font-serif text-2xl font-normal text-luxury-charcoal">Contact Information</h2>
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-serif text-luxury-charcoal mb-2">Email *</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-serif text-luxury-charcoal mb-2">First Name *</label>
                      <input
                        type="text"
                        value={guestFirstName}
                        onChange={(e) => setGuestFirstName(e.target.value)}
                        required
                        className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-serif text-luxury-charcoal mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={guestLastName}
                        onChange={(e) => setGuestLastName(e.target.value)}
                        required
                        className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full rounded-md bg-[#302b35] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24]">
                    Continue to Address -&gt;
                  </button>
                </form>
              </div>
            )}

            {/* Address Step */}
            {currentStep === 'address' && (
              <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-7 font-serif text-2xl font-normal text-luxury-charcoal">Shipping Address</h2>
                <form id="address-form" onSubmit={handleAddressSubmit} className="space-y-6">
                  {isGuest ? (
                    <AddressForm
                      guestMode
                      initialFirstName={guestFirstName}
                      initialLastName={guestLastName}
                      onGuestAddress={(address) => setGuestShippingAddress(address)}
                    />
                  ) : addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <label key={addr.id} className="flex items-start gap-3 p-4 border border-black/10 bg-white transition hover:border-black/40 cursor-pointer">
                          <input
                            type="radio"
                            name="shippingAddress"
                            value={addr.id}
                            checked={selectedShippingAddressId === addr.id}
                            onChange={(e) => setSelectedShippingAddressId(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-luxury-charcoal">{addr.firstName} {addr.lastName}</p>
                            <p className="text-sm text-luxury-brown mt-1">
                              {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-sm text-luxury-brown">
                              {addr.city}, {addr.stateProvince} {addr.postalCode}
                            </p>
                            <p className="text-sm text-luxury-brown">{addr.country}</p>
                            <p className="text-sm text-luxury-brown">{addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-luxury-brown">No saved addresses. Please add a new address.</p>
                  )}

                  {!isGuest && <button
                    type="button"
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="text-sm text-luxury-gold hover:text-luxury-darkGold underline"
                  >
                    {showNewAddressForm ? '-- Cancel' : '+ Add New Address'}
                  </button>}

                  {!isGuest && showNewAddressForm && <AddressForm onSuccess={() => { loadCheckoutData(); setShowNewAddressForm(false); }} />}

                  {!isGuest && <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="sameAsShipping"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="sameAsShipping" className="text-sm text-luxury-brown">
                      Billing address same as shipping
                    </label>
                  </div>}

                </form>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-3 font-serif text-2xl font-normal text-luxury-charcoal">Shipping & Payment</h2>
                <div className="mb-7 rounded-lg border border-[#ded8d0] bg-[#faf9f6] p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-luxury-brown/70">Shipping</p>
                      <p className="mt-2 font-serif text-xl text-luxury-charcoal">Free Worldwide Shipping</p>
                      <p className="mt-1 text-sm text-luxury-brown">All products are delivered worldwide with no shipping charge.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-green-700">FREE</span>
                  </div>
                  {shippingMethod && (
                    <p className="mt-4 border-t border-[#ded8d0] pt-4 text-sm text-luxury-brown">
                      Delivery method: {shippingMethod.description || shippingMethod.name}
                    </p>
                  )}
                </div>
                <p className="mb-7 text-sm text-luxury-brown">Select a secure payment method to complete your Wolhomes order.</p>

                {availablePaymentProviders.length > 0 && paymentConfigured ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { id: 'razorpay', label: 'Razorpay', description: 'Cards, UPI & Indian payment methods' },
                        { id: 'paypal', label: 'PayPal', description: 'Pay securely with your PayPal account' },
                        { id: 'crypto', label: 'Crypto', description: 'USDT / USDC stablecoin payment' },
                      ].map((method) => {
                        const available = availablePaymentProviders.includes(method.id);
                        const selected = paymentProvider === method.id;

                        return (
                          <button
                            key={method.id}
                            type="button"
                            disabled={!available || submitting}
                            onClick={() => {
                              setError(null);
                              setPaymentProvider(method.id as 'razorpay' | 'paypal' | 'crypto');
                              setCryptoPayment(null);
                              setCryptoTxHash('');
                            }}
                            className={
                              'rounded-lg border p-5 text-left transition ' +
                              (selected
                                ? 'border-[#302b35] bg-[#f5f1eb] shadow-sm'
                                : 'border-[#ded8d0] bg-white hover:border-[#8f8579]') +
                              (!available ? ' cursor-not-allowed opacity-40' : '')
                            }
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-serif text-lg text-luxury-charcoal">{method.label}</span>
                              <span
                                className={
                                  'h-4 w-4 rounded-full border ' +
                                  (selected ? 'border-[#302b35] bg-[#302b35]' : 'border-[#aaa29a]')
                                }
                              />
                            </div>
                            <p className="text-xs leading-5 text-luxury-brown">{method.description}</p>
                            {!available && (
                              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-terracotta">
                                Currently unavailable
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {paymentProvider === 'crypto' && (
                      <div className="space-y-5 rounded-lg border border-[#ded8d0] bg-[#faf9f6] p-5">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                            Network
                          </label>
                          <select
                            value={selectedCryptoNetwork}
                            onChange={(e) => {
                              setSelectedCryptoNetwork(e.target.value);
                              if (e.target.value === 'tron' && selectedCryptoAsset === 'USDC') {
                                setSelectedCryptoAsset('USDT');
                              }
                              setCryptoPayment(null);
                              setCryptoTxHash('');
                            }}
                            disabled={submitting || !!cryptoPayment}
                            className="w-full rounded-md border border-[#cfc8c0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none"
                          >
                            {(cryptoNetworks.length ? cryptoNetworks : ['ethereum', 'solana', 'tron']).map((network) => (
                              <option key={network} value={network}>
                                {network.charAt(0).toUpperCase() + network.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                            Asset
                          </label>
                          <select
                            value={selectedCryptoAsset}
                            onChange={(e) => {
                              setSelectedCryptoAsset(e.target.value);
                              setCryptoPayment(null);
                              setCryptoTxHash('');
                            }}
                            disabled={submitting || !!cryptoPayment}
                            className="w-full rounded-md border border-[#cfc8c0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none"
                          >
                            {(cryptoAssets.length ? cryptoAssets : ['USDT', 'USDC'])
                              .filter((asset) => !(selectedCryptoNetwork === 'tron' && asset === 'USDC'))
                              .map((asset) => (
                                <option key={asset} value={asset}>
                                  {asset}
                                </option>
                              ))}
                          </select>
                        </div>

                        {cryptoPayment && (
                          <div className="space-y-5">
                            <div className="rounded-md border border-[#ded8d0] bg-white p-5">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                                Send exactly
                              </p>
                              <p className="font-serif text-2xl text-luxury-charcoal">
                                {cryptoPayment.amount.toFixed(6)} {cryptoPayment.asset}
                              </p>
                              <p className="mt-3 text-xs text-luxury-brown">
                                {cryptoPayment.network} network
                              </p>
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                                Receiving address
                              </p>
                              <div className="break-all rounded-md border border-[#ded8d0] bg-white p-4 font-mono text-xs text-luxury-charcoal">
                                {cryptoPayment.address}
                              </div>
                            </div>                            <div className="rounded-md border border-[#ded8d0] bg-white p-5 text-center">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                                Scan to Pay
                              </p>
                              {cryptoQrCode ? (
                                <img
                                  src={cryptoQrCode}
                                  alt={`${cryptoPayment.asset} payment QR code`}
                                  className="mx-auto h-48 w-48 rounded-md border border-[#ded8d0] bg-white p-2"
                                />
                              ) : (
                                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-md border border-dashed border-[#cfc8c0] text-xs text-luxury-brown">
                                  Generating QR...
                                </div>
                              )}
                              <p className="mt-3 text-xs text-luxury-brown">
                                {cryptoPayment.asset} · {cryptoPayment.network}
                              </p>
                            </div>


                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-brown">
                                Transaction hash
                              </label>
                              <input
                                value={cryptoTxHash}
                                onChange={(e) => setCryptoTxHash(e.target.value.trim())}
                                placeholder="Paste your transaction hash"
                                className="w-full rounded-md border border-[#cfc8c0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none focus:border-[#302b35]"
                                disabled={submitting}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('address')}
                        disabled={submitting}
                        className="rounded-md border border-[#cfc8c0] bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white disabled:opacity-50"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={submitting || paymentProvider === 'none'}
                        className="flex-1 rounded-md bg-[#302b35] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting
                          ? 'Preparing secure payment...'
                          : cryptoPayment
                            ? 'Payment details ready'
                            : paymentProvider === 'razorpay'
                              ? 'Continue with Razorpay'
                              : paymentProvider === 'paypal'
                                ? paymentProviderOrderId ? 'Capture PayPal Payment' : 'Continue with PayPal'
                                : 'Continue with Crypto'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border border-luxury-terracotta/40 bg-luxury-terracotta/10 p-6">
                      <p className="text-luxury-charcoal text-center">
                        No payment method is currently configured for this currency.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('address')}
                      className="rounded-md border border-[#cfc8c0] bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Order Summary */}
          <div className="sticky top-24 min-w-0">
            <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-7 shadow-sm">
              <h2 className="mb-6 font-serif text-2xl font-normal text-luxury-charcoal">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-luxury-sand">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 border border-luxury-sand bg-luxury-cream shrink-0">
                      {item.product.media?.[0]?.url ? (
                        <img src={item.product.media[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-luxury-sand" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-luxury-charcoal line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-luxury-brown">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-serif text-luxury-charcoal">{money(item.priceSnapshot * item.quantity, shippingMethod?.currency ?? cart.currency)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-[#ded8d0] text-sm">
                <div className="flex justify-between text-[#59535b]">
                  <span>Item(s) total</span>
                  <span>${originalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#59535b]">
                  <span>Shop discount</span>
                  <span className="font-medium text-green-700">-${shopDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#59535b]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#59535b]">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-700">{shippingCost === 0 ? "FREE" : "$" + shippingCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-2xl font-serif text-luxury-charcoal">
                <span>Total</span>
                <span className="text-2xl font-medium text-luxury-charcoal">${total.toFixed(2)}</span>
              </div>
            </div>
            {currentStep === "address" && (
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setCurrentStep("customer")} className="rounded-md border border-[#cfc8c0] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white">
                  Back
                </button>
                <button type="submit" form="address-form" className="flex-1 rounded-md bg-[#302b35] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#211e24]">
                  Continue to Shipping & Payment →
                </button>
              </div>
            )}
undefined          </div>
        </div>
      </div>
    </main>
  );
}
function StepIndicator({ step, label, current, completed }: { step: number; label: string; current: boolean; completed: boolean }) {
  return (
    <button type="button" aria-current={current ? "step" : undefined} className={current ? "flex min-w-[88px] flex-col items-center rounded-md border border-luxury-gold bg-luxury-gold/10 px-4 py-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-luxury-gold/30" : completed ? "flex min-w-[88px] flex-col items-center rounded-md border border-[#d9c79a] bg-[#faf7ef] px-4 py-2 transition-all hover:border-luxury-gold focus:outline-none focus:ring-2 focus:ring-luxury-gold/30" : "flex min-w-[88px] flex-col items-center rounded-md border border-[#ded8d0] bg-white px-4 py-2 transition-all hover:border-luxury-gold hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold/30"}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif transition-colors ${current ? "bg-luxury-gold text-white" : completed ? "bg-luxury-gold/70 text-white" : "bg-luxury-sand text-luxury-brown"}`}>
        {completed ? "✓" : step}
      </div>
      <span className={`text-xs mt-2 ${current ? "font-semibold text-luxury-charcoal" : "text-luxury-brown"}`}>{label}</span>
    </button>
  );
}
function StripePaymentForm({
  returnUrl,
  onSuccess,
  onError,
}: {
  returnUrl: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment service is still loading. Please try again.');
      return;
    }

    setProcessing(true);
    onError('');

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl.startsWith('http') ? returnUrl : window.location.origin + returnUrl,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    setProcessing(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-black/10 bg-white p-5">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="btn-luxury w-full px-8 py-4 disabled:opacity-50"
      >
        {processing ? 'Processing Payment...' : 'Pay Securely'}
      </button>
    </form>
  );
}
function AddressForm({
  onSuccess,
  guestMode = false,
  initialFirstName = '',
  initialLastName = '',
  onGuestAddress,
}: {
  onSuccess?: () => void;
  guestMode?: boolean;
  initialFirstName?: string;
  initialLastName?: string;
  onGuestAddress?: (address: Omit<Address, 'id' | 'userId' | 'createdAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'US',
    phone: '',
    isDefault: false,
    type: 'BOTH' as 'SHIPPING' | 'BILLING' | 'BOTH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (guestMode) {
      onGuestAddress?.(formData);
      setSubmitting(false);
      return;
    }

    const result = await createAddress(formData);

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.message || 'Failed to create address');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-luxury-sand bg-luxury-cream">
      <h3 className="font-serif text-lg text-luxury-charcoal mb-4">New Address</h3>

      {error && (
        <div className="border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
        <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
      </div>

      <input name="company" placeholder="Company (optional)" value={formData.company} onChange={handleChange} className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
      <input name="addressLine1" placeholder="Address Line 1 *" value={formData.addressLine1} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
      <input name="addressLine2" placeholder="Address Line 2" value={formData.addressLine2} onChange={handleChange} className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />

      <div className="grid grid-cols-2 gap-3">
        <input name="city" placeholder="City *" value={formData.city} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
        <input name="stateProvince" placeholder="State" value={formData.stateProvince} onChange={handleChange} className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="postalCode" placeholder="Postal Code *" value={formData.postalCode} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
        <input name="country" placeholder="Country *" value={formData.country} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />
      </div>

      <input name="phone" type="tel" placeholder="Phone *" value={formData.phone} onChange={handleChange} required className="w-full rounded-md border border-[#ded8d0] bg-white px-4 py-3 text-sm text-luxury-charcoal outline-none transition focus:border-[#302b35]" />

      <button type="submit" disabled={submitting} className="btn-luxury w-full px-6 py-3 text-sm disabled:opacity-50">
        {submitting ? 'Saving...' : guestMode ? 'Use This Address' : 'Save Address'}
      </button>
    </form>
  );
}




















