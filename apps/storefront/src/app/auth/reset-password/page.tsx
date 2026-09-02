'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset link');
      return;
    }

    setLoading(true);

    const result = await resetPassword({ token, password });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } else {
      setError(result.message || 'Password reset failed');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="mb-6">
              <span className="text-6xl">✓</span>
            </div>
            <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Password Reset</h1>
            <p className="text-luxury-brown">
              Your password has been successfully reset
            </p>
          </div>

          <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10 text-center">
            <p className="text-luxury-brown mb-6">
              Redirecting to login page...
            </p>
            <Link
              href="/auth/login"
              className="btn-luxury px-8 py-4 inline-block"
            >
              Go to Login →
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
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Reset Password</h1>
          <p className="text-luxury-brown">
            Create a new password for your account
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
              <label htmlFor="password" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-luxury"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-luxury-brown/70 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-luxury"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-luxury-sand text-center">
            <Link
              href="/auth/login"
              className="text-sm text-luxury-gold hover:text-luxury-darkGold transition-colors underline"
            >
              Back to Login
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-cream flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
