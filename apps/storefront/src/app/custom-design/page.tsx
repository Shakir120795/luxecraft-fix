'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCustomRequest, isAuthenticated } from '@/lib/api';

export default function CustomDesignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productCategory: '',
    desiredDimensions: '',
    preferredColors: '',
    preferredMaterials: '',
    quantity: 1,
    estimatedBudget: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/custom-design');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await createCustomRequest({
      title: formData.title,
      description: formData.description,
      productCategory: formData.productCategory || undefined,
      desiredDimensions: formData.desiredDimensions || undefined,
      preferredColors: formData.preferredColors || undefined,
      preferredMaterials: formData.preferredMaterials || undefined,
      quantity: formData.quantity,
      estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
    });

    if (result.success && result.data) {
      router.push(`/custom-design/requests/${result.data.id}`);
    } else {
      setError(result.message || 'Failed to submit request');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-luxury-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-serif font-light tracking-tight mb-6">
            Bespoke <span className="text-luxury-gold">Design Service</span>
          </h1>
          <p className="text-xl text-luxury-cream/90 mb-8 leading-relaxed max-w-2xl mx-auto">
            Create something truly unique. Our master artisans will bring your vision to life with unparalleled craftsmanship.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-serif font-light text-luxury-charcoal text-center mb-16">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">1</span>
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Share Your Vision</h3>
            <p className="text-sm text-luxury-brown">Tell us about your dream piece and requirements</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">2</span>
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Consultation</h3>
            <p className="text-sm text-luxury-brown">Our experts refine the design with you</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">3</span>
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Approval</h3>
            <p className="text-sm text-luxury-brown">Review quote and design before crafting begins</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-serif text-luxury-gold">4</span>
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Handcrafted</h3>
            <p className="text-sm text-luxury-brown">Master artisans create your piece</p>
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-12">
          <h2 className="text-3xl font-serif font-light text-luxury-charcoal mb-8 text-center">
            Start Your Custom Design
          </h2>

          {error && (
            <div className="mb-8 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Project Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-luxury"
                placeholder="e.g., Custom Living Room Rug"
              />
            </div>

            <div>
              <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Product Category
              </label>
              <select
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                className="input-luxury"
              >
                <option value="">Select a category</option>
                <option value="Hand Knotted Rugs">Hand Knotted Rugs</option>
                <option value="Hand Tufted Rugs">Hand Tufted Rugs</option>
                <option value="Flat Weave Rugs">Flat Weave Rugs</option>
                <option value="Craft & Statue">Craft & Statue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="input-luxury"
                placeholder="Describe your vision in detail. Include style preferences, intended use, room decor, inspiration, or any specific requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  Desired Dimensions
                </label>
                <input
                  name="desiredDimensions"
                  value={formData.desiredDimensions}
                  onChange={handleChange}
                  className="input-luxury"
                  placeholder="e.g., 8x10 feet"
                />
              </div>

              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  Quantity *
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className="input-luxury"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  Preferred Colors
                </label>
                <input
                  name="preferredColors"
                  value={formData.preferredColors}
                  onChange={handleChange}
                  className="input-luxury"
                  placeholder="e.g., Ivory, Navy, Gold accents"
                />
              </div>

              <div>
                <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  Preferred Materials
                </label>
                <input
                  name="preferredMaterials"
                  value={formData.preferredMaterials}
                  onChange={handleChange}
                  className="input-luxury"
                  placeholder="e.g., Wool, Silk, Cotton"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Estimated Budget (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-brown">$</span>
                <input
                  name="estimatedBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  className="input-luxury pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-luxury-brown/70 mt-2">
                This helps us provide accurate recommendations
              </p>
            </div>

            <div className="border border-luxury-gold/30 bg-luxury-gold/5 p-6">
              <h3 className="font-serif text-lg text-luxury-charcoal mb-3">📎 Reference Files</h3>
              <p className="text-sm text-luxury-brown mb-4">
                After submitting, you'll be able to upload reference images and files in the conversation thread.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-luxury w-full px-10 py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Request...' : 'Submit Design Request →'}
            </button>

            <p className="text-xs text-luxury-brown/70 text-center">
              By submitting, you agree to our{' '}
              <Link href="/terms" className="text-luxury-gold underline">Terms of Service</Link>.
              One of our design specialists will contact you within 24 hours.
            </p>
          </form>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-luxury-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Master Craftsmanship</h3>
              <p className="text-luxury-brown">
                Decades of artisan experience in every piece
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">✓</div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">No Commitment Quote</h3>
              <p className="text-luxury-brown">
                Free consultation and transparent pricing
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-xl font-serif text-luxury-charcoal mb-3">Global Delivery</h3>
              <p className="text-luxury-brown">
                White-glove shipping to your door anywhere
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
