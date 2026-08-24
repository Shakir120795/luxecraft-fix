'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-luxury-night via-[#4A3F35] to-luxury-night text-white py-24">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-serif font-light tracking-tight mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-luxury-cream/90 leading-relaxed max-w-3xl mx-auto">
            We'd love to hear from you. Reach out with any questions or inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <h2 className="text-4xl font-serif font-light text-luxury-charcoal mb-8">
              Contact Information
            </h2>

            <div className="space-y-8 mb-12">
              <div className="border-l-4 border-luxury-gold pl-6">
                <h3 className="text-lg font-serif text-luxury-charcoal mb-2">Address</h3>
                <p className="text-luxury-brown leading-relaxed">
                  123 Artisan Boulevard<br />
                  Design District<br />
                  New York, NY 10001<br />
                  United States
                </p>
              </div>

              <div className="border-l-4 border-luxury-gold pl-6">
                <h3 className="text-lg font-serif text-luxury-charcoal mb-2">Phone</h3>
                <p className="text-luxury-brown">
                  <a href="tel:+1234567890" className="hover:text-luxury-gold transition-colors">
                    +1 (234) 567-890
                  </a>
                </p>
                <p className="text-sm text-luxury-brown/70 mt-1">
                  Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                  Saturday: 10:00 AM - 4:00 PM EST
                </p>
              </div>

              <div className="border-l-4 border-luxury-gold pl-6">
                <h3 className="text-lg font-serif text-luxury-charcoal mb-2">Email</h3>
                <p className="text-luxury-brown">
                  <a href="mailto:hello@luxecraft.com" className="hover:text-luxury-gold transition-colors">
                    hello@luxecraft.com
                  </a>
                </p>
                <p className="text-sm text-luxury-brown/70 mt-1">
                  We respond within 24 hours
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border border-luxury-sand bg-luxury-beige p-8">
              <h3 className="text-2xl font-serif text-luxury-charcoal mb-6">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/faq" className="block text-luxury-brown hover:text-luxury-gold transition-colors">
                  → Frequently Asked Questions
                </Link>
                <Link href="/shipping" className="block text-luxury-brown hover:text-luxury-gold transition-colors">
                  → Shipping Information
                </Link>
                <Link href="/returns" className="block text-luxury-brown hover:text-luxury-gold transition-colors">
                  → Returns & Refunds
                </Link>
                <Link href="/custom-design" className="block text-luxury-brown hover:text-luxury-gold transition-colors">
                  → Custom Design Services
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-4xl font-serif font-light text-luxury-charcoal mb-8">
              Send Us a Message
            </h2>

            {success && (
              <div className="mb-8 border border-luxury-gold bg-luxury-gold/10 px-6 py-4">
                <h3 className="font-serif text-luxury-charcoal mb-2">Message Sent!</h3>
                <p className="text-luxury-brown">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-8 border border-luxury-terracotta bg-luxury-terracotta/10 px-6 py-4 text-luxury-charcoal">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="label-luxury">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-luxury"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="label-luxury">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-luxury"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label-luxury">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-luxury"
                  placeholder="+1 (234) 567-890"
                />
              </div>

              <div>
                <label htmlFor="subject" className="label-luxury">
                  Subject *
                </label>
                <select
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-luxury"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Status</option>
                  <option value="custom">Custom Design</option>
                  <option value="shipping">Shipping & Delivery</option>
                  <option value="returns">Returns & Refunds</option>
                  <option value="product">Product Information</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="label-luxury">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="input-luxury resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-luxury w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-sm text-luxury-brown text-center">
                By submitting this form, you agree to our{' '}
                <Link href="/privacy" className="underline hover:text-luxury-gold">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Visit Us Section */}
        <section className="mt-20 border border-luxury-sand bg-luxury-beige p-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-serif font-light text-luxury-charcoal mb-6">
              Visit Our Showroom
            </h2>
            <p className="text-luxury-brown text-lg leading-relaxed mb-8">
              Experience our craftsmanship in person. Visit our flagship showroom in the heart of 
              New York's Design District to see our collection and meet with our design consultants.
            </p>
            <p className="text-luxury-brown mb-8">
              <strong>Showroom Hours:</strong><br />
              Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday: 10:00 AM - 4:00 PM<br />
              Sunday: Closed
            </p>
            <p className="text-sm text-luxury-brown">
              Private appointments available outside regular hours. Please call ahead to schedule.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
