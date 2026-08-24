'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAddresses, createAddress, isAuthenticated, Address } from '@/lib/api';

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/account/addresses');
      return;
    }

    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-luxury-brown">
            <div className="w-4 h-4 bg-luxury-gold rounded-full animate-pulse" />
            <span className="font-serif">Loading addresses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Header */}
      <div className="bg-luxury-beige border-b border-luxury-sand py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif font-light text-luxury-charcoal mb-3">My Addresses</h1>
          <p className="text-luxury-brown text-lg">Manage your shipping and billing addresses</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-luxury-sand bg-luxury-beige p-6 sticky top-24">
              <Link href="/account" className="text-sm text-luxury-gold hover:text-luxury-darkGold underline mb-6 block">
                ← Back to Account
              </Link>
              
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-luxury w-full px-6 py-3 text-sm"
              >
                {showForm ? 'Cancel' : '+ Add New Address'}
              </button>
            </div>
          </div>

          {/* Addresses List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Address Form */}
            {showForm && (
              <div className="border border-luxury-sand bg-luxury-beige p-8">
                <h2 className="text-2xl font-serif text-luxury-charcoal mb-6">Add New Address</h2>
                <AddressForm
                  onSuccess={() => {
                    loadAddresses();
                    setShowForm(false);
                  }}
                />
              </div>
            )}

            {/* Existing Addresses */}
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className="border border-luxury-sand bg-luxury-beige p-6 relative"
                  >
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 text-xs px-3 py-1 bg-luxury-gold/20 text-luxury-gold">
                        Default
                      </span>
                    )}
                    
                    <div className="mb-4">
                      <p className="font-serif text-lg text-luxury-charcoal mb-1">
                        {address.firstName} {address.lastName}
                      </p>
                      {address.company && (
                        <p className="text-sm text-luxury-brown mb-1">{address.company}</p>
                      )}
                      <p className="text-sm text-luxury-brown">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-sm text-luxury-brown">{address.addressLine2}</p>
                      )}
                      <p className="text-sm text-luxury-brown">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm text-luxury-brown">{address.country}</p>
                      <p className="text-sm text-luxury-brown mt-2">{address.phone}</p>
                    </div>

                    <div className="flex gap-3">
                      <button className="text-sm text-luxury-gold hover:text-luxury-darkGold underline">
                        Edit
                      </button>
                      <button className="text-sm text-luxury-terracotta hover:text-luxury-terracotta/80 underline">
                        Delete
                      </button>
                      {!address.isDefault && (
                        <button className="text-sm text-luxury-brown hover:text-luxury-gold underline">
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-luxury-sand bg-luxury-beige p-12 text-center">
                <div className="mb-6">
                  <span className="text-7xl">📍</span>
                </div>
                <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-4">
                  No Addresses Saved
                </h2>
                <p className="text-luxury-brown mb-8">
                  Add your first address to make checkout faster
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-luxury px-8 py-3"
                >
                  Add Address →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AddressForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
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

    const result = await createAddress(formData);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.message || 'Failed to create address');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">First Name *</label>
          <input name="firstName" value={formData.firstName} onChange={handleChange} required className="input-luxury" />
        </div>
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">Last Name *</label>
          <input name="lastName" value={formData.lastName} onChange={handleChange} required className="input-luxury" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Company (optional)</label>
        <input name="company" value={formData.company} onChange={handleChange} className="input-luxury" />
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Address Line 1 *</label>
        <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} required className="input-luxury" />
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Address Line 2</label>
        <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input-luxury" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">City *</label>
          <input name="city" value={formData.city} onChange={handleChange} required className="input-luxury" />
        </div>
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">State</label>
          <input name="state" value={formData.state} onChange={handleChange} className="input-luxury" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">Postal Code *</label>
          <input name="postalCode" value={formData.postalCode} onChange={handleChange} required className="input-luxury" />
        </div>
        <div>
          <label className="block text-sm font-serif text-luxury-charcoal mb-2">Country *</label>
          <input name="country" value={formData.country} onChange={handleChange} required className="input-luxury" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Phone *</label>
        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} required className="input-luxury" />
      </div>

      <div>
        <label className="block text-sm font-serif text-luxury-charcoal mb-2">Address Type</label>
        <select name="type" value={formData.type} onChange={handleChange} className="input-luxury">
          <option value="BOTH">Shipping & Billing</option>
          <option value="SHIPPING">Shipping Only</option>
          <option value="BILLING">Billing Only</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <label htmlFor="isDefault" className="text-sm text-luxury-brown">
          Set as default address
        </label>
      </div>

      <button type="submit" disabled={submitting} className="btn-luxury w-full px-8 py-4 disabled:opacity-50">
        {submitting ? 'Saving...' : 'Save Address'}
      </button>
    </form>
  );
}
