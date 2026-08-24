'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { register } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/auth/verify-email';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
    });

    if (result.success) {
      // Redirect to email verification
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } else {
      setError(result.message || 'Registration failed');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-luxury-cream flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-light text-luxury-charcoal mb-3">Create Account</h1>
          <p className="text-luxury-brown">Join LuxeCraft for exclusive access</p>
        </div>

        {/* Register Form */}
        <div className="border border-luxury-sand bg-luxury-beige p-8 sm:p-10">
          {error && (
            <div className="mb-6 border border-luxury-terracotta/50 bg-luxury-terracotta/10 px-4 py-3 text-luxury-charcoal text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-luxury"
                  placeholder="John"
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-luxury"
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-luxury"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-luxury"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-luxury"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-luxury-brown/70 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-serif text-luxury-charcoal mb-2 tracking-wide">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input-luxury"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-4 h-4 mt-1 text-luxury-gold border-luxury-sand focus:ring-luxury-gold"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-luxury-brown">
                I agree to the{' '}
                <Link href="/terms" className="text-luxury-gold hover:text-luxury-darkGold underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-luxury-gold hover:text-luxury-darkGold underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
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

          {/* Login Link */}
          <div className="text-center">
            <p className="text-luxury-brown mb-4">Already have an account?</p>
            <Link
              href={`/auth/login${redirectTo !== '/auth/verify-email' ? `?redirect=${redirectTo}` : ''}`}
              className="btn-luxury-outline w-full px-8 py-4 inline-block"
            >
              Sign In
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-cream flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
