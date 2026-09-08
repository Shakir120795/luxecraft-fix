'use client';

import { useState, useEffect } from 'react';
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
  Cart,
  Address,
  ShippingMethod,
} from '@/lib/api';

type CheckoutStep = 'customer' | 'address' | 'shipping' | 'payment' | 'review';

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
  const [paymentProvider, setPaymentProvider] = useState('none');
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [paymentPublicKey, setPaymentPublicKey] = useState<string | undefined>();
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentGuestAccessToken, setPaymentGuestAccessToken] = useState<string | null>(null);

  useEffect(() => {
    loadCheckoutData();
  }, []);

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
      setPaymentProvider(paymentConfig.provider);
      setPaymentConfigured(paymentConfig.configured && paymentConfig.currencySupported);
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

    // Load shipping methods
    const shippingAddr = authenticated
      ? addresses.find(a => a.id === selectedShippingAddressId)
      : guestShippingAddress;
    if (shippingAddr && cart) {
      const methods = await getShippingMethods({
        country: shippingAddr.country,
        weight: cart.items.reduce((sum, item) => sum + (item.product.weightKg || 0) * item.quantity, 0),
        orderValue: cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
      });
      setShippingMethods(methods);
      
      if (methods.length > 0) {
        setShippingMethod(methods[0]);
      }
    }

    setCurrentStep('shipping');
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!shippingMethod) {
      setError('Please select a shipping method');
      return;
    }

    if (paymentProvider !== 'stripe' || !paymentConfigured) {
      setError('Payment service is currently unavailable. Please try again later.');
      return;
    }

    setCurrentStep('payment');
    await handlePlaceOrder();
  }

  async function handlePlaceOrder() {
    if (!cart || !shippingMethod) {
      setError('Shipping is unavailable for this address.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await createOrder({
        shippingAddressId: selectedShippingAddressId || undefined,
        shippingMethodId: shippingMethod.id,
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

      if (result.success && result.data) {
        if (paymentProvider === 'stripe' && result.data.clientSecret) {
          setPaymentOrderId(result.data.order.id);
          setPaymentGuestAccessToken(result.data.guestAccessToken || null);
          setPaymentClientSecret(result.data.clientSecret);
          setSubmitting(false);
          return;
        }
        // Redirect to order confirmation
        const confirmationQuery = new URLSearchParams({ orderId: result.data.order.id });
        if (result.data.guestAccessToken) confirmationQuery.set('access', result.data.guestAccessToken);
        router.push(`/order-confirmation?${confirmationQuery.toString()}`);
      } else {
        setError(result.message || 'Failed to place order');
        setSubmitting(false);
      }
    } catch (err) {
      setError('Failed to place order');
      setSubmitting(false);
      console.error(err);
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
            <StepIndicator step={1} label="Customer" current={currentStep === 'customer'} completed={['address', 'shipping', 'payment', 'review'].includes(currentStep)} />
            <div className="w-12 h-px bg-luxury-sand" />
            <StepIndicator step={2} label="Address" current={currentStep === 'address'} completed={['shipping', 'payment', 'review'].includes(currentStep)} />
            <div className="w-12 h-px bg-luxury-sand" />
            <StepIndicator step={3} label="Shipping" current={currentStep === 'shipping'} completed={['payment', 'review'].includes(currentStep)} />
            <div className="w-12 h-px bg-luxury-sand" />
            <StepIndicator step={4} label="Payment" current={currentStep === 'payment'} completed={currentStep === 'review'} />
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

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-2 font-serif text-2xl font-normal text-luxury-charcoal">Shipping</h2>
                <p className="mb-7 text-sm text-luxury-brown">
                  Shipping is calculated automatically for your delivery country.
                </p>

                <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-6">
                  {shippingMethod ? (
                    <div className="rounded-md border border-[#ded8d0] bg-[#faf9f7] p-5">
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-luxury-brown/70">
                            Shipping to {shippingMethod.name.replace(' Shipping', '')}
                          </p>
                          <p className="mt-2 font-medium text-luxury-charcoal">
                            {shippingMethod.description || 'Country-based shipping'}
                          </p>
                          {shippingMethod.estimatedDays && (
                            <p className="mt-1 text-sm text-luxury-brown">
                              Estimated delivery: {shippingMethod.estimatedDays} business days
                            </p>
                          )}
                        </div>
                        <p className="font-serif text-xl text-luxury-charcoal">
                          {shippingMethod.currency === 'INR' ? '₹' :
                           shippingMethod.currency === 'USD' ? '$' :
                           shippingMethod.currency === 'CAD' ? 'C$' :
                           shippingMethod.currency === 'GBP' ? '£' :
                           shippingMethod.currency === 'EUR' ? '€' :
                           shippingMethod.currency === 'AUD' ? 'A$' :
                           `${shippingMethod.currency} `}
                          {shippingMethod.rate.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-luxury-brown">
                      No shipping available for your delivery country.
                    </p>
                  )}

                </form>
              </div>
            )}            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="rounded-lg border border-[#ded8d0] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-7 font-serif text-2xl font-normal text-luxury-charcoal">Payment</h2>

                {paymentProvider === 'stripe' && paymentConfigured ? (
                  paymentClientSecret && paymentPublicKey && paymentOrderId ? (
                    <Elements
                      stripe={loadStripe(paymentPublicKey)}
                      options={{ clientSecret: paymentClientSecret }}
                    >
                      <StripePaymentForm
                        returnUrl={'/order-confirmation?orderId=' + encodeURIComponent(paymentOrderId) + (paymentGuestAccessToken ? '&access=' + encodeURIComponent(paymentGuestAccessToken) : '')}
                        onSuccess={() => {
                          const confirmationQuery = new URLSearchParams({ orderId: paymentOrderId });
                          if (paymentGuestAccessToken) confirmationQuery.set('access', paymentGuestAccessToken);
                          router.push('/order-confirmation?' + confirmationQuery.toString());
                        }}
                        onError={setError}
                      />
                    </Elements>
                  ) : (
                    <div className="space-y-6">
                      <div className="border border-luxury-sand bg-luxury-cream p-6">
                        <p className="text-luxury-charcoal text-center">
                          {submitting ? 'Preparing secure payment...' : 'Unable to initialize payment. Please try again.'}
                        </p>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep('shipping')}
                          className="rounded-md border border-[#cfc8c0] bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white"
                          disabled={submitting}
                        >
                          ' Back
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    <div className="border border-luxury-terracotta/40 bg-luxury-terracotta/10 p-6">
                      <p className="text-luxury-charcoal text-center">
                        Payment service is currently unavailable. Please try again later.
                      </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('shipping')}
                        className="rounded-md border border-[#cfc8c0] bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white"
                      >
                        ' Back
                      </button>
                    </div>
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
                  Continue to Shipping →
                </button>
              </div>
            )}
            {currentStep === "shipping" && (
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setCurrentStep("address")} className="rounded-md border border-[#cfc8c0] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#302b35] transition hover:border-[#302b35] hover:bg-[#302b35] hover:text-white">
                  Back
                </button>
                <button type="submit" form="shipping-form" disabled={!shippingMethod} className="flex-1 rounded-md bg-[#302b35] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-50">
                  Continue to Payment →
                </button>
              </div>
            )}
          </div>
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




















