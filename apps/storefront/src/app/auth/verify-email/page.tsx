'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail, resendVerificationCode } from '@/lib/api';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await verifyEmail({ email, code });

    if (result.success) {
      setSuccess('Email verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } else {
      setError(result.message || 'Verification failed');
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setSuccess(null);
    setResending(true);

    const result = await resendVerificationCode(email);

    if (result.success) {
      setSuccess(result.message || 'Verification code sent!');
    } else {
      setError(result.message || 'Failed to send code');
    }

    setResending(false);
  }

  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <span className="text-6xl">📧</span>
          </div>
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Verify Your Email</h1>
          <p className="text-luxury-brown">
            We've sent a verification code to your email address
          </p>
        </div>

        {/* Verification Form */}
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10">
          {error && (
            <div className="mb-6 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 border border-luxury-gold/50 bg-luxury-gold/10 px-4 py-3 text-luxury-charcoal text-sm">
              {success}
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

            <div>
              <label htmlFor="code" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="input-luxury text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-luxury-brown/70 mt-2">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-luxury w-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email →'}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-8 pt-6 border-t border-luxury-sand text-center">
            <p className="text-sm text-luxury-brown mb-3">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-luxury-gold hover:text-luxury-darkGold transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>

        {/* Skip for Now */}
        <div className="mt-8 text-center">
          <Link
            href="/account"
            className="text-sm text-luxury-brown hover:text-luxury-gold transition-colors"
          >
            Skip for now (verify later) →
          </Link>
        </div>

        {/* Back to Login */}
        <div className="mt-4 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-luxury-brown hover:text-luxury-gold transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-cream flex items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
