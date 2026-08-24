'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getCart, 
  isAuthenticated, 
  getCurrentUser,
  getAddresses, 
  createAddress,
  getShippingMethods,
  createOrder,
  Cart,
  Address,
  ShippingMethod,
} from '@/lib/api';

type CheckoutStep = 'customer' | 'address' | 'shipping' | 'payment' | 'review';

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
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');

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
        setSelectedShippingMethodId(methods[0].id);
      }
    }

    setCurrentStep('shipping');
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedShippingMethodId) {
      setError('Please select a shipping method');
      return;
    }

    setCurrentStep('payment');
  }

  async function handlePlaceOrder() {
    if (!cart) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await createOrder({
        shippingAddressId: selectedShippingAddressId || undefined,
        shippingMethodId: selectedShippingMethodId,
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
        // Redirect to order confirmation
        router.push(`/order-confirmation?orderId=${result.data.order.id}`);
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

  const subtotal = cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  const selectedShippingMethod = shippingMethods.find(m => m.id === selectedShippingMethodId);
  const shippingCost = selectedShippingMethod?.rate || 0;
  const taxAmount = 0; // TODO: Calculate tax
  const total = subtotal + shippingCost + taxAmount;

  return (
    <main className="min-h-screen bg-luxury-cream py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-4">Checkout</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Customer Info Step */}
            {currentStep === 'customer' && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Contact Information</h2>
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-serif text-luxury-charcoal mb-2">Email *</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="input-luxury"
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
                        className="input-luxury"
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
                        className="input-luxury"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-luxury w-full px-8 py-4">
                    Continue to Address →
                  </button>
                </form>
              </div>
            )}

            {/* Address Step */}
            {currentStep === 'address' && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Shipping Address</h2>
                <form onSubmit={handleAddressSubmit} className="space-y-6">
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
                        <label key={addr.id} className="flex items-start gap-3 p-4 border border-luxury-sand hover:border-luxury-gold transition-colors cursor-pointer">
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
                    {showNewAddressForm ? '− Cancel' : '+ Add New Address'}
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

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setCurrentStep('customer')} className="btn-luxury-outline px-8 py-4">
                      ← Back
                    </button>
                    <button type="submit" className="btn-luxury flex-1 px-8 py-4">
                      Continue to Shipping →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Shipping Method</h2>
                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  {shippingMethods.length > 0 ? (
                    <div className="space-y-3">
                      {shippingMethods.map(method => (
                        <label key={method.id} className="flex items-center justify-between p-4 border border-luxury-sand hover:border-luxury-gold transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.id}
                              checked={selectedShippingMethodId === method.id}
                              onChange={(e) => setSelectedShippingMethodId(e.target.value)}
                            />
                            <div>
                              <p className="font-medium text-luxury-charcoal">{method.name}</p>
                              {method.description && (
                                <p className="text-sm text-luxury-brown">{method.description}</p>
                              )}
                              {method.estimatedDays && (
                                <p className="text-sm text-luxury-brown/70">Estimated delivery: {method.estimatedDays} days</p>
                              )}
                            </div>
                          </div>
                          <p className="font-serif text-luxury-charcoal">${method.rate.toFixed(2)}</p>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-luxury-brown">No shipping methods available for your location.</p>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setCurrentStep('address')} className="btn-luxury-outline px-8 py-4">
                      ← Back
                    </button>
                    <button type="submit" className="btn-luxury flex-1 px-8 py-4" disabled={shippingMethods.length === 0}>
                      Continue to Payment →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Payment</h2>
                <div className="space-y-6">
                  <div className="border border-luxury-gold/30 bg-luxury-gold/5 p-6">
                    <p className="text-luxury-brown text-center">
                      🔒 Payment integration coming soon. For now, orders will be created without payment.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setCurrentStep('shipping')} className="btn-luxury-outline px-8 py-4">
                      ← Back
                    </button>
                    <button 
                      onClick={handlePlaceOrder} 
                      disabled={submitting}
                      className="btn-luxury flex-1 px-8 py-4 disabled:opacity-50"
                    >
                      {submitting ? 'Placing Order...' : 'Place Order →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-luxury-sand bg-luxury-beige p-6">
              <h2 className="text-xl font-serif text-luxury-charcoal mb-6">Order Summary</h2>

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
                    <p className="text-sm font-serif text-luxury-charcoal">${(item.priceSnapshot * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-luxury-sand text-sm">
                <div className="flex justify-between text-luxury-brown">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-luxury-brown">
                  <span>Shipping</span>
                  <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'TBD'}</span>
                </div>
                <div className="flex justify-between text-luxury-brown">
                  <span>Tax</span>
                  <span>TBD</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-serif text-luxury-charcoal">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ step, label, current, completed }: { step: number; label: string; current: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif transition-colors ${
        current ? 'bg-luxury-gold text-white' : completed ? 'bg-luxury-gold/70 text-white' : 'bg-luxury-sand text-luxury-brown'
      }`}>
        {completed ? '✓' : step}
      </div>
      <span className={`text-xs mt-2 ${current ? 'text-luxury-charcoal font-medium' : 'text-luxury-brown'}`}>{label}</span>
    </div>
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
        <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} required className="input-luxury" />
        <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} required className="input-luxury" />
      </div>

      <input name="company" placeholder="Company (optional)" value={formData.company} onChange={handleChange} className="input-luxury" />
      <input name="addressLine1" placeholder="Address Line 1 *" value={formData.addressLine1} onChange={handleChange} required className="input-luxury" />
      <input name="addressLine2" placeholder="Address Line 2" value={formData.addressLine2} onChange={handleChange} className="input-luxury" />

      <div className="grid grid-cols-2 gap-3">
        <input name="city" placeholder="City *" value={formData.city} onChange={handleChange} required className="input-luxury" />
        <input name="stateProvince" placeholder="State" value={formData.stateProvince} onChange={handleChange} className="input-luxury" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="postalCode" placeholder="Postal Code *" value={formData.postalCode} onChange={handleChange} required className="input-luxury" />
        <input name="country" placeholder="Country *" value={formData.country} onChange={handleChange} required className="input-luxury" />
      </div>

      <input name="phone" type="tel" placeholder="Phone *" value={formData.phone} onChange={handleChange} required className="input-luxury" />

      <button type="submit" disabled={submitting} className="btn-luxury w-full px-6 py-3 text-sm disabled:opacity-50">
        {submitting ? 'Saving...' : guestMode ? 'Use This Address' : 'Save Address'}
      </button>
    </form>
  );
}
