'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || 'Failed to send reset email');
    }

    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="mb-6">
              <span className="text-6xl">✉️</span>
            </div>
            <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Check Your Email</h1>
            <p className="text-luxury-brown leading-relaxed">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10 text-center">
            <p className="text-luxury-brown mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="btn-luxury w-full px-8 py-4 inline-block"
              >
                Back to Login →
              </Link>

              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-luxury-brown hover:text-luxury-gold transition-colors underline"
              >
                Resend Email
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-luxury-brown hover:text-luxury-gold transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Forgot Password?</h1>
          <p className="text-luxury-brown">
            Enter your email and we'll send you reset instructions
          </p>
        </div>

        {/* Form */}
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10">
          {error && (
            <div className="mb-6 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-luxury"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-luxury-sand text-center">
            <Link
              href="/auth/login"
              className="text-sm text-luxury-gold hover:text-luxury-darkGold transition-colors underline"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-luxury-brown hover:text-luxury-gold transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
