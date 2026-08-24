'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      router.push(redirectTo);
    } else {
      setError(result.message || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Welcome Back</h1>
          <p className="text-luxury-brown">Sign in to your LuxeCraft account</p>
        </div>

        {/* Login Form */}
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

            <div>
              <label htmlFor="password" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-luxury"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-luxury-gold border-luxury-sand focus:ring-luxury-gold"
                />
                <span className="ml-2 text-luxury-brown">Remember me</span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-luxury-gold hover:text-luxury-darkGold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-luxury-sand"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-luxury-beige text-luxury-brown">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-luxury-brown mb-4">Don't have an account?</p>
            <Link
              href={`/auth/register${redirectTo !== '/account' ? `?redirect=${redirectTo}` : ''}`}
              className="btn-luxury-outline w-full px-8 py-4 inline-block"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Guest Checkout Option */}
        {redirectTo.includes('checkout') && (
          <div className="mt-8 text-center">
            <p className="text-luxury-brown mb-4">Don't want to create an account?</p>
            <Link
              href="/checkout?guest=true"
              className="text-sm text-luxury-gold hover:text-luxury-darkGold transition-colors underline"
            >
              Continue as Guest →
            </Link>
          </div>
        )}

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-cream flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
