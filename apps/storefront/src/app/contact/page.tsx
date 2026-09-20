'use client';

import { useState } from 'react';
import { submitContactMessage } from '@/lib/api';
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
      await submitContactMessage(formData);

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
    <main className="min-h-screen bg-[#f8f6f2] text-[#302b35]">
      <section className="border-b border-[#ded8d0] bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5d38]">
            Wolhomes Concierge
          </p>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl font-serif text-5xl font-light leading-[1.05] tracking-tight text-[#302b35] sm:text-6xl lg:text-7xl">
                Let’s create something
                <span className="block text-[#8a5d38]">meaningful.</span>
              </h1>
            </div>

            <p className="max-w-xl text-base leading-8 text-[#6a636b] lg:justify-self-end lg:text-lg">
              We&apos;d love to hear from you. Whether you are exploring our
              collection, planning a bespoke rug, or simply have a question,
              our team is here to help.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <div className="rounded-lg border border-[#ded8d0] bg-white p-7 shadow-sm sm:p-8">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
                Get In Touch
              </p>

              <h2 className="mb-7 font-serif text-3xl font-light text-[#302b35] sm:text-4xl">
                Contact Information
              </h2>

              <div className="space-y-7">
                <div className="border-t border-[#eee9e3] pt-5">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Email
                  </h3>
                  <a
                    href="mailto:info@wolhomes.com"
                    className="text-sm text-[#302b35] transition-colors hover:text-[#8a5d38]"
                  >
                    info@wolhomes.com
                  </a>
                  <p className="mt-2 text-sm leading-6 text-[#8b8389]">
                    Monday – Friday: 9:00 AM – 5:00 PM EST
                    <br />
                    We strive to respond within 24 to 48 hours.
                  </p>
                </div>

                <div className="border-t border-[#eee9e3] pt-5">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Factory &amp; Manufacturing Facility Address
                  </h3>
                  <p className="text-sm leading-7 text-[#6a636b]">
                    WOLHOMES
                    <br />
                    575/2-C, Devpurwa Road, Mirzapur,
                    <br />
                    Uttar Pradesh, India – 231001
                  </p>
                </div>

                <div className="border-t border-[#eee9e3] pt-5">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Custom &amp; Trade Inquiries
                  </h3>
                  <p className="text-sm leading-7 text-[#6a636b]">
                    <strong>Custom Rug Orders:</strong> Have a specific size, color palette, or design in mind? Send us an email with your specifications or sketches, and our master artisans will bring it to life.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6a636b]">
                    <strong>Trade &amp; Wholesale Program:</strong> Are you an interior designer, architect, or business owner looking for bulk or trade pricing? Contact us with your business details and resale certificate to join our trade program.
                  </p>
                </div>
              </div>

                <div className="border-t border-[#eee9e3] pt-5">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Phone
                  </h3>
                  <a
                    href="tel:+1234567890"
                    className="text-sm text-[#302b35] transition-colors hover:text-[#8a5d38]"
                  >
                    +1 (234) 567-890
                  </a>
                  <p className="mt-2 text-sm leading-6 text-[#8b8389]">
                    Monday - Friday: 9:00 AM - 6:00 PM EST
                    <br />
                    Saturday: 10:00 AM - 4:00 PM EST
                  </p>
                </div>

                <div className="border-t border-[#eee9e3] pt-5">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5d38]">
                    Email
                  </h3>
                  <a
                    href="mailto:info@wolhomes.com"
                    className="text-sm text-[#302b35] transition-colors hover:text-[#8a5d38]"
                  >
                    info@wolhomes.com
                  </a>
                  <p className="mt-2 text-sm text-[#8b8389]">
                    We respond within 24 hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#ded8d0] bg-white p-7 shadow-sm sm:p-8">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
                Explore Wolhomes
              </p>

              <h3 className="mb-5 font-serif text-2xl text-[#302b35]">
                Helpful Links
              </h3>

              <div className="space-y-3">
                <Link
                  href="/faq"
                  className="group flex items-center justify-between border-b border-[#eee9e3] py-3 text-sm text-[#6a636b] transition-colors hover:text-[#8a5d38]"
                >
                  Frequently Asked Questions
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/returns"
                  className="group flex items-center justify-between border-b border-[#eee9e3] py-3 text-sm text-[#6a636b] transition-colors hover:text-[#8a5d38]"
                >
                  Returns & Refunds
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/custom-design"
                  className="group flex items-center justify-between py-3 text-sm text-[#6a636b] transition-colors hover:text-[#8a5d38]"
                >
                  Custom Design Services
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#ded8d0] bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-8">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
                Concierge Support
              </p>

              <h2 className="font-serif text-3xl font-light text-[#302b35] sm:text-4xl">
                Send Us a Message
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#6a636b]">
                Tell us what you&apos;re looking for and our team will get back
                to you with the right guidance.
              </p>
            </div>

            {success && (
              <div className="mb-7 border border-[#8a5d38]/20 bg-[#8a5d38]/5 px-5 py-4">
                <p className="font-serif text-lg text-[#302b35]">Message Sent</p>
                <p className="mt-1 text-sm leading-6 text-[#6a636b]">
                  Thank you for contacting us. We&apos;ll get back to you within
                  24 hours.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-7 border border-[#bf4e48]/20 bg-[#bf4e48]/5 px-5 py-4 text-sm text-[#8f3934]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f666d]"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-12 w-full border border-[#ded8d0] bg-[#fcfbf9] px-4 text-sm text-[#302b35] outline-none transition focus:border-[#8a5d38] focus:bg-white"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f666d]"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-12 w-full border border-[#ded8d0] bg-[#fcfbf9] px-4 text-sm text-[#302b35] outline-none transition focus:border-[#8a5d38] focus:bg-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f666d]"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-12 w-full border border-[#ded8d0] bg-[#fcfbf9] px-4 text-sm text-[#302b35] outline-none transition focus:border-[#8a5d38] focus:bg-white"
                    placeholder="+1 (234) 567-890"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f666d]"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="h-12 w-full border border-[#ded8d0] bg-[#fcfbf9] px-4 text-sm text-[#302b35] outline-none transition focus:border-[#8a5d38] focus:bg-white"
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
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f666d]"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={7}
                  className="w-full resize-none border border-[#ded8d0] bg-[#fcfbf9] px-4 py-3 text-sm leading-7 text-[#302b35] outline-none transition focus:border-[#8a5d38] focus:bg-white"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#302b35] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-center text-xs leading-6 text-[#8b8389]">
                By submitting this form, you agree to our{' '}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:text-[#8a5d38]"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

